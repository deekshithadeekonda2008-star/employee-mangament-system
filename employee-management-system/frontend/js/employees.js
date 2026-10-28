/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - EMPLOYEES DIRECTORY CONTROLLER
 */

let currentEmployees = [];
let departmentsList = [];
let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    await loadDepartmentsDropdown();
    await loadEmployees();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input debounced
    const searchInput = document.getElementById('employee-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            loadEmployees();
        }, 350));
    }

    // Filter selects
    ['filter-dept', 'filter-status', 'filter-type', 'sort-by'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                currentPage = 1;
                loadEmployees();
            });
        }
    });

    // Add employee button & modal
    const addBtn = document.getElementById('btn-add-employee');
    const modal = document.getElementById('modal-employee');
    const modalClose = document.getElementById('modal-employee-close');
    const modalCancel = document.getElementById('btn-employee-cancel');
    const employeeForm = document.getElementById('form-employee');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            resetEmployeeForm();
            document.getElementById('modal-employee-title').textContent = 'Add New Employee';
            document.getElementById('employee-id-field').value = '';
            modal.classList.add('active');
        });
    }

    const closeModal = () => modal && modal.classList.remove('active');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);

    // View Modal event listeners
    const viewModal = document.getElementById('modal-view-employee');
    const viewClose = document.getElementById('modal-view-close');
    const viewBtnClose = document.getElementById('btn-view-close');
    const closeViewModal = () => viewModal && viewModal.classList.remove('active');
    if (viewClose) viewClose.addEventListener('click', closeViewModal);
    if (viewBtnClose) viewBtnClose.addEventListener('click', closeViewModal);

    // Close on backdrop click
    [modal, viewModal].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) m.classList.remove('active');
            });
        }
    });

    // Save form submit
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeFormSubmit);
    }
}

async function loadDepartmentsDropdown() {
    try {
        const response = await API.get('/departments', { is_active: true });
        if (response.success && response.data?.departments) {
            departmentsList = response.data.departments;

            // Populate filter dropdown
            const filterDept = document.getElementById('filter-dept');
            if (filterDept) {
                filterDept.innerHTML = '<option value="">All Departments</option>' +
                    departmentsList.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
            }

            // Populate modal department select
            const formDept = document.getElementById('emp-form-dept');
            if (formDept) {
                formDept.innerHTML = '<option value="" disabled selected>Select Department</option>' +
                    departmentsList.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load departments dropdown:', err);
    }
}

async function loadEmployees() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 2.5rem;">
                <div class="spinner" style="margin: 0 auto 0.5rem auto;"></div>
                <div style="color: var(--navy-500); font-size: 0.88rem;">Loading employee directory...</div>
            </td>
        </tr>
    `;

    const search = document.getElementById('employee-search')?.value || '';
    const dept = document.getElementById('filter-dept')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'joining_date';

    try {
        const response = await API.get('/employees', {
            search,
            department_id: dept,
            employment_status: status,
            employment_type: type,
            sort_by: sortBy,
            page: currentPage,
            limit
        });

        if (response.success && response.data) {
            currentEmployees = response.data.employees || [];
            renderEmployeesTable(currentEmployees);
            renderPagination(response.data.pagination);
        }
    } catch (err) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--danger);">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                    <div>${escapeHtml(err.message || 'Error loading employees.')}</div>
                </td>
            </tr>
        `;
    }
}

