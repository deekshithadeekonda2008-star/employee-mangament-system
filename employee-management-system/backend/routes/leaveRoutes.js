import express from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateLeaveRequest } from '../validators/employeeValidator.js';

const router = express.Router();

router.get('/', authenticate, leaveController.getLeaves);
router.get('/:id', authenticate, leaveController.getLeaveById);
router.post('/', authenticate, validate(validateLeaveRequest), leaveController.submitLeaveRequest);
router.patch('/:id/cancel', authenticate, leaveController.cancelLeaveRequest);
router.patch('/:id/review', authenticate, authorize(['Admin', 'HR Manager']), leaveController.reviewLeaveRequest);

export default router;
