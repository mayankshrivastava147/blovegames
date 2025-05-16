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
    order_id: 'order_1747392820641_682713216556fe6f0ddd5a84',
    opt_type: 'add',
    coin_kind: 'gift_pass',
    num: 100,
    ts: ts,
    app_secret: APP_SECRET   // ✅ Yeh add karo params me
  },
  'update'  // ✅ Signature type correct
);

console.log('Generated ts:', ts);
console.log('Generated sign_v2:', sign);
