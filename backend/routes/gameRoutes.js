const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
// const axios = require('axios');
const crypto = require('crypto');

const User = require('../models/User');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// Create New Game Session API
router.post('/create-session', protect, async (req, res) => {
  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ success: false, message: "GameID is required" });
  }

  try {
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
    if (!session) return res.status(404).json({ success: false, message: 'Invalid session' });
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

// // Generate Signed Balance URL
// router.get('/generate/balance-url', async (req, res) => {
//   const { uid, game_key } = req.query;

//   if (!uid || !game_key) {
//     return res.status(400).json({ success: false, message: 'uid and game_key are required' });
//   }

//   const app_key = 'jk';
//   const coin_kinds = 'gift_pass';
//   const app_secret = '2p00dkc6GWzHi29txzyz';
//   const ts = Date.now();

//   const stringToSign = `app_key=${app_key}&game_key=${game_key}&uid=${uid}&coin_kinds=${coin_kinds}&ts=${ts}`;
//   const sign_v2 = crypto.createHmac("sha256", app_secret).update(stringToSign).digest("hex");

//   const url = `https://yourdomain.com/game/api/finance/coin/account/balance?uid=${uid}&coin_kinds=${coin_kinds}&app_key=${app_key}&game_key=${game_key}&ts=${ts}&sign_v2=${sign_v2}`;

//   return res.json({
//     success: true,
//     message: 'Signed balance URL generated successfully',
//     url
//   });
// });


module.exports = router;
