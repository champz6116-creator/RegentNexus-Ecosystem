const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Report = require('../models/Report');
const { verifyToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// =========================================================================
// 1. GET /api/messages/conversations
// =========================================================================
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ['$sender', '$recipient'] },
              { s: '$sender', r: '$recipient' },
              { s: '$recipient', r: '$sender' }
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const populated = await Message.populate(conversations, {
      path: 'lastMessage.sender lastMessage.recipient',
      select: 'firstName lastName schoolId'
    });

    const formatInbox = populated.map(c => {
      if (!c.lastMessage.isSystemAction && (!c.lastMessage.sender || !c.lastMessage.recipient)) return null;
      
      const isSenderMe = c.lastMessage.sender && c.lastMessage.sender._id.toString() === userId.toString();
      const participant = isSenderMe ? c.lastMessage.recipient : c.lastMessage.sender;
      
      return {
        _id: participant ? participant._id.toString() : 'system',
        participant: participant ? {
          _id: participant._id.toString(),
          firstName: participant.firstName,
          lastName: participant.lastName,
          schoolId: participant.schoolId
        } : { firstName: "System", lastName: "Notice" },
        contextItem: c.lastMessage.contextItem || 'General Exchange',
        itemId: c.lastMessage.itemId,
        text: c.lastMessage.text,
        timestamp: c.lastMessage.timestamp
      };
    }).filter(Boolean);

    return res.json(formatInbox);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving conversations', error: err.message });
  }
});

// =========================================================================
// 2. GET /api/messages/channel/:chatId
// =========================================================================
router.get('/channel/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
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
    }).sort({ timestamp: 1 });

    const formatted = chatHistory.map(m => ({
      _id: m._id.toString(),
      text: m.text,
      sender: m.isSystemAction ? 'system' : (m.sender.toString() === userId.toString() ? 'me' : m.sender.toString()),
      contextItem: m.contextItem,
      itemId: m.itemId,
      isSystemAction: m.isSystemAction,
      isReportNotice: m.isReportNotice,
      timestamp: m.timestamp
    }));

    // CRITICAL FIX: Deliver response payload back to client channel stream
    return res.json(formatted);

  } catch (err) {
    return res.status(500).json({ message: 'Error loading messages', error: err.message });
  }
});

// =========================================================================
// 3. POST /api/messages/initialize
// =========================================================================
router.post('/initialize', verifyToken, async (req, res) => {
  try {
    const { text, recipientId, contextItem, itemId } = req.body;
    const senderId = req.userId;

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
router.post('/channel/:chatId/send', verifyToken, async (req, res) => {
  try {
    const { text, contextItem, itemId } = req.body;
    const senderId = req.userId;
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
router.post('/report', verifyToken, async (req, res) => {
  try {
    const { reportedUserId, itemId, reason } = req.body;

    await Report.create({
      reporter: req.userId,
      targetType: itemId ? 'listing' : 'user',
      targetId: itemId || reportedUserId,
      feedback: reason || 'Flagged via peer chat utility interface.'
    });

    const reportNotice = await Message.create({
      sender: req.userId,
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
      io.to(req.userId.toString().trim()).emit('receive_message', output);
    }

    return res.status(201).json({ message: 'User reported cleanly.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;