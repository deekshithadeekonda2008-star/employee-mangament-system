import * as employeeService from '../services/employeeService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getEmployees = async (req, res, next) => {
    try {
        const { search, department_id, employment_status, employment_type, sort_by, sort_order, page, limit } = req.query;
        const result = await employeeService.getAllEmployees(
            { search, department_id, employment_status, employment_type, sort_by, sort_order, page, limit },
            req.user
        );
        return sendSuccess(res, 'Employees retrieved successfully.', result);
    } catch (err) {
        next(err);
    }
};

export const getEmployeeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.getEmployeeById(id, req.user);
        return sendSuccess(res, 'Employee details retrieved successfully.', { employee });
    } catch (err) {
        next(err);
    }
};

export const createEmployee = async (req, res, next) => {
    try {
        const employee = await employeeService.createEmployee(req.body);
        return sendSuccess(res, 'Employee record created successfully.', { employee }, 201);
    } catch (err) {
        next(err);
    }
};

export const updateEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.updateEmployee(id, req.body);
        return sendSuccess(res, 'Employee record updated successfully.', { employee });
    } catch (err) {
        next(err);
    }
};

export const updateEmployeeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['Active', 'On Leave', 'Inactive'].includes(status)) {
            return sendError(res, "Status must be 'Active', 'On Leave', or 'Inactive'.", [], 400);
        }
        const employee = await employeeService.updateEmployeeStatus(id, status);
        return sendSuccess(res, `Employee status updated to '${status}'.`, { employee });
    } catch (err) {
        next(err);
    }
};

export const deleteEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.deleteEmployee(id);
        return sendSuccess(res, 'Employee record deleted successfully.', { employee });
    } catch (err) {
        next(err);
    }
};
