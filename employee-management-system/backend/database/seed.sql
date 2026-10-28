-- ==============================================================================
-- EMPLOYEE MANAGEMENT SYSTEM (EMS) - SEED DATA
-- Purpose: Sample development and demonstration data.
-- NOTICE: All names, emails, addresses, and phone numbers are fictional.
-- ==============================================================================

-- Clean up any existing sample records safely
TRUNCATE TABLE public.payroll, public.leave_requests, public.attendance, public.employees, public.departments CASCADE;

-- ==============================================================================
-- 1. DEPARTMENTS SEED DATA
-- ==============================================================================
INSERT INTO public.departments (id, name, description, is_active) VALUES
('d1000000-0000-0000-0000-000000000001', 'Engineering', 'Software development, infrastructure, QA, and technological research.', true),
('d1000000-0000-0000-0000-000000000002', 'Human Resources', 'Recruitment, employee relations, payroll support, and organizational culture.', true),
('d1000000-0000-0000-0000-000000000003', 'Product & Design', 'Product roadmaps, UX/UI design, user research, and customer discovery.', true),
('d1000000-0000-0000-0000-000000000004', 'Sales & Marketing', 'Brand marketing, customer acquisition, account management, and outreach.', true),
('d1000000-0000-0000-0000-000000000005', 'Finance & Accounting', 'Financial planning, accounting records, auditing, and organizational budgeting.', true),
('d1000000-0000-0000-0000-000000000006', 'Operations', 'Business operations, facilities management, and administrative coordination.', true);

