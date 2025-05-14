const crypto = require('crypto');

/**
 * Generates sign_v2 for API calls
 * @param {string} app_secret - The secret key from .env
 * @param {object} params - Parameters for signature
 * @param {string} type - balance | order_create | update
 * @returns {string} sign_v2 hash
 */
function generateSignature(app_secret, params, type) {
  let stringToSign = '';

  switch (type) {
    case 'balance':
      stringToSign = `app_key=${params.app_key}&game_key=${params.game_key}&uid=${params.uid}&coin_kinds=${params.coin_kinds}&ts=${params.ts}`;
      break;

    case 'order_create':
      stringToSign = `app_key=${params.app_key}&game_key=${params.game_key}&uid=${params.uid}&opt_type=${params.opt_type}&coin_kind=${params.coin_kind}&ts=${params.ts}`;
      break;

    case 'update':
      stringToSign = `app_key=${params.app_key}&game_key=${params.game_key}&uid=${params.uid}&order_id=${params.order_id}&opt_type=${params.opt_type}&coin_kind=${params.coin_kind}&num=${params.num}&ts=${params.ts}`;
      break;

    default:
      throw new Error(`❌ Invalid signature type: ${type}`);
  }

  const hash = crypto.createHmac('sha256', app_secret).update(stringToSign).digest('hex');
  return hash;
}

module.exports = generateSignature;
