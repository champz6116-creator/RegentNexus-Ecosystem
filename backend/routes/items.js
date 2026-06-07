const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Report = require('../models/Report');

const router = express.Router();

/**
 * GET /api/listings/user/me
 * Workspace filter array. Placed at the top so it doesn't get captured by /:id
 */
router.get('/user/me', async (req, res) => {
  try {
    const listings = await Item.find({ owner: req.userId }).populate('owner', 'firstName lastName schoolMail');
    return res.status(200).json(listings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mirror personal workspace array.' });
  }
});

/**
 * GET /api/listings/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'firstName lastName schoolMail phone schoolId');
    if (!item) return res.status(404).json({ message: 'Requested item does not exist.' });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error matching endpoint metadata.' });
  }
});

/**
 * GET /api/listings
 * System catalog discovery node stream
 */
router.get('/', async (req, res) => {
  try {
    const { q, category, type, mine } = req.query;
    const filter = { status: 'active' };

    if (mine === 'true' && req.userId) {
      filter.owner = req.userId;
    }
    if (category) filter.category = category;
    if (type) filter.type = type;
    
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') }
      ];
    }

    const items = await Item.find(filter).populate('owner', 'firstName lastName schoolMail');
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch items catalogue stream.' });
  }
});

/**
 * POST /api/listings
 * Launch a marketplace entry assignment
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, category, type, note, price, imageUrl } = req.body;
    const item = await Item.create({
      title,
      description,
      category,
      type,
      note,
      price,
      owner: req.userId, 
      imageUrl,
    });
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ==================================================================== */
/* CRITICAL CORE FIX: ACTIONS MUST BE PLACED BEFORE THE GENERIC REQ :ID */
/* ==================================================================== */

/**
 * POST /api/listings/:id/star
 * Toggles a user's starred list data index references
 */
router.post('/:id/star', async (req, res) => {
  try {
    const itemId = req.params.id;
    const user = req.user; // Hydrated securely from the verifyToken gateway in server.js
    
    if (!user) return res.status(404).json({ message: 'User context not found.' });
    if (!user.starredServices) user.starredServices = [];

    const hasStarred = user.starredServices.some(id => id && id.toString() === itemId);

    if (hasStarred) {
      user.starredServices = user.starredServices.filter(id => id && id.toString() !== itemId);
    } else {
      user.starredServices.push(itemId);
    }

    user.markModified('starredServices');
    await user.save();
    return res.status(200).json({ user, message: 'Starred array updated cleanly.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to adjust starring sequence variables.' });
  }
});

/**
 * POST /api/listings/:id/cart
 * Modifies user shopping cart arrays dynamically
 */
router.post('/:id/cart', async (req, res) => {
  try {
    const { quantity } = req.body;
    const targetQuantity = Math.max(1, parseInt(quantity) || 1);
    const itemId = req.params.id;
    const user = req.user; // Hydrated securely from the verifyToken gateway in server.js
    
    if (!user) return res.status(404).json({ message: 'User context not found.' });
    if (!user.cart) user.cart = [];

    const existingCartItem = user.cart.find(c => c.item && c.item.toString() === itemId);

    if (existingCartItem) {
      existingCartItem.quantity += targetQuantity;
    } else {
      user.cart.push({ item: itemId, quantity: targetQuantity });
    }

    user.markModified('cart');
    await user.save();
    return res.status(200).json({ user, message: 'Cart items updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not push variables onto the cart schema layer.' });
  }
});

/**
 * POST /api/listings/:id/rate
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Listing not found' });

    const score = req.body.score || req.body.rating;
    const comment = req.body.comment || '';

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'A valid numerical score between 1 and 5 is required.' });
    }

    item.ratings.push({ rater: req.userId, score: parseInt(score), comment });
    await item.save();
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/listings/:id/report
 */
router.post('/:id/report', async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ message: 'Feedback is required' });

    const report = await Report.create({
      reporter: req.userId,
      targetType: 'listing',
      targetId: req.params.id,
      feedback,
    });

    return res.status(201).json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ==================================================================== */
/* GENERIC IDENTIFIER PARSERS SIT AT THE ABSOLUTE BOTTOM               */
/* ==================================================================== */

/**
 * PUT /api/listings/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updates = {};
    ['title', 'description', 'category', 'type', 'note', 'price', 'imageUrl', 'status'].forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    Object.assign(item, updates);
    await item.save();
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/listings/:id
 * Soft-deletes campus records and notifies conversation channels
 */
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    item.status = 'removed';
    await item.save();

    // Generate automated system broadcast link inside message tables
    const systemNotice = await Message.create({
      text: `📢 This listing ("${item.title}") is no longer active. Transactions are locked.`,
      contextItem: item.title,
      itemId: item._id,
      isSystemAction: true,
      timestamp: new Date()
    });

    if (global.io) {
      global.io.emit('receive_message', {
        _id: systemNotice._id.toString(),
        text: systemNotice.text,
        sender: 'system',
        contextItem: systemNotice.contextItem,
        itemId: systemNotice.itemId,
        isSystemAction: true,
        timestamp: systemNotice.timestamp
      });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;