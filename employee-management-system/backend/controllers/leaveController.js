import * as leaveService from '../services/leaveService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getLeaves = async (req, res, next) => {
    try {
        const { status, leave_type, employee_id, start_date, end_date, page, limit } = req.query;
        const result = await leaveService.getAllLeaves(
            { status, leave_type, employee_id, start_date, end_date, page, limit },
            req.user
        );
        return sendSuccess(res, 'Leave requests retrieved successfully.', result);
    } catch (err) {
        next(err);
    }
};

export const getLeaveById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const leave = await leaveService.getLeaveById(id, req.user);
        return sendSuccess(res, 'Leave request retrieved successfully.', { leave });
    } catch (err) {
        next(err);
    }
};

export const submitLeaveRequest = async (req, res, next) => {
    try {
        const leave = await leaveService.submitLeaveRequest(req.body, req.user);
        return sendSuccess(res, 'Leave request submitted successfully.', { leave }, 201);
    } catch (err) {
        next(err);
    }
};

export const cancelLeaveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const leave = await leaveService.cancelLeaveRequest(id, req.user);
        return sendSuccess(res, 'Leave request cancelled successfully.', { leave });
    } catch (err) {
        next(err);
    }
};

export const reviewLeaveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reviewer_comments } = req.body;
        if (!status) {
            return sendError(res, "Field 'status' is required ('Approved' or 'Rejected').", [], 400);
        }
        const leave = await leaveService.reviewLeaveRequest(id, { status, reviewer_comments }, req.user);
        return sendSuccess(res, `Leave request marked as '${status}'.`, { leave });
    } catch (err) {
        next(err);
    }
};
