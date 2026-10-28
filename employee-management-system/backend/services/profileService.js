import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';
import { getDepartmentsStore } from './departmentService.js';

export const getProfile = async (user) => {
    if (isSupabaseConfigured()) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        let employee = null;
        if (user.employee_id) {
            const { data: emp } = await supabaseAdmin
                .from('employees')
                .select('*, departments(id, name), manager:manager_id(first_name, last_name, employee_code)')
                .eq('id', user.employee_id)
                .single();
            employee = emp;
        }

        return {
            id: user.id,
            email: user.email,
            role: profile?.role || user.role,
            display_name: profile?.display_name || user.display_name,
            employee
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    const emp = employees.find(e => e.id === user.employee_id || e.auth_user_id === user.id);
    let joinedEmp = null;
    if (emp) {
        const dept = departments.find(d => d.id === emp.department_id);
        const mgr = employees.find(m => m.id === emp.manager_id);
        joinedEmp = {
            ...emp,
            departments: dept ? { id: dept.id, name: dept.name } : null,
            manager: mgr ? { first_name: mgr.first_name, last_name: mgr.last_name, employee_code: mgr.employee_code } : null
        };
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
        employee: joinedEmp
    };
};

export const updateProfile = async (user, { display_name, phone, address, profile_photo_url }) => {
    // Note: Non-admin users CANNOT modify their role, salary, department, employment_status, or employee_code!
    if (isSupabaseConfigured()) {
        if (display_name) {
            await supabaseAdmin
                .from('profiles')
                .update({ display_name, updated_at: new Date().toISOString() })
                .eq('id', user.id);
        }

        if (user.employee_id) {
            const empUpdates = { updated_at: new Date().toISOString() };
            if (phone !== undefined) empUpdates.phone = phone;
            if (address !== undefined) empUpdates.address = address;
            if (profile_photo_url !== undefined) empUpdates.profile_photo_url = profile_photo_url;

            await supabaseAdmin
                .from('employees')
                .update(empUpdates)
                .eq('id', user.employee_id);
        }

        return getProfile(user);
    }

    // Dev Fallback
    if (display_name) {
        user.display_name = display_name;
    }
    if (user.employee_id) {
        const employees = getEmployeesStore();
        const index = employees.findIndex(e => e.id === user.employee_id);
        if (index !== -1) {
            if (phone !== undefined) employees[index].phone = phone;
            if (address !== undefined) employees[index].address = address;
            if (profile_photo_url !== undefined) employees[index].profile_photo_url = profile_photo_url;
            employees[index].updated_at = new Date().toISOString();
        }
    }

    return getProfile(user);
};
