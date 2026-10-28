import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';

// Helper to get current date formatted as YYYY-MM-DD in ORG timezone
export const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

// Helper to get current time formatted as HH:MM:SS
export const getCurrentTimeString = () => {
    return new Date().toTimeString().split(' ')[0];
};

// Calculate working minutes between check_in and check_out (HH:MM:SS)
export const calculateWorkingMinutes = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [h1, m1, s1 = 0] = checkIn.split(':').map(Number);
    const [h2, m2, s2 = 0] = checkOut.split(':').map(Number);
    const totalMinutes1 = h1 * 60 + m1 + s1 / 60;
    const totalMinutes2 = h2 * 60 + m2 + s2 / 60;
    return Math.max(0, Math.round(totalMinutes2 - totalMinutes1));
};

let devAttendanceStore = [
    {
        id: 'a1000000-0000-0000-0000-000000000001',
        employee_id: 'e1000000-0000-0000-0000-000000000001',
        attendance_date: getTodayDateString(),
        check_in: '08:55:00',
        check_out: '17:15:00',
        status: 'Present',
        working_minutes: 500,
        remarks: 'Executive daily briefing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'a1000000-0000-0000-0000-000000000002',
        employee_id: 'e1000000-0000-0000-0000-000000000002',
        attendance_date: getTodayDateString(),
        check_in: '09:02:00',
        check_out: '17:30:00',
        status: 'Present',
        working_minutes: 508,
        remarks: 'Recruitment coordination',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'a1000000-0000-0000-0000-000000000003',
        employee_id: 'e1000000-0000-0000-0000-000000000003',
        attendance_date: getTodayDateString(),
        check_in: '09:15:00',
        check_out: null,
        status: 'Present',
        working_minutes: 0,
        remarks: 'Engineering review',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'a1000000-0000-0000-0000-000000000004',
        employee_id: 'e1000000-0000-0000-0000-000000000004',
        attendance_date: getTodayDateString(),
        check_in: '09:35:00',
        check_out: null,
        status: 'Late',
        working_minutes: 0,
        remarks: 'Transit delay',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

export const getAttendanceStore = () => devAttendanceStore;

export const getAllAttendance = async ({ date, start_date, end_date, employee_id, department_id, status, page = 1, limit = 20 }, user) => {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    // Enforce role-based restriction: regular employees can ONLY view their own attendance
    let targetEmployeeId = employee_id;
    if (user.role === 'Employee') {
        targetEmployeeId = user.employee_id;
        if (!targetEmployeeId) {
            return { records: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } };
        }
    }

    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('attendance')
            .select(`
                *,
                employee:employee_id(id, employee_code, first_name, last_name, email, department_id, departments(id, name))
            `, { count: 'exact' });

        if (date) query = query.eq('attendance_date', date);
        if (start_date) query = query.gte('attendance_date', start_date);
        if (end_date) query = query.lte('attendance_date', end_date);
        if (targetEmployeeId) query = query.eq('employee_id', targetEmployeeId);
        if (status) query = query.eq('status', status);

        query = query.order('attendance_date', { ascending: false }).order('check_in', { ascending: false }).range(offset, offset + limitNum - 1);

        const { data, count, error } = await query;
        if (error) throw new Error(error.message);

        // Apply department filtering if requested and joined
        let records = data;
        if (department_id) {
            records = records.filter(r => r.employee?.department_id === department_id);
        }

        return {
            records,
            pagination: {
                total: count || records.length,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil((count || records.length) / limitNum)
            }
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    let records = devAttendanceStore.map(att => {
        const emp = employees.find(e => e.id === att.employee_id);
        return {
            ...att,
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
    if (date) records = records.filter(r => r.attendance_date === date);
    if (start_date) records = records.filter(r => r.attendance_date >= start_date);
    if (end_date) records = records.filter(r => r.attendance_date <= end_date);
    if (status) records = records.filter(r => r.status === status);
    if (department_id) records = records.filter(r => r.employee?.department_id === department_id);

    records.sort((a, b) => (b.attendance_date > a.attendance_date ? 1 : -1));

    const total = records.length;
    const paginated = records.slice(offset, offset + limitNum);

    return {
        records: paginated,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

export const employeeCheckIn = async (employeeId, remarks = '') => {
    if (!employeeId) throw new Error('Employee ID required for check-in.');
    const today = getTodayDateString();
    const nowTime = getCurrentTimeString();

    // Determine status (Late if after 09:30)
    const [hours, minutes] = nowTime.split(':').map(Number);
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    const status = isLate ? 'Late' : 'Present';

    if (isSupabaseConfigured()) {
        const { data: existing } = await supabaseAdmin
            .from('attendance')
            .select('id, check_in')
            .eq('employee_id', employeeId)
            .eq('attendance_date', today)
            .maybeSingle();

        if (existing) {
            throw new Error(`You have already checked in today at ${existing.check_in}. Check-out is the next permitted action.`);
        }

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .insert([{
                employee_id: employeeId,
                attendance_date: today,
                check_in: nowTime,
                status,
                working_minutes: 0,
                remarks: remarks || (isLate ? 'Checked in after 09:30 AM' : 'On-time check-in')
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev Fallback
    const existing = devAttendanceStore.find(a => a.employee_id === employeeId && a.attendance_date === today);
    if (existing) {
        throw new Error(`You have already checked in today at ${existing.check_in}. Check-out is the next permitted action.`);
    }

    const newRecord = {
        id: `a1000000-0000-0000-0000-${String(devAttendanceStore.length + 1).padStart(12, '0')}`,
        employee_id: employeeId,
        attendance_date: today,
        check_in: nowTime,
        check_out: null,
        status,
        working_minutes: 0,
        remarks: remarks || (isLate ? 'Checked in after 09:30 AM' : 'On-time check-in'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    devAttendanceStore.unshift(newRecord);
    return newRecord;
};

export const employeeCheckOut = async (employeeId, remarks = '') => {
    if (!employeeId) throw new Error('Employee ID required for check-out.');
    const today = getTodayDateString();
    const nowTime = getCurrentTimeString();

    if (isSupabaseConfigured()) {
        const { data: existing, error: findError } = await supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('attendance_date', today)
            .single();

        if (findError || !existing) {
            throw new Error('No active check-in record found for today. Please check in first before checking out.');
        }

        if (existing.check_out) {
            throw new Error(`You have already completed check-out today at ${existing.check_out}.`);
        }

        const duration = calculateWorkingMinutes(existing.check_in, nowTime);
        const updatedRemarks = remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${remarks}` : existing.remarks;

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .update({
                check_out: nowTime,
                working_minutes: duration,
                remarks: updatedRemarks,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev Fallback
    const existingIndex = devAttendanceStore.findIndex(a => a.employee_id === employeeId && a.attendance_date === today);
    if (existingIndex === -1) {
        throw new Error('No active check-in record found for today. Please check in first before checking out.');
    }

    const existing = devAttendanceStore[existingIndex];
    if (existing.check_out) {
        throw new Error(`You have already completed check-out today at ${existing.check_out}.`);
    }

    const duration = calculateWorkingMinutes(existing.check_in, nowTime);
    devAttendanceStore[existingIndex] = {
        ...existing,
        check_out: nowTime,
        working_minutes: duration,
        remarks: remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${remarks}` : existing.remarks,
        updated_at: new Date().toISOString()
    };

    return devAttendanceStore[existingIndex];
};

export const recordManualAttendance = async ({ employee_id, attendance_date, check_in, check_out, status = 'Present', remarks = '' }) => {
    if (check_in && check_out && check_out < check_in) {
        throw new Error('Check-out time cannot precede check-in time.');
    }

    const workingMinutes = (check_in && check_out) ? calculateWorkingMinutes(check_in, check_out) : 0;

    if (isSupabaseConfigured()) {
        const { data: existing } = await supabaseAdmin
            .from('attendance')
            .select('id')
            .eq('employee_id', employee_id)
            .eq('attendance_date', attendance_date)
            .maybeSingle();

        if (existing) {
            throw new Error(`An attendance record already exists for this employee on ${attendance_date}. Please edit the existing record instead.`);
        }

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .insert([{
                employee_id,
                attendance_date,
                check_in: check_in || null,
                check_out: check_out || null,
                status,
                working_minutes: workingMinutes,
                remarks
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    // Dev Fallback
    const dup = devAttendanceStore.find(a => a.employee_id === employee_id && a.attendance_date === attendance_date);
    if (dup) {
        throw new Error(`An attendance record already exists for this employee on ${attendance_date}. Please edit the existing record instead.`);
    }

    const newRecord = {
        id: `a1000000-0000-0000-0000-${String(devAttendanceStore.length + 1).padStart(12, '0')}`,
        employee_id,
        attendance_date,
        check_in: check_in || null,
        check_out: check_out || null,
        status,
        working_minutes: workingMinutes,
        remarks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    devAttendanceStore.unshift(newRecord);
    return newRecord;
};

export const updateAttendance = async (id, { check_in, check_out, status, remarks }) => {
    if (check_in && check_out && check_out < check_in) {
        throw new Error('Check-out time cannot precede check-in time.');
    }

    if (isSupabaseConfigured()) {
        const { data: current, error: getErr } = await supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('id', id)
            .single();

        if (getErr || !current) throw new Error('Attendance record not found.');

        const finalCheckIn = check_in !== undefined ? check_in : current.check_in;
        const finalCheckOut = check_out !== undefined ? check_out : current.check_out;
        const duration = (finalCheckIn && finalCheckOut) ? calculateWorkingMinutes(finalCheckIn, finalCheckOut) : 0;

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .update({
                check_in: finalCheckIn,
                check_out: finalCheckOut,
                status: status !== undefined ? status : current.status,
                working_minutes: duration,
                remarks: remarks !== undefined ? remarks : current.remarks,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    const index = devAttendanceStore.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Attendance record not found.');

    const current = devAttendanceStore[index];
    const finalCheckIn = check_in !== undefined ? check_in : current.check_in;
    const finalCheckOut = check_out !== undefined ? check_out : current.check_out;
    const duration = (finalCheckIn && finalCheckOut) ? calculateWorkingMinutes(finalCheckIn, finalCheckOut) : 0;

    devAttendanceStore[index] = {
        ...current,
        check_in: finalCheckIn,
        check_out: finalCheckOut,
        status: status !== undefined ? status : current.status,
        working_minutes: duration,
        remarks: remarks !== undefined ? remarks : current.remarks,
        updated_at: new Date().toISOString()
    };

    return devAttendanceStore[index];
};
