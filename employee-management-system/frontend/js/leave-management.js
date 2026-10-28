/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - LEAVE MANAGEMENT CONTROLLER
 */

let leaveRequestsList = [];

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    setupEventListeners();
    await loadLeaves();
});

function setupEventListeners() {
    // Submit Leave Modal
    const requestBtn = document.getElementById('btn-request-leave');
    const modal = document.getElementById('modal-leave-request');
    const modalClose = document.getElementById('modal-leave-close');
    const modalCancel = document.getElementById('btn-leave-cancel');
    const form = document.getElementById('form-leave-request');

    // Review Modal
    const reviewModal = document.getElementById('modal-review-leave');
    const reviewClose = document.getElementById('modal-review-close');
    const reviewCancel = document.getElementById('btn-review-cancel');
    const reviewForm = document.getElementById('form-review-leave');

    if (requestBtn && modal) {
        requestBtn.addEventListener('click', () => {
            if (form) form.reset();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            document.getElementById('leave-start-date').value = tomorrowStr;
            document.getElementById('leave-end-date').value = tomorrowStr;
            calculateModalDays();
            modal.classList.add('active');
        });
    }

    const closeRequestModal = () => modal && modal.classList.remove('active');
    if (modalClose) modalClose.addEventListener('click', closeRequestModal);
    if (modalCancel) modalCancel.addEventListener('click', closeRequestModal);

    const closeReviewModal = () => reviewModal && reviewModal.classList.remove('active');
    if (reviewClose) reviewClose.addEventListener('click', closeReviewModal);
    if (reviewCancel) reviewCancel.addEventListener('click', closeReviewModal);

    // Auto-calculate requested days when start or end date change
    ['leave-start-date', 'leave-end-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', calculateModalDays);
    });

    if (form) form.addEventListener('submit', handleLeaveSubmit);
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);

    // Filters
    ['filter-leave-status', 'filter-leave-type'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => loadLeaves());
    });
}

function calculateModalDays() {
    const startStr = document.getElementById('leave-start-date')?.value;
    const endStr = document.getElementById('leave-end-date')?.value;
    const daysDisplay = document.getElementById('leave-calculated-days');
    if (!startStr || !endStr || !daysDisplay) return;

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) {
        daysDisplay.textContent = '0 days (Invalid range)';
        daysDisplay.style.color = 'var(--danger)';
        return;
    }

    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    daysDisplay.textContent = `${diff} day(s)`;
    daysDisplay.style.color = 'var(--primary)';
}

