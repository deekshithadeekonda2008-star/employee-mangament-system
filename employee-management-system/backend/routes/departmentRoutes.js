import express from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateDepartment } from '../validators/employeeValidator.js';

const router = express.Router();

router.get('/', authenticate, departmentController.getDepartments);
router.get('/:id', authenticate, departmentController.getDepartmentById);
router.post('/', authenticate, authorize(['Admin', 'HR Manager']), validate(validateDepartment), departmentController.createDepartment);
router.put('/:id', authenticate, authorize(['Admin', 'HR Manager']), validate(validateDepartment), departmentController.updateDepartment);
router.patch('/:id/status', authenticate, authorize(['Admin', 'HR Manager']), departmentController.updateDepartmentStatus);
router.delete('/:id', authenticate, authorize('Admin'), departmentController.deleteDepartment);

export default router;
