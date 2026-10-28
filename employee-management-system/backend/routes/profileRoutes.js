import express from 'express';
import * as profileController from '../controllers/profileController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, profileController.updateProfile);

export default router;
