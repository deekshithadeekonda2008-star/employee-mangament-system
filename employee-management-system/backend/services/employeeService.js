import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

// In-memory store fallback for development when live Supabase is pending setup
let devEmployeesStore = [
    {
        id: 'e1000000-0000-0000-0000-000000000001',
        employee_code: 'EMP-1001',
        auth_user_id: 'dev-admin-uid-1001',
        first_name: 'Eleanor',
        last_name: 'Vance',
        email: 'eleanor.vance@company.com',
        phone: '+1 (555) 234-5678',
        address: '742 Evergreen Terrace, Springfield, OR',
        department_id: 'd1000000-0000-0000-0000-000000000006',
        job_title: 'Chief Operating Officer & System Admin',
        joining_date: '2021-01-15',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: null,
        date_of_birth: '1985-04-12',
        gender: 'Female',
        basic_salary: 145000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2021-01-15').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000002',
        employee_code: 'EMP-1002',
        auth_user_id: 'dev-hr-uid-1002',
        first_name: 'Sarah',
        last_name: 'Jenkins',
        email: 'sarah.jenkins@company.com',
        phone: '+1 (555) 345-6789',
        address: '124 Conch Street, Pacific Grove, CA',
        department_id: 'd1000000-0000-0000-0000-000000000002',
        job_title: 'Head of People & Culture',
        joining_date: '2021-06-01',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000001',
        date_of_birth: '1988-09-24',
        gender: 'Female',
        basic_salary: 115000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2021-06-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000003',
        employee_code: 'EMP-1003',
        auth_user_id: null,
        first_name: 'Alex',
        last_name: 'Rivera',
        email: 'alex.rivera@company.com',
        phone: '+1 (555) 456-7890',
        address: '42 Wallaby Way, Sydney, WA',
        department_id: 'd1000000-0000-0000-0000-000000000001',
        job_title: 'Principal Engineering Lead',
        joining_date: '2021-03-10',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000001',
        date_of_birth: '1990-11-15',
        gender: 'Non-Binary',
        basic_salary: 135000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2021-03-10').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000004',
        employee_code: 'EMP-1004',
        auth_user_id: 'dev-emp-uid-1004',
        first_name: 'Maya',
        last_name: 'Chen',
        email: 'maya.chen@company.com',
        phone: '+1 (555) 567-8901',
        address: '221B Baker Street, Londonderry, NH',
        department_id: 'd1000000-0000-0000-0000-000000000001',
        job_title: 'Senior Frontend Developer',
        joining_date: '2022-02-14',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000003',
        date_of_birth: '1993-07-22',
        gender: 'Female',
        basic_salary: 98000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2022-02-14').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000005',
        employee_code: 'EMP-1005',
        auth_user_id: null,
        first_name: 'David',
        last_name: 'Kim',
        email: 'david.kim@company.com',
        phone: '+1 (555) 678-9012',
        address: '350 Fifth Avenue, New York, NY',
        department_id: 'd1000000-0000-0000-0000-000000000001',
        job_title: 'Backend Systems Engineer',
        joining_date: '2022-08-01',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000003',
        date_of_birth: '1991-03-08',
        gender: 'Male',
        basic_salary: 102000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2022-08-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000006',
        employee_code: 'EMP-1006',
        auth_user_id: null,
        first_name: 'Jessica',
        last_name: 'Taylor',
        email: 'jessica.taylor@company.com',
        phone: '+1 (555) 789-0123',
        address: '10 Downing Court, Boston, MA',
        department_id: 'd1000000-0000-0000-0000-000000000003',
        job_title: 'Lead Product Designer',
        joining_date: '2022-10-15',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000001',
        date_of_birth: '1994-01-30',
        gender: 'Female',
        basic_salary: 105000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2022-10-15').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000007',
        employee_code: 'EMP-1007',
        auth_user_id: null,
        first_name: 'Marcus',
        last_name: 'Johnson',
        email: 'marcus.johnson@company.com',
        phone: '+1 (555) 890-1234',
        address: '1600 Pennsylvania Blvd, Philadelphia, PA',
        department_id: 'd1000000-0000-0000-0000-000000000004',
        job_title: 'Director of Enterprise Sales',
        joining_date: '2023-01-10',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000001',
        date_of_birth: '1987-12-05',
        gender: 'Male',
        basic_salary: 120000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2023-01-10').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000008',
        employee_code: 'EMP-1008',
        auth_user_id: null,
        first_name: 'Sophia',
        last_name: 'Martinez',
        email: 'sophia.martinez@company.com',
        phone: '+1 (555) 901-2345',
        address: '777 Lucky Way, Austin, TX',
        department_id: 'd1000000-0000-0000-0000-000000000005',
        job_title: 'Senior Financial Analyst',
        joining_date: '2023-04-03',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000001',
        date_of_birth: '1992-06-18',
        gender: 'Female',
        basic_salary: 94000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2023-04-03').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000009',
        employee_code: 'EMP-1009',
        auth_user_id: null,
        first_name: 'Liam',
        last_name: "O'Connor",
        email: 'liam.oconnor@company.com',
        phone: '+1 (555) 012-3456',
        address: '88 Emerald Isle, Dublin, OH',
        department_id: 'd1000000-0000-0000-0000-000000000001',
        job_title: 'Quality Assurance Engineer',
        joining_date: '2023-07-17',
        employment_type: 'Contract',
        employment_status: 'On Leave',
        manager_id: 'e1000000-0000-0000-0000-000000000003',
        date_of_birth: '1996-08-11',
        gender: 'Male',
        basic_salary: 72000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2023-07-17').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'e1000000-0000-0000-0000-000000000010',
        employee_code: 'EMP-1010',
        auth_user_id: null,
        first_name: 'Emily',
        last_name: 'Watson',
        email: 'emily.watson@company.com',
        phone: '+1 (555) 123-9876',
        address: '500 Silicon Alley, San Jose, CA',
        department_id: 'd1000000-0000-0000-0000-000000000002',
        job_title: 'Talent Acquisition Partner',
        joining_date: '2023-09-01',
        employment_type: 'Full-time',
        employment_status: 'Active',
        manager_id: 'e1000000-0000-0000-0000-000000000002',
        date_of_birth: '1995-10-02',
        gender: 'Female',
        basic_salary: 76000.00,
        profile_photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
        created_at: new Date('2023-09-01').toISOString(),
        updated_at: new Date().toISOString()
    }
];

