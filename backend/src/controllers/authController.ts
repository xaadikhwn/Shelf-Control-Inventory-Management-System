import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import * as authService from '../services/authService';
import { sendEmail } from '../utils/email';

const sendTokenResponse = async (user: any, statusCode: number, res: Response) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  // Convert to object and remove sensitive info from output
  const userData = user.toObject();
  userData.password = undefined;
  userData.refreshTokens = undefined;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    data: userData,
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError('Invalid credentials', 401));
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      // Remove token from user's active refresh tokens
      await User.updateOne(
        { refreshTokens: token },
        { $pull: { refreshTokens: token } }
      );
    }

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return next(new AppError('No refresh token provided', 401));
    }

    const user = await User.findOne({ refreshTokens: token });
    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.verifyEmail(req.params.token as string);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with that email', 404));
    }

    const resetToken = authService.createPasswordResetToken(user);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });
      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Email could not be sent', 500));
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token as string).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid token or token expired', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new AppError('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
