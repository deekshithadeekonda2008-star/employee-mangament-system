import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { isSupabaseConfigured } from './config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================================================================
// CORS & SECURITY CONFIGURATION
// ==============================================================================
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(s => s.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:8080'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman, file://)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in development for smooth local testing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development request logger
if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        next();
    });
}

// ==============================================================================
// HEALTH CHECK ENDPOINT
// ==============================================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Employee Management System REST API is healthy and operational.',
        data: {
            status: 'online',
            timestamp: new Date().toISOString(),
            supabase_connected: isSupabaseConfigured(),
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

// ==============================================================================
// API ROUTES MOUNTING
// ==============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/profile', profileRoutes);

// ==============================================================================
// 404 & ERROR HANDLING MIDDLEWARE
// ==============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==============================================================================
// SERVER INITIALIZATION
// ==============================================================================
const server = app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `=====================================================`);
    console.log('\x1b[32m%s\x1b[0m', `🚀 EMS REST API Server running on http://localhost:${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `📡 Base API Path: http://localhost:${PORT}/api`);
    console.log('\x1b[36m%s\x1b[0m', `🔍 Supabase Connected: ${isSupabaseConfigured() ? 'YES (Live Database)' : 'NO (Dev Simulation Mode)'}`);
    console.log('\x1b[32m%s\x1b[0m', `=====================================================`);
});

export default app;
export { server };
