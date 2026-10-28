import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Public login endpoint (authenticates with Supabase Auth or dev fallback)
router.post('/login', authController.login);

// Protected session check
router.get('/me', authenticate, authController.getMe);

// Protected logout
router.post('/logout', authenticate, authController.logout);

// Admin-only user provisioning endpoint
router.post('/provision', authenticate, authorize('Admin'), authController.provisionUser);

export default router;
