import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

export const getSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getDashboardSummary();
        return sendSuccess(res, 'Dashboard summary metrics retrieved successfully.', summary);
    } catch (err) {
        next(err);
    }
};

export const getCharts = async (req, res, next) => {
    try {
        const charts = await dashboardService.getDashboardCharts();
        return sendSuccess(res, 'Dashboard chart datasets retrieved successfully.', charts);
    } catch (err) {
        next(err);
    }
};

export const getRecentActivity = async (req, res, next) => {
    try {
        const activity = await dashboardService.getRecentActivity();
        return sendSuccess(res, 'Recent dashboard activity retrieved successfully.', activity);
    } catch (err) {
        next(err);
    }
};
