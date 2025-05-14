const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const appConfig = require('../config/appConfig');

// ✅ GET /api/utils/generate-signature
router.get('/generate-signature', async (req, res) => {
  const {
    uid,
    opt_type = 'sub',
    app_key = 'jk',
    game_key,
    coin_kind = 'gift_pass'
  } = req.query;

  if (!uid || !game_key) {
    return res.status(400).json({
      success: false,
      message: 'uid and game_key are required'
    });
  }

  const config = appConfig[app_key];
  if (!config || !config.valid_game_keys.includes(game_key)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid app_key or game_key'
    });
  }

  const ts = Date.now();
  const stringToSign = `app_key=${app_key}&game_key=${game_key}&uid=${uid}&opt_type=${opt_type}&coin_kind=${coin_kind}&ts=${ts}`;
  const sign_v2 = crypto.createHmac('sha256', config.app_secret).update(stringToSign).digest('hex');

  return res.json({
    success: true,
    message: 'Signature generated successfully',
    data: {
      uid,
      game_key,
      opt_type,
      ts,
      sign_v2,
      stringToSign
    }
  });
});

module.exports = router;
