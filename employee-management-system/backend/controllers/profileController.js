import * as profileService from '../services/profileService.js';
import { sendSuccess } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
    try {
        const profile = await profileService.getProfile(req.user);
        return sendSuccess(res, 'User profile retrieved successfully.', { profile });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await profileService.updateProfile(req.user, req.body);
        return sendSuccess(res, 'Profile updated successfully.', { profile });
    } catch (err) {
        next(err);
    }
};
