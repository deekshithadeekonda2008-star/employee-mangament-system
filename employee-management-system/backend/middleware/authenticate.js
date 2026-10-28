import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication Middleware
 * Validates Supabase JWT Bearer token and attaches authenticated user context.
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Authentication required. Missing or malformed Bearer token.', [], 401);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return sendError(res, 'Authentication token missing.', [], 401);
        }

        // Development mock tokens support
        if (token.startsWith('dev-')) {
            if (token === 'dev-admin-token') {
                req.user = {
                    id: 'dev-admin-uid-1001',
                    email: 'admin@company.com',
                    display_name: 'System Admin (Dev)',
                    role: 'Admin',
                    employee_id: 'e1000000-0000-0000-0000-000000000001'
                };
                return next();
            } else if (token === 'dev-hr-token') {
                req.user = {
                    id: 'dev-hr-uid-1002',
                    email: 'hr@company.com',
                    display_name: 'HR Manager (Dev)',
                    role: 'HR Manager',
                    employee_id: 'e1000000-0000-0000-0000-000000000002'
                };
                return next();
            } else if (token === 'dev-employee-token') {
                req.user = {
                    id: 'dev-emp-uid-1004',
                    email: 'maya.chen@company.com',
                    display_name: 'Maya Chen (Dev)',
                    role: 'Employee',
                    employee_id: 'e1000000-0000-0000-0000-000000000004'
                };
                return next();
            }
        }

        // If Supabase is not configured, inform the client
        if (!isSupabaseConfigured()) {
            return sendError(res, 'Supabase credentials are not configured on the backend. Please configure .env with your Supabase keys or use development credentials.', [], 401);
        }

        // Verify token with Supabase Auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return sendError(res, 'Invalid, expired, or revoked authentication session.', [authError?.message || 'User not found'], 401);
        }

        // Query profiles table for role and display metadata
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, display_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            // Auto-provision profile or return error if missing
            return sendError(res, 'User profile record not found. Please contact an administrator.', [profileError?.message], 403);
        }

        // Retrieve linked employee record if available
        const { data: employee } = await supabaseAdmin
            .from('employees')
            .select('id, employee_code, first_name, last_name, department_id, basic_salary')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        // Attach safe user context
        req.user = {
            id: user.id,
            email: user.email,
            role: profile.role,
            display_name: profile.display_name || `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || user.email,
            employee_id: employee?.id || null,
            employee_code: employee?.employee_code || null,
            department_id: employee?.department_id || null
        };

        next();
    } catch (err) {
        return sendError(res, 'Authentication verification failure.', [err.message], 500);
    }
};
