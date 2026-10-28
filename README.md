# Employee Management System (EMS)

A comprehensive, production-minded full-stack web application designed for modern organizations to manage employee records, organizational departments, daily attendance, leave approvals, payroll statements, and audit reports through an interactive, role-based dashboard.

---

## 1. Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), Fetch API, [Chart.js 4.4](https://www.chartjs.org/), [Font Awesome 6](https://fontawesome.com/)
- **Backend:** Node.js, Express.js (RESTful API architecture, ES modules), `@supabase/supabase-js`
- **Database:** Supabase PostgreSQL with Relational Constraints, Foreign Keys, UUID Primary Keys, Indexes, and Row Level Security (RLS)
- **Security:** Supabase JWT Bearer Authentication, Role-Based Access Control (RBAC), CSV Formula Injection Sanitization, Zero plaintext password storage

---

## 2. Project Directory Structure

```text
employee-management-system/
├── frontend/
│   ├── index.html                  # Landing router (redirects to dashboard or login)
│   ├── login.html                  # Secure login page with demo account shortcuts
│   ├── dashboard.html              # Centralized metrics, 4 Chart.js charts, recent activity
│   ├── employees.html              # Employee directory with search, filters, and add modal
│   ├── employee-details.html       # Comprehensive profile view with attendance, leave & payroll tabs
│   ├── departments.html            # Department cards, member roster, head assignment
│   ├── attendance.html             # Daily clock-in/out, duration calculation & manual logs
│   ├── leave-management.html       # Leave application, review queue, day calculator
│   ├── payroll.html                # Salary statement generator & printable payslips
│   ├── reports.html                # 4 dynamic workforce reports with CSV export & print
│   ├── profile.html                # User profile management with restricted field protection
│   ├── css/
│   │   ├── style.css               # Design tokens, blue/white corporate palette, cards, modals
│   │   ├── dashboard.css           # Metrics grid, chart layouts, recent activity feeds
│   │   ├── employees.css           # Table views, avatars, detail tabs, stat tags
│   │   ├── forms.css               # Form controls, validation states, floating labels
│   │   └── responsive.css          # Mobile sidebar drawer, print stylesheets, responsive grids
│   ├── js/
│   │   ├── config.js               # API endpoints, role enums, storage keys
│   │   ├── api.js                  # Unified Fetch client with Bearer auth injection
│   │   ├── auth.js                 # Session guard, authentication lifecycle, sidebar renderer
│   │   ├── dashboard.js            # Metric counters, Chart.js integrations, activity stream
│   │   ├── employees.js            # Employee CRUD, search, filter, pagination
│   │   ├── departments.js          # Department CRUD, member listings, constraint checks
│   │   ├── attendance.js           # Clock in/out, time duration, manual adjust
│   │   ├── leave-management.js     # Leave applications, day calculation, review workflow
│   │   ├── payroll.js              # Gross/Net salary engine, printable pay slips
│   │   ├── reports.js              # Query runner, CSV export with injection defense
│   │   └── utils.js                # Toasts, confirmation modal, date/currency formatters
│   └── assets/
│       └── images/
│
└── backend/
    ├── package.json                # Express, Supabase client, CORS, Dotenv
    ├── server.js                   # Express server entry point, CORS, logging, health check
    ├── .env                        # Local environment secrets (ignored by Git)
    ├── .env.example                # Example template for environment variables
    ├── .gitignore
    ├── config/
    │   └── supabase.js             # Supabase client initialization & connection health
    ├── middleware/
    │   ├── authenticate.js         # JWT verification & profile attachment
    │   ├── authorize.js            # Role-based permission enforcement (Admin, HR, Employee)
    │   ├── validate.js             # Generic request validator runner
    │   └── errorHandler.js         # Centralized error handler & 404 handler
    ├── routes/
    │   ├── authRoutes.js           # /api/auth (login, me, logout, provision)
    │   ├── employeeRoutes.js       # /api/employees
    │   ├── departmentRoutes.js     # /api/departments
    │   ├── attendanceRoutes.js     # /api/attendance
    │   ├── leaveRoutes.js          # /api/leaves
    │   ├── payrollRoutes.js        # /api/payroll
    │   ├── dashboardRoutes.js      # /api/dashboard
    │   ├── reportRoutes.js         # /api/reports
    │   └── profileRoutes.js        # /api/profile
    ├── controllers/
    │   ├── authController.js
    │   ├── employeeController.js
    │   ├── departmentController.js
    │   ├── attendanceController.js
    │   ├── leaveController.js
    │   ├── payrollController.js
    │   ├── dashboardController.js
    │   ├── reportController.js
    │   └── profileController.js
    ├── services/
    │   ├── employeeService.js      # Employee logic, duplicate checks, salary redaction
    │   ├── departmentService.js    # Department management, reassignment checks
    │   ├── attendanceService.js    # Clock-in/out duration calculation, daily uniqueness
    │   ├── leaveService.js         # Date validation, overlap detection, review state machine
    │   ├── payrollService.js       # Gross = Basic + Allowances + Bonus; Net = Gross - Deductions
    │   ├── dashboardService.js     # Aggregate queries for statistics and chart series
    │   ├── reportService.js        # Data aggregations and spreadsheet sanitization
    │   └── profileService.js       # Field-level security for user self-service updates
    ├── validators/
    │   └── employeeValidator.js    # Payload validation functions
    ├── utils/
    │   └── response.js             # Standard JSON response envelopes (sendSuccess, sendError)
    └── database/
        ├── schema.sql              # PostgreSQL DDL, check constraints, triggers, RLS policies
        └── seed.sql                # Demonstration organization dataset
```

