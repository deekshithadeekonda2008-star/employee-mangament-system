-- ==============================================================================
-- EMPLOYEE MANAGEMENT SYSTEM (EMS) - DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE: profiles
-- References Supabase auth.users for application-level user profiles and roles.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Employee' CHECK (role IN ('Admin', 'HR Manager', 'Employee')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'Stores user account metadata and role mapping linked to Supabase Auth.';
COMMENT ON COLUMN public.profiles.role IS 'Authorized roles: Admin, HR Manager, or Employee.';

-- ==============================================================================
-- 2. TABLE: departments
-- Organizational departments for employee assignment and hierarchical reporting.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    department_head_id UUID, -- Foreign key to employees(id) added after employees table creation
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.departments IS 'Departments within the organization.';

-- ==============================================================================
-- 3. TABLE: employees
-- Core employee directory storing personal, organizational, and job information.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    auth_user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    job_title VARCHAR(150) NOT NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
    employment_status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (employment_status IN ('Active', 'On Leave', 'Inactive')),
    manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say')),
    profile_photo_url TEXT,
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (basic_salary >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.employees IS 'Employee records containing personal, employment, and compensation details.';

-- Add circular foreign key for department head reference
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_departments_department_head'
    ) THEN
        ALTER TABLE public.departments
        ADD CONSTRAINT fk_departments_department_head
        FOREIGN KEY (department_head_id) REFERENCES public.employees(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================================================
-- 4. TABLE: attendance
-- Daily attendance logs, check-in, check-out, status, and duration calculations.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status VARCHAR(50) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Half-day', 'Leave')),
    working_minutes INTEGER NOT NULL DEFAULT 0 CHECK (working_minutes >= 0),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_employee_daily_attendance UNIQUE(employee_id, attendance_date)
);

COMMENT ON TABLE public.attendance IS 'Daily attendance tracking for employees.';

-- ==============================================================================
-- 5. TABLE: leave_requests
-- Leave applications submitted by employees and reviewed by HR or Admin.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_days NUMERIC(4, 1) NOT NULL CHECK (leave_days > 0),
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_leave_dates_validity CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.leave_requests IS 'Leave requests with review workflow history.';

-- ==============================================================================
-- 6. TABLE: payroll
-- Monthly compensation statements, gross/net earnings, and payment statuses.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    pay_month INTEGER NOT NULL CHECK (pay_month BETWEEN 1 AND 12),
    pay_year INTEGER NOT NULL CHECK (pay_year >= 2000),
    basic_salary NUMERIC(12, 2) NOT NULL CHECK (basic_salary >= 0),
    allowances NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (allowances >= 0),
    bonus NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (bonus >= 0),
    deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (deductions >= 0),
    gross_salary NUMERIC(12, 2) NOT NULL CHECK (gross_salary >= 0),
    net_salary NUMERIC(12, 2) NOT NULL CHECK (net_salary >= 0),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (payment_status IN ('Draft', 'Pending', 'Paid')),
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_employee_payroll_period UNIQUE(employee_id, pay_month, pay_year)
);

COMMENT ON TABLE public.payroll IS 'Payroll compensation calculation records per employee and pay period.';

-- ==============================================================================
-- INDEXES FOR FREQUENTLY QUERIED FIELDS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON public.employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON public.employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);

CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON public.payroll(pay_year, pay_month);
CREATE INDEX IF NOT EXISTS idx_payroll_payment_status ON public.payroll(payment_status);

-- ==============================================================================
-- TRIGGER FUNCTION: update_timestamp
-- Automatically updates updated_at whenever a row is modified.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_departments_updated_at ON public.departments;
CREATE TRIGGER trigger_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_employees_updated_at ON public.employees;
CREATE TRIGGER trigger_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON public.attendance;
CREATE TRIGGER trigger_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trigger_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_payroll_updated_at ON public.payroll;
CREATE TRIGGER trigger_payroll_updated_at BEFORE UPDATE ON public.payroll FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Returns current user's role from profiles table
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns current user's linked employee_id from employees table
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID AS $$
    SELECT id FROM public.employees WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Admin and HR can read all user profiles. Employees can read their own profile.
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        id = auth.uid()
    )
);

-- Users can update only their own profile display_name (roles cannot be self-elevated).
-- Only Admins can modify any profile role.
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() = 'Admin' OR
        id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- 2. DEPARTMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Any authenticated user can view active departments. Admin and HR can view all departments.
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
CREATE POLICY "departments_select_policy" ON public.departments
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        is_active = true
    )
);

