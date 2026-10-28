import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { getEmployeesStore } from './employeeService.js';
import { getDepartmentsStore } from './departmentService.js';
import { getAttendanceStore, getTodayDateString } from './attendanceService.js';
import { getLeavesStore } from './leaveService.js';

export const getDashboardSummary = async () => {
    const today = getTodayDateString();

    if (isSupabaseConfigured()) {
        const [
            { count: totalEmployees },
            { count: activeEmployees },
            { count: inactiveEmployees },
            { count: onLeaveEmployees },
            { count: totalDepartments },
            { count: todayAttendanceCount },
            { count: pendingLeaveCount }
        ] = await Promise.all([
            supabaseAdmin.from('employees').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Active'),
            supabaseAdmin.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'Inactive'),
            supabaseAdmin.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'On Leave'),
            supabaseAdmin.from('departments').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('attendance_date', today).in('status', ['Present', 'Late', 'Half-day']),
            supabaseAdmin.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending')
        ]);

        return {
            totalEmployees: totalEmployees || 0,
            activeEmployees: activeEmployees || 0,
            inactiveEmployees: inactiveEmployees || 0,
            onLeaveEmployees: onLeaveEmployees || 0,
            totalDepartments: totalDepartments || 0,
            todayAttendanceCount: todayAttendanceCount || 0,
            pendingLeaveCount: pendingLeaveCount || 0
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    const attendance = getAttendanceStore();
    const leaves = getLeavesStore();

    return {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.employment_status === 'Active').length,
        inactiveEmployees: employees.filter(e => e.employment_status === 'Inactive').length,
        onLeaveEmployees: employees.filter(e => e.employment_status === 'On Leave').length,
        totalDepartments: departments.filter(d => d.is_active).length,
        todayAttendanceCount: attendance.filter(a => a.attendance_date === today && ['Present', 'Late', 'Half-day'].includes(a.status)).length,
        pendingLeaveCount: leaves.filter(l => l.status === 'Pending').length
    };
};

export const getDashboardCharts = async () => {
    const today = getTodayDateString();

    if (isSupabaseConfigured()) {
        const [
            { data: deptEmployees },
            { data: departments },
            { data: joiningData },
            { data: todayAttendance },
            { data: leaveStatuses }
        ] = await Promise.all([
            supabaseAdmin.from('employees').select('department_id'),
            supabaseAdmin.from('departments').select('id, name'),
            supabaseAdmin.from('employees').select('joining_date'),
            supabaseAdmin.from('attendance').select('status').eq('attendance_date', today),
            supabaseAdmin.from('leave_requests').select('status')
        ]);

        // 1. Employees by Department
        const deptMap = {};
        (departments || []).forEach(d => { deptMap[d.id] = { name: d.name, count: 0 }; });
        (deptEmployees || []).forEach(e => {
            if (e.department_id && deptMap[e.department_id]) {
                deptMap[e.department_id].count++;
            }
        });
        const employeesByDepartment = {
            labels: Object.values(deptMap).map(d => d.name),
            data: Object.values(deptMap).map(d => d.count)
        };

        // 2. Monthly Joining Trends (Past 6 months)
        const monthCounts = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthCounts[key] = 0;
        }
        (joiningData || []).forEach(e => {
            if (e.joining_date) {
                const jd = new Date(e.joining_date);
                const key = jd.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (monthCounts[key] !== undefined) {
                    monthCounts[key]++;
                }
            }
        });
        const monthlyJoiningTrends = {
            labels: Object.keys(monthCounts),
            data: Object.values(monthCounts)
        };

        // 3. Attendance Summary for Today
        const attSummary = { Present: 0, Late: 0, 'Half-day': 0, Leave: 0, Absent: 0 };
        (todayAttendance || []).forEach(a => {
            if (attSummary[a.status] !== undefined) attSummary[a.status]++;
        });
        const attendanceSummary = {
            labels: Object.keys(attSummary),
            data: Object.values(attSummary)
        };

        // 4. Leave Request Status Distribution
        const leaveSummary = { Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 };
        (leaveStatuses || []).forEach(l => {
            if (leaveSummary[l.status] !== undefined) leaveSummary[l.status]++;
        });
        const leaveDistribution = {
            labels: Object.keys(leaveSummary),
            data: Object.values(leaveSummary)
        };

        return {
            employeesByDepartment,
            monthlyJoiningTrends,
            attendanceSummary,
            leaveDistribution
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const departments = getDepartmentsStore();
    const attendance = getAttendanceStore();
    const leaves = getLeavesStore();

    // 1. Dept distribution
    const deptMap = {};
    departments.forEach(d => { deptMap[d.id] = { name: d.name, count: 0 }; });
    employees.forEach(e => {
        if (e.department_id && deptMap[e.department_id]) {
            deptMap[e.department_id].count++;
        }
    });

    // 2. Joining trends
    const monthCounts = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthCounts[key] = 0;
    }
    employees.forEach(e => {
        if (e.joining_date) {
            const jd = new Date(e.joining_date);
            const key = jd.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthCounts[key] !== undefined) {
                monthCounts[key]++;
            }
        }
    });

    // 3. Attendance summary
    const attSummary = { Present: 0, Late: 0, 'Half-day': 0, Leave: 0, Absent: 0 };
    attendance.filter(a => a.attendance_date === today).forEach(a => {
        if (attSummary[a.status] !== undefined) attSummary[a.status]++;
    });

    // 4. Leave distribution
    const leaveSummary = { Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 };
    leaves.forEach(l => {
        if (leaveSummary[l.status] !== undefined) leaveSummary[l.status]++;
    });

    return {
        employeesByDepartment: {
            labels: Object.values(deptMap).map(d => d.name),
            data: Object.values(deptMap).map(d => d.count)
        },
        monthlyJoiningTrends: {
            labels: Object.keys(monthCounts),
            data: Object.values(monthCounts)
        },
        attendanceSummary: {
            labels: Object.keys(attSummary),
            data: Object.values(attSummary)
        },
        leaveDistribution: {
            labels: Object.keys(leaveSummary),
            data: Object.values(leaveSummary)
        }
    };
};

