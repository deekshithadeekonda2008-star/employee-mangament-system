import * as payrollService from '../services/payrollService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getPayroll = async (req, res, next) => {
    try {
        const { employee_id, pay_month, pay_year, payment_status, page, limit } = req.query;
        const result = await payrollService.getAllPayroll(
            { employee_id, pay_month, pay_year, payment_status, page, limit },
            req.user
        );
        return sendSuccess(res, 'Payroll records retrieved successfully.', result);
    } catch (err) {
        next(err);
    }
};

export const getPayrollById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payroll = await payrollService.getPayrollById(id, req.user);
        return sendSuccess(res, 'Payroll statement retrieved successfully.', { payroll });
    } catch (err) {
        next(err);
    }
};

export const createPayroll = async (req, res, next) => {
    try {
        const payroll = await payrollService.createPayroll(req.body);
        return sendSuccess(res, 'Payroll record created successfully.', { payroll }, 201);
    } catch (err) {
        next(err);
    }
};

export const updatePayroll = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payroll = await payrollService.updatePayroll(id, req.body);
        return sendSuccess(res, 'Payroll record updated successfully.', { payroll });
    } catch (err) {
        next(err);
    }
};

export const updatePayrollStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { payment_status, payment_date } = req.body;
        if (!payment_status || !['Draft', 'Pending', 'Paid'].includes(payment_status)) {
            return sendError(res, "Payment status must be 'Draft', 'Pending', or 'Paid'.", [], 400);
        }
        const payroll = await payrollService.updatePayrollStatus(id, payment_status, payment_date);
        return sendSuccess(res, `Payroll payment status updated to '${payment_status}'.`, { payroll });
    } catch (err) {
        next(err);
    }
};
