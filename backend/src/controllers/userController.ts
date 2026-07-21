import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../utils/AppError';

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Filter out unwanted fields like password, role
    const { name, initials, studentId } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      { name, initials, studentId },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      { avatarUrl },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
