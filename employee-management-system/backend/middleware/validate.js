import { sendError } from '../utils/response.js';

/**
 * Request Validation Middleware factory.
 * Executes a validation callback on req (body, query, params).
 * @param {Function} validatorFn - Function returning { isValid: boolean, errors: string[] }
 * @param {'body'|'query'|'params'} source - Property on req to validate (default 'body')
 */
export const validate = (validatorFn, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = req[source] || {};
        const result = validatorFn(dataToValidate);

        if (!result.isValid) {
            return sendError(
                res,
                'Validation error: One or more fields failed validation checks.',
                result.errors || [],
                400
            );
        }

        next();
    };
};
