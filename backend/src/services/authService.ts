import crypto from 'crypto';
import User, { IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/email';

export const registerUser = async (userData: any): Promise<IUser> => {
  const { name, email, password, role, studentId, initials } = userData;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  // Generate Email Verification Token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name,
    email,
    password,
    role,
    studentId,
    initials,
    emailVerificationToken,
    emailVerificationExpire
  });

  // Try to send email
  try {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `You are receiving this email because you need to verify your email address. \n\n Please make a GET request to: \n\n ${verifyUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
    // Don't fail the registration, but log it
    console.error('Error sending email', error);
  }

  return user;
};

export const verifyEmail = async (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired token', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

export const createPasswordResetToken = (user: IUser) => {
  const resetToken = crypto.randomBytes(20).toString('hex');

  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};
