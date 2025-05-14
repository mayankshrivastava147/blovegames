require('dotenv').config();
const express = require('express');
const router = express.Router();
const verifySignature = require('../utils/verifySignature');
const generateSignature = require('../utils/generateSignature');
const Session = require('../models/Session');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const appConfig = require('../config/appConfig');
const mongoose = require('mongoose');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default_secret';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ✅ Webhook Callback Verification
router.post('/callback', (req, res) => {
  const signature = req.headers['x-webhook-signature'] || req.body.signature;
  if (!signature) return res.status(400).json({ success: false, message: 'Signature missing' });

  const isValid = verifySignature(req.body, signature, WEBHOOK_SECRET);
  if (!isValid) return res.status(401).json({ success: false, message: 'Signature invalid' });

  console.log('✅ Webhook received:', req.body);
  return res.status(200).json({ success: true, message: 'Webhook accepted' });
});

// ✅ Session Validation API
router.get('/check/session', async (req, res) => {
  const { uid, sid, game_key, app_key } = req.query;

  if (!uid || !sid || !game_key || !app_key) {
    return res.json({ dm_error: 400, error_msg: "Missing required parameters", data: {} });
  }

  const config = appConfig[app_key];
  if (!config || !config.valid_game_keys.includes(game_key)) {
    return res.json({ dm_error: 401, error_msg: "Invalid app_key or game_key", data: {} });
  }

  try {
    const session = await Session.findOne({ sessionId: sid, status: 'active' });
    if (!session) return res.json({ dm_error: 403, error_msg: "Invalid or expired session", data: {} });

    if (session.userId.toString() !== uid) {
      return res.json({ dm_error: 404, error_msg: "User ID mismatch", data: {} });
    }

    return res.json({ dm_error: 0, error_msg: "success", data: {} });
  } catch (err) {
    return res.json({ dm_error: 500, error_msg: err.message, data: {} });
  }
});

// ✅ Coin Balance API
router.get('/finance/coin/account/balance', async (req, res) => {
  const { uid, coin_kinds, app_key, game_key, ts, sign_v2 } = req.query;

  if (!uid || !coin_kinds || !app_key || !game_key || !ts || !sign_v2) {
    return res.status(400).json({ dm_error: 499, error_msg: 'Missing required parameters', data: [] });
  }

  const config = appConfig[app_key];
  if (!config || !config.valid_game_keys.includes(game_key)) {
    return res.status(403).json({ dm_error: 403, error_msg: 'Invalid app_key or game_key', data: [] });
  }

  const expectedSign = generateSignature({ app_key, game_key, uid, coin_kinds, ts }, 'balance');
  if (expectedSign !== sign_v2) {
    return res.status(403).json({ dm_error: 403, error_msg: 'Invalid signature', data: [] });
  }

  try {
    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ dm_error: 404, error_msg: 'User not found', data: [] });
    }

    const coinsArray = coin_kinds.split(',').map(coin => ({ coin_kind: coin, num: user.walletBalance }));
    return res.status(200).json({ dm_error: 0, error_msg: 'success', data: coinsArray });
  } catch (err) {
    return res.status(500).json({ dm_error: 500, error_msg: err.message, data: [] });
  }
});

// ✅ Order Create API
router.post('/finance/coin/order/create', async (req, res) => {
  const { app_key, game_key, uid, opt_type, coin_kind, ts, sign_v2, num, extra = {} } = req.body;

  if (!app_key || !game_key || !uid || !opt_type || !coin_kind || !ts || !sign_v2 || !num) {
    return res.status(400).json({ dm_error: 499, error_msg: 'Missing required parameters', data: {} });
  }

  const config = appConfig[app_key];
  if (!config || !config.valid_game_keys.includes(game_key)) {
    return res.status(400).json({ dm_error: 499, error_msg: 'Invalid app_key or game_key', data: {} });
  }

  const expectedSign = generateSignature({ app_key, game_key, uid, opt_type, coin_kind, ts }, 'order_create');
  if (expectedSign !== sign_v2) {
    return res.status(403).json({ dm_error: 403, error_msg: 'Invalid signature', data: {} });
  }

  try {
    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ dm_error: 404, error_msg: 'User not found', data: {} });

    if (opt_type === 'sub' && user.walletBalance < Math.abs(num)) {
      return res.status(400).json({ dm_error: 1001, error_msg: 'Insufficient balance', data: {} });
    }

    const order_id = `order_${Date.now()}_${uid}`;
    await Transaction.create({
      userId: uid,
      sessionId: extra.session_id || null,
      gameId: game_key,
      orderId: order_id,
      type: opt_type === 'sub' ? 'debit' : 'credit',
      amount: Math.abs(num),
      status: 'pending'
    });

    return res.status(200).json({ dm_error: 0, error_msg: 'success', data: { order_id } });
  } catch (err) {
    return res.status(500).json({ dm_error: 500, error_msg: err.message, data: {} });
  }
});

