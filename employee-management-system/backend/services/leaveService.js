import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';

// Calculate days between two dates inclusive
export const calculateLeaveDays = (startDateStr, endDateStr) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

let devLeavesStore = [
    {
        id: 'l1000000-0000-0000-0000-000000000001',
        employee_id: 'e1000000-0000-0000-0000-000000000009',
        leave_type: 'Sick Leave',
        start_date: '2026-10-24',
        end_date: '2026-10-28',
        leave_days: 5.0,
        reason: 'Recovering from seasonal flu under medical advice.',
        status: 'Approved',
        reviewed_by: 'dev-hr-uid-1002',
        reviewer_comments: 'Get well soon. Medical certificate acknowledged.',
        created_at: new Date('2026-10-23').toISOString(),
        updated_at: new Date('2026-10-23').toISOString()
    },
    {
        id: 'l1000000-0000-0000-0000-000000000002',
        employee_id: 'e1000000-0000-0000-0000-000000000004',
        leave_type: 'Casual Leave',
        start_date: '2026-10-30',
        end_date: '2026-11-01',
        leave_days: 3.0,
        reason: 'Attending family wedding ceremony.',
        status: 'Pending',
        reviewed_by: null,
        reviewer_comments: null,
        created_at: new Date('2026-10-25').toISOString(),
        updated_at: new Date('2026-10-25').toISOString()
    },
    {
        id: 'l1000000-0000-0000-0000-000000000003',
        employee_id: 'e1000000-0000-0000-0000-000000000005',
        leave_type: 'Earned Leave',
        start_date: '2026-11-05',
        end_date: '2026-11-09',
        leave_days: 5.0,
        reason: 'Annual vacation trip with family.',
        status: 'Pending',
        reviewed_by: null,
        reviewer_comments: null,
        created_at: new Date('2026-10-25').toISOString(),
        updated_at: new Date('2026-10-25').toISOString()
    }
];

export const getLeavesStore = () => devLeavesStore;

