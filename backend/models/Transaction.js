// const mongoose = require('mongoose');

// const transactionSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   sessionId: { type: String, required: false },
//   gameId: { type: String, required: true },
//   type: { type: String, enum: ['credit', 'debit'], required: true },
//   amount: { type: Number, required: true },
//   timestamp: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Transaction', transactionSchema);
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  gameId: { type: String },
  orderId: { type: String, unique: true },
  type: { type: String, enum: ['credit', 'debit'] },
  amount: { type: Number },
  status: { type: String, enum: ['pending', 'completed'] },
  updatedBalance: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
