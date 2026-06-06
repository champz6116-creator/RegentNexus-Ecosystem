const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
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
      if (!c.lastMessage.sender || !c.lastMessage.recipient) return null;
      const isSenderMe = c.lastMessage.sender._id.toString() === userId.toString();
      const participant = isSenderMe ? c.lastMessage.recipient : c.lastMessage.sender;
      return {
        _id: participant._id.toString(),
        participant: {
          _id: participant._id.toString(),
          firstName: participant.firstName,
          lastName: participant.lastName,
          schoolId: participant.schoolId
        },
        contextItem: c.lastMessage.contextItem,
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
        { sender: targetPeerId, recipient: userId }
      ]
    }).sort({ timestamp: 1 });

    const formatted = chatHistory.map(m => ({
      _id: m._id.toString(),
      text: m.text,
      sender: m.sender.toString() === userId.toString() ? 'me' : m.sender.toString(),
      contextItem: m.contextItem,
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
    const { text, recipientId, contextItem } = req.body;
    const senderId = req.userId;

    if (!recipientId || !text) {
      return res.status(400).json({ message: 'Recipient and message text are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      contextItem: contextItem || 'General Exchange',
      text: text.trim(),
      timestamp: new Date()
    });

    const savedMsg = await newMessage.save();
    const populated = await Message.populate(savedMsg, {
      path: 'sender recipient',
      select: 'firstName lastName'
    });

    res.status(201).json({
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: 'me',
      contextItem: savedMsg.contextItem,
      timestamp: savedMsg.timestamp,
      message: 'Message sent successfully'
    });
  } catch (err) {
    console.error('Error initializing message:', err);
    res.status(500).json({ message: 'Error saving message', error: err.message });
  }
});

// POST /api/messages/channel/:chatId/send
router.post('/channel/:chatId/send', verifyToken, async (req, res) => {
  try {
    const { text, recipientId, contextItem } = req.body;
    const senderId = req.userId;
    const chatId = req.params.chatId;

    if (!text || !chatId) {
      return res.status(400).json({ message: 'Message text and chat ID are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: chatId,
      contextItem: contextItem || 'General Exchange',
      text: text.trim(),
      timestamp: new Date()
    });

    const savedMsg = await newMessage.save();

    res.status(201).json({
      _id: savedMsg._id.toString(),
      text: savedMsg.text,
      sender: 'me',
      contextItem: savedMsg.contextItem,
      timestamp: savedMsg.timestamp,
      message: 'Message sent successfully'
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error saving message', error: err.message });
  }
});

module.exports = router;
