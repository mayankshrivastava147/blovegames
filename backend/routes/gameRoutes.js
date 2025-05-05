const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// Game Login API
router.post('/login', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid user' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30m' });

    res.status(200).json({
      success: true,
      message: 'Game login successful',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create New Game Session API
router.post('/create-session', protect, async (req, res) => {
  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ success: false, message: "GameID is required" });
  }

  try {
    // Inactivate old sessions for the same gameId
    await Session.updateMany(
      { userId: req.user.id, gameId },
      { $set: { status: 'inactive' } }
    );

    const newSession = new Session({
      userId: req.user.id,
      gameId,
      sessionId: uuidv4(),
      status: 'active'
    });

    await newSession.save();

    res.status(201).json({
      success: true,
      message: "Game session created successfully",
      data: {
        sessionId: newSession.sessionId,
        gameId: newSession.gameId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Wallet Balance API
router.post('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Balance fetched successfully',
      data: { balance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debit Wallet API
router.post('/debit', protect, async (req, res) => {
  const { amount, sessionId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount for debit' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required' });
  }

  try {
    const session = await Session.findOne({ sessionId, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid session' });
    }

    if (session.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Session expired. Please start a new session to continue.'
      });
    }

    const user = await User.findById(req.user.id);

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    user.walletBalance -= amount;
    await user.save();

    await Transaction.create({
      userId: req.user.id,
      sessionId,
      gameId: session.gameId,
      type: 'debit',
      amount
    });

    res.status(200).json({
      success: true,
      message: 'Debit successful',
      data: { balance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Credit Wallet API
router.post('/credit', protect, async (req, res) => {
  const { amount, sessionId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount for credit' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required' });
  }

  try {
    const session = await Session.findOne({ sessionId, userId: req.user.id });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid session' });
    }

    if (session.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Session expired. Please start a new session to continue.'
      });
    }

    const user = await User.findById(req.user.id);

    user.walletBalance += amount;
    await user.save();

    await Transaction.create({
      userId: req.user.id,
      sessionId,
      gameId: session.gameId,
      type: 'credit',
      amount
    });

    res.status(200).json({
      success: true,
      message: 'Credit successful',
      data: { balance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Get All Transactions API 
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      message: 'Transaction history fetched successfully',
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
