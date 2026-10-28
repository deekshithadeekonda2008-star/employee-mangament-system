import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get('/summary', authenticate, dashboardController.getSummary);
router.get('/charts', authenticate, dashboardController.getCharts);
router.get('/recent-activity', authenticate, dashboardController.getRecentActivity);

export default router;
