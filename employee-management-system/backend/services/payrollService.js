import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';

// Calculate gross and net salary with 2-decimal precision
export const calculateSalaries = (basicSalary, allowances = 0, bonus = 0, deductions = 0) => {
    const basic = Math.max(0, parseFloat(basicSalary || 0));
    const allow = Math.max(0, parseFloat(allowances || 0));
    const bon = Math.max(0, parseFloat(bonus || 0));
    const ded = Math.max(0, parseFloat(deductions || 0));

    const gross = parseFloat((basic + allow + bon).toFixed(2));
    const net = parseFloat(Math.max(0, gross - ded).toFixed(2));

    return {
        basic_salary: basic,
        allowances: allow,
        bonus: bon,
        deductions: ded,
        gross_salary: gross,
        net_salary: net
    };
};

let devPayrollStore = [
    {
        id: 'p1000000-0000-0000-0000-000000000001',
        employee_id: 'e1000000-0000-0000-0000-000000000001',
        pay_month: 9,
        pay_year: 2026,
        basic_salary: 12083.33,
        allowances: 1500.00,
        bonus: 2000.00,
        deductions: 2500.00,
        gross_salary: 15583.33,
        net_salary: 13083.33,
        payment_status: 'Paid',
        payment_date: '2026-09-30',
        created_at: new Date('2026-09-28').toISOString(),
        updated_at: new Date('2026-09-30').toISOString()
    },
    {
        id: 'p1000000-0000-0000-0000-000000000002',
        employee_id: 'e1000000-0000-0000-0000-000000000002',
        pay_month: 9,
        pay_year: 2026,
        basic_salary: 9583.33,
        allowances: 1200.00,
        bonus: 1000.00,
        deductions: 1800.00,
        gross_salary: 11783.33,
        net_salary: 9983.33,
        payment_status: 'Paid',
        payment_date: '2026-09-30',
        created_at: new Date('2026-09-28').toISOString(),
        updated_at: new Date('2026-09-30').toISOString()
    },
    {
        id: 'p1000000-0000-0000-0000-000000000003',
        employee_id: 'e1000000-0000-0000-0000-000000000003',
        pay_month: 9,
        pay_year: 2026,
        basic_salary: 11250.00,
        allowances: 1000.00,
        bonus: 1500.00,
        deductions: 2200.00,
        gross_salary: 13750.00,
        net_salary: 11550.00,
        payment_status: 'Paid',
        payment_date: '2026-09-30',
        created_at: new Date('2026-09-28').toISOString(),
        updated_at: new Date('2026-09-30').toISOString()
    },
    {
        id: 'p1000000-0000-0000-0000-000000000004',
        employee_id: 'e1000000-0000-0000-0000-000000000004',
        pay_month: 9,
        pay_year: 2026,
        basic_salary: 8166.67,
        allowances: 800.00,
        bonus: 500.00,
        deductions: 1400.00,
        gross_salary: 9466.67,
        net_salary: 8066.67,
        payment_status: 'Paid',
        payment_date: '2026-09-30',
        created_at: new Date('2026-09-28').toISOString(),
        updated_at: new Date('2026-09-30').toISOString()
    },
    {
        id: 'p1000000-0000-0000-0000-000000000005',
        employee_id: 'e1000000-0000-0000-0000-000000000004',
        pay_month: 10,
        pay_year: 2026,
        basic_salary: 8166.67,
        allowances: 800.00,
        bonus: 0.00,
        deductions: 1400.00,
        gross_salary: 8966.67,
        net_salary: 7566.67,
        payment_status: 'Pending',
        payment_date: null,
        created_at: new Date('2026-10-25').toISOString(),
        updated_at: new Date('2026-10-25').toISOString()
    }
];

export const getPayrollStore = () => devPayrollStore;

