const bcrypt = require('bcryptjs');
const db = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role_id } = req.body;

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      return next(err);
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    
    let assignedRoleId = role_id;
    if (!assignedRoleId) {
      const userRole = await db.Role.findOne({ where: { name: 'User' } });
      assignedRoleId = userRole.id;
    }

    const user = await db.User.create({
      full_name,
      email,
      password_hash,
      role_id: assignedRoleId
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({ 
      where: { email },
      include: [{ model: db.Role }]
    });

    if (!user || !user.is_active) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      return next(err);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    await db.RefreshToken.create({
      user_id: user.id,
      token_hash: refreshToken, // ideally should be hashed before saving, keeping it simple
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.Role.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Find token and set revoked_at
      const tokenRecord = await db.RefreshToken.findOne({ where: { token_hash: refreshToken } });
      if (tokenRecord) {
        tokenRecord.revoked_at = new Date();
        await tokenRecord.save();
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.Role.name,
        avatar_url: req.user.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      const err = new Error('No refresh token provided');
      err.statusCode = 401;
      return next(err);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      return next(error);
    }

    // Check if token exists in DB and is not revoked
    const tokenRecord = await db.RefreshToken.findOne({
      where: { token_hash: refreshToken }
    });

    if (!tokenRecord || tokenRecord.revoked_at || tokenRecord.expires_at < new Date()) {
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      return next(err);
    }

    const user = await db.User.findByPk(decoded.userId, {
      include: [{ model: db.Role }]
    });

    if (!user || !user.is_active) {
      const err = new Error('User not found or inactive');
      err.statusCode = 401;
      return next(err);
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password / reset password stubs
exports.forgotPassword = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Reset link generated' });
};

exports.resetPassword = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Password reset successfully' });
};