---

## 3. Database Architecture & Setup

### Database Tables Overview
1. **`profiles`**: Linked to `auth.users(id)` via foreign key on delete cascade. Stores `display_name`, `role` (`Admin`, `HR Manager`, `Employee`).
2. **`departments`**: Organizational departments with `id`, unique `name`, `description`, `department_head_id`, and `is_active`.
3. **`employees`**: Directory holding `employee_code` (unique), `auth_user_id`, personal info, `department_id`, `job_title`, `employment_status`, `employment_type`, and `basic_salary`.
4. **`attendance`**: Daily records with `employee_id`, `attendance_date`, `check_in`, `check_out`, `working_minutes`, `status`, and unique constraint on `(employee_id, attendance_date)`.
5. **`leave_requests`**: Applications with `employee_id`, `leave_type`, `start_date`, `end_date`, `leave_days`, `reason`, `status`, and `reviewed_by`.
6. **`payroll`**: Statements with `employee_id`, `pay_month`, `pay_year`, `basic_salary`, `allowances`, `bonus`, `deductions`, `gross_salary`, `net_salary`, and `payment_status`.

### Setting up Supabase Database:
1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing one.
3. In the left navigation, click **SQL Editor**.
4. Open and copy the contents of `backend/database/schema.sql` into the SQL Editor and click **Run**.
5. (Optional) Run `backend/database/seed.sql` to populate sample departments, employees, attendance, leave requests, and payroll statements.

---

## 4. Configuration & Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```bash
cd employee-management-system/backend
cp .env.example .env
```

Edit `backend/.env` with your Supabase credentials:

```env
PORT=5000
NODE_ENV=development

# Allowed Origins for CORS
CLIENT_URL=http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:8080

# Supabase Credentials (from Supabase Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

ORG_TIMEZONE=UTC
```

> **Note on Development Fallback Mode:**
> If `SUPABASE_URL` is left unconfigured, the backend automatically runs in **Dev Simulation Mode** with pre-seeded in-memory data, enabling instant testing of all endpoints, authentication, and frontend workflows without setup friction!

---

## 5. Startup & Running the Application

### A. Starting the Backend API

```bash
cd employee-management-system/backend
npm install
npm start
```
The REST API will start on **`http://localhost:5000`** with base path **`/api`**.

### B. Starting the Frontend Client

You can serve the `employee-management-system/frontend/` directory with any static HTTP server:

**Option 1: Using VS Code Live Server extension**
- Open the folder in VS Code.
- Right-click `frontend/login.html` or `frontend/index.html` and choose **Open with Live Server**.

**Option 2: Using Node `npx serve` or `http-server`**
```bash
npx serve employee-management-system/frontend -p 5500
```

Open your browser to: **`http://localhost:5500/login.html`** (or `index.html`).

---

## 6. User Roles & Permission Matrix

