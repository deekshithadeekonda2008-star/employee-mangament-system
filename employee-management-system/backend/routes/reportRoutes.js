import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.get('/employees', authenticate, reportController.getEmployeeReport);
router.get('/attendance', authenticate, reportController.getAttendanceReport);
router.get('/leaves', authenticate, reportController.getLeaveReport);
router.get('/payroll', authenticate, authorize(['Admin', 'HR Manager']), reportController.getPayrollReport);

export default router;
