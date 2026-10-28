import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMe = async (req, res, next) => {
    try {
        return sendSuccess(res, 'Current authenticated session retrieved.', {
            user: req.user
        });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        // Stateless JWT token - client clears storage, or Supabase revokes
        return sendSuccess(res, 'Logged out successfully.');
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return sendError(res, 'Email and password are required.', [], 400);
        }

        // Development mock login for testing and demo shortcuts
        const devUsers = {
            'admin@company.com': { token: 'dev-admin-token', role: 'Admin', name: 'System Admin (Dev)', empId: 'e1000000-0000-0000-0000-000000000001' },
            'hr@company.com': { token: 'dev-hr-token', role: 'HR Manager', name: 'HR Manager (Dev)', empId: 'e1000000-0000-0000-0000-000000000002' },
            'employee@company.com': { token: 'dev-employee-token', role: 'Employee', name: 'Maya Chen (Dev)', empId: 'e1000000-0000-0000-0000-000000000004' }
        };

        const targetDev = devUsers[email.toLowerCase()];

        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                    email,
                    password
                });

                if (error || !data?.user) {
                    // In development mode, if demo credentials are used, fall back so developer is not blocked
                    if (process.env.NODE_ENV !== 'production' && targetDev && password === 'Password123!') {
                        console.warn(`[Auth Fallback]: Demo account "${email}" authenticated via local dev store.`);
                        return sendSuccess(res, 'Development authentication successful (Demo account fallback).', {
                            session: {
                                access_token: targetDev.token,
                                refresh_token: 'dev-refresh-token',
                                expires_at: Math.floor(Date.now() / 1000) + 86400
                            },
                            user: {
                                id: `dev-user-${targetDev.role.toLowerCase()}`,
                                email,
                                role: targetDev.role,
                                display_name: targetDev.name,
                                employee_id: targetDev.empId
                            }
                        });
                    }

                    // Check for network or connection failures to Supabase
                    if (error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')) {
                        return sendError(res, 'Unable to connect to Supabase. Please verify SUPABASE_URL in your backend .env file.', [error.message], 503);
                    }

                    return sendError(res, error?.message || 'Invalid email or password credentials.', [], 401);
                }

                // Fetch profile
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('role, display_name')
                    .eq('id', data.user.id)
                    .single();

                // Fetch linked employee
                const { data: employee } = await supabaseAdmin
                    .from('employees')
                    .select('id, employee_code, first_name, last_name')
                    .eq('auth_user_id', data.user.id)
                    .maybeSingle();

                return sendSuccess(res, 'Authentication successful.', {
                    session: {
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                        expires_at: data.session.expires_at
                    },
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        role: profile?.role || 'Employee',
                        display_name: profile?.display_name || data.user.email,
                        employee_id: employee?.id || null
                    }
                });
            } catch (supaErr) {
                if (process.env.NODE_ENV !== 'production' && targetDev && password === 'Password123!') {
                    console.warn(`[Auth Fallback]: Supabase error (${supaErr.message}). Demo account "${email}" authenticated via local dev store.`);
                    return sendSuccess(res, 'Development authentication successful (Demo account fallback).', {
                        session: {
                            access_token: targetDev.token,
                            refresh_token: 'dev-refresh-token',
                            expires_at: Math.floor(Date.now() / 1000) + 86400
                        },
                        user: {
                            id: `dev-user-${targetDev.role.toLowerCase()}`,
                            email,
                            role: targetDev.role,
                            display_name: targetDev.name,
                            employee_id: targetDev.empId
                        }
                    });
                }
                return sendError(res, `Failed to reach Supabase database: ${supaErr.message}. Verify SUPABASE_URL in backend .env.`, [], 503);
            }
        }

        // Development mock login for testing without live Supabase
        if (targetDev && password === 'Password123!') {
            return sendSuccess(res, 'Development authentication successful.', {
                session: {
                    access_token: targetDev.token,
                    refresh_token: 'dev-refresh-token',
                    expires_at: Math.floor(Date.now() / 1000) + 86400
                },
                user: {
                    id: `dev-user-${targetDev.role.toLowerCase()}`,
                    email,
                    role: targetDev.role,
                    display_name: targetDev.name,
                    employee_id: targetDev.empId
                }
            });
        }

        return sendError(res, 'Invalid email or password. Default test accounts: admin@company.com, hr@company.com, employee@company.com with password: Password123!', [], 401);
    } catch (err) {
        next(err);
    }
};

/**
 * Admin authorized account-provisioning workflow
 * (Creates auth.users account and profile without allowing public self-escalation)
 */
export const provisionUser = async (req, res, next) => {
    try {
        const { email, password, display_name, role, employee_id } = req.body;
        if (!email || !password || !role) {
            return sendError(res, 'Email, password, and role are required.', [], 400);
        }

        if (!['Admin', 'HR Manager', 'Employee'].includes(role)) {
            return sendError(res, "Role must be 'Admin', 'HR Manager', or 'Employee'.", [], 400);
        }

        if (isSupabaseConfigured()) {
            const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { display_name }
            });

            if (authErr) throw new Error(authErr.message);

            // Upsert profile
            await supabaseAdmin.from('profiles').upsert({
                id: authUser.user.id,
                display_name: display_name || email,
                role
            });

            // Link employee record if provided
            if (employee_id) {
                await supabaseAdmin
                    .from('employees')
                    .update({ auth_user_id: authUser.user.id })
                    .eq('id', employee_id);
            }

            return sendSuccess(res, 'User account successfully provisioned by administrator.', {
                user: {
                    id: authUser.user.id,
                    email: authUser.user.email,
                    role,
                    display_name
                }
            }, 201);
        }

        return sendSuccess(res, 'User provisioned (Dev mode).', { email, role, display_name }, 201);
    } catch (err) {
        next(err);
    }
};
