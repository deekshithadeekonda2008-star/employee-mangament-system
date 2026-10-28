import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';
import { getDepartmentsStore } from './departmentService.js';
import { getAttendanceStore } from './attendanceService.js';
import { getLeavesStore } from './leaveService.js';
import { getPayrollStore } from './payrollService.js';

/**
 * Escapes values against CSV formula injection (=, +, -, @, \t, \r).
 */
export const sanitizeCsvValue = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
    }
    // Escape double quotes
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const getEmployeeReport = async ({ department_id, employment_status, employment_type, start_date, end_date }, user) => {
    const isPrivileged = user.role === 'Admin' || user.role === 'HR Manager';

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('employees')
            .select('id, employee_code, first_name, last_name, email, phone, job_title, joining_date, employment_type, employment_status, basic_salary, departments(name)');

        if (department_id) query = query.eq('department_id', department_id);
        if (employment_status) query = query.eq('employment_status', employment_status);
        if (employment_type) query = query.eq('employment_type', employment_type);
        if (start_date) query = query.gte('joining_date', start_date);
        if (end_date) query = query.lte('joining_date', end_date);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return (data || []).map(e => ({
            id: e.id,
            employee_code: e.employee_code,
            name: `${e.first_name} ${e.last_name}`,
            email: e.email,
            phone: e.phone || 'N/A',
            department: e.departments?.name || 'Unassigned',
            job_title: e.job_title,
            joining_date: e.joining_date,
            employment_type: e.employment_type,
            employment_status: e.employment_status,
            basic_salary: isPrivileged ? parseFloat(e.basic_salary || 0) : '[REDACTED]'
        }));
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    let records = employees.map(e => {
        const dept = departments.find(d => d.id === e.department_id);
        return {
            id: e.id,
            employee_code: e.employee_code,
            name: `${e.first_name} ${e.last_name}`,
            email: e.email,
            phone: e.phone || 'N/A',
            department_id: e.department_id,
            department: dept ? dept.name : 'Unassigned',
            job_title: e.job_title,
            joining_date: e.joining_date,
            employment_type: e.employment_type,
            employment_status: e.employment_status,
            basic_salary: isPrivileged ? e.basic_salary : '[REDACTED]'
        };
    });

    if (department_id) records = records.filter(r => r.department_id === department_id);
    if (employment_status) records = records.filter(r => r.employment_status === employment_status);
    if (employment_type) records = records.filter(r => r.employment_type === employment_type);
    if (start_date) records = records.filter(r => r.joining_date >= start_date);
    if (end_date) records = records.filter(r => r.joining_date <= end_date);

    return records;
};

export const getAttendanceReport = async ({ start_date, end_date, employee_id, department_id, status }, user) => {
    let targetEmployeeId = employee_id;
    if (user.role === 'Employee') {
        targetEmployeeId = user.employee_id;
    }

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('attendance')
            .select(`
                id, attendance_date, check_in, check_out, status, working_minutes, remarks,
                employee:employee_id(id, employee_code, first_name, last_name, department_id, departments(name))
            `);

        if (targetEmployeeId) query = query.eq('employee_id', targetEmployeeId);
        if (start_date) query = query.gte('attendance_date', start_date);
        if (end_date) query = query.lte('attendance_date', end_date);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        let records = (data || []).map(a => ({
            id: a.id,
            employee_code: a.employee?.employee_code,
            name: `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`.trim(),
            department: a.employee?.departments?.name || 'Unassigned',
            department_id: a.employee?.department_id,
            attendance_date: a.attendance_date,
            check_in: a.check_in || 'N/A',
            check_out: a.check_out || 'N/A',
            status: a.status,
            working_hours: (a.working_minutes / 60).toFixed(1) + ' hrs',
            remarks: a.remarks || ''
        }));

        if (department_id) {
            records = records.filter(r => r.department_id === department_id);
        }

        return records;
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    const attendance = getAttendanceStore();

    let records = attendance.map(a => {
        const emp = employees.find(e => e.id === a.employee_id);
        const dept = emp ? departments.find(d => d.id === emp.department_id) : null;
        return {
            id: a.id,
            employee_id: a.employee_id,
            employee_code: emp ? emp.employee_code : 'N/A',
            name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
            department_id: emp?.department_id,
            department: dept ? dept.name : 'Unassigned',
            attendance_date: a.attendance_date,
            check_in: a.check_in || 'N/A',
            check_out: a.check_out || 'N/A',
            status: a.status,
            working_hours: (a.working_minutes / 60).toFixed(1) + ' hrs',
            remarks: a.remarks || ''
        };
    });

    if (targetEmployeeId) records = records.filter(r => r.employee_id === targetEmployeeId);
    if (department_id) records = records.filter(r => r.department_id === department_id);
    if (status) records = records.filter(r => r.status === status);
    if (start_date) records = records.filter(r => r.attendance_date >= start_date);
    if (end_date) records = records.filter(r => r.attendance_date <= end_date);

    return records;
};