export const getAllPayroll = async ({ employee_id, pay_month, pay_year, payment_status, page = 1, limit = 20 }, user) => {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    // Regular employee can ONLY view their own payroll records
    let targetEmployeeId = employee_id;
    if (user.role === 'Employee') {
        targetEmployeeId = user.employee_id;
        if (!targetEmployeeId) {
            return { records: [], summary: { totalGross: 0, totalNet: 0, totalRecords: 0 }, pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } };
        }
    }

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('payroll')
            .select(`
                *,
                employee:employee_id(id, employee_code, first_name, last_name, email, job_title, department_id, departments(id, name))
            `, { count: 'exact' });

        if (targetEmployeeId) query = query.eq('employee_id', targetEmployeeId);
        if (pay_month) query = query.eq('pay_month', parseInt(pay_month, 10));
        if (pay_year) query = query.eq('pay_year', parseInt(pay_year, 10));
        if (payment_status) query = query.eq('payment_status', payment_status);

        query = query.order('pay_year', { ascending: false }).order('pay_month', { ascending: false }).range(offset, offset + limitNum - 1);

        const { data, count, error } = await query;
        if (error) throw new Error(error.message);

        // Calculate summary aggregates
        const totalGross = data.reduce((sum, r) => sum + parseFloat(r.gross_salary || 0), 0);
        const totalNet = data.reduce((sum, r) => sum + parseFloat(r.net_salary || 0), 0);

        return {
            records: data,
            summary: {
                totalGross: parseFloat(totalGross.toFixed(2)),
                totalNet: parseFloat(totalNet.toFixed(2)),
                totalRecords: count || data.length
            },
            pagination: {
                total: count || data.length,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil((count || data.length) / limitNum)
            }
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    let records = devPayrollStore.map(p => {
        const emp = employees.find(e => e.id === p.employee_id);
        return {
            ...p,
            employee: emp ? {
                id: emp.id,
                employee_code: emp.employee_code,
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email,
                job_title: emp.job_title,
                department_id: emp.department_id
            } : null
        };
    });

    if (targetEmployeeId) records = records.filter(r => r.employee_id === targetEmployeeId);
    if (pay_month) records = records.filter(r => r.pay_month === parseInt(pay_month, 10));
    if (pay_year) records = records.filter(r => r.pay_year === parseInt(pay_year, 10));
    if (payment_status) records = records.filter(r => r.payment_status === payment_status);

    records.sort((a, b) => (b.pay_year - a.pay_year || b.pay_month - a.pay_month));

    const totalGross = records.reduce((sum, r) => sum + r.gross_salary, 0);
    const totalNet = records.reduce((sum, r) => sum + r.net_salary, 0);

    const total = records.length;
    const paginated = records.slice(offset, offset + limitNum);

    return {
        records: paginated,
        summary: {
            totalGross: parseFloat(totalGross.toFixed(2)),
            totalNet: parseFloat(totalNet.toFixed(2)),
            totalRecords: total
        },
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

export const getPayrollById = async (id, user) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('payroll')
            .select(`
                *,
                employee:employee_id(id, employee_code, first_name, last_name, email, job_title, address, phone, joining_date, department_id, departments(id, name))
            `)
            .eq('id', id)
            .single();

        if (error || !data) throw new Error(error?.message || 'Payroll record not found.');

        if (user.role === 'Employee' && data.employee_id !== user.employee_id) {
            throw new Error('Forbidden: You are not authorized to view this payroll statement.');
        }

        return data;
    }

    const item = devPayrollStore.find(p => p.id === id);
    if (!item) throw new Error('Payroll record not found.');

    if (user.role === 'Employee' && item.employee_id !== user.employee_id) {
        throw new Error('Forbidden: You are not authorized to view this payroll statement.');
    }

    const employees = getEmployeesStore();
    const emp = employees.find(e => e.id === item.employee_id);
    return {
        ...item,
        employee: emp || null
    };
};

