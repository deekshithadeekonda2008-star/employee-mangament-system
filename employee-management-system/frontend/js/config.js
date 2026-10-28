/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - CLIENT CONFIGURATION
 */

const CONFIG = {
    // Backend API Base Endpoint
    API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname || window.location.protocol === 'file:')
        ? 'http://localhost:5000/api'
        : `${window.location.origin}/api`,

    // Application Role Enums
    ROLES: {
        ADMIN: 'Admin',
        HR: 'HR Manager',
        EMPLOYEE: 'Employee'
    },

    // Browser Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'ems_access_token',
        USER: 'ems_user_data'
    },

    // Session Expiry Time Check
    SESSION_TIMEOUT_MINUTES: 120
};

window.CONFIG = CONFIG;
