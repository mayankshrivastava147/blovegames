const express = require('express');
const router = express.Router();
const verifySignature = require('../utils/verifySignature');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default_secret';

router.post('/callback', (req, res) => {
  const signature = req.headers['x-webhook-signature'] || req.body.signature;

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Signature missing' });
  }

  const isValid = verifySignature(req.body, signature, WEBHOOK_SECRET);

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Signature invalid' });
  }

  console.log('✅ Webhook verified and received:', req.body);

  // 🟡 TODO: yaha game logic add karna (e.g. credit coins on win)
  res.status(200).json({ success: true, message: 'Webhook accepted' });
});

module.exports = router;