export const getRecentActivity = async () => {
    if (isSupabaseConfigured()) {
        const [
            { data: recentEmployees },
            { data: recentAttendance },
            { data: pendingLeaves }
        ] = await Promise.all([
            supabaseAdmin.from('employees').select('id, employee_code, first_name, last_name, job_title, joining_date, departments(name)').order('created_at', { ascending: false }).limit(5),
            supabaseAdmin.from('attendance').select('id, attendance_date, check_in, status, employee:employee_id(first_name, last_name, employee_code)').order('created_at', { ascending: false }).limit(5),
            supabaseAdmin.from('leave_requests').select('id, leave_type, start_date, end_date, leave_days, reason, employee:employee_id(first_name, last_name, employee_code)').eq('status', 'Pending').order('created_at', { ascending: false }).limit(5)
        ]);

        return {
            recentEmployees: recentEmployees || [],
            recentAttendance: recentAttendance || [],
            pendingLeaves: pendingLeaves || []
        };
    }

    // Dev Fallback
    const employees = getEmployeesStore();
    const attendance = getAttendanceStore();
    const leaves = getLeavesStore();
    const departments = getDepartmentsStore();

    const recentEmployees = [...employees].slice(0, 5).map(e => {
        const dept = departments.find(d => d.id === e.department_id);
        return {
            id: e.id,
            employee_code: e.employee_code,
            first_name: e.first_name,
            last_name: e.last_name,
            job_title: e.job_title,
            joining_date: e.joining_date,
            departments: dept ? { name: dept.name } : null
        };
    });

    const recentAttendance = [...attendance].slice(0, 5).map(a => {
        const emp = employees.find(e => e.id === a.employee_id);
        return {
            id: a.id,
            attendance_date: a.attendance_date,
            check_in: a.check_in,
            status: a.status,
            employee: emp ? { first_name: emp.first_name, last_name: emp.last_name, employee_code: emp.employee_code } : null
        };
    });

    const pendingLeaves = leaves.filter(l => l.status === 'Pending').slice(0, 5).map(l => {
        const emp = employees.find(e => e.id === l.employee_id);
        return {
            id: l.id,
            leave_type: l.leave_type,
            start_date: l.start_date,
            end_date: l.end_date,
            leave_days: l.leave_days,
            reason: l.reason,
            employee: emp ? { first_name: emp.first_name, last_name: emp.last_name, employee_code: emp.employee_code } : null
        };
    });

    return {
        recentEmployees,
        recentAttendance,
        pendingLeaves
    };
};
