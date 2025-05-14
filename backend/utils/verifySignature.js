const crypto = require('crypto');

function verifySignature(data, providedSignature, secret) {
  const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(stringifiedData)
    .digest('hex');

  return expectedSignature === providedSignature;
}

module.exports = verifySignature;
