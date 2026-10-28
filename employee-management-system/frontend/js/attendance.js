/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - ATTENDANCE CONTROLLER
 */

let attendanceList = [];
let employeesList = [];

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    initializeDateInput();
    await loadEmployeesDropdown();
    await checkTodayStatus();
    await loadAttendance();
    setupEventListeners();
});

function initializeDateInput() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('filter-attendance-date');
    if (dateInput) dateInput.value = today;
}

function setupEventListeners() {
    // Check-in and Check-out actions
    const checkInBtn = document.getElementById('btn-check-in');
    const checkOutBtn = document.getElementById('btn-check-out');

    if (checkInBtn) {
        checkInBtn.addEventListener('click', handleCheckIn);
    }
    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', handleCheckOut);
    }

    // Filters
    ['filter-attendance-date', 'filter-attendance-status', 'filter-attendance-emp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => loadAttendance());
        }
    });

    // Manual Log Modal for HR/Admin
    const manualBtn = document.getElementById('btn-manual-attendance');
    const modal = document.getElementById('modal-manual-attendance');
    const modalClose = document.getElementById('modal-attendance-close');
    const modalCancel = document.getElementById('btn-attendance-cancel');
    const form = document.getElementById('form-manual-attendance');

    if (manualBtn && modal) {
        manualBtn.addEventListener('click', () => {
            if (form) form.reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('manual-att-date').value = today;
            document.getElementById('manual-att-id').value = '';
            document.getElementById('modal-att-title').textContent = 'Log Attendance Record';
            modal.classList.add('active');
        });
    }

    const closeModal = () => modal && modal.classList.remove('active');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);

    if (form) form.addEventListener('submit', handleManualAttendanceSubmit);
}

