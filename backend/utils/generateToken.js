const jwt = require('jsonwebtoken');

// بتولّد JWT يحتوي على id المستخدم، نستخدمه للتحقق من هويته بكل طلب لاحق
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
