/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - REPORTS CONTROLLER
 */

let currentReportData = [];
let currentReportType = 'employees';

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    await loadDepartmentsDropdown();
    setupEventListeners();
    await runReport();
});

function setupEventListeners() {
    const reportTypeSelect = document.getElementById('report-type-select');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', () => {
            currentReportType = reportTypeSelect.value;
            runReport();
        });
    }

    const runBtn = document.getElementById('btn-run-report');
    if (runBtn) {
        runBtn.addEventListener('click', () => runReport());
    }

    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportCsv);
    }

    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
}

async function loadDepartmentsDropdown() {
    try {
        const response = await API.get('/departments', { is_active: true });
        if (response.success && response.data?.departments) {
            const selectEl = document.getElementById('report-filter-dept');
            if (selectEl) {
                selectEl.innerHTML = '<option value="">All Departments</option>' +
                    response.data.departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load departments for reports:', err);
    }
}

async function runReport() {
    const tableHead = document.getElementById('report-table-head');
    const tableBody = document.getElementById('report-table-body');
    const reportTitle = document.getElementById('active-report-title');
    const reportCount = document.getElementById('report-records-count');
    if (!tableHead || !tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2.5rem;"><div class="spinner"></div></td></tr>';

    const deptId = document.getElementById('report-filter-dept')?.value || '';
    const startDate = document.getElementById('report-filter-start')?.value || '';
    const endDate = document.getElementById('report-filter-end')?.value || '';

    try {
        let endpoint = '/reports/employees';
        let title = 'Employee Directory Report';

        if (currentReportType === 'attendance') {
            endpoint = '/reports/attendance';
            title = 'Attendance Log Report';
        } else if (currentReportType === 'leaves') {
            endpoint = '/reports/leaves';
            title = 'Leave Applications & Approvals Report';
        } else if (currentReportType === 'payroll') {
            endpoint = '/reports/payroll';
            title = 'Payroll Compensation Summary Report';
        }

        if (reportTitle) reportTitle.textContent = title;

        const response = await API.get(endpoint, {
            department_id: deptId,
            start_date: startDate,
            end_date: endDate
        });

        if (response.success && response.data?.records) {
            currentReportData = response.data.records;
            if (reportCount) reportCount.textContent = `${currentReportData.length} record(s)`;
            renderReportTable(currentReportType, currentReportData);
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 2rem;">${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderReportTable(type, records) {
    const tableHead = document.getElementById('report-table-head');
    const tableBody = document.getElementById('report-table-body');
    if (!tableHead || !tableBody) return;

    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-file-excel"></i></div>
                        <h4 class="empty-state-title">No matching report records</h4>
                        <p class="empty-state-desc">Try clearing or widening your active filter range.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    if (type === 'employees') {
        tableHead.innerHTML = `
            <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Joining Date</th>
                <th>Salary (Base)</th>
            </tr>
        `;
        tableBody.innerHTML = records.map(r => `
            <tr>
                <td><strong>${escapeHtml(r.employee_code)}</strong></td>
                <td>${escapeHtml(r.name)}</td>
                <td>${escapeHtml(r.email)}</td>
                <td>${escapeHtml(r.department)}</td>
                <td>${escapeHtml(r.job_title)}</td>
                <td><span class="badge ${r.employment_status === 'Active' ? 'badge-success' : 'badge-neutral'}">${escapeHtml(r.employment_status)}</span></td>
                <td>${formatDate(r.joining_date)}</td>
                <td>${typeof r.basic_salary === 'number' ? formatCurrency(r.basic_salary) : r.basic_salary}</td>
            </tr>
        `).join('');
    } else if (type === 'attendance') {
        tableHead.innerHTML = `
            <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Status</th>
            </tr>
        `;
        tableBody.innerHTML = records.map(r => `
            <tr>
                <td><strong>${escapeHtml(r.employee_code)}</strong></td>
                <td>${escapeHtml(r.name)}</td>
                <td>${escapeHtml(r.department)}</td>
                <td>${formatDate(r.attendance_date)}</td>
                <td>${formatTime(r.check_in)}</td>
                <td>${formatTime(r.check_out)}</td>
                <td>${escapeHtml(r.working_hours)}</td>
                <td><span class="badge ${r.status === 'Present' ? 'badge-success' : 'badge-warning'}">${escapeHtml(r.status)}</span></td>
            </tr>
        `).join('');
    } else if (type === 'leaves') {
        tableHead.innerHTML = `
            <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
            </tr>
        `;
        tableBody.innerHTML = records.map(r => `
            <tr>
                <td><strong>${escapeHtml(r.employee_code)}</strong></td>
                <td>${escapeHtml(r.name)}</td>
                <td><span class="badge badge-info">${escapeHtml(r.leave_type)}</span></td>
                <td>${formatDate(r.start_date)}</td>
                <td>${formatDate(r.end_date)}</td>
                <td><strong>${r.leave_days}d</strong></td>
                <td>${escapeHtml(r.reason)}</td>
                <td><span class="badge ${r.status === 'Approved' ? 'badge-success' : (r.status === 'Pending' ? 'badge-warning' : 'badge-danger')}">${escapeHtml(r.status)}</span></td>
            </tr>
        `).join('');
    } else if (type === 'payroll') {
        tableHead.innerHTML = `
            <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Pay Period</th>
                <th>Basic Salary</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
            </tr>
        `;
        tableBody.innerHTML = records.map(r => `
            <tr>
                <td><strong>${escapeHtml(r.employee_code)}</strong></td>
                <td>${escapeHtml(r.name)}</td>
                <td>${escapeHtml(r.department)}</td>
                <td><strong>${escapeHtml(r.pay_period)}</strong></td>
                <td>${formatCurrency(r.basic_salary)}</td>
                <td>${formatCurrency(r.gross_salary)}</td>
                <td><span style="color: var(--danger);">${formatCurrency(r.deductions)}</span></td>
                <td><strong style="color: var(--navy-900);">${formatCurrency(r.net_salary)}</strong></td>
            </tr>
        `).join('');
    }
}

function handleExportCsv() {
    if (!currentReportData || currentReportData.length === 0) {
        showToast('warning', 'No Data', 'No records to export in the current report view.');
        return;
    }

    let filename = `EMS_${currentReportType.toUpperCase()}_REPORT`;
    let headers = [];
    let rows = [];

    if (currentReportType === 'employees') {
        headers = ['Employee Code', 'Full Name', 'Email', 'Phone', 'Department', 'Job Title', 'Status', 'Employment Type', 'Joining Date', 'Basic Salary'];
        rows = currentReportData.map(r => [
            r.employee_code,
            r.name,
            r.email,
            r.phone,
            r.department,
            r.job_title,
            r.employment_status,
            r.employment_type,
            r.joining_date,
            r.basic_salary
        ]);
    } else if (currentReportType === 'attendance') {
        headers = ['Employee Code', 'Full Name', 'Department', 'Attendance Date', 'Check In', 'Check Out', 'Working Duration', 'Status', 'Remarks'];
        rows = currentReportData.map(r => [
            r.employee_code,
            r.name,
            r.department,
            r.attendance_date,
            r.check_in,
            r.check_out,
            r.working_hours,
            r.status,
            r.remarks
        ]);
    } else if (currentReportType === 'leaves') {
        headers = ['Employee Code', 'Full Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Reviewer Comments'];
        rows = currentReportData.map(r => [
            r.employee_code,
            r.name,
            r.department,
            r.leave_type,
            r.start_date,
            r.end_date,
            r.leave_days,
            r.reason,
            r.status,
            r.reviewer_comments
        ]);
    } else if (currentReportType === 'payroll') {
        headers = ['Employee Code', 'Full Name', 'Department', 'Job Title', 'Pay Period', 'Basic Salary', 'Allowances', 'Bonus', 'Deductions', 'Gross Salary', 'Net Salary', 'Payment Status'];
        rows = currentReportData.map(r => [
            r.employee_code,
            r.name,
            r.department,
            r.job_title,
            r.pay_period,
            r.basic_salary,
            r.allowances,
            r.bonus,
            r.deductions,
            r.gross_salary,
            r.net_salary,
            r.payment_status
        ]);
    }

    exportToCsv(filename, headers, rows);
    showToast('success', 'Export Complete', `Report exported to CSV securely with formula sanitization.`);
}
