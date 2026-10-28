import { sendError } from '../utils/response.js';

/**
 * Role-Based Authorization Middleware
 * Enforces allowed roles on protected endpoints.
 * @param {string[]|string} allowedRoles Single role or array of allowed roles ('Admin', 'HR Manager', 'Employee')
 */
export const authorize = (allowedRoles = []) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'User identity unverified. Authentication must precede authorization.', [], 401);
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return sendError(
                res,
                `Forbidden: Access denied. Required role(s): [${roles.join(', ')}]. Current role: '${req.user.role}'.`,
                [],
                403
            );
        }

        next();
    };
};