async function loadEmployeesDropdown() {
    try {
        const response = await API.get('/employees', { limit: 100 });
        if (response.success && response.data?.employees) {
            employeesList = response.data.employees;

            // Filter dropdown
            const filterEmp = document.getElementById('filter-attendance-emp');
            if (filterEmp) {
                filterEmp.innerHTML = '<option value="">All Employees</option>' +
                    employeesList.map(e => `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} (${escapeHtml(e.employee_code)})</option>`).join('');
            }

            // Modal employee select
            const modalEmp = document.getElementById('manual-att-employee');
            if (modalEmp) {
                modalEmp.innerHTML = '<option value="" disabled selected>Select Employee</option>' +
                    employeesList.map(e => `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} (${escapeHtml(e.employee_code)})</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load employees for attendance:', err);
    }
}

async function checkTodayStatus() {
    const user = Auth.getCurrentUser();
    if (!user || !user.employee_id) return;

    const today = new Date().toISOString().split('T')[0];
    const checkInBtn = document.getElementById('btn-check-in');
    const checkOutBtn = document.getElementById('btn-check-out');
    const statusBanner = document.getElementById('my-attendance-status-banner');

    try {
        const response = await API.get('/attendance', {
            employee_id: user.employee_id,
            date: today
        });

        if (response.success && response.data?.records && response.data.records.length > 0) {
            const todayRecord = response.data.records[0];

            if (statusBanner) {
                if (todayRecord.check_out) {
                    statusBanner.innerHTML = `
                        <div class="badge badge-success" style="font-size: 0.88rem; padding: 0.4rem 0.8rem;">
                            <i class="fa-solid fa-circle-check"></i> Shift Complete: In at ${formatTime(todayRecord.check_in)}, Out at ${formatTime(todayRecord.check_out)} (${(todayRecord.working_minutes / 60).toFixed(1)} hrs)
                        </div>
                    `;
                    if (checkInBtn) checkInBtn.disabled = true;
                    if (checkOutBtn) checkOutBtn.disabled = true;
                } else {
                    statusBanner.innerHTML = `
                        <div class="badge badge-warning" style="font-size: 0.88rem; padding: 0.4rem 0.8rem;">
                            <i class="fa-solid fa-clock"></i> Active Shift: Checked in at ${formatTime(todayRecord.check_in)}
                        </div>
                    `;
                    if (checkInBtn) checkInBtn.disabled = true;
                    if (checkOutBtn) checkOutBtn.disabled = false;
                }
            }
        } else {
            if (statusBanner) {
                statusBanner.innerHTML = `
                    <div class="badge badge-neutral" style="font-size: 0.88rem; padding: 0.4rem 0.8rem;">
                        <i class="fa-solid fa-person-walking"></i> Not checked in yet today.
                    </div>
                `;
            }
            if (checkInBtn) checkInBtn.disabled = false;
            if (checkOutBtn) checkOutBtn.disabled = true;
        }
    } catch (err) {
        console.error('Failed checking today status:', err);
    }
}

async function handleCheckIn() {
    try {
        const response = await API.post('/attendance/check-in', { remarks: 'Web portal check-in' });
        showToast('success', 'Checked In', response.message || 'You have successfully checked in for today.');
        await checkTodayStatus();
        await loadAttendance();
    } catch (err) {
        showToast('error', 'Check-In Failed', err.message || 'Error executing check-in.');
    }
}

async function handleCheckOut() {
    const confirmed = await confirmDialog({
        title: 'Check-Out Confirmation',
        message: 'Are you sure you want to clock out for the rest of today?',
        confirmText: 'Clock Out',
        confirmClass: 'btn-primary'
    });

    if (!confirmed) return;

    try {
        const response = await API.post('/attendance/check-out', { remarks: 'Web portal check-out' });
        showToast('success', 'Checked Out', response.message || 'You have successfully clocked out.');
        await checkTodayStatus();
        await loadAttendance();
    } catch (err) {
        showToast('error', 'Check-Out Failed', err.message || 'Error executing check-out.');
    }
}

async function loadAttendance() {
    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem;"><div class="spinner"></div></td></tr>';

    const date = document.getElementById('filter-attendance-date')?.value || '';
    const status = document.getElementById('filter-attendance-status')?.value || '';
    const empId = document.getElementById('filter-attendance-emp')?.value || '';

    try {
        const response = await API.get('/attendance', {
            date,
            status,
            employee_id: empId,
            limit: 50
        });

        if (response.success && response.data?.records) {
            attendanceList = response.data.records;
            renderAttendanceTable(attendanceList);
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 2rem;">${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderAttendanceTable(records) {
    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                        <h4 class="empty-state-title">No attendance logs found</h4>
                        <p class="empty-state-desc">No records match the selected date and filters.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const currentUser = Auth.getCurrentUser();
    const canManage = currentUser && ['Admin', 'HR Manager'].includes(currentUser.role);

    tbody.innerHTML = records.map(att => {
        const statusBadge = att.status === 'Present'
            ? 'badge-success'
            : (att.status === 'Late' ? 'badge-warning' : (att.status === 'Leave' ? 'badge-info' : 'badge-danger'));

        const hoursDisplay = att.working_minutes > 0 ? `${(att.working_minutes / 60).toFixed(1)} hrs` : (att.check_in && !att.check_out ? 'In Progress' : '0.0 hrs');

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(att.employee?.first_name || 'Staff')} ${escapeHtml(att.employee?.last_name || '')}</strong>
                    <div style="font-size: 0.75rem; color: var(--navy-500);">${escapeHtml(att.employee?.employee_code || '')}</div>
                </td>
                <td>${formatDate(att.attendance_date)}</td>
                <td><strong style="color: var(--navy-900);">${formatTime(att.check_in)}</strong></td>
                <td>${formatTime(att.check_out)}</td>
                <td><span class="badge ${statusBadge}">${escapeHtml(att.status)}</span></td>
                <td>${hoursDisplay}</td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.8rem; color: var(--navy-600);">${escapeHtml(att.remarks || '—')}</span>
                        ${canManage ? `
                            <button class="btn btn-secondary btn-sm btn-icon" onclick="openEditAttendanceModal('${att.id}')" title="Adjust Record">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openEditAttendanceModal = (id) => {
    const att = attendanceList.find(a => a.id === id);
    if (!att) return;

    document.getElementById('modal-att-title').textContent = 'Adjust Attendance Record';
    document.getElementById('manual-att-id').value = att.id;
    document.getElementById('manual-att-employee').value = att.employee_id;
    document.getElementById('manual-att-employee').disabled = true;
    document.getElementById('manual-att-date').value = att.attendance_date;
    document.getElementById('manual-att-date').disabled = true;
    document.getElementById('manual-att-in').value = att.check_in || '';
    document.getElementById('manual-att-out').value = att.check_out || '';
    document.getElementById('manual-att-status').value = att.status;
    document.getElementById('manual-att-remarks').value = att.remarks || '';

    document.getElementById('modal-manual-attendance').classList.add('active');
};

async function handleManualAttendanceSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('manual-att-id').value;
    const isEdit = Boolean(id);

    const payload = {
        employee_id: document.getElementById('manual-att-employee').value,
        attendance_date: document.getElementById('manual-att-date').value,
        check_in: document.getElementById('manual-att-in').value || null,
        check_out: document.getElementById('manual-att-out').value || null,
        status: document.getElementById('manual-att-status').value,
        remarks: document.getElementById('manual-att-remarks').value.trim()
    };

    try {
        if (isEdit) {
            await API.put(`/attendance/${id}`, payload);
            showToast('success', 'Attendance Updated', 'Attendance record adjusted successfully.');
        } else {
            await API.post('/attendance', payload);
            showToast('success', 'Attendance Logged', 'Attendance record created successfully.');
        }

        document.getElementById('modal-manual-attendance').classList.remove('active');
        document.getElementById('manual-att-employee').disabled = false;
        document.getElementById('manual-att-date').disabled = false;
        await loadAttendance();
    } catch (err) {
        showToast('error', 'Operation Failed', err.message || 'Failed to save attendance record.');
    }
}
