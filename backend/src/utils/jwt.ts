import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const generateAccessToken = (userId: string | Types.ObjectId): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });
};

export const generateRefreshToken = (userId: string | Types.ObjectId): string => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });
};
