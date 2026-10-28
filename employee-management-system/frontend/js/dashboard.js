/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - DASHBOARD CONTROLLER
 */

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    await loadDashboard();
});

let charts = {};

async function loadDashboard() {
    try {
        await Promise.all([
            loadSummaryMetrics(),
            loadCharts(),
            loadRecentActivity()
        ]);
    } catch (err) {
        showToast('error', 'Dashboard Error', err.message || 'Failed to load dashboard data.');
    }
}

async function loadSummaryMetrics() {
    try {
        const response = await API.get('/dashboard/summary');
        if (response.success && response.data) {
            const data = response.data;
            setMetricText('metric-total-employees', data.totalEmployees);
            setMetricText('metric-active-employees', data.activeEmployees);
            setMetricText('metric-inactive-employees', data.inactiveEmployees);
            setMetricText('metric-onleave-employees', data.onLeaveEmployees);
            setMetricText('metric-total-departments', data.totalDepartments);
            setMetricText('metric-today-attendance', data.todayAttendanceCount);
            setMetricText('metric-pending-leaves', data.pendingLeaveCount);
        }
    } catch (err) {
        console.error('Failed to load metrics:', err);
    }
}

function setMetricText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = value !== undefined ? value : 0;
}

async function loadCharts() {
    try {
        const response = await API.get('/dashboard/charts');
        if (!response.success || !response.data) return;

        const data = response.data;

        // 1. Employees by Department Chart (Bar)
        renderDeptChart(data.employeesByDepartment);

        // 2. Monthly Joining Trends Chart (Line)
        renderJoiningChart(data.monthlyJoiningTrends);

        // 3. Attendance Summary Chart (Doughnut)
        renderAttendanceChart(data.attendanceSummary);

        // 4. Leave Distribution Chart (Pie)
        renderLeaveChart(data.leaveDistribution);
    } catch (err) {
        console.error('Failed to load charts:', err);
    }
}

function renderDeptChart(chartData) {
    const ctx = document.getElementById('chart-dept-distribution');
    if (!ctx || !window.Chart) return;
    if (charts.dept) charts.dept.destroy();

    charts.dept = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels.length ? chartData.labels : ['No Departments'],
            datasets: [{
                label: 'Employees',
                data: chartData.data.length ? chartData.data : [0],
                backgroundColor: '#2563eb',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderJoiningChart(chartData) {
    const ctx = document.getElementById('chart-joining-trends');
    if (!ctx || !window.Chart) return;
    if (charts.joining) charts.joining.destroy();

    charts.joining = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels.length ? chartData.labels : ['No Data'],
            datasets: [{
                label: 'New Joiners',
                data: chartData.data.length ? chartData.data : [0],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.35,
                borderWidth: 2,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderAttendanceChart(chartData) {
    const ctx = document.getElementById('chart-attendance-summary');
    if (!ctx || !window.Chart) return;
    if (charts.attendance) charts.attendance.destroy();

    const colors = ['#16a34a', '#d97706', '#0284c7', '#9333ea', '#dc2626'];

    charts.attendance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data.some(v => v > 0) ? chartData.data : [1],
                backgroundColor: chartData.data.some(v => v > 0) ? colors : ['#cbd5e1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '65%'
        }
    });
}

function renderLeaveChart(chartData) {
    const ctx = document.getElementById('chart-leave-distribution');
    if (!ctx || !window.Chart) return;
    if (charts.leaves) charts.leaves.destroy();

    const colors = ['#d97706', '#16a34a', '#dc2626', '#64748b'];

    charts.leaves = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data.some(v => v > 0) ? chartData.data : [1],
                backgroundColor: chartData.data.some(v => v > 0) ? colors : ['#cbd5e1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

async function loadRecentActivity() {
    try {
        const response = await API.get('/dashboard/recent-activity');
        if (!response.success || !response.data) return;

        const { recentEmployees, recentAttendance, pendingLeaves } = response.data;

        // 1. Recent Employees
        const empListEl = document.getElementById('recent-employees-list');
        if (empListEl) {
            if (recentEmployees.length === 0) {
                empListEl.innerHTML = '<li class="activity-text-sub" style="text-align: center; padding: 1rem;">No recent employees found.</li>';
            } else {
                empListEl.innerHTML = recentEmployees.map(emp => `
                    <li class="activity-item">
                        <div class="activity-user">
                            <div class="activity-avatar">${emp.first_name.charAt(0)}</div>
                            <div>
                                <div class="activity-text-primary">${escapeHtml(emp.first_name)} ${escapeHtml(emp.last_name)}</div>
                                <div class="activity-text-sub">${escapeHtml(emp.job_title)} &bull; ${escapeHtml(emp.departments?.name || 'General')}</div>
                            </div>
                        </div>
                        <span class="activity-tag badge-neutral">${formatDate(emp.joining_date)}</span>
                    </li>
                `).join('');
            }
        }

        // 2. Recent Attendance
        const attListEl = document.getElementById('recent-attendance-list');
        if (attListEl) {
            if (recentAttendance.length === 0) {
                attListEl.innerHTML = '<li class="activity-text-sub" style="text-align: center; padding: 1rem;">No attendance logged yet.</li>';
            } else {
                attListEl.innerHTML = recentAttendance.map(att => {
                    const badgeClass = att.status === 'Present' ? 'badge-success' : (att.status === 'Late' ? 'badge-warning' : 'badge-neutral');
                    return `
                        <li class="activity-item">
                            <div class="activity-user">
                                <div class="activity-avatar" style="background-color: var(--navy-100); color: var(--navy-700);">${(att.employee?.first_name || 'U').charAt(0)}</div>
                                <div>
                                    <div class="activity-text-primary">${escapeHtml(att.employee?.first_name || 'Employee')} ${escapeHtml(att.employee?.last_name || '')}</div>
                                    <div class="activity-text-sub">${formatDate(att.attendance_date)} &bull; In: ${formatTime(att.check_in)}</div>
                                </div>
                            </div>
                            <span class="badge ${badgeClass}">${escapeHtml(att.status)}</span>
                        </li>
                    `;
                }).join('');
            }
        }

        // 3. Pending Leaves
        const leaveListEl = document.getElementById('recent-leaves-list');
        if (leaveListEl) {
            if (pendingLeaves.length === 0) {
                leaveListEl.innerHTML = '<li class="activity-text-sub" style="text-align: center; padding: 1rem;">No pending leave requests!</li>';
            } else {
                leaveListEl.innerHTML = pendingLeaves.map(leave => `
                    <li class="activity-item">
                        <div class="activity-user">
                            <div class="activity-avatar" style="background-color: var(--warning-bg); color: var(--warning);"><i class="fa-solid fa-umbrella-beach"></i></div>
                            <div>
                                <div class="activity-text-primary">${escapeHtml(leave.employee?.first_name || 'Staff')} ${escapeHtml(leave.employee?.last_name || '')}</div>
                                <div class="activity-text-sub">${escapeHtml(leave.leave_type)} (${leave.leave_days}d)</div>
                            </div>
                        </div>
                        <a href="leave-management.html" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Review</a>
                    </li>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load recent activity:', err);
    }
}