// ✅ Coin Update API
router.post('/finance/coin/update', async (req, res) => {
  const { app_key, game_key, uid, order_id, opt_type, coin_kind, num, ts, sign_v2, extra = {} } = req.body;

  if (!app_key || !game_key || !uid || !order_id || !opt_type || !coin_kind || !ts || !sign_v2 || !num) {
    return res.status(400).json({ dm_error: 499, error_msg: 'Missing required parameters', data: {} });
  }

  const config = appConfig[app_key];
  if (!config || !config.valid_game_keys.includes(game_key)) {
    return res.status(400).json({ dm_error: 499, error_msg: 'Invalid app_key or game_key', data: {} });
  }

  const expectedSign = generateSignature({ app_key, game_key, uid, order_id, opt_type, coin_kind, num, ts }, 'update');
  if (expectedSign !== sign_v2) {
    return res.status(403).json({ dm_error: 403, error_msg: 'Invalid signature', data: {} });
  }

  try {
    const tx = await Transaction.findOne({ orderId: order_id });
    if (!tx) return res.status(404).json({ dm_error: 404, error_msg: 'Order not found', data: {} });

    if (tx.status === 'completed') {
      return res.status(200).json({ dm_error: 0, error_msg: 'Already completed', data: { balance_num: tx.updatedBalance } });
    }

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ dm_error: 404, error_msg: 'User not found', data: {} });

    let updatedBalance = user.walletBalance;
    if (opt_type === 'sub') {
      if (user.walletBalance < Math.abs(num)) {
        return res.status(400).json({ dm_error: 1001, error_msg: 'Insufficient balance', data: {} });
      }
      updatedBalance -= Math.abs(num);
    } else if (opt_type === 'add' || opt_type === 'undoSub') {
      updatedBalance += Math.abs(num);
    } else {
      return res.status(400).json({ dm_error: 499, error_msg: 'Invalid opt_type', data: {} });
    }

    user.walletBalance = updatedBalance;
    await user.save();

    tx.status = 'completed';
    tx.updatedBalance = updatedBalance;
    await tx.save();

    return res.status(200).json({ dm_error: 0, error_msg: 'success', data: { balance_num: updatedBalance } });
  } catch (err) {
    return res.status(500).json({ dm_error: 500, error_msg: err.message, data: {} });
  }
});

// ✅ Get Users Info API
router.post('/users', async (req, res) => {
  const { uid, app_key, game_key } = req.body;

  if (!uid || !Array.isArray(uid) || !app_key || !game_key) {
    return res.status(400).json({ dm_error: 499, error_msg: 'Missing required parameters', data: [] });
  }

  const config = appConfig[app_key];
  if (!config || !config.valid_game_keys.includes(game_key)) {
    return res.status(403).json({ dm_error: 403, error_msg: 'Invalid app_key or game_key', data: [] });
  }

  try {
    const users = await User.find({ _id: { $in: uid } });
    const responseData = users.map(user => ({
      uid: user._id.toString(),
      nick: user.username,
      gender: user.gender || 1,
      portrait: `${BASE_URL}${user.portrait}`
    }));

    return res.status(200).json({ dm_error: 0, error_msg: 'success', data: responseData });
  } catch (err) {
    return res.status(500).json({ dm_error: 500, error_msg: err.message, data: [] });
  }
});

module.exports = router;
