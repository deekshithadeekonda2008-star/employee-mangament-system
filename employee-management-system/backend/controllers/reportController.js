import * as reportService from '../services/reportService.js';
import { sendSuccess } from '../utils/response.js';

export const getEmployeeReport = async (req, res, next) => {
    try {
        const { department_id, employment_status, employment_type, start_date, end_date } = req.query;
        const report = await reportService.getEmployeeReport(
            { department_id, employment_status, employment_type, start_date, end_date },
            req.user
        );
        return sendSuccess(res, 'Employee report generated successfully.', { records: report, total: report.length });
    } catch (err) {
        next(err);
    }
};

export const getAttendanceReport = async (req, res, next) => {
    try {
        const { start_date, end_date, employee_id, department_id, status } = req.query;
        const report = await reportService.getAttendanceReport(
            { start_date, end_date, employee_id, department_id, status },
            req.user
        );
        return sendSuccess(res, 'Attendance report generated successfully.', { records: report, total: report.length });
    } catch (err) {
        next(err);
    }
};

export const getLeaveReport = async (req, res, next) => {
    try {
        const { start_date, end_date, employee_id, status, leave_type } = req.query;
        const report = await reportService.getLeaveReport(
            { start_date, end_date, employee_id, status, leave_type },
            req.user
        );
        return sendSuccess(res, 'Leave report generated successfully.', { records: report, total: report.length });
    } catch (err) {
        next(err);
    }
};

export const getPayrollReport = async (req, res, next) => {
    try {
        const { pay_month, pay_year, payment_status, employee_id } = req.query;
        const report = await reportService.getPayrollReport(
            { pay_month, pay_year, payment_status, employee_id },
            req.user
        );
        return sendSuccess(res, 'Payroll report generated successfully.', { records: report, total: report.length });
    } catch (err) {
        next(err);
    }
};
