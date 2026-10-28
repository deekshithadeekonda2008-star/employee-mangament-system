/**
 * Standardized API response utilities.
 * Ensures strict compliance with consistent JSON envelope contracts.
 */

/**
 * Sends a successful JSON response.
 * @param {import('express').Response} res
 * @param {string} message Human-readable summary
 * @param {any} data Response payload
 * @param {number} statusCode HTTP status code (default 200)
 */
export const sendSuccess = (res, message = 'Operation completed successfully', data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data: data !== null ? data : {}
    });
};

/**
 * Sends a standardized error JSON response.
 * @param {import('express').Response} res
 * @param {string} message Error message
 * @param {Array<any>|any} errors Additional error details or validation violations
 * @param {number} statusCode HTTP error status code (default 400)
 */
export const sendError = (res, message = 'An error occurred processing the request', errors = [], statusCode = 400) => {
    const formattedErrors = Array.isArray(errors) ? errors : [errors];
    return res.status(statusCode).json({
        success: false,
        message,
        errors: formattedErrors
    });
};
