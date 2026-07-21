import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validations/authValidation';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/change-password', validate(changePasswordSchema), updatePassword);

export default router;
