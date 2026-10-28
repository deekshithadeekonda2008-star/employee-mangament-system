/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - DEPARTMENTS CONTROLLER
 */

let departmentsList = [];
let employeesList = [];

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    await loadEmployeesDropdown();
    await loadDepartments();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('dept-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadDepartments();
        }, 300));
    }

    const filterStatus = document.getElementById('dept-filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => loadDepartments());
    }

    // Modal Add Department
    const addBtn = document.getElementById('btn-add-dept');
    const modal = document.getElementById('modal-department');
    const modalClose = document.getElementById('modal-dept-close');
    const modalCancel = document.getElementById('btn-dept-cancel');
    const form = document.getElementById('form-department');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            if (form) form.reset();
            document.getElementById('modal-dept-title').textContent = 'Add New Department';
            document.getElementById('dept-id-field').value = '';
            modal.classList.add('active');
        });
    }

    const closeModal = () => modal && modal.classList.remove('active');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);

    if (form) form.addEventListener('submit', handleDepartmentSubmit);

    // Member view modal close
    const membersModal = document.getElementById('modal-dept-members');
    const membersModalClose = document.getElementById('modal-members-close');
    if (membersModal && membersModalClose) {
        membersModalClose.addEventListener('click', () => membersModal.classList.remove('active'));
    }
}

