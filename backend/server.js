require('dotenv').config({ path: './.env' });

console.log('🔍 Using MongoDB URI:', process.env.MONGO_URI);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((error) => console.error('❌ MongoDB Connection Error:', error));

// ✅ Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));
app.use('/game/api', require('./routes/webhookRoutes'));
app.use('/api/utils', require('./routes/utilsRoutes'));

// ✅ Static Files (public images etc.)
app.use('/public', express.static(path.join(__dirname, '../public')));

// ✅ Root API Check
app.get('/', (req, res) => {
    res.send('✅ BloveGames API is running 🚀');
});

// ✅ Global Error Handler
app.use(errorHandler);

// ✅ Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
