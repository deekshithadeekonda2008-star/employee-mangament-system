import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateAttendance } from '../validators/employeeValidator.js';

const router = express.Router();

router.get('/', authenticate, attendanceController.getAttendance);
router.post('/check-in', authenticate, attendanceController.employeeCheckIn);
router.post('/check-out', authenticate, attendanceController.employeeCheckOut);
router.post('/', authenticate, authorize(['Admin', 'HR Manager']), validate(validateAttendance), attendanceController.recordManualAttendance);
router.put('/:id', authenticate, authorize(['Admin', 'HR Manager']), attendanceController.updateAttendance);

export default router;