export const getLeaveReport = async ({ start_date, end_date, employee_id, status, leave_type }, user) => {
    let targetEmployeeId = employee_id;
    if (user.role === 'Employee') {
        targetEmployeeId = user.employee_id;
    }

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('leave_requests')
            .select(`
                id, leave_type, start_date, end_date, leave_days, reason, status, reviewer_comments, created_at,
                employee:employee_id(employee_code, first_name, last_name, departments(name)),
                reviewer:reviewed_by(display_name)
            `);

        if (targetEmployeeId) query = query.eq('employee_id', targetEmployeeId);
        if (status) query = query.eq('status', status);
        if (leave_type) query = query.eq('leave_type', leave_type);
        if (start_date) query = query.gte('start_date', start_date);
        if (end_date) query = query.lte('end_date', end_date);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return (data || []).map(l => ({
            id: l.id,
            employee_code: l.employee?.employee_code,
            name: `${l.employee?.first_name || ''} ${l.employee?.last_name || ''}`.trim(),
            department: l.employee?.departments?.name || 'Unassigned',
            leave_type: l.leave_type,
            start_date: l.start_date,
            end_date: l.end_date,
            leave_days: l.leave_days,
            reason: l.reason,
            status: l.status,
            reviewer: l.reviewer?.display_name || 'Pending',
            reviewer_comments: l.reviewer_comments || '',
            request_date: l.created_at.split('T')[0]
        }));
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    const leaves = getLeavesStore();

    let records = leaves.map(l => {
        const emp = employees.find(e => e.id === l.employee_id);
        const dept = emp ? departments.find(d => d.id === emp.department_id) : null;
        return {
            id: l.id,
            employee_id: l.employee_id,
            employee_code: emp ? emp.employee_code : 'N/A',
            name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
            department: dept ? dept.name : 'Unassigned',
            leave_type: l.leave_type,
            start_date: l.start_date,
            end_date: l.end_date,
            leave_days: l.leave_days,
            reason: l.reason,
            status: l.status,
            reviewer: l.reviewed_by ? 'HR / Admin' : 'Pending',
            reviewer_comments: l.reviewer_comments || '',
            request_date: l.created_at.split('T')[0]
        };
    });

    if (targetEmployeeId) records = records.filter(r => r.employee_id === targetEmployeeId);
    if (status) records = records.filter(r => r.status === status);
    if (leave_type) records = records.filter(r => r.leave_type === leave_type);
    if (start_date) records = records.filter(r => r.start_date >= start_date);
    if (end_date) records = records.filter(r => r.end_date <= end_date);

    return records;
};

export const getPayrollReport = async ({ pay_month, pay_year, payment_status, employee_id }, user) => {
    // Only Admin and HR Manager can view organizational payroll reports
    if (user.role !== 'Admin' && user.role !== 'HR Manager') {
        throw new Error('Forbidden: You are not authorized to access organizational payroll reports.');
    }

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('payroll')
            .select(`
                id, pay_month, pay_year, basic_salary, allowances, bonus, deductions, gross_salary, net_salary, payment_status, payment_date,
                employee:employee_id(employee_code, first_name, last_name, job_title, departments(name))
            `);

        if (employee_id) query = query.eq('employee_id', employee_id);
        if (pay_month) query = query.eq('pay_month', parseInt(pay_month, 10));
        if (pay_year) query = query.eq('pay_year', parseInt(pay_year, 10));
        if (payment_status) query = query.eq('payment_status', payment_status);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return (data || []).map(p => ({
            id: p.id,
            employee_code: p.employee?.employee_code,
            name: `${p.employee?.first_name || ''} ${p.employee?.last_name || ''}`.trim(),
            job_title: p.employee?.job_title,
            department: p.employee?.departments?.name || 'Unassigned',
            pay_period: `${p.pay_month}/${p.pay_year}`,
            basic_salary: parseFloat(p.basic_salary),
            allowances: parseFloat(p.allowances),
            bonus: parseFloat(p.bonus),
            deductions: parseFloat(p.deductions),
            gross_salary: parseFloat(p.gross_salary),
            net_salary: parseFloat(p.net_salary),
            payment_status: p.payment_status,
            payment_date: p.payment_date || 'N/A'
        }));
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    const payroll = getPayrollStore();

    let records = payroll.map(p => {
        const emp = employees.find(e => e.id === p.employee_id);
        const dept = emp ? departments.find(d => d.id === emp.department_id) : null;
        return {
            id: p.id,
            employee_id: p.employee_id,
            employee_code: emp ? emp.employee_code : 'N/A',
            name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
            job_title: emp ? emp.job_title : 'N/A',
            department: dept ? dept.name : 'Unassigned',
            pay_period: `${p.pay_month}/${p.pay_year}`,
            pay_month: p.pay_month,
            pay_year: p.pay_year,
            basic_salary: p.basic_salary,
            allowances: p.allowances,
            bonus: p.bonus,
            deductions: p.deductions,
            gross_salary: p.gross_salary,
            net_salary: p.net_salary,
            payment_status: p.payment_status,
            payment_date: p.payment_date || 'N/A'
        };
    });

    if (employee_id) records = records.filter(r => r.employee_id === employee_id);
    if (pay_month) records = records.filter(r => r.pay_month === parseInt(pay_month, 10));
    if (pay_year) records = records.filter(r => r.pay_year === parseInt(pay_year, 10));
    if (payment_status) records = records.filter(r => r.payment_status === payment_status);

    return records;
};
