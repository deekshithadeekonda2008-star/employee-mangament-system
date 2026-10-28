/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - API CLIENT
 * Unified HTTP Fetch wrapper with Bearer token injection and error handling.
 */

const API = {
    /**
     * Internal request dispatcher.
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle unauthorized / expired session
            if (response.status === 401) {
                // If not already on login page, redirect
                if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html')) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
                    window.location.href = 'login.html?expired=true';
                }
            }

            const data = await response.json().catch(() => ({
                success: false,
                message: `Failed to parse JSON response (HTTP ${response.status})`,
                errors: []
            }));

            if (!response.ok) {
                const error = new Error(data.message || `Request failed with status ${response.status}`);
                error.status = response.status;
                error.errors = data.errors || [];
                throw error;
            }

            return data;
        } catch (err) {
            console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
            throw err;
        }
    },

    get(endpoint, params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const queryString = query.toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(fullEndpoint, { method: 'GET' });
    },

    post(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    patch(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

window.API = API;
