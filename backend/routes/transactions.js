const express = require('express');
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  if (req.role === 'admin') {
    const transactions = await Transaction.find().populate('buyer seller listing');
    return res.json(transactions);
  }

  const transactions = await Transaction.find({ buyer: req.userId }).populate('seller listing');
  res.json(transactions);
});

router.post('/', async (req, res) => {
  const { listingId, amount } = req.body;
  const listing = await Item.findById(listingId);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.owner.toString() === req.userId) {
    return res.status(400).json({ message: 'Cannot buy your own listing' });
  }

  const transaction = await Transaction.create({
    buyer: req.userId,
    seller: listing.owner,
    listing: listing._id,
    amount,
    status: 'completed',
  });

  res.status(201).json(transaction);
});

module.exports = router;