-- ==============================================================================
-- 2. EMPLOYEES SEED DATA
-- Note: Replace auth_user_id with the generated auth.users UUID once users sign up via Supabase Auth.
-- ==============================================================================
INSERT INTO public.employees (
    id, employee_code, first_name, last_name, email, phone, address,
    department_id, job_title, joining_date, employment_type, employment_status,
    manager_id, date_of_birth, gender, basic_salary, profile_photo_url
) VALUES
-- Admin / Executive (Eleanor Vance)
(
    'e1000000-0000-0000-0000-000000000001', 'EMP-1001', 'Eleanor', 'Vance',
    'eleanor.vance@company.com', '+1 (555) 234-5678', '742 Evergreen Terrace, Springfield, OR',
    'd1000000-0000-0000-0000-000000000006', 'Chief Operating Officer & System Admin', '2021-01-15',
    'Full-time', 'Active', NULL, '1985-04-12', 'Female', 145000.00,
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
),
-- HR Manager (Sarah Jenkins)
(
    'e1000000-0000-0000-0000-000000000002', 'EMP-1002', 'Sarah', 'Jenkins',
    'sarah.jenkins@company.com', '+1 (555) 345-6789', '124 Conch Street, Pacific Grove, CA',
    'd1000000-0000-0000-0000-000000000002', 'Head of People & Culture', '2021-06-01',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000001', '1988-09-24', 'Female', 115000.00,
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
),
-- Engineering Lead (Alex Rivera)
(
    'e1000000-0000-0000-0000-000000000003', 'EMP-1003', 'Alex', 'Rivera',
    'alex.rivera@company.com', '+1 (555) 456-7890', '42 Wallaby Way, Sydney, WA',
    'd1000000-0000-0000-0000-000000000001', 'Principal Engineering Lead', '2021-03-10',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000001', '1990-11-15', 'Non-Binary', 135000.00,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
),
-- Frontend Engineer (Maya Chen)
(
    'e1000000-0000-0000-0000-000000000004', 'EMP-1004', 'Maya', 'Chen',
    'maya.chen@company.com', '+1 (555) 567-8901', '221B Baker Street, Londonderry, NH',
    'd1000000-0000-0000-0000-000000000001', 'Senior Frontend Developer', '2022-02-14',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000003', '1993-07-22', 'Female', 98000.00,
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
),
-- Backend Engineer (David Kim)
(
    'e1000000-0000-0000-0000-000000000005', 'EMP-1005', 'David', 'Kim',
    'david.kim@company.com', '+1 (555) 678-9012', '350 Fifth Avenue, New York, NY',
    'd1000000-0000-0000-0000-000000000001', 'Backend Systems Engineer', '2022-08-01',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000003', '1991-03-08', 'Male', 102000.00,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
),
-- Product Designer (Jessica Taylor)
(
    'e1000000-0000-0000-0000-000000000006', 'EMP-1006', 'Jessica', 'Taylor',
    'jessica.taylor@company.com', '+1 (555) 789-0123', '10 Downing Court, Boston, MA',
    'd1000000-0000-0000-0000-000000000003', 'Lead Product Designer', '2022-10-15',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000001', '1994-01-30', 'Female', 105000.00,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
),
-- Sales Lead (Marcus Johnson)
(
    'e1000000-0000-0000-0000-000000000007', 'EMP-1007', 'Marcus', 'Johnson',
    'marcus.johnson@company.com', '+1 (555) 890-1234', '1600 Pennsylvania Blvd, Philadelphia, PA',
    'd1000000-0000-0000-0000-000000000004', 'Director of Enterprise Sales', '2023-01-10',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000001', '1987-12-05', 'Male', 120000.00,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
),
-- Financial Analyst (Sophia Martinez)
(
    'e1000000-0000-0000-0000-000000000008', 'EMP-1008', 'Sophia', 'Martinez',
    'sophia.martinez@company.com', '+1 (555) 901-2345', '777 Lucky Way, Austin, TX',
    'd1000000-0000-0000-0000-000000000005', 'Senior Financial Analyst', '2023-04-03',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000001', '1992-06-18', 'Female', 94000.00,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
),
-- QA Engineer (Liam O'Connor)
(
    'e1000000-0000-0000-0000-000000000009', 'EMP-1009', 'Liam', 'O''Connor',
    'liam.oconnor@company.com', '+1 (555) 012-3456', '88 Emerald Isle, Dublin, OH',
    'd1000000-0000-0000-0000-000000000001', 'Quality Assurance Engineer', '2023-07-17',
    'Contract', 'On Leave', 'e1000000-0000-0000-0000-000000000003', '1996-08-11', 'Male', 72000.00,
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
),
-- Talent Specialist (Emily Watson)
(
    'e1000000-0000-0000-0000-000000000010', 'EMP-1010', 'Emily', 'Watson',
    'emily.watson@company.com', '+1 (555) 123-9876', '500 Silicon Alley, San Jose, CA',
    'd1000000-0000-0000-0000-000000000002', 'Talent Acquisition Partner', '2023-09-01',
    'Full-time', 'Active', 'e1000000-0000-0000-0000-000000000002', '1995-10-02', 'Female', 76000.00,
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
);

-- Update department heads
UPDATE public.departments SET department_head_id = 'e1000000-0000-0000-0000-000000000003' WHERE id = 'd1000000-0000-0000-0000-000000000001'; -- Engineering -> Alex
UPDATE public.departments SET department_head_id = 'e1000000-0000-0000-0000-000000000002' WHERE id = 'd1000000-0000-0000-0000-000000000002'; -- HR -> Sarah
UPDATE public.departments SET department_head_id = 'e1000000-0000-0000-0000-000000000006' WHERE id = 'd1000000-0000-0000-0000-000000000003'; -- Product -> Jessica
UPDATE public.departments SET department_head_id = 'e1000000-0000-0000-0000-000000000007' WHERE id = 'd1000000-0000-0000-0000-000000000004'; -- Sales -> Marcus
UPDATE public.departments SET department_head_id = 'e1000000-0000-0000-0000-000000000008' WHERE id = 'd1000000-0000-0000-0000-000000000005'; -- Finance -> Sophia
UPDATE public.departments SET department_head_id = 'e1000000-0000-0000-0000-000000000001' WHERE id = 'd1000000-0000-0000-0000-000000000006'; -- Operations -> Eleanor

-- ==============================================================================
-- 3. ATTENDANCE SEED DATA
-- Recent attendance logs for employees across recent working days.
-- ==============================================================================
INSERT INTO public.attendance (
    id, employee_id, attendance_date, check_in, check_out, status, working_minutes, remarks
) VALUES
-- Today's attendance (CURRENT_DATE)
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', CURRENT_DATE, '08:55:00', '17:15:00', 'Present', 485, 'Executive briefing'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:02:00', '17:30:00', 'Present', 508, 'Recruitment interviews'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000003', CURRENT_DATE, '09:15:00', '18:00:00', 'Present', 525, 'Sprint architectural review'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000004', CURRENT_DATE, '09:40:00', '18:10:00', 'Late', 510, 'Subway delay reported'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000005', CURRENT_DATE, '08:50:00', '17:00:00', 'Present', 490, 'Database optimization task'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000006', CURRENT_DATE, '09:00:00', '13:00:00', 'Half-day', 240, 'Medical appointment afternoon'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', CURRENT_DATE, '09:05:00', '17:35:00', 'Present', 510, 'Client presentations'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', CURRENT_DATE, '08:45:00', '17:05:00', 'Present', 500, 'Monthly financial audit'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', CURRENT_DATE, NULL, NULL, 'Leave', 0, 'Approved medical leave'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000010', CURRENT_DATE, '09:10:00', '17:40:00', 'Present', 510, 'Campus hiring drive'),

