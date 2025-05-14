require('dotenv').config();  // ✅ Load .env variables
const generateSignature = require('./generateSignature');  // ✅ Correct import

function getSignedPayload(data, type) {
  const ts = Date.now();  // ✅ Current timestamp

  const APP_SECRET = process.env.APP_SECRET;
  if (!APP_SECRET) {
    throw new Error('❌ APP_SECRET not found in .env file');
  }

  const sign_v2 = generateSignature(APP_SECRET, { ...data, ts }, type);

  return { ts, sign_v2 };
}

module.exports = { getSignedPayload };  // ✅ Correct export
