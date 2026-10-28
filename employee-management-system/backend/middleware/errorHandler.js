import { sendError } from '../utils/response.js';

/**
 * Centralized Application Error Handling Middleware
 * Ensures safe responses without exposing database credentials, secrets, or internal stack traces.
 */
export const errorHandler = (err, req, res, next) => {
    // Log error internally for debugging
    console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = err.statusCode || (res.statusCode && res.statusCode >= 400 ? res.statusCode : 500);

    // Filter out internal system error leaks
    let userMessage = err.message || 'An unexpected internal server error occurred.';
    
    // Clean up PostgreSQL or Supabase specific database error messages if sensitive
    if (userMessage.includes('password') || userMessage.includes('secret') || userMessage.includes('apiKey')) {
        userMessage = 'A database security exception occurred. Please try again or contact system support.';
    }

    const errors = err.errors || (process.env.NODE_ENV === 'development' ? [err.message] : []);

    return sendError(res, userMessage, errors, statusCode);
};

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res) => {
    return sendError(
        res,
        `Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
        [],
        404
    );
};