export const createPayroll = async ({ employee_id, pay_month, pay_year, basic_salary, allowances, bonus, deductions, payment_status = 'Draft', payment_date = null }) => {
    const month = parseInt(pay_month, 10);
    const year = parseInt(pay_year, 10);
    const calculated = calculateSalaries(basic_salary, allowances, bonus, deductions);

    if (isSupabaseConfigured()) {
        // Prevent duplicate payroll records for same employee & pay period
        const { data: existing } = await supabaseAdmin
            .from('payroll')
            .select('id')
            .eq('employee_id', employee_id)
            .eq('pay_month', month)
            .eq('pay_year', year)
            .maybeSingle();

        if (existing) {
            throw new Error(`A payroll statement for this employee already exists for period ${month}/${year}.`);
        }

        const { data, error } = await supabaseAdmin
            .from('payroll')
            .insert([{
                employee_id,
                pay_month: month,
                pay_year: year,
                ...calculated,
                payment_status,
                payment_date: payment_status === 'Paid' ? (payment_date || new Date().toISOString().split('T')[0]) : null
            }])
            .select('*, employee:employee_id(first_name, last_name, employee_code)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev Fallback
    const dup = devPayrollStore.find(p => p.employee_id === employee_id && p.pay_month === month && p.pay_year === year);
    if (dup) {
        throw new Error(`A payroll statement for this employee already exists for period ${month}/${year}.`);
    }

    const newRecord = {
        id: `p1000000-0000-0000-0000-${String(devPayrollStore.length + 1).padStart(12, '0')}`,
        employee_id,
        pay_month: month,
        pay_year: year,
        ...calculated,
        payment_status,
        payment_date: payment_status === 'Paid' ? (payment_date || new Date().toISOString().split('T')[0]) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    devPayrollStore.unshift(newRecord);
    return newRecord;
};

export const updatePayroll = async (id, updateFields) => {
    if (isSupabaseConfigured()) {
        const { data: current, error: getErr } = await supabaseAdmin
            .from('payroll')
            .select('*')
            .eq('id', id)
            .single();

        if (getErr || !current) throw new Error('Payroll record not found.');

        const basic = updateFields.basic_salary !== undefined ? updateFields.basic_salary : current.basic_salary;
        const allow = updateFields.allowances !== undefined ? updateFields.allowances : current.allowances;
        const bon = updateFields.bonus !== undefined ? updateFields.bonus : current.bonus;
        const ded = updateFields.deductions !== undefined ? updateFields.deductions : current.deductions;

        const calculated = calculateSalaries(basic, allow, bon, ded);
        const status = updateFields.payment_status || current.payment_status;
        const payDate = status === 'Paid' ? (updateFields.payment_date || current.payment_date || new Date().toISOString().split('T')[0]) : null;

        const { data, error } = await supabaseAdmin
            .from('payroll')
            .update({
                ...calculated,
                payment_status: status,
                payment_date: payDate,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devPayrollStore.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payroll record not found.');
    const current = devPayrollStore[index];

    const basic = updateFields.basic_salary !== undefined ? updateFields.basic_salary : current.basic_salary;
    const allow = updateFields.allowances !== undefined ? updateFields.allowances : current.allowances;
    const bon = updateFields.bonus !== undefined ? updateFields.bonus : current.bonus;
    const ded = updateFields.deductions !== undefined ? updateFields.deductions : current.deductions;

    const calculated = calculateSalaries(basic, allow, bon, ded);
    const status = updateFields.payment_status || current.payment_status;
    const payDate = status === 'Paid' ? (updateFields.payment_date || current.payment_date || new Date().toISOString().split('T')[0]) : null;

    devPayrollStore[index] = {
        ...current,
        ...calculated,
        payment_status: status,
        payment_date: payDate,
        updated_at: new Date().toISOString()
    };

    return devPayrollStore[index];
};

export const updatePayrollStatus = async (id, payment_status, payment_date = null) => {
    return updatePayroll(id, { payment_status, payment_date });
};