-- Yesterday's attendance
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', '08:50:00', '17:20:00', 'Present', 510, 'Normal workday'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:15:00', 'Present', 495, 'Policy updates'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', '09:05:00', '18:05:00', 'Present', 540, 'Sprint demo'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:30:00', 'Present', 510, 'Component development'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000005', CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:30:00', 'Present', 510, 'API endpoint integration'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '1 day', '08:58:00', '17:25:00', 'Present', 507, 'Figma prototype handoff'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', CURRENT_DATE - INTERVAL '1 day', '09:30:00', '18:00:00', 'Late', 510, 'Morning road closure'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '1 day', '08:45:00', '17:15:00', 'Present', 510, 'Expense reviews'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', CURRENT_DATE - INTERVAL '1 day', NULL, NULL, 'Leave', 0, 'Approved sick leave'),
(gen_random_uuid(), 'e1000000-0000-0000-0000-000000000010', CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:30:00', 'Present', 510, 'Applicant screening');

-- ==============================================================================
-- 4. LEAVE REQUESTS SEED DATA
-- ==============================================================================
INSERT INTO public.leave_requests (
    id, employee_id, leave_type, start_date, end_date, leave_days,
    reason, status, reviewer_comments
) VALUES
-- Approved sick leave
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', 'Sick Leave',
    CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 5.0,
    'Recovering from seasonal flu under medical advice.', 'Approved',
    'Get well soon. Medical certificate acknowledged.'
),
-- Pending casual leave
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000004', 'Casual Leave',
    CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 3.0,
    'Attending family wedding ceremony.', 'Pending', NULL
),
-- Pending earned leave
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000005', 'Earned Leave',
    CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE + INTERVAL '16 days', 5.0,
    'Annual vacation trip with family.', 'Pending', NULL
),
-- Approved casual leave in the past
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000006', 'Casual Leave',
    CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '13 days', 2.0,
    'Personal errands and DMV appointment.', 'Approved', 'Approved as scheduled.'
),
-- Rejected request
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', 'Unpaid Leave',
    CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '20 days', 10.0,
    'Extended personal travel.', 'Rejected', 'Requested during quarterly peak sales period.'
);

-- ==============================================================================
-- 5. PAYROLL SEED DATA
-- Monthly statements for previous and current active pay periods.
-- ==============================================================================
INSERT INTO public.payroll (
    id, employee_id, pay_month, pay_year, basic_salary, allowances, bonus,
    deductions, gross_salary, net_salary, payment_status, payment_date
) VALUES
-- EMP-1001 (Eleanor Vance - COO)
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 9, 2026,
    12083.33, 1500.00, 2000.00, 2500.00, 15583.33, 13083.33, 'Paid', '2026-09-30'
),
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 10, 2026,
    12083.33, 1500.00, 0.00, 2500.00, 13583.33, 11083.33, 'Pending', NULL
),

-- EMP-1002 (Sarah Jenkins - HR Head)
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 9, 2026,
    9583.33, 1200.00, 1000.00, 1800.00, 11783.33, 9983.33, 'Paid', '2026-09-30'
),
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 10, 2026,
    9583.33, 1200.00, 0.00, 1800.00, 10783.33, 8983.33, 'Pending', NULL
),

-- EMP-1003 (Alex Rivera - Principal Lead)
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000003', 9, 2026,
    11250.00, 1000.00, 1500.00, 2200.00, 13750.00, 11550.00, 'Paid', '2026-09-30'
),
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000003', 10, 2026,
    11250.00, 1000.00, 0.00, 2200.00, 12250.00, 10050.00, 'Draft', NULL
),

-- EMP-1004 (Maya Chen - Senior Frontend)
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000004', 9, 2026,
    8166.67, 800.00, 500.00, 1400.00, 9466.67, 8066.67, 'Paid', '2026-09-30'
),
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000004', 10, 2026,
    8166.67, 800.00, 0.00, 1400.00, 8966.67, 7566.67, 'Pending', NULL
),

-- EMP-1005 (David Kim - Backend Systems)
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000005', 9, 2026,
    8500.00, 800.00, 500.00, 1500.00, 9800.00, 8300.00, 'Paid', '2026-09-30'
),
(
    gen_random_uuid(), 'e1000000-0000-0000-0000-000000000005', 10, 2026,
    8500.00, 800.00, 0.00, 1500.00, 9300.00, 7800.00, 'Draft', NULL
);
