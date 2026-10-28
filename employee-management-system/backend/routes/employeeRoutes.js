import express from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateEmployeeCreate, validateEmployeeUpdate } from '../validators/employeeValidator.js';

const router = express.Router();

router.get('/', authenticate, employeeController.getEmployees);
router.get('/:id', authenticate, employeeController.getEmployeeById);
router.post('/', authenticate, authorize(['Admin', 'HR Manager']), validate(validateEmployeeCreate), employeeController.createEmployee);
router.put('/:id', authenticate, authorize(['Admin', 'HR Manager']), validate(validateEmployeeUpdate), employeeController.updateEmployee);
router.patch('/:id/status', authenticate, authorize(['Admin', 'HR Manager']), employeeController.updateEmployeeStatus);
router.delete('/:id', authenticate, authorize(['Admin', 'HR Manager']), employeeController.deleteEmployee);

export default router;