export const getAllLeaves = async ({ status, leave_type, employee_id, start_date, end_date, page = 1, limit = 20 }, user) => {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    // Enforce role restriction: regular employees only view their own leaves
    let targetEmployeeId = employee_id;
    if (user.role === 'Employee') {
        targetEmployeeId = user.employee_id;
        if (!targetEmployeeId) {
            return { leaves: [], counts: { pending: 0, approved: 0, rejected: 0, total: 0 }, pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } };
        }
    }

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('leave_requests')
            .select(`
                *,
                employee:employee_id(id, employee_code, first_name, last_name, email, department_id, departments(id, name)),
                reviewer:reviewed_by(id, display_name, role)
            `, { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (leave_type) query = query.eq('leave_type', leave_type);
        if (targetEmployeeId) query = query.eq('employee_id', targetEmployeeId);
        if (start_date) query = query.gte('start_date', start_date);
        if (end_date) query = query.lte('end_date', end_date);

        query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

        const { data, count, error } = await query;
        if (error) throw new Error(error.message);

        // Fetch counts summary
        let countQuery = supabaseAdmin.from('leave_requests').select('status');
        if (targetEmployeeId) countQuery = countQuery.eq('employee_id', targetEmployeeId);
        const { data: allStatuses } = await countQuery;

        const counts = {
            total: allStatuses ? allStatuses.length : 0,
            pending: allStatuses ? allStatuses.filter(l => l.status === 'Pending').length : 0,
            approved: allStatuses ? allStatuses.filter(l => l.status === 'Approved').length : 0,
            rejected: allStatuses ? allStatuses.filter(l => l.status === 'Rejected').length : 0
        };

        return {
            leaves: data,
            counts,
            pagination: {
                total: count || 0,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil((count || 0) / limitNum)
            }
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    let records = devLeavesStore.map(leave => {
        const emp = employees.find(e => e.id === leave.employee_id);
        return {
            ...leave,
            employee: emp ? {
                id: emp.id,
                employee_code: emp.employee_code,
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email,
                department_id: emp.department_id
            } : null
        };
    });

    if (targetEmployeeId) records = records.filter(r => r.employee_id === targetEmployeeId);
    if (status) records = records.filter(r => r.status === status);
    if (leave_type) records = records.filter(r => r.leave_type === leave_type);
    if (start_date) records = records.filter(r => r.start_date >= start_date);
    if (end_date) records = records.filter(r => r.end_date <= end_date);

    records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const counts = {
        total: records.length,
        pending: records.filter(r => r.status === 'Pending').length,
        approved: records.filter(r => r.status === 'Approved').length,
        rejected: records.filter(r => r.status === 'Rejected').length
    };

    const total = records.length;
    const paginated = records.slice(offset, offset + limitNum);

    return {
        leaves: paginated,
        counts,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

export const getLeaveById = async (id, user) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('leave_requests')
            .select(`
                *,
                employee:employee_id(id, employee_code, first_name, last_name, email, department_id, departments(id, name)),
                reviewer:reviewed_by(id, display_name, role)
            `)
            .eq('id', id)
            .single();

        if (error || !data) throw new Error(error?.message || 'Leave request not found.');

        // Verify authorization
        if (user.role === 'Employee' && data.employee_id !== user.employee_id) {
            throw new Error('Forbidden: You are not authorized to view this leave request.');
        }

        return data;
    }

    const leave = devLeavesStore.find(l => l.id === id);
    if (!leave) throw new Error('Leave request not found.');
    if (user.role === 'Employee' && leave.employee_id !== user.employee_id) {
        throw new Error('Forbidden: You are not authorized to view this leave request.');
    }

    const employees = getEmployeesStore();
    const emp = employees.find(e => e.id === leave.employee_id);
    return {
        ...leave,
        employee: emp || null
    };
};

export const submitLeaveRequest = async ({ employee_id, leave_type, start_date, end_date, reason }, user) => {
    const targetEmployeeId = user.role === 'Employee' ? user.employee_id : (employee_id || user.employee_id);
    if (!targetEmployeeId) {
        throw new Error('No valid employee ID associated with this request.');
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) {
        throw new Error('Leave end date cannot precede start date.');
    }

    const leaveDays = calculateLeaveDays(start_date, end_date);

    if (isSupabaseConfigured()) {
        // Prevent overlapping active requests for the same employee
        const { data: overlapping } = await supabaseAdmin
            .from('leave_requests')
            .select('id, start_date, end_date, status')
            .eq('employee_id', targetEmployeeId)
            .in('status', ['Pending', 'Approved'])
            .lte('start_date', end_date)
            .gte('end_date', start_date)
            .maybeSingle();

        if (overlapping) {
            throw new Error(`Overlapping leave request detected: You already have a ${overlapping.status} leave request from ${overlapping.start_date} to ${overlapping.end_date}.`);
        }

        const { data, error } = await supabaseAdmin
            .from('leave_requests')
            .insert([{
                employee_id: targetEmployeeId,
                leave_type,
                start_date,
                end_date,
                leave_days: leaveDays,
                reason,
                status: 'Pending'
            }])
            .select('*, employee:employee_id(first_name, last_name, employee_code)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev Fallback: overlapping check
    const overlapping = devLeavesStore.find(l => 
        l.employee_id === targetEmployeeId &&
        ['Pending', 'Approved'].includes(l.status) &&
        l.start_date <= end_date &&
        l.end_date >= start_date
    );

    if (overlapping) {
        throw new Error(`Overlapping leave request detected: You already have a ${overlapping.status} leave request from ${overlapping.start_date} to ${overlapping.end_date}.`);
    }

    const newLeave = {
        id: `l1000000-0000-0000-0000-${String(devLeavesStore.length + 1).padStart(12, '0')}`,
        employee_id: targetEmployeeId,
        leave_type,
        start_date,
        end_date,
        leave_days: leaveDays,
        reason,
        status: 'Pending',
        reviewed_by: null,
        reviewer_comments: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    devLeavesStore.unshift(newLeave);
    return newLeave;
};

export const cancelLeaveRequest = async (id, user) => {
    if (isSupabaseConfigured()) {
        const { data: current, error: getErr } = await supabaseAdmin
            .from('leave_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (getErr || !current) throw new Error('Leave request not found.');

        if (user.role === 'Employee' && current.employee_id !== user.employee_id) {
            throw new Error('Forbidden: You can only cancel your own leave requests.');
        }

        if (current.status !== 'Pending') {
            throw new Error(`Cannot cancel a leave request with status '${current.status}'. Only 'Pending' requests can be cancelled.`);
        }

        const { data, error } = await supabaseAdmin
            .from('leave_requests')
            .update({
                status: 'Cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devLeavesStore.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Leave request not found.');
    const current = devLeavesStore[index];

    if (user.role === 'Employee' && current.employee_id !== user.employee_id) {
        throw new Error('Forbidden: You can only cancel your own leave requests.');
    }

    if (current.status !== 'Pending') {
        throw new Error(`Cannot cancel a leave request with status '${current.status}'. Only 'Pending' requests can be cancelled.`);
    }

    devLeavesStore[index].status = 'Cancelled';
    devLeavesStore[index].updated_at = new Date().toISOString();
    return devLeavesStore[index];
};

export const reviewLeaveRequest = async (id, { status, reviewer_comments }, reviewerUser) => {
    if (!['Approved', 'Rejected'].includes(status)) {
        throw new Error("Review status must be either 'Approved' or 'Rejected'.");
    }

    if (isSupabaseConfigured()) {
        const { data: current, error: getErr } = await supabaseAdmin
            .from('leave_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (getErr || !current) throw new Error('Leave request not found.');

        if (current.status !== 'Pending') {
            throw new Error(`This leave request has already been processed with status '${current.status}'.`);
        }

        const { data, error } = await supabaseAdmin
            .from('leave_requests')
            .update({
                status,
                reviewed_by: reviewerUser.id,
                reviewer_comments: reviewer_comments || `Request ${status.toLowerCase()} by ${reviewerUser.display_name}.`,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devLeavesStore.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Leave request not found.');
    const current = devLeavesStore[index];

    if (current.status !== 'Pending') {
        throw new Error(`This leave request has already been processed with status '${current.status}'.`);
    }

    devLeavesStore[index] = {
        ...current,
        status,
        reviewed_by: reviewerUser.id,
        reviewer_comments: reviewer_comments || `Request ${status.toLowerCase()} by ${reviewerUser.display_name}.`,
        updated_at: new Date().toISOString()
    };

    return devLeavesStore[index];
};
