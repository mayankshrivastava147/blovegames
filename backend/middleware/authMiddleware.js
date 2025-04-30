const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Token decode karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Database se user validate karo
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found, authorization denied' });
      }

      // User data attach karo request me
      req.user = user;
      next();

    } catch (error) {
      console.error('Token error:', error);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please login again' });
      } else {
        return res.status(401).json({ message: 'Invalid token, authorization denied' });
      }
    }
  } else {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};

module.exports = { protect };
