const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Report = require('../models/Report');
const { verifyToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/messages/conversations
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
              { s: '$sender', r: '$recipient', item: '$contextItem' },
              { s: '$recipient', r: '$sender', item: '$contextItem' }
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
      
      // Fallback fallback variables if system message has no explicit participant references
      return {
        _id: participant ? participant._id.toString() : 'system',
        participant: participant ? {
          _id: participant._id.toString(),
          firstName: participant.firstName,
          lastName: participant.lastName,
          schoolId: participant.schoolId
        } : { firstName: "System", lastName: "Notice" },
        contextItem: c.lastMessage.contextItem,
        itemId: c.lastMessage.itemId,
        text: c.lastMessage.text,
        timestamp: c.lastMessage.timestamp
      };
    }).filter(Boolean);

    res.json(formatInbox);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving conversations', error: err.message });
  }
});

// GET /api/messages/channel/:chatId
router.get('/channel/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const targetPeerId = req.params.chatId;

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

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error loading messages', error: err.message });
  }
});

// POST /api/messages/initialize
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
    const populated = await Message.populate(savedMsg, {
      path: 'sender recipient',
      select: 'firstName lastName'
    });

    const output = {
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: 'me',
      contextItem: savedMsg.contextItem,
      itemId: savedMsg.itemId,
      isSystemAction: false,
      timestamp: savedMsg.timestamp,
      message: 'Message sent successfully'
    };

    if (global.io) {
      global.io.to(recipientId).emit('receive_message', { ...output, sender: senderId.toString() });
      global.io.to(senderId).emit('receive_message', output);
    }

    res.status(201).json(output);
  } catch (err) {
    console.error('Error initializing message:', err);
    res.status(500).json({ message: 'Error saving message', error: err.message });
  }
});

// POST /api/messages/channel/:chatId/send
router.post('/channel/:chatId/send', verifyToken, async (req, res) => {
  try {
    const { text, contextItem, itemId } = req.body;
    const senderId = req.userId;
    const chatId = req.params.chatId;

    if (!text || !chatId) {
      return res.status(400).json({ message: 'Message text and chat ID are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: chatId,
      contextItem: contextItem || 'General Exchange',
      itemId: itemId || null,
      text: text.trim(),
      timestamp: new Date()
    });

    const savedMsg = await newMessage.save();

    const output = {
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: 'me',
      contextItem: savedMsg.contextItem,
      itemId: savedMsg.itemId,
      isSystemAction: false,
      timestamp: savedMsg.timestamp,
      message: 'Message sent successfully'
    };

    if (global.io) {
      global.io.to(chatId).emit('receive_message', { ...output, sender: senderId.toString() });
      global.io.to(senderId).emit('receive_message', output);
    }

    res.status(201).json(output);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error saving message', error: err.message });
  }
});

// NEW PIPELINE: POST /api/messages/report
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

    if (global.io) {
      global.io.to(req.userId).emit('receive_message', output);
    }

    return res.status(201).json({ message: 'User reported cleanly.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;