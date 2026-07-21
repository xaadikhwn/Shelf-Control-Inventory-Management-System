import express from 'express';
import { updateProfile, uploadProfilePicture } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';
import { uploadAvatar } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.use(protect);

router.put('/profile', updateProfile);
router.post('/profile-picture', uploadAvatar.single('avatar'), uploadProfilePicture);

export default router;
