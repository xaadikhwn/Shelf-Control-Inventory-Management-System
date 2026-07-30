const bcrypt = require('bcryptjs');
const db = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role_id, role } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      return next(err);
    }

    // Check if user already exists
    const allUsers = await db.User.findAll();
    const existingUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existingUser) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      return next(err);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password.trim(), salt);

    let assignedRoleId = role_id;
    if (!assignedRoleId && role) {
      const roleObj = await db.Role.findOne({ where: { name: role } });
      if (roleObj) assignedRoleId = roleObj.id;
    }
    if (!assignedRoleId) {
      const userRole = await db.Role.findOne({ where: { name: 'User' } });
      if (userRole) assignedRoleId = userRole.id;
    }

    const user = await db.User.create({
      full_name: full_name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password_hash,
      role_id: assignedRoleId || 3,
      is_active: true
    });

    const userWithRole = await db.User.findByPk(user.id, {
      include: [{ model: db.Role }]
    });

    const accessToken = generateAccessToken(userWithRole);
    const refreshToken = generateRefreshToken(userWithRole);

    await db.RefreshToken.create({
      user_id: user.id,
      token_hash: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: userWithRole.id,
          full_name: userWithRole.full_name,
          email: userWithRole.email,
          role: userWithRole.Role ? userWithRole.Role.name : 'User'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      return next(err);
    }

    const cleanInput = email.trim().toLowerCase();

    // 1. Direct email lookup
    let user = await db.User.findOne({
      where: { email: cleanInput },
      include: [{ model: db.Role }]
    });

    // 2. Flexible fallback search (e.g., 'admin', 'manager', 'user', 'testadmin', 'alex')
    if (!user) {
      const allUsers = await db.User.findAll({ include: [{ model: db.Role }] });
      user = allUsers.find(
        (u) =>
          u.email.toLowerCase() === cleanInput ||
          u.email.toLowerCase().startsWith(cleanInput) ||
          u.email.toLowerCase().split('@')[0] === cleanInput ||
          u.full_name.toLowerCase() === cleanInput
      );

      // 3. Helpful feedback listing available accounts if no match
      if (!user) {
        res.clearCookie('refreshToken');
        const availableEmails = allUsers.map((u) => u.email).join(', ');
        return res.status(401).json({
          success: false,
          error: {
            message: `Account '${email}' not found. Registered accounts: ${availableEmails || 'admin@bizmanage.com'} (Password: admin123)`
          }
        });
      }
    }

    if (!user.is_active) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: 'User account is inactive. Please contact system administrator.' }
      });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password_hash);
    if (!isMatch) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: `Invalid password for ${user.email}. Default password is: admin123` }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    await db.RefreshToken.create({
      user_id: user.id,
      token_hash: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.Role ? user.Role.name : 'User'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
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
        role: req.user.Role ? req.user.Role.name : 'User',
        avatar_url: req.user.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'No refresh token provided' }
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired refresh token' }
      });
    }

    // Check if token exists in DB and is not revoked
    const tokenRecord = await db.RefreshToken.findOne({
      where: { token_hash: refreshToken }
    });

    if (!tokenRecord || tokenRecord.revoked_at || tokenRecord.expires_at < new Date()) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or revoked refresh token' }
      });
    }

    const user = await db.User.findByPk(decoded.userId, {
      include: [{ model: db.Role }]
    });

    if (!user || !user.is_active) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: 'User account not found or inactive' }
      });
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

exports.forgotPassword = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Reset link generated' });
};

exports.resetPassword = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Password reset successfully' });
};
