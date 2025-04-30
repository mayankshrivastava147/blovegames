// utils/verifySignature.js
const crypto = require('crypto');

function verifySignature(body, receivedSignature, secret) {
  const payload = JSON.stringify(body); // Body ko JSON string banate hain

  const expectedSignature = crypto
    .createHmac('sha256', secret)      // secret key ke saath HMAC
    .update(payload)                   // payload ko encrypt karo
    .digest('hex');                    // hex format me output lo

  return receivedSignature === expectedSignature; // Match check
}

module.exports = verifySignature;
