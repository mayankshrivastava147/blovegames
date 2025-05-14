require('dotenv').config();
const generateSignature = require('./generateSignature');

const ts = Date.now();
const APP_SECRET = process.env.APP_SECRET;

if (!APP_SECRET) {
  throw new Error('❌ APP_SECRET not found in .env file');
}

const sign = generateSignature(
  APP_SECRET,
  {
    app_key: 'jk',
    game_key: 'fruitspin',
    uid: '6824a03ab733c9beda442413',
    order_id: 'order_1747239103259_6824a03ab733c9beda442413',
    opt_type: 'add',
    coin_kind: 'gift_pass',
    num: 10,
    ts: ts
  },
  'update'
);

console.log('Generated ts:', ts);
console.log('Generated sign_v2:', sign);
