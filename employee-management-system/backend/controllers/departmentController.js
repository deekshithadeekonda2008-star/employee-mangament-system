import * as departmentService from '../services/departmentService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDepartments = async (req, res, next) => {
    try {
        const { search, is_active } = req.query;
        const departments = await departmentService.getAllDepartments({ search, is_active });
        return sendSuccess(res, 'Departments retrieved successfully.', { departments });
    } catch (err) {
        next(err);
    }
};

export const getDepartmentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const department = await departmentService.getDepartmentById(id);
        return sendSuccess(res, 'Department details retrieved successfully.', { department });
    } catch (err) {
        next(err);
    }
};

export const createDepartment = async (req, res, next) => {
    try {
        const department = await departmentService.createDepartment(req.body);
        return sendSuccess(res, 'Department created successfully.', { department }, 201);
    } catch (err) {
        next(err);
    }
};

export const updateDepartment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const department = await departmentService.updateDepartment(id, req.body);
        return sendSuccess(res, 'Department updated successfully.', { department });
    } catch (err) {
        next(err);
    }
};

export const updateDepartmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        if (is_active === undefined) {
            return sendError(res, "Field 'is_active' (boolean) is required.", [], 400);
        }
        const department = await departmentService.updateDepartmentStatus(id, Boolean(is_active));
        return sendSuccess(res, `Department status updated to ${is_active ? 'active' : 'inactive'}.`, { department });
    } catch (err) {
        next(err);
    }
};

export const deleteDepartment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await departmentService.deleteDepartment(id);
        return sendSuccess(res, 'Department deleted successfully.', result);
    } catch (err) {
        next(err);
    }
};
