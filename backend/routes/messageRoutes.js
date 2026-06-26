const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Report = require('../models/Report');
const User = require('../models/User');
const mongoose = require('mongoose');

const buildConversationRoomId = (userA, userB) => {
  const [first, second] = [userA, userB].map(String).sort();
  return `conversation:${first}:${second}`;
};

const getAuthUserId = (req) => {
  const rawId = req.user?._id || req.userId;
  if (!rawId) return null;
  return new mongoose.Types.ObjectId(rawId.toString());
};

const formatParticipant = (peerDoc, fallbackId) => ({
  _id: (peerDoc?._id || fallbackId).toString(),
  firstName: peerDoc?.firstName || '',
  lastName: peerDoc?.lastName || '',
  schoolId: peerDoc?.schoolId
});

// =========================================================================
// 1. GET /api/messages/conversations
// =========================================================================
router.get('/conversations', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rows = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }]
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $addFields: {
          peerId: {
            $cond: [
              { $eq: ['$isSystemAction', true] },
              null,
              {
                $cond: [
                  { $eq: ['$sender', userId] },
                  '$recipient',
                  '$sender'
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$isSystemAction', true] },
              'system',
              '$peerId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'peer'
        }
      },
      {
        $unwind: {
          path: '$peer',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    const formatInbox = await Promise.all(
      rows
        .filter((row) => row._id !== null)
        .map(async (row) => {
          if (row._id === 'system') {
            return {
              _id: 'system',
              participant: { _id: 'system', firstName: 'System', lastName: 'Notice' },
              contextItem: row.lastMessage.contextItem || 'General Exchange',
              itemId: row.lastMessage.itemId,
              text: row.lastMessage.text,
              timestamp: row.lastMessage.timestamp
            };
          }

          let peerDoc = row.peer;
          if (!peerDoc?.firstName && !peerDoc?.lastName) {
            peerDoc = await User.findById(row._id).select('firstName lastName schoolId').lean();
          }

          return {
            _id: row._id.toString(),
            participant: formatParticipant(peerDoc, row._id),
            contextItem: row.lastMessage.contextItem || 'General Exchange',
            itemId: row.lastMessage.itemId,
            text: row.lastMessage.text,
            timestamp: row.lastMessage.timestamp
          };
        })
    );

    return res.json(formatInbox);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving conversations', error: err.message });
  }
});

// =========================================================================
// 2. GET /api/messages/channel/:chatId
// =========================================================================
router.get('/channel/:chatId', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userIdStr = userId.toString();
    const targetPeerId = req.params.chatId;

    if (targetPeerId === 'system' || targetPeerId === 'new_channel_context' || !mongoose.Types.ObjectId.isValid(targetPeerId)) {
      return res.json([]);
    }

    const chatHistory = await Message.find({
      $or: [
        { sender: userId, recipient: targetPeerId },
        { sender: targetPeerId, recipient: userId },
        { isSystemAction: true, recipient: targetPeerId },
        { isSystemAction: true, sender: userId }
      ]
    })
      .sort({ timestamp: 1 })
      .lean();

    const formatted = chatHistory.map(m => ({
      _id: m._id.toString(),
      text: m.text,
      sender: m.isSystemAction ? 'system' : (m.sender.toString() === userIdStr ? 'me' : m.sender.toString()),
      contextItem: m.contextItem,
      itemId: m.itemId,
      isSystemAction: m.isSystemAction,
      isReportNotice: m.isReportNotice,
      timestamp: m.timestamp
    }));

    return res.json(formatted);

  } catch (err) {
    return res.status(500).json({ message: 'Error loading messages', error: err.message });
  }
});

// =========================================================================
// 3. POST /api/messages/initialize
// =========================================================================
router.post('/initialize', async (req, res) => {
  try {
    const { text, recipientId, contextItem, itemId } = req.body;
    const senderId = getAuthUserId(req);
    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!recipientId || !text) {
      return res.status(400).json({ message: 'Recipient and message text are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      contextItem: contextItem || 'General Exchange',
      itemId: itemId || null,
      text: text.trim(),
      timestamp: new Date()
    });

    const savedMsg = await newMessage.save();

    // Clean payload representation for external recipient delivery
    const output = {
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: senderId.toString(),
      recipient: recipientId.toString(),
      contextItem: savedMsg.contextItem,
      itemId: savedMsg.itemId,
      isSystemAction: false,
      timestamp: savedMsg.timestamp
    };

    // Safe Engine Resolve: Broadcasts live socket pulse to the active peer room boundary
    const io = req.app.get('io') || global.io;
    if (io) {
      const conversationRoomId = buildConversationRoomId(senderId, recipientId);
      console.log(`🔔 Emitting message to room [${conversationRoomId}]:`, output);
      io.to(conversationRoomId).emit('receive_message', output);
      io.to(recipientId.toString().trim()).emit('receive_message', output);
    }

    // Return explicit state parameters directly to the author to instantly align UI feeds
    return res.status(201).json({ 
      ...output, 
      conversationId: recipientId.toString(), 
      sender: 'me', 
      message: 'Message sent successfully' 
    });
  } catch (err) {
    console.error('Error initializing message:', err);
    return res.status(500).json({ message: 'Error saving message', error: err.message });
  }
});