export const getEmployeesStore = () => devEmployeesStore;

const deptMap = {
    'd1000000-0000-0000-0000-000000000001': 'Engineering',
    'd1000000-0000-0000-0000-000000000002': 'Human Resources',
    'd1000000-0000-0000-0000-000000000003': 'Product & Design',
    'd1000000-0000-0000-0000-000000000004': 'Sales & Marketing',
    'd1000000-0000-0000-0000-000000000005': 'Finance & Accounting',
    'd1000000-0000-0000-0000-000000000006': 'Operations'
};

/**
 * Strips sensitive fields (like basic_salary) if user is not authorized.
 */
const sanitizeEmployee = (employee, userRole, currentUserId) => {
    if (!employee) return null;
    const sanitized = { ...employee };
    if (!sanitized.departments && sanitized.department_id) {
        sanitized.departments = {
            id: sanitized.department_id,
            name: deptMap[sanitized.department_id] || 'General'
        };
    }
    // Only Admin, HR Manager, or the employee themselves can see basic_salary
    if (userRole !== 'Admin' && userRole !== 'HR Manager' && employee.auth_user_id !== currentUserId) {
        delete sanitized.basic_salary;
    }
    return sanitized;
};

export const getAllEmployees = async ({ search, department_id, employment_status, employment_type, sort_by = 'joining_date', sort_order = 'desc', page = 1, limit = 10 }, user) => {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('employees')
            .select('*, departments(id, name), manager:manager_id(id, first_name, last_name, employee_code)', { count: 'exact' });

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_code.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (department_id) {
            query = query.eq('department_id', department_id);
        }
        if (employment_status) {
            query = query.eq('employment_status', employment_status);
        }
        if (employment_type) {
            query = query.eq('employment_type', employment_type);
        }

        const ascending = sort_order.toLowerCase() === 'asc';
        query = query.order(sort_by, { ascending }).range(offset, offset + limitNum - 1);

        const { data, count, error } = await query;
        if (error) throw new Error(error.message);

        const sanitized = data.map(emp => sanitizeEmployee(emp, user.role, user.id));

        return {
            employees: sanitized,
            pagination: {
                total: count || 0,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil((count || 0) / limitNum)
            }
        };
    }

    // Dev Fallback in-memory
    let filtered = [...devEmployeesStore];

    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(e => 
            e.first_name.toLowerCase().includes(s) ||
            e.last_name.toLowerCase().includes(s) ||
            e.employee_code.toLowerCase().includes(s) ||
            e.email.toLowerCase().includes(s)
        );
    }
    if (department_id) {
        filtered = filtered.filter(e => e.department_id === department_id);
    }
    if (employment_status) {
        filtered = filtered.filter(e => e.employment_status === employment_status);
    }
    if (employment_type) {
        filtered = filtered.filter(e => e.employment_type === employment_type);
    }

    filtered.sort((a, b) => {
        let valA = a[sort_by] || '';
        let valB = b[sort_by] || '';
        if (valA < valB) return sort_order === 'asc' ? -1 : 1;
        if (valA > valB) return sort_order === 'asc' ? 1 : -1;
        return 0;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);
    const sanitized = paginated.map(emp => sanitizeEmployee(emp, user.role, user.id));

    return {
        employees: sanitized,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

export const getEmployeeById = async (id, user) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('employees')
            .select('*, departments(id, name, description), manager:manager_id(id, first_name, last_name, employee_code, job_title)')
            .eq('id', id)
            .single();

        if (error || !data) throw new Error(error?.message || 'Employee record not found.');
        return sanitizeEmployee(data, user.role, user.id);
    }

    const found = devEmployeesStore.find(e => e.id === id);
    if (!found) throw new Error('Employee record not found.');
    return sanitizeEmployee(found, user.role, user.id);
};

