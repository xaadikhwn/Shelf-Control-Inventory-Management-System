const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.Role?.name },
    process.env.JWT_ACCESS_SECRET || 'your_access_secret_key_here',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_here',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_here');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
};