// =========================================================================
// 4. POST /api/messages/channel/:chatId/send
// =========================================================================
router.post('/channel/:chatId/send', async (req, res) => {
  try {
    const { text, contextItem, itemId } = req.body;
    const senderId = getAuthUserId(req);
    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const recipientId = req.params.chatId; 

    if (!text || !recipientId) {
      return res.status(400).json({ message: 'Message text and target recipient identifier are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId, 
      text: text.trim(),
      contextItem: contextItem || 'General Exchange',
      itemId: itemId || null,
      timestamp: new Date()
    });

    const savedMsg = await newMessage.save();

    // Standardized network serialization object
    const output = {
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: senderId.toString(),
      recipient: recipientId.toString(),
      contextItem: savedMsg.contextItem,
      itemId: savedMsg.itemId,
      isSystemAction: false,
      timestamp: savedMsg.timestamp
    };

    // Safe Engine Resolve: Routes the data stream out to the remote recipient
    const io = req.app.get('io') || global.io;
    if (io) {
      const conversationRoomId = buildConversationRoomId(senderId, recipientId);
      console.log(`🔔 Emitting message to room [${conversationRoomId}]:`, output);
      io.to(conversationRoomId).emit('receive_message', output);
      io.to(recipientId.toString().trim()).emit('receive_message', output);
    }

    // Map sender explicitly to 'me' to prevent alignment shift loops in local client arrays
    return res.status(201).json({
      ...output,
      sender: 'me'
    });

  } catch (err) {
    console.error('❌ Critical transmission log error encountered:', err);
    return res.status(500).json({ message: 'Error saving message', error: err.message });
  }
});

// =========================================================================
// 5. POST /api/messages/report
// =========================================================================
router.post('/report', async (req, res) => {
  try {
    const { reportedUserId, itemId, reason } = req.body;
    const reporterId = getAuthUserId(req);
    if (!reporterId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Report.create({
      reporter: reporterId,
      targetType: itemId ? 'listing' : 'user',
      targetId: itemId || reportedUserId,
      feedback: reason || 'Flagged via peer chat utility interface.'
    });

    const reportNotice = await Message.create({
      sender: reporterId,
      recipient: reportedUserId,
      text: '⚠️ You flagged this conversation for administrative review.',
      contextItem: 'Safety Signal',
      itemId: itemId || null,
      isSystemAction: true,
      isReportNotice: true,
      timestamp: new Date()
    });

    const output = {
      _id: reportNotice._id.toString(),
      text: reportNotice.text,
      sender: 'system',
      contextItem: reportNotice.contextItem,
      itemId: reportNotice.itemId,
      isSystemAction: true,
      isReportNotice: true,
      timestamp: reportNotice.timestamp
    };

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(reporterId.toString().trim()).emit('receive_message', output);
    }

    return res.status(201).json({ message: 'User reported cleanly.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Developer helper: Debug-only endpoint to simulate sending messages without auth (DO NOT enable in production)
router.post('/debug/send', async (req, res) => {
  try {
    const { senderId, recipientId, text, contextItem, itemId } = req.body;
    if (!senderId || !recipientId || !text) return res.status(400).json({ message: 'senderId, recipientId and text required' });

    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      text: text.trim(),
      contextItem: contextItem || 'Debug Message',
      itemId: itemId || null,
      timestamp: new Date()
    });

    const savedMsg = await newMessage.save();
    const output = {
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: senderId.toString(),
      recipient: recipientId.toString(),
      contextItem: savedMsg.contextItem,
      itemId: savedMsg.itemId,
      isSystemAction: false,
      timestamp: savedMsg.timestamp
    };

    const io = req.app.get('io') || global.io;
    if (io) {
      const conversationRoomId = buildConversationRoomId(senderId, recipientId);
      console.log(`🔔 [DEBUG] Emitting message to room [${conversationRoomId}]:`, output);
      io.to(conversationRoomId).emit('receive_message', output);
      io.to(recipientId.toString().trim()).emit('receive_message', output);
    }

    return res.status(201).json(output);
  } catch (err) {
    console.error('[DEBUG] Failed to send debug message:', err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;