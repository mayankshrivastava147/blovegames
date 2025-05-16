require('dotenv').config();
const generateSignature = require('./generateSignature');

const ts = Date.now();
const APP_SECRET = process.env.APP_SECRET;

if (!APP_SECRET) {
  throw new Error('❌ APP_SECRET not found in .env file');
}

const sign = generateSignature(
  {
    app_key: 'jk',
    game_key: 'fruitspin',
    uid: '682713216556fe6f0ddd5a84',
    coin_kinds: 'gift_pass',
    ts: ts,
    app_secret: APP_SECRET   // ✅ Yeh add karo
  },
  'balance'  // ✅ Signature type correct
);

console.log('Generated ts:', ts);
console.log('Generated sign_v2:', sign);