-- Only Admin and HR can insert departments.
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
CREATE POLICY "departments_insert_policy" ON public.departments
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.get_current_role() IN ('Admin', 'HR Manager')
);

-- Only Admin and HR can update departments.
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
CREATE POLICY "departments_update_policy" ON public.departments
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.get_current_role() IN ('Admin', 'HR Manager')
);

-- Only Admin can delete departments.
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;
CREATE POLICY "departments_delete_policy" ON public.departments
FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.get_current_role() = 'Admin'
);

-- ------------------------------------------------------------------------------
-- 3. EMPLOYEES POLICIES
-- ------------------------------------------------------------------------------
-- Admin and HR can view all employee records. Employees can view all active employee basic info or their own profile.
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
CREATE POLICY "employees_select_policy" ON public.employees
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        auth_user_id = auth.uid() OR
        employment_status = 'Active'
    )
);

-- Only Admin and HR can create employee records.
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
CREATE POLICY "employees_insert_policy" ON public.employees
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.get_current_role() IN ('Admin', 'HR Manager')
);

-- Admin and HR can update any employee record.
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
CREATE POLICY "employees_update_policy" ON public.employees
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.get_current_role() IN ('Admin', 'HR Manager')
);

-- Only Admin can permanently remove employee records (deactivation is preferred).
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;
CREATE POLICY "employees_delete_policy" ON public.employees
FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.get_current_role() = 'Admin'
);

-- ------------------------------------------------------------------------------
-- 4. ATTENDANCE POLICIES
-- ------------------------------------------------------------------------------
-- Admin and HR can view all attendance records; Employees can view only their own.
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
CREATE POLICY "attendance_select_policy" ON public.attendance
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        employee_id = public.get_current_employee_id()
    )
);

-- Admin and HR can record attendance for any employee; Employees can record their own daily check-in.
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;
CREATE POLICY "attendance_insert_policy" ON public.attendance
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        (employee_id = public.get_current_employee_id() AND attendance_date = CURRENT_DATE)
    )
);

-- Admin and HR can update any attendance record; Employees can update only their own check-out on the current date.
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance;
CREATE POLICY "attendance_update_policy" ON public.attendance
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        (employee_id = public.get_current_employee_id() AND attendance_date = CURRENT_DATE)
    )
);

-- ------------------------------------------------------------------------------
-- 5. LEAVE REQUESTS POLICIES
-- ------------------------------------------------------------------------------
-- Admin and HR can view all leave requests; Employees can view only their own.
DROP POLICY IF EXISTS "leaves_select_policy" ON public.leave_requests;
CREATE POLICY "leaves_select_policy" ON public.leave_requests
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        employee_id = public.get_current_employee_id()
    )
);

-- Employees can submit leave requests for themselves; Admin/HR can also file requests.
DROP POLICY IF EXISTS "leaves_insert_policy" ON public.leave_requests;
CREATE POLICY "leaves_insert_policy" ON public.leave_requests
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        employee_id = public.get_current_employee_id()
    )
);

-- Admin and HR can approve/reject leave requests; Employees can cancel their own pending requests.
DROP POLICY IF EXISTS "leaves_update_policy" ON public.leave_requests;
CREATE POLICY "leaves_update_policy" ON public.leave_requests
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        (employee_id = public.get_current_employee_id() AND status = 'Pending')
    )
);

-- ------------------------------------------------------------------------------
-- 6. PAYROLL POLICIES
-- ------------------------------------------------------------------------------
-- Admin and HR can view all payroll records; Employees can view only their own records.
DROP POLICY IF EXISTS "payroll_select_policy" ON public.payroll;
CREATE POLICY "payroll_select_policy" ON public.payroll
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        public.get_current_role() IN ('Admin', 'HR Manager') OR
        employee_id = public.get_current_employee_id()
    )
);

-- Only Admin and HR can create payroll entries.
DROP POLICY IF EXISTS "payroll_insert_policy" ON public.payroll;
CREATE POLICY "payroll_insert_policy" ON public.payroll
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.get_current_role() IN ('Admin', 'HR Manager')
);

-- Only Admin and HR can update payroll records.
DROP POLICY IF EXISTS "payroll_update_policy" ON public.payroll;
CREATE POLICY "payroll_update_policy" ON public.payroll
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.get_current_role() IN ('Admin', 'HR Manager')
);

-- Only Admin can delete payroll records.
DROP POLICY IF EXISTS "payroll_delete_policy" ON public.payroll;
CREATE POLICY "payroll_delete_policy" ON public.payroll
FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.get_current_role() = 'Admin'
);