| Module / Feature | Admin | HR Manager | Employee |
| :--- | :---: | :---: | :---: |
| **Dashboard Statistics & Charts** | Full Organization | Full Organization | Scoped / Personal |
| **View Employee Directory** | Yes (All + Salary) | Yes (All + Salary) | Yes (Salary Redacted) |
| **Add / Edit / Deactivate Employees** | Yes | Yes | No |
| **Manage Departments** | Full (Add/Edit/Delete) | Full (Add/Edit) | View Only |
| **Clock In / Clock Out (Self)** | Yes | Yes | Yes |
| **View Attendance Logs** | All Staff | All Staff | Own Records Only |
| **Manual Attendance Log & Adjust** | Yes | Yes | No |
| **Submit Leave Request** | Yes | Yes | Yes (Self) |
| **Cancel Pending Leave** | Yes (Self) | Yes (Self) | Yes (Self Only) |
| **Approve / Reject Leave Requests** | Yes | Yes | No |
| **Create / Update Payroll** | Yes | Yes | No |
| **View Payroll Statements** | All Records | All Records | Own Statements Only |
| **Access Organizational Reports** | Yes | Yes | Restricted |
| **Export Permitted Reports to CSV**| Yes | Yes | Restricted |
| **Edit Profile Contact Information** | Yes (Self) | Yes (Self) | Yes (Self) |
| **Self-Change Role / Salary** | No (Strictly Blocked)| No (Strictly Blocked)| No (Strictly Blocked)|

---

## 7. Demo Accounts for Immediate Testing

On `login.html`, click any of the quick demo buttons or enter these credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin@company.com` | `Password123!` |
| **HR Manager** | `hr@company.com` | `Password123!` |
| **Staff Employee** | `employee@company.com` | `Password123!` |

---

## 8. REST API Reference

All requests accept and return standard JSON payloads. Protected routes require `Authorization: Bearer <token>`.

### Authentication
- `POST /api/auth/login`: Authenticate email & password. Returns JWT token and user role.
- `GET /api/auth/me`: Verify session and retrieve caller identity.
- `POST /api/auth/logout`: Revoke/clear active session.
- `POST /api/auth/provision`: (Admin only) Authorized user account creation.

### Employees
- `GET /api/employees?search=&department_id=&employment_status=&page=1&limit=10`
- `GET /api/employees/:id`
- `POST /api/employees` (Admin, HR Manager)
- `PUT /api/employees/:id` (Admin, HR Manager)
- `PATCH /api/employees/:id/status` (Admin, HR Manager)
- `DELETE /api/employees/:id` (Admin, HR Manager)

### Departments
- `GET /api/departments?search=&is_active=true`
- `GET /api/departments/:id`
- `POST /api/departments` (Admin, HR Manager)
- `PUT /api/departments/:id` (Admin, HR Manager)
- `PATCH /api/departments/:id/status` (Admin, HR Manager)
- `DELETE /api/departments/:id` (Admin only, rejects if employees are assigned)

### Attendance
- `GET /api/attendance?date=&status=&employee_id=`
- `POST /api/attendance/check-in` (Caller clock-in for today)
- `POST /api/attendance/check-out` (Caller clock-out for today)
- `POST /api/attendance` (Admin/HR manual log)
- `PUT /api/attendance/:id` (Admin/HR adjustment)

### Leave Management
- `GET /api/leaves?status=&leave_type=&employee_id=`
- `GET /api/leaves/:id`
- `POST /api/leaves` (Submit leave request with overlap validation)
- `PATCH /api/leaves/:id/cancel` (Cancel pending request)
- `PATCH /api/leaves/:id/review` (Admin/HR approve or reject with comments)

### Payroll
- `GET /api/payroll?pay_month=&pay_year=&payment_status=`
- `GET /api/payroll/:id` (Fetch detailed statement)
- `POST /api/payroll` (Admin/HR calculate gross and net salary)
- `PUT /api/payroll/:id` (Admin/HR update components)
- `PATCH /api/payroll/:id/status` (Update status to Draft, Pending, or Paid)

### Analytics & Reports
- `GET /api/dashboard/summary` (7 key organization metric totals)
- `GET /api/dashboard/charts` (Series for 4 dashboard visual charts)
- `GET /api/dashboard/recent-activity` (Recent employees, check-ins, leaves)
- `GET /api/reports/employees`
- `GET /api/reports/attendance`
- `GET /api/reports/leaves`
- `GET /api/reports/payroll` (Admin/HR only)

### Profile Self-Service
- `GET /api/profile`
- `PUT /api/profile` (Update display name, phone, address, photo URL)

---

## 9. Security Features

1. **Role Enforcement on Backend**: Hiding buttons in the frontend is not trusted; all protected API routes verify the caller's JWT and database role before executing operations.
2. **Salary Redaction**: Non-administrative employees requesting employee records automatically have `basic_salary` stripped from colleague records.
3. **CSV Formula Injection Mitigation**: All CSV exports sanitize cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` by prefixing a single apostrophe (`'`).
4. **No Plaintext Passwords**: Authentication is managed by Supabase Auth with bcrypt hashing and signed JWT tokens.
5. **No Secret Leaks**: Stack traces, database connection strings, and service role keys are excluded from client error responses.