async function loadEmployeesDropdown() {
    try {
        const response = await API.get('/employees', { limit: 100 });
        if (response.success && response.data?.employees) {
            employeesList = response.data.employees;
            const selectEl = document.getElementById('dept-head-select');
            if (selectEl) {
                selectEl.innerHTML = '<option value="">None (Unassigned)</option>' +
                    employeesList.map(e => `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} (${escapeHtml(e.employee_code)})</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load employees for dept head dropdown:', err);
    }
}

async function loadDepartments() {
    const grid = document.getElementById('departments-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <div class="spinner" style="margin: 0 auto 0.5rem auto;"></div>
            <div style="color: var(--navy-500); font-size: 0.88rem;">Loading departments...</div>
        </div>
    `;

    const search = document.getElementById('dept-search')?.value || '';
    const status = document.getElementById('dept-filter-status')?.value;

    try {
        const params = {};
        if (search) params.search = search;
        if (status !== undefined && status !== '') params.is_active = status;

        const response = await API.get('/departments', params);
        if (response.success && response.data?.departments) {
            departmentsList = response.data.departments;
            renderDepartments(departmentsList);
        }
    } catch (err) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--danger);">
                <div>${escapeHtml(err.message || 'Error loading departments.')}</div>
            </div>
        `;
    }
}

function renderDepartments(departments) {
    const grid = document.getElementById('departments-grid');
    if (!grid) return;

    if (departments.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fa-solid fa-building-slash"></i></div>
                    <h4 class="empty-state-title">No departments found</h4>
                    <p class="empty-state-desc">Create a new department to organize your workforce structure.</p>
                </div>
            </div>
        `;
        return;
    }

    const currentUser = Auth.getCurrentUser();
    const canManage = currentUser && ['Admin', 'HR Manager'].includes(currentUser.role);
    const isAdmin = currentUser && currentUser.role === 'Admin';

    grid.innerHTML = departments.map(dept => {
        const headName = dept.department_head 
            ? `${dept.department_head.first_name} ${dept.department_head.last_name}` 
            : 'Unassigned';

        return `
            <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background-color: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                <i class="fa-solid fa-sitemap"></i>
                            </div>
                            <div>
                                <h3 style="font-size: 1.15rem; color: var(--navy-900); margin-bottom: 0.15rem;">${escapeHtml(dept.name)}</h3>
                                <span class="badge ${dept.is_active ? 'badge-success' : 'badge-danger'}">
                                    ${dept.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p style="font-size: 0.85rem; color: var(--navy-600); margin-bottom: 1.25rem; min-height: 40px;">
                        ${escapeHtml(dept.description || 'No description provided for this department.')}
                    </p>

                    <div style="background-color: var(--navy-50); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.4rem;">
                            <span style="color: var(--navy-500);">Department Head:</span>
                            <strong style="color: var(--navy-900);">${escapeHtml(headName)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
                            <span style="color: var(--navy-500);">Total Staff:</span>
                            <span class="badge badge-info">${dept.employee_count} member(s)</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--navy-100); padding-top: 1rem; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="viewDepartmentMembers('${dept.id}')">
                        <i class="fa-solid fa-users"></i> View Members
                    </button>
                    ${canManage ? `
                        <div style="display: flex; gap: 0.35rem;">
                            <button class="btn btn-secondary btn-sm btn-icon" onclick="openEditDepartmentModal('${dept.id}')" title="Edit Department">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ${isAdmin ? `
                                <button class="btn btn-outline-danger btn-sm btn-icon" onclick="deleteDepartment('${dept.id}', '${dept.name}', ${dept.employee_count})" title="Delete Department">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

window.openEditDepartmentModal = (id) => {
    const dept = departmentsList.find(d => d.id === id);
    if (!dept) return;

    document.getElementById('modal-dept-title').textContent = 'Edit Department';
    document.getElementById('dept-id-field').value = dept.id;
    document.getElementById('dept-name').value = dept.name;
    document.getElementById('dept-desc').value = dept.description || '';
    document.getElementById('dept-head-select').value = dept.department_head_id || '';
    document.getElementById('dept-status').value = dept.is_active ? 'true' : 'false';

    document.getElementById('modal-department').classList.add('active');
};

async function handleDepartmentSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('dept-id-field').value;
    const isEdit = Boolean(id);

    const payload = {
        name: document.getElementById('dept-name').value.trim(),
        description: document.getElementById('dept-desc').value.trim(),
        department_head_id: document.getElementById('dept-head-select').value || null,
        is_active: document.getElementById('dept-status').value === 'true'
    };

    try {
        if (isEdit) {
            await API.put(`/departments/${id}`, payload);
            showToast('success', 'Department Updated', 'Department details updated successfully.');
        } else {
            await API.post('/departments', payload);
            showToast('success', 'Department Created', 'New department created successfully.');
        }

        document.getElementById('modal-department').classList.remove('active');
        loadDepartments();
    } catch (err) {
        showToast('error', 'Operation Failed', err.message || 'Failed to save department.');
    }
}

window.deleteDepartment = async (id, name, employeeCount) => {
    if (employeeCount > 0) {
        showToast('warning', 'Action Prohibited', `Cannot delete "${name}" because ${employeeCount} employee(s) are assigned to it. Reassign employees before deletion.`);
        return;
    }

    const confirmed = await confirmDialog({
        title: 'Delete Department',
        message: `Are you sure you want to delete "${name}"? This action cannot be reversed.`,
        confirmText: 'Delete Department',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        await API.delete(`/departments/${id}`);
        showToast('success', 'Department Deleted', `Department "${name}" was successfully deleted.`);
        loadDepartments();
    } catch (err) {
        showToast('error', 'Delete Failed', err.message || 'Failed to delete department.');
    }
};

window.viewDepartmentMembers = async (id) => {
    const modal = document.getElementById('modal-dept-members');
    const titleEl = document.getElementById('modal-members-dept-name');
    const tbody = document.getElementById('dept-members-table-body');
    if (!modal || !tbody) return;

    modal.classList.add('active');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;"><div class="spinner"></div></td></tr>';

    try {
        const response = await API.get(`/departments/${id}`);
        if (response.success && response.data?.department) {
            const dept = response.data.department;
            if (titleEl) titleEl.textContent = `${dept.name} Members`;

            if (!dept.employees || dept.employees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--navy-500);">No employees currently assigned to this department.</td></tr>';
                return;
            }

            tbody.innerHTML = dept.employees.map(e => `
                <tr>
                    <td><strong>${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)}</strong></td>
                    <td>${escapeHtml(e.employee_code)}</td>
                    <td>${escapeHtml(e.job_title)}</td>
                    <td><span class="badge ${e.employment_status === 'Active' ? 'badge-success' : 'badge-neutral'}">${escapeHtml(e.employment_status)}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">${escapeHtml(err.message)}</td></tr>`;
    }
};