export const createEmployee = async (employeeData) => {
    // Generate unique code if absent
    if (!employeeData.employee_code) {
        const count = isSupabaseConfigured() ? (await supabaseAdmin.from('employees').select('id', { count: 'exact' })).count : devEmployeesStore.length;
        employeeData.employee_code = `EMP-${1001 + (count || 0)}`;
    }

    if (isSupabaseConfigured()) {
        // Check duplicates
        const { data: existing } = await supabaseAdmin
            .from('employees')
            .select('id, employee_code, email')
            .or(`employee_code.eq.${employeeData.employee_code},email.eq.${employeeData.email}`)
            .maybeSingle();

        if (existing) {
            throw new Error(`An employee with employee code '${employeeData.employee_code}' or email '${employeeData.email}' already exists.`);
        }

        const { data, error } = await supabaseAdmin
            .from('employees')
            .insert([{
                ...employeeData,
                basic_salary: parseFloat(employeeData.basic_salary || 0)
            }])
            .select('*, departments(id, name)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev fallback
    const dup = devEmployeesStore.find(e => e.employee_code === employeeData.employee_code || e.email.toLowerCase() === employeeData.email.toLowerCase());
    if (dup) {
        throw new Error(`An employee with employee code '${employeeData.employee_code}' or email '${employeeData.email}' already exists.`);
    }

    const newEmp = {
        id: `e1000000-0000-0000-0000-${String(devEmployeesStore.length + 1).padStart(12, '0')}`,
        auth_user_id: employeeData.auth_user_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...employeeData,
        basic_salary: parseFloat(employeeData.basic_salary || 0)
    };

    devEmployeesStore.unshift(newEmp);
    return newEmp;
};

export const updateEmployee = async (id, updateData) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('employees')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*, departments(id, name)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devEmployeesStore.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee not found.');

    devEmployeesStore[index] = {
        ...devEmployeesStore[index],
        ...updateData,
        updated_at: new Date().toISOString()
    };
    return devEmployeesStore[index];
};

export const updateEmployeeStatus = async (id, status) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('employees')
            .update({ employment_status: status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devEmployeesStore.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee not found.');
    devEmployeesStore[index].employment_status = status;
    devEmployeesStore[index].updated_at = new Date().toISOString();
    return devEmployeesStore[index];
};

export const deleteEmployee = async (id) => {
    if (isSupabaseConfigured()) {
        const { data: existing, error: findError } = await supabaseAdmin
            .from('employees')
            .select('id, employee_code, first_name, last_name')
            .eq('id', id)
            .single();

        if (findError || !existing) {
            throw new Error('Employee record not found.');
        }

        const { error } = await supabaseAdmin
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return existing;
    }

    const index = devEmployeesStore.findIndex(e => e.id === id);
    if (index === -1) {
        throw new Error('Employee record not found.');
    }
    const [deleted] = devEmployeesStore.splice(index, 1);
    return deleted;
};
