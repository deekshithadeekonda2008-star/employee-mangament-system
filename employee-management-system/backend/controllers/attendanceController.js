import * as attendanceService from '../services/attendanceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAttendance = async (req, res, next) => {
    try {
        const { date, start_date, end_date, employee_id, department_id, status, page, limit } = req.query;
        const result = await attendanceService.getAllAttendance(
            { date, start_date, end_date, employee_id, department_id, status, page, limit },
            req.user
        );
        return sendSuccess(res, 'Attendance records retrieved successfully.', result);
    } catch (err) {
        next(err);
    }
};

export const employeeCheckIn = async (req, res, next) => {
    try {
        const targetEmployeeId = req.user.employee_id;
        if (!targetEmployeeId) {
            return sendError(res, 'No employee record linked to current user account for check-in.', [], 400);
        }
        const record = await attendanceService.employeeCheckIn(targetEmployeeId, req.body.remarks);
        return sendSuccess(res, 'Checked in successfully.', { attendance: record }, 201);
    } catch (err) {
        next(err);
    }
};

export const employeeCheckOut = async (req, res, next) => {
    try {
        const targetEmployeeId = req.user.employee_id;
        if (!targetEmployeeId) {
            return sendError(res, 'No employee record linked to current user account for check-out.', [], 400);
        }
        const record = await attendanceService.employeeCheckOut(targetEmployeeId, req.body.remarks);
        return sendSuccess(res, 'Checked out successfully.', { attendance: record });
    } catch (err) {
        next(err);
    }
};

export const recordManualAttendance = async (req, res, next) => {
    try {
        const record = await attendanceService.recordManualAttendance(req.body);
        return sendSuccess(res, 'Attendance record created successfully.', { attendance: record }, 201);
    } catch (err) {
        next(err);
    }
};

export const updateAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const record = await attendanceService.updateAttendance(id, req.body);
        return sendSuccess(res, 'Attendance record updated successfully.', { attendance: record });
    } catch (err) {
        next(err);
    }
};
