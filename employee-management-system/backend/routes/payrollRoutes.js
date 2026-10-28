import express from 'express';
import * as payrollController from '../controllers/payrollController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validatePayroll } from '../validators/employeeValidator.js';

const router = express.Router();

router.get('/', authenticate, payrollController.getPayroll);
router.get('/:id', authenticate, payrollController.getPayrollById);
router.post('/', authenticate, authorize(['Admin', 'HR Manager']), validate(validatePayroll), payrollController.createPayroll);
router.put('/:id', authenticate, authorize(['Admin', 'HR Manager']), payrollController.updatePayroll);
router.patch('/:id/status', authenticate, authorize(['Admin', 'HR Manager']), payrollController.updatePayrollStatus);

export default router;