function renderEmployeesTable(employees) {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;

    if (employees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-users-slash"></i></div>
                        <h4 class="empty-state-title">No employees found</h4>
                        <p class="empty-state-desc">Try refining your search terms, adjusting active filters, or add a new team member.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const currentUser = Auth.getCurrentUser();
    const canManage = currentUser && ['Admin', 'HR Manager'].includes(currentUser.role);

    tbody.innerHTML = employees.map(emp => {
        const statusBadge = emp.employment_status === 'Active'
            ? 'badge-success'
            : (emp.employment_status === 'On Leave' ? 'badge-warning' : 'badge-danger');

        const deptName = emp.departments?.name || 'General';
        const avatarLetter = (emp.first_name || 'E').charAt(0);
        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
        const salaryText = emp.basic_salary !== undefined 
            ? formatCurrency(emp.basic_salary) 
            : '<span style="color: var(--navy-400);">Confidential</span>';

        return `
            <tr>
                <td>
                    <span class="badge badge-subtle" style="font-family: monospace; font-size: 0.85rem; font-weight: 700;">
                        ${escapeHtml(emp.employee_code || 'EMP-—')}
                    </span>
                </td>
                <td>
                    <div class="emp-cell-profile">
                        ${emp.profile_photo_url 
                            ? `<img src="${emp.profile_photo_url}" class="emp-avatar" alt="Photo" onerror="this.outerHTML='<div class=\\'emp-avatar-placeholder\\'>${avatarLetter}</div>'">`
                            : `<div class="emp-avatar-placeholder">${avatarLetter}</div>`
                        }
                        <div>
                            <div class="emp-meta-name">${escapeHtml(fullName)}</div>
                            <div style="font-size: 0.76rem; color: var(--navy-500);">${escapeHtml(emp.employment_type || 'Full-time')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <a href="mailto:${escapeHtml(emp.email)}" style="color: var(--primary); text-decoration: none;">
                        ${escapeHtml(emp.email)}
                    </a>
                </td>
                <td>${escapeHtml(emp.phone || '—')}</td>
                <td><span class="badge badge-subtle">${escapeHtml(deptName)}</span></td>
                <td><strong>${escapeHtml(emp.job_title)}</strong></td>
                <td><span style="font-weight: 600; color: var(--navy-800);">${salaryText}</span></td>
                <td><span class="badge ${statusBadge}">${escapeHtml(emp.employment_status)}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="openViewEmployeeModal('${emp.id}')" title="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <a href="employee-details.html?id=${emp.id}" class="btn btn-secondary btn-sm" title="Full Record & Attendance">
                            <i class="fa-solid fa-id-badge"></i>
                        </a>
                        ${canManage ? `
                            <button class="btn btn-secondary btn-sm" onclick="openEditEmployeeModal('${emp.id}')" title="Edit Employee">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn ${emp.employment_status === 'Active' ? 'btn-secondary' : 'btn-success'} btn-sm" onclick="toggleEmployeeStatus('${emp.id}', '${emp.employment_status}')" title="${emp.employment_status === 'Active' ? 'Deactivate' : 'Activate'}">
                                <i class="fa-solid ${emp.employment_status === 'Active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="openDeleteEmployeeModal('${emp.id}', '${escapeHtml(fullName)}', '${escapeHtml(emp.employee_code || '')}')" title="Delete Employee">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination-container');
    if (!container || !pagination) return;

    const { total, page, totalPages } = pagination;
    const startCount = total === 0 ? 0 : (page - 1) * limit + 1;
    const endCount = Math.min(page * limit, total);

    container.innerHTML = `
        <div class="pagination-info">Showing ${startCount} to ${endCount} of ${total} employees</div>
        <div class="pagination-controls">
            <button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                <button class="page-btn ${p === page ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>
            `).join('')}
            <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

window.goToPage = (page) => {
    currentPage = page;
    loadEmployees();
};

window.openViewEmployeeModal = (id) => {
    const emp = currentEmployees.find(e => e.id === id);
    if (!emp) return;

    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    const avatarLetter = (emp.first_name || 'E').charAt(0);
    const deptName = emp.departments?.name || 'General';

    const avatarWrap = document.getElementById('view-emp-avatar-container');
    if (avatarWrap) {
        avatarWrap.innerHTML = emp.profile_photo_url
            ? `<img src="${emp.profile_photo_url}" style="width: 68px; height: 68px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary-100);" alt="Photo" onerror="this.outerHTML='<div class=\\'profile-banner-avatar-placeholder\\'>${avatarLetter}</div>'">`
            : `<div class="profile-banner-avatar-placeholder" style="width: 68px; height: 68px; font-size: 1.6rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-weight: 700;">${avatarLetter}</div>`;
    }

    document.getElementById('view-emp-name').textContent = fullName;
    document.getElementById('view-emp-code').textContent = emp.employee_code || 'EMP-—';

    const statusEl = document.getElementById('view-emp-status');
    statusEl.textContent = emp.employment_status || 'Active';
    statusEl.className = `badge ${emp.employment_status === 'Active' ? 'badge-success' : (emp.employment_status === 'On Leave' ? 'badge-warning' : 'badge-danger')}`;

    document.getElementById('view-emp-type').textContent = emp.employment_type || 'Full-time';
    document.getElementById('view-emp-dept').textContent = deptName;
    document.getElementById('view-emp-title').textContent = emp.job_title || '—';
    document.getElementById('view-emp-email').textContent = emp.email || '—';
    document.getElementById('view-emp-phone').textContent = emp.phone || '—';
    document.getElementById('view-emp-salary').textContent = emp.basic_salary !== undefined ? formatCurrency(emp.basic_salary) : 'Confidential';
    document.getElementById('view-emp-joining').textContent = formatDate(emp.joining_date);
    document.getElementById('view-emp-address').textContent = emp.address || 'No address provided';

    const fullLink = document.getElementById('view-emp-full-link');
    if (fullLink) fullLink.href = `employee-details.html?id=${emp.id}`;

    const viewModal = document.getElementById('modal-view-employee');
    if (viewModal) viewModal.classList.add('active');
};

window.openEditEmployeeModal = (id) => {
    const emp = currentEmployees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('modal-employee-title').textContent = 'Edit Employee';
    document.getElementById('employee-id-field').value = emp.id;
    const codeEl = document.getElementById('emp-code');
    if (codeEl) codeEl.value = emp.employee_code || '';
    document.getElementById('emp-first-name').value = emp.first_name || '';
    document.getElementById('emp-last-name').value = emp.last_name || '';
    document.getElementById('emp-email').value = emp.email || '';
    document.getElementById('emp-phone').value = emp.phone || '';
    document.getElementById('emp-form-dept').value = emp.department_id || '';
    document.getElementById('emp-job-title').value = emp.job_title || '';
    document.getElementById('emp-type').value = emp.employment_type || 'Full-time';
    document.getElementById('emp-status').value = emp.employment_status || 'Active';
    document.getElementById('emp-joining-date').value = emp.joining_date ? emp.joining_date.split('T')[0] : '';
    document.getElementById('emp-salary').value = emp.basic_salary !== undefined ? emp.basic_salary : '';
    document.getElementById('emp-photo-url').value = emp.profile_photo_url || '';
    document.getElementById('emp-address').value = emp.address || '';

    document.getElementById('modal-employee').classList.add('active');
};

window.openDeleteEmployeeModal = async (id, name, code) => {
    const confirmed = await confirmDialog({
        title: 'Delete Employee Record',
        message: `Are you sure you want to permanently delete ${name} (${code || 'ID: ' + id})? All related attendance, leave, and payroll records will be deleted. This action cannot be undone.`,
        confirmText: 'Delete Employee',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        await API.delete(`/employees/${id}`);
        showToast('success', 'Employee Deleted', `${name} has been removed from the system.`);
        loadEmployees();
    } catch (err) {
        showToast('error', 'Delete Failed', err.message || 'Could not delete employee record.');
    }
};

async function handleEmployeeFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('employee-id-field').value;
    const isEdit = Boolean(id);

    const codeVal = document.getElementById('emp-code')?.value.trim() || undefined;

    const payload = {
        employee_code: codeVal,
        first_name: document.getElementById('emp-first-name').value.trim(),
        last_name: document.getElementById('emp-last-name').value.trim(),
        email: document.getElementById('emp-email').value.trim(),
        phone: document.getElementById('emp-phone').value.trim(),
        department_id: document.getElementById('emp-form-dept').value,
        job_title: document.getElementById('emp-job-title').value.trim(),
        employment_type: document.getElementById('emp-type').value,
        employment_status: document.getElementById('emp-status').value,
        joining_date: document.getElementById('emp-joining-date').value,
        basic_salary: parseFloat(document.getElementById('emp-salary').value) || 0,
        profile_photo_url: document.getElementById('emp-photo-url').value.trim(),
        address: document.getElementById('emp-address').value.trim()
    };

    try {
        if (isEdit) {
            await API.put(`/employees/${id}`, payload);
            showToast('success', 'Employee Updated', 'Employee record updated successfully.');
        } else {
            await API.post('/employees', payload);
            showToast('success', 'Employee Created', 'New employee added successfully.');
        }

        document.getElementById('modal-employee').classList.remove('active');
        loadEmployees();
    } catch (err) {
        showToast('error', 'Operation Failed', err.message || (err.errors && err.errors[0]) || 'Error saving employee.');
    }
}

window.toggleEmployeeStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const actionVerb = currentStatus === 'Active' ? 'deactivate' : 'activate';

    const confirmed = await confirmDialog({
        title: `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} Employee`,
        message: `Are you sure you want to ${actionVerb} this employee? Historical attendance and payroll records will be preserved.`,
        confirmText: `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}`,
        confirmClass: currentStatus === 'Active' ? 'btn-danger' : 'btn-success'
    });

    if (!confirmed) return;

    try {
        await API.patch(`/employees/${id}/status`, { status: newStatus });
        showToast('success', 'Status Updated', `Employee has been marked as ${newStatus}.`);
        loadEmployees();
    } catch (err) {
        showToast('error', 'Update Failed', err.message || 'Failed to update employee status.');
    }
};

function resetEmployeeForm() {
    const form = document.getElementById('form-employee');
    if (form) form.reset();
    const codeEl = document.getElementById('emp-code');
    if (codeEl) codeEl.value = '';
    const today = new Date().toISOString().split('T')[0];
    const joiningEl = document.getElementById('emp-joining-date');
    if (joiningEl) joiningEl.value = today;
}
