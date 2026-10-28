import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

let supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Ensure URL has protocol if provided
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`;
}

const isValidSupabaseUrl = (url) => {
    if (!url || url === 'https://your-project-id.supabase.co') return false;
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
        // A valid remote domain must contain at least one dot (e.g. .supabase.co)
        return parsed.hostname.includes('.');
    } catch {
        return false;
    }
};

const isConfigured = 
    isValidSupabaseUrl(supabaseUrl) && 
    (supabaseServiceRoleKey || supabaseAnonKey) &&
    supabaseServiceRoleKey !== 'your-supabase-service-role-key' &&
    supabaseAnonKey !== 'your-supabase-anon-key';

if (!isConfigured) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Supabase Config Notice]: Live Supabase database is not active.');
    if (supabaseUrl && !isValidSupabaseUrl(supabaseUrl)) {
        console.warn('\x1b[33m%s\x1b[0m', `   SUPABASE_URL "${supabaseUrl}" appears incomplete (missing .supabase.co).`);
        console.warn('\x1b[33m%s\x1b[0m', '   Expected format: https://<project-ref>.supabase.co');
    } else {
        console.warn('\x1b[33m%s\x1b[0m', '   Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to connect.');
    }
    console.warn('\x1b[36m%s\x1b[0m', '   Running in Dev Simulation Mode with built-in test accounts:');
    console.warn('\x1b[36m%s\x1b[0m', '   - admin@company.com / Password123! (Admin)');
    console.warn('\x1b[36m%s\x1b[0m', '   - hr@company.com    / Password123! (HR Manager)');
    console.warn('\x1b[36m%s\x1b[0m', '   - employee@company.com / Password123! (Employee)');
}

// Privileged client for authorized backend operations
export const supabaseAdmin = isConfigured
    ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
    : null;

/**
 * Creates a Supabase client scoped to a specific user's Bearer token.
 * @param {string} token - The user's JWT access token
 */
export const getSupabaseUserClient = (token) => {
    if (!isConfigured) return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
};

export const isSupabaseConfigured = () => isConfigured;