async function loadLeaves() {
    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem;"><div class="spinner"></div></td></tr>';

    const status = document.getElementById('filter-leave-status')?.value || '';
    const leave_type = document.getElementById('filter-leave-type')?.value || '';

    try {
        const response = await API.get('/leaves', { status, leave_type });
        if (response.success && response.data) {
            leaveRequestsList = response.data.leaves || [];
            updateStatusCounters(response.data.counts);
            renderLeavesTable(leaveRequestsList);
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 2rem;">${escapeHtml(err.message)}</td></tr>`;
    }
}

function updateStatusCounters(counts) {
    if (!counts) return;
    const pendingEl = document.getElementById('stat-pending-leaves');
    const approvedEl = document.getElementById('stat-approved-leaves');
    const rejectedEl = document.getElementById('stat-rejected-leaves');
    if (pendingEl) pendingEl.textContent = counts.pending || 0;
    if (approvedEl) approvedEl.textContent = counts.approved || 0;
    if (rejectedEl) rejectedEl.textContent = counts.rejected || 0;
}

function renderLeavesTable(leaves) {
    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;

    if (leaves.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-umbrella-beach"></i></div>
                        <h4 class="empty-state-title">No leave requests found</h4>
                        <p class="empty-state-desc">There are no leave requests matching the active filters.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const currentUser = Auth.getCurrentUser();
    const canReview = currentUser && ['Admin', 'HR Manager'].includes(currentUser.role);

    tbody.innerHTML = leaves.map(leave => {
        const badgeClass = leave.status === 'Approved'
            ? 'badge-success'
            : (leave.status === 'Pending' ? 'badge-warning' : (leave.status === 'Rejected' ? 'badge-danger' : 'badge-neutral'));

        const isOwner = currentUser && (leave.employee_id === currentUser.employee_id);
        const canCancel = isOwner && leave.status === 'Pending';

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(leave.employee?.first_name || 'Staff')} ${escapeHtml(leave.employee?.last_name || '')}</strong>
                    <div style="font-size: 0.75rem; color: var(--navy-500);">${escapeHtml(leave.employee?.employee_code || '')}</div>
                </td>
                <td><span class="badge badge-info">${escapeHtml(leave.leave_type)}</span></td>
                <td>${formatDate(leave.start_date)} &mdash; ${formatDate(leave.end_date)}</td>
                <td><strong>${leave.leave_days}d</strong></td>
                <td>
                    <span style="font-size: 0.85rem; color: var(--navy-700);">${escapeHtml(leave.reason)}</span>
                    ${leave.reviewer_comments ? `<div style="font-size: 0.75rem; color: var(--navy-500); margin-top: 0.2rem;"><em>Reviewer: ${escapeHtml(leave.reviewer_comments)}</em></div>` : ''}
                </td>
                <td><span class="badge ${badgeClass}">${escapeHtml(leave.status)}</span></td>
                <td>
                    <div class="table-actions">
                        ${canReview && leave.status === 'Pending' ? `
                            <button class="btn btn-primary btn-sm" onclick="openReviewModal('${leave.id}')">
                                <i class="fa-solid fa-gavel"></i> Review
                            </button>
                        ` : ''}
                        ${canCancel ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="cancelLeave('${leave.id}')">
                                <i class="fa-solid fa-ban"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleLeaveSubmit(e) {
    e.preventDefault();
    const payload = {
        leave_type: document.getElementById('leave-type-select').value,
        start_date: document.getElementById('leave-start-date').value,
        end_date: document.getElementById('leave-end-date').value,
        reason: document.getElementById('leave-reason-text').value.trim()
    };

    try {
        await API.post('/leaves', payload);
        showToast('success', 'Request Submitted', 'Your leave request has been submitted for management review.');
        document.getElementById('modal-leave-request').classList.remove('active');
        await loadLeaves();
    } catch (err) {
        showToast('error', 'Submission Failed', err.message || 'Error submitting leave request.');
    }
}

window.cancelLeave = async (id) => {
    const confirmed = await confirmDialog({
        title: 'Cancel Leave Request',
        message: 'Are you sure you want to cancel this pending leave request?',
        confirmText: 'Cancel Request',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        await API.patch(`/leaves/${id}/cancel`);
        showToast('success', 'Request Cancelled', 'Your leave request was cancelled.');
        await loadLeaves();
    } catch (err) {
        showToast('error', 'Cancellation Failed', err.message || 'Error cancelling leave request.');
    }
};

window.openReviewModal = (id) => {
    const leave = leaveRequestsList.find(l => l.id === id);
    if (!leave) return;

    document.getElementById('review-leave-id').value = leave.id;
    document.getElementById('review-emp-name').textContent = `${leave.employee?.first_name || ''} ${leave.employee?.last_name || ''}`;
    document.getElementById('review-leave-dates').textContent = `${formatDate(leave.start_date)} to ${formatDate(leave.end_date)} (${leave.leave_days} days)`;
    document.getElementById('review-leave-reason').textContent = leave.reason;
    document.getElementById('review-comments').value = '';

    document.getElementById('modal-review-leave').classList.add('active');
};

async function handleReviewSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('review-leave-id').value;
    const status = document.getElementById('review-decision-select').value;
    const reviewer_comments = document.getElementById('review-comments').value.trim();

    try {
        await API.patch(`/leaves/${id}/review`, { status, reviewer_comments });
        showToast('success', 'Decision Recorded', `Leave request successfully marked as ${status}.`);
        document.getElementById('modal-review-leave').classList.remove('active');
        await loadLeaves();
    } catch (err) {
        showToast('error', 'Review Failed', err.message || 'Error recording review decision.');
    }
}
