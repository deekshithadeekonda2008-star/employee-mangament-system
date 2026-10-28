/**
 * Input Validators for Employee Management System.
 * Ensures data integrity, format verification, and defense against malformed inputs.
 */

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valid enum values
export const VALID_EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];
export const VALID_EMPLOYMENT_STATUSES = ['Active', 'On Leave', 'Inactive'];
export const VALID_GENDERS = ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'];
export const VALID_ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Half-day', 'Leave'];
export const VALID_LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'];
export const VALID_LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
export const VALID_PAYROLL_STATUSES = ['Draft', 'Pending', 'Paid'];

/**
 * Validates employee creation payload.
 */
export const validateEmployeeCreate = (data) => {
    const errors = [];

    if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim().length < 2) {
        errors.push('First name is required and must be at least 2 characters.');
    }

    if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim().length < 2) {
        errors.push('Last name is required and must be at least 2 characters.');
    }

    if (!data.email || !EMAIL_REGEX.test(data.email.trim())) {
        errors.push('A valid email address is required.');
    }

    if (!data.department_id) {
        errors.push('Department ID is required.');
    }

    if (!data.job_title || typeof data.job_title !== 'string' || data.job_title.trim().length < 2) {
        errors.push('Job title is required and must be at least 2 characters.');
    }

    if (data.phone && typeof data.phone === 'string' && data.phone.trim().length > 0) {
        const phoneRegex = /^[\d\+\-\(\)\s]{7,25}$/;
        if (!phoneRegex.test(data.phone.trim())) {
            errors.push('Phone number format is invalid (7-25 characters allowed, numbers/symbols).');
        }
    }

    if (data.employment_type && !VALID_EMPLOYMENT_TYPES.includes(data.employment_type)) {
        errors.push(`Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}.`);
    }

    if (data.employment_status && !VALID_EMPLOYMENT_STATUSES.includes(data.employment_status)) {
        errors.push(`Employment status must be one of: ${VALID_EMPLOYMENT_STATUSES.join(', ')}.`);
    }

    if (data.basic_salary !== undefined && data.basic_salary !== null) {
        const salary = parseFloat(data.basic_salary);
        if (isNaN(salary) || salary < 0) {
            errors.push('Basic salary must be a non-negative number.');
        }
    }

    if (data.joining_date && isNaN(Date.parse(data.joining_date))) {
        errors.push('Joining date must be a valid date format (YYYY-MM-DD).');
    }

    if (data.date_of_birth && isNaN(Date.parse(data.date_of_birth))) {
        errors.push('Date of birth must be a valid date format (YYYY-MM-DD).');
    }

    if (data.gender && !VALID_GENDERS.includes(data.gender)) {
        errors.push(`Gender must be one of: ${VALID_GENDERS.join(', ')}.`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates employee update payload.
 */
export const validateEmployeeUpdate = (data) => {
    const errors = [];

    if (data.first_name !== undefined && (typeof data.first_name !== 'string' || data.first_name.trim().length < 2)) {
        errors.push('First name must be at least 2 characters.');
    }

    if (data.last_name !== undefined && (typeof data.last_name !== 'string' || data.last_name.trim().length < 2)) {
        errors.push('Last name must be at least 2 characters.');
    }

    if (data.email !== undefined && !EMAIL_REGEX.test(data.email.trim())) {
        errors.push('Email must be in a valid email format.');
    }

    if (data.phone !== undefined && data.phone !== null && data.phone.trim().length > 0) {
        const phoneRegex = /^[\d\+\-\(\)\s]{7,25}$/;
        if (!phoneRegex.test(data.phone.trim())) {
            errors.push('Phone number format is invalid (7-25 characters allowed, numbers/symbols).');
        }
    }

    if (data.employment_type && !VALID_EMPLOYMENT_TYPES.includes(data.employment_type)) {
        errors.push(`Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}.`);
    }

    if (data.employment_status && !VALID_EMPLOYMENT_STATUSES.includes(data.employment_status)) {
        errors.push(`Employment status must be one of: ${VALID_EMPLOYMENT_STATUSES.join(', ')}.`);
    }

    if (data.basic_salary !== undefined && data.basic_salary !== null) {
        const salary = parseFloat(data.basic_salary);
        if (isNaN(salary) || salary < 0) {
            errors.push('Basic salary must be a non-negative number.');
        }
    }

    if (data.gender && !VALID_GENDERS.includes(data.gender)) {
        errors.push(`Gender must be one of: ${VALID_GENDERS.join(', ')}.`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates department creation/update payload.
 */
export const validateDepartment = (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('Department name is required and must be at least 2 characters.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates attendance record creation/update payload.
 */
export const validateAttendance = (data) => {
    const errors = [];

    if (!data.employee_id) {
        errors.push('Employee ID is required.');
    }

    if (!data.attendance_date || isNaN(Date.parse(data.attendance_date))) {
        errors.push('A valid attendance date (YYYY-MM-DD) is required.');
    }

    if (data.status && !VALID_ATTENDANCE_STATUSES.includes(data.status)) {
        errors.push(`Attendance status must be one of: ${VALID_ATTENDANCE_STATUSES.join(', ')}.`);
    }

    if (data.check_in && data.check_out) {
        if (data.check_out < data.check_in) {
            errors.push('Check-out time cannot precede check-in time.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates leave request submission.
 */
export const validateLeaveRequest = (data) => {
    const errors = [];

    if (!data.leave_type || !VALID_LEAVE_TYPES.includes(data.leave_type)) {
        errors.push(`Leave type is required and must be one of: ${VALID_LEAVE_TYPES.join(', ')}.`);
    }

    if (!data.start_date || isNaN(Date.parse(data.start_date))) {
        errors.push('Start date must be a valid date (YYYY-MM-DD).');
    }

    if (!data.end_date || isNaN(Date.parse(data.end_date))) {
        errors.push('End date must be a valid date (YYYY-MM-DD).');
    }

    if (data.start_date && data.end_date) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        if (end < start) {
            errors.push('End date cannot precede start date.');
        }
    }

    if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length < 3) {
        errors.push('Reason is required and must be at least 3 characters.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates payroll record creation/update.
 */
export const validatePayroll = (data) => {
    const errors = [];

    if (!data.employee_id) {
        errors.push('Employee ID is required.');
    }

    const month = parseInt(data.pay_month, 10);
    if (isNaN(month) || month < 1 || month > 12) {
        errors.push('Pay month must be an integer between 1 and 12.');
    }

    const year = parseInt(data.pay_year, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
        errors.push('Pay year must be a valid year (2000-2100).');
    }

    const basicSalary = parseFloat(data.basic_salary);
    if (isNaN(basicSalary) || basicSalary < 0) {
        errors.push('Basic salary must be a non-negative number.');
    }

    if (data.allowances !== undefined) {
        const val = parseFloat(data.allowances);
        if (isNaN(val) || val < 0) errors.push('Allowances must be a non-negative number.');
    }

    if (data.bonus !== undefined) {
        const val = parseFloat(data.bonus);
        if (isNaN(val) || val < 0) errors.push('Bonus must be a non-negative number.');
    }

    if (data.deductions !== undefined) {
        const val = parseFloat(data.deductions);
        if (isNaN(val) || val < 0) errors.push('Deductions must be a non-negative number.');
    }

    if (data.payment_status && !VALID_PAYROLL_STATUSES.includes(data.payment_status)) {
        errors.push(`Payment status must be one of: ${VALID_PAYROLL_STATUSES.join(', ')}.`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
