/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - AUTHENTICATION & SESSION CONTROLLER
 */

const Auth = {
    /**
     * Checks if user has an active session token.
     */
    isAuthenticated() {
        return Boolean(localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN));
    },

    /**
     * Gets current stored user payload.
     */
    getCurrentUser() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    /**
     * Authenticates user against backend API.
     */
    async login(email, password) {
        try {
            const response = await API.post('/auth/login', { email, password });
            if (response.success && response.data?.session?.access_token) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, response.data.session.access_token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.data.user));
                return response.data.user;
            } else {
                throw new Error(response.message || 'Login failed.');
            }
        } catch (err) {
            throw err;
        }
    },

    /**
     * Logs out the current user and clears session state.
     */
    async logout() {
        try {
            await API.post('/auth/logout').catch(() => {});
        } finally {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
            window.location.href = 'login.html';
        }
    },

    /**
     * Verifies session with backend /api/auth/me.
     */
    async verifySession() {
        if (!this.isAuthenticated()) return null;
        try {
            const response = await API.get('/auth/me');
            if (response.success && response.data?.user) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.data.user));
                return response.data.user;
            }
        } catch (err) {
            console.warn('[Session Verification Failed]:', err);
            this.logout();
        }
        return null;
    },

    /**
     * Route protection guard for authenticated pages.
     * @param {string[]} allowedRoles - Optional list of required roles
     */
    guard(allowedRoles = []) {
        const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('index.html');

        if (!this.isAuthenticated()) {
            if (!isAuthPage) {
                window.location.href = 'login.html';
            }
            return;
        }

        const user = this.getCurrentUser();
        if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
            showToast('error', 'Access Denied', `Your role (${user.role}) is not authorized to access this page.`);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            return;
        }

        // Initialize UI Shell if user is authenticated
        document.addEventListener('DOMContentLoaded', () => {
            this.initSidebarAndNavbar();
        });
    },

    /**
     * Injects sidebar user metadata, active nav link styling, mobile toggle, and logout handlers.
     */
    initSidebarAndNavbar() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Populate sidebar user details
        const userNameEl = document.querySelector('.user-name');
        const userRoleEl = document.querySelector('.user-role-label');
        const userAvatarEl = document.querySelector('.user-avatar-sm');

        if (userNameEl) userNameEl.textContent = user.display_name || user.email;
        if (userRoleEl) userRoleEl.textContent = user.role;
        if (userAvatarEl) {
            const initial = (user.display_name || user.email || 'U').charAt(0).toUpperCase();
            userAvatarEl.textContent = initial;
        }

        // Highlight active page link in sidebar
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Hide administrative navigation items if user is Employee
        if (user.role === 'Employee') {
            const hrAdminOnlySelectors = [
                'a[href="departments.html"]',
                '.admin-only-action'
            ];
            hrAdminOnlySelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    // Keep visible or mark restricted
                });
            });
        }

        // Setup logout buttons
        document.querySelectorAll('.btn-logout, .btn-sidebar-logout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                confirmDialog({
                    title: 'Sign Out',
                    message: 'Are you sure you want to log out of your session?',
                    confirmText: 'Sign Out',
                    confirmClass: 'btn-danger'
                }).then(confirmed => {
                    if (confirmed) Auth.logout();
                });
            });
        });

        // Mobile drawer navigation toggle
        const toggleBtn = document.querySelector('.btn-mobile-toggle');
        const sidebar = document.querySelector('.sidebar');
        let backdrop = document.querySelector('.sidebar-backdrop');

        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            document.body.appendChild(backdrop);
        }

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                backdrop.classList.toggle('active');
            });

            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('open');
                backdrop.classList.remove('active');
            });
        }
    }
};

window.Auth = Auth;
