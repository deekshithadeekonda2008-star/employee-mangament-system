import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';

let devDepartmentsStore = [
    {
        id: 'd1000000-0000-0000-0000-000000000001',
        name: 'Engineering',
        description: 'Software development, infrastructure, QA, and technological research.',
        department_head_id: 'e1000000-0000-0000-0000-000000000003',
        is_active: true,
        created_at: new Date('2021-01-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'd1000000-0000-0000-0000-000000000002',
        name: 'Human Resources',
        description: 'Recruitment, employee relations, payroll support, and organizational culture.',
        department_head_id: 'e1000000-0000-0000-0000-000000000002',
        is_active: true,
        created_at: new Date('2021-01-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'd1000000-0000-0000-0000-000000000003',
        name: 'Product & Design',
        description: 'Product roadmaps, UX/UI design, user research, and customer discovery.',
        department_head_id: 'e1000000-0000-0000-0000-000000000006',
        is_active: true,
        created_at: new Date('2021-01-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'd1000000-0000-0000-0000-000000000004',
        name: 'Sales & Marketing',
        description: 'Brand marketing, customer acquisition, account management, and outreach.',
        department_head_id: 'e1000000-0000-0000-0000-000000000007',
        is_active: true,
        created_at: new Date('2021-01-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'd1000000-0000-0000-0000-000000000005',
        name: 'Finance & Accounting',
        description: 'Financial planning, accounting records, auditing, and organizational budgeting.',
        department_head_id: 'e1000000-0000-0000-0000-000000000008',
        is_active: true,
        created_at: new Date('2021-01-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'd1000000-0000-0000-0000-000000000006',
        name: 'Operations',
        description: 'Business operations, facilities management, and administrative coordination.',
        department_head_id: 'e1000000-0000-0000-0000-000000000001',
        is_active: true,
        created_at: new Date('2021-01-01').toISOString(),
        updated_at: new Date().toISOString()
    }
];

export const getDepartmentsStore = () => devDepartmentsStore;

export const getAllDepartments = async ({ search, is_active } = {}) => {
    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('departments')
            .select(`
                *,
                department_head:department_head_id(id, first_name, last_name, employee_code, email),
                employees(id)
            `)
            .order('name', { ascending: true });

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        if (is_active !== undefined) {
            query = query.eq('is_active', is_active === 'true' || is_active === true);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data.map(dept => ({
            ...dept,
            employee_count: dept.employees ? dept.employees.length : 0,
            employees: undefined
        }));
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    let depts = devDepartmentsStore.map(dept => {
        const head = employees.find(e => e.id === dept.department_head_id);
        const count = employees.filter(e => e.department_id === dept.id).length;
        return {
            ...dept,
            department_head: head ? {
                id: head.id,
                first_name: head.first_name,
                last_name: head.last_name,
                employee_code: head.employee_code,
                email: head.email
            } : null,
            employee_count: count
        };
    });

    if (search) {
        const s = search.toLowerCase();
        depts = depts.filter(d => d.name.toLowerCase().includes(s) || (d.description && d.description.toLowerCase().includes(s)));
    }
    if (is_active !== undefined) {
        const act = is_active === 'true' || is_active === true;
        depts = depts.filter(d => d.is_active === act);
    }

    return depts;
};

export const getDepartmentById = async (id) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select(`
                *,
                department_head:department_head_id(id, first_name, last_name, employee_code, email, job_title),
                employees:employees(id, employee_code, first_name, last_name, email, job_title, employment_status, employment_type)
            `)
            .eq('id', id)
            .single();

        if (error || !data) throw new Error(error?.message || 'Department not found.');
        return {
            ...data,
            employee_count: data.employees ? data.employees.length : 0
        };
    }

    const dept = devDepartmentsStore.find(d => d.id === id);
    if (!dept) throw new Error('Department not found.');

    const employees = getEmployeesStore();
    const head = employees.find(e => e.id === dept.department_head_id);
    const assignedEmployees = employees.filter(e => e.department_id === dept.id);

    return {
        ...dept,
        department_head: head || null,
        employee_count: assignedEmployees.length,
        employees: assignedEmployees
    };
};

export const createDepartment = async ({ name, description, department_head_id }) => {
    if (isSupabaseConfigured()) {
        // Duplicate check
        const { data: existing } = await supabaseAdmin
            .from('departments')
            .select('id')
            .ilike('name', name.trim())
            .maybeSingle();

        if (existing) {
            throw new Error(`A department named '${name}' already exists.`);
        }

        const { data, error } = await supabaseAdmin
            .from('departments')
            .insert([{
                name: name.trim(),
                description,
                department_head_id: department_head_id || null,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev Fallback
    const dup = devDepartmentsStore.find(d => d.name.toLowerCase() === name.trim().toLowerCase());
    if (dup) {
        throw new Error(`A department named '${name}' already exists.`);
    }

    const newDept = {
        id: `d1000000-0000-0000-0000-${String(devDepartmentsStore.length + 1).padStart(12, '0')}`,
        name: name.trim(),
        description: description || '',
        department_head_id: department_head_id || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    devDepartmentsStore.push(newDept);
    return newDept;
};

export const updateDepartment = async (id, { name, description, department_head_id, is_active }) => {
    if (isSupabaseConfigured()) {
        if (name) {
            const { data: existing } = await supabaseAdmin
                .from('departments')
                .select('id')
                .ilike('name', name.trim())
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                throw new Error(`Another department with name '${name}' already exists.`);
            }
        }

        const updatePayload = { updated_at: new Date().toISOString() };
        if (name !== undefined) updatePayload.name = name.trim();
        if (description !== undefined) updatePayload.description = description;
        if (department_head_id !== undefined) updatePayload.department_head_id = department_head_id || null;
        if (is_active !== undefined) updatePayload.is_active = is_active;

        const { data, error } = await supabaseAdmin
            .from('departments')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devDepartmentsStore.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Department not found.');

    if (name) {
        const dup = devDepartmentsStore.find(d => d.id !== id && d.name.toLowerCase() === name.trim().toLowerCase());
        if (dup) throw new Error(`Another department with name '${name}' already exists.`);
        devDepartmentsStore[index].name = name.trim();
    }
    if (description !== undefined) devDepartmentsStore[index].description = description;
    if (department_head_id !== undefined) devDepartmentsStore[index].department_head_id = department_head_id || null;
    if (is_active !== undefined) devDepartmentsStore[index].is_active = is_active;
    devDepartmentsStore[index].updated_at = new Date().toISOString();

    return devDepartmentsStore[index];
};

export const updateDepartmentStatus = async (id, is_active) => {
    return updateDepartment(id, { is_active });
};

export const deleteDepartment = async (id) => {
    // Check if department still has assigned employees
    if (isSupabaseConfigured()) {
        const { count, error: countErr } = await supabaseAdmin
            .from('employees')
            .select('id', { count: 'exact', head: true })
            .eq('department_id', id);

        if (count && count > 0) {
            throw new Error(`Cannot delete department. There are ${count} active employee(s) assigned to this department. Please reassign them first.`);
        }

        const { error } = await supabaseAdmin
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { id, deleted: true };
    }

    const employees = getEmployeesStore();
    const count = employees.filter(e => e.department_id === id).length;
    if (count > 0) {
        throw new Error(`Cannot delete department. There are ${count} active employee(s) assigned to this department. Please reassign them first.`);
    }

    const index = devDepartmentsStore.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Department not found.');
    devDepartmentsStore.splice(index, 1);
    return { id, deleted: true };
};
