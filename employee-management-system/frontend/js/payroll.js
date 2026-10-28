/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - PAYROLL CONTROLLER
 */

let payrollRecordsList = [];
let employeesList = [];

document.addEventListener('DOMContentLoaded', async () => {
    Auth.guard();
    initializePeriodSelectors();
    await loadEmployeesDropdown();
    await loadPayroll();
    setupEventListeners();
});

function initializePeriodSelectors() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const monthFilter = document.getElementById('filter-pay-month');
    const yearFilter = document.getElementById('filter-pay-year');
    if (monthFilter) monthFilter.value = '';
    if (yearFilter) yearFilter.value = currentYear;

    // Modal month/year defaults
    const modalMonth = document.getElementById('pay-modal-month');
    const modalYear = document.getElementById('pay-modal-year');
    if (modalMonth) modalMonth.value = currentMonth;
    if (modalYear) modalYear.value = currentYear;
}

function setupEventListeners() {
    // Generate Payroll Modal
    const createBtn = document.getElementById('btn-create-payroll');
    const modal = document.getElementById('modal-payroll');
    const modalClose = document.getElementById('modal-payroll-close');
    const modalCancel = document.getElementById('btn-payroll-cancel');
    const form = document.getElementById('form-payroll');

    if (createBtn && modal) {
        createBtn.addEventListener('click', () => {
            if (form) form.reset();
            document.getElementById('payroll-id-field').value = '';
            document.getElementById('modal-payroll-title').textContent = 'Generate Payroll Record';
            initializePeriodSelectors();
            calculateFormTotals();
            modal.classList.add('active');
        });
    }

    const closeModal = () => modal && modal.classList.remove('active');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);

    // Auto-calculate on numeric field inputs
    ['pay-basic', 'pay-allowances', 'pay-bonus', 'pay-deductions'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateFormTotals);
    });

    // When an employee is chosen in modal, prefill their basic salary if available
    const empSelect = document.getElementById('pay-modal-employee');
    if (empSelect) {
        empSelect.addEventListener('change', () => {
            const empId = empSelect.value;
            const emp = employeesList.find(e => e.id === empId);
            if (emp && emp.basic_salary) {
                // Monthly base salary = annual / 12
                const monthlyBase = (parseFloat(emp.basic_salary) / 12).toFixed(2);
                document.getElementById('pay-basic').value = monthlyBase;
                calculateFormTotals();
            }
        });
    }

    if (form) form.addEventListener('submit', handlePayrollSubmit);

    // Filters
    ['filter-pay-month', 'filter-pay-year', 'filter-pay-status', 'filter-pay-emp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => loadPayroll());
    });

    // Pay Slip Modal close
    const slipModal = document.getElementById('modal-payslip');
    const slipClose = document.getElementById('modal-payslip-close');
    if (slipModal && slipClose) {
        slipClose.addEventListener('click', () => slipModal.classList.remove('active'));
    }

    // Print button in payslip
    const printBtn = document.getElementById('btn-print-payslip');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
}

function calculateFormTotals() {
    const basic = parseFloat(document.getElementById('pay-basic')?.value) || 0;
    const allowances = parseFloat(document.getElementById('pay-allowances')?.value) || 0;
    const bonus = parseFloat(document.getElementById('pay-bonus')?.value) || 0;
    const deductions = parseFloat(document.getElementById('pay-deductions')?.value) || 0;

    const gross = basic + allowances + bonus;
    const net = Math.max(0, gross - deductions);

    const grossEl = document.getElementById('calc-gross-display');
    const netEl = document.getElementById('calc-net-display');
    if (grossEl) grossEl.textContent = formatCurrency(gross);
    if (netEl) netEl.textContent = formatCurrency(net);
}

async function loadEmployeesDropdown() {
    try {
        const response = await API.get('/employees', { limit: 100 });
        if (response.success && response.data?.employees) {
            employeesList = response.data.employees;

            const filterEmp = document.getElementById('filter-pay-emp');
            if (filterEmp) {
                filterEmp.innerHTML = '<option value="">All Employees</option>' +
                    employeesList.map(e => `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} (${escapeHtml(e.employee_code)})</option>`).join('');
            }

            const modalEmp = document.getElementById('pay-modal-employee');
            if (modalEmp) {
                modalEmp.innerHTML = '<option value="" disabled selected>Select Employee</option>' +
                    employeesList.map(e => `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} (${escapeHtml(e.employee_code)})</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load employees for payroll:', err);
    }
}

async function loadPayroll() {
    const tbody = document.getElementById('payroll-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2.5rem;"><div class="spinner"></div></td></tr>';

    const month = document.getElementById('filter-pay-month')?.value || '';
    const year = document.getElementById('filter-pay-year')?.value || '';
    const status = document.getElementById('filter-pay-status')?.value || '';
    const empId = document.getElementById('filter-pay-emp')?.value || '';

    try {
        const response = await API.get('/payroll', {
            pay_month: month,
            pay_year: year,
            payment_status: status,
            employee_id: empId
        });

        if (response.success && response.data) {
            payrollRecordsList = response.data.records || [];
            updateSummaryTotals(response.data.summary);
            renderPayrollTable(payrollRecordsList);
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 2rem;">${escapeHtml(err.message)}</td></tr>`;
    }
}

function updateSummaryTotals(summary) {
    if (!summary) return;
    const grossEl = document.getElementById('total-gross-payout');
    const netEl = document.getElementById('total-net-payout');
    const countEl = document.getElementById('total-statements-count');
    if (grossEl) grossEl.textContent = formatCurrency(summary.totalGross || 0);
    if (netEl) netEl.textContent = formatCurrency(summary.totalNet || 0);
    if (countEl) countEl.textContent = summary.totalRecords || 0;
}

function renderPayrollTable(records) {
    const tbody = document.getElementById('payroll-table-body');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                        <h4 class="empty-state-title">No payroll statements found</h4>
                        <p class="empty-state-desc">Generate new payroll records for the active pay period.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const currentUser = Auth.getCurrentUser();
    const canManage = currentUser && ['Admin', 'HR Manager'].includes(currentUser.role);

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    tbody.innerHTML = records.map(p => {
        const statusBadge = p.payment_status === 'Paid'
            ? 'badge-success'
            : (p.payment_status === 'Pending' ? 'badge-warning' : 'badge-neutral');

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(p.employee?.first_name || 'Staff')} ${escapeHtml(p.employee?.last_name || '')}</strong>
                    <div style="font-size: 0.75rem; color: var(--navy-500);">${escapeHtml(p.employee?.employee_code || '')}</div>
                </td>
                <td><strong>${monthNames[p.pay_month]} ${p.pay_year}</strong></td>
                <td>${formatCurrency(p.basic_salary)}</td>
                <td>${formatCurrency(p.allowances + p.bonus)}</td>
                <td><span style="color: var(--danger);">${formatCurrency(p.deductions)}</span></td>
                <td><strong style="color: var(--navy-900);">${formatCurrency(p.net_salary)}</strong></td>
                <td><span class="badge ${statusBadge}">${escapeHtml(p.payment_status)}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewPaySlip('${p.id}')" title="Printable Statement">
                            <i class="fa-solid fa-file-lines"></i> Payslip
                        </button>
                        ${canManage ? `
                            <button class="btn btn-secondary btn-sm btn-icon" onclick="openEditPayrollModal('${p.id}')" title="Edit Statement">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openEditPayrollModal = (id) => {
    const p = payrollRecordsList.find(item => item.id === id);
    if (!p) return;

    document.getElementById('modal-payroll-title').textContent = 'Edit Payroll Record';
    document.getElementById('payroll-id-field').value = p.id;
    document.getElementById('pay-modal-employee').value = p.employee_id;
    document.getElementById('pay-modal-employee').disabled = true;
    document.getElementById('pay-modal-month').value = p.pay_month;
    document.getElementById('pay-modal-year').value = p.pay_year;
    document.getElementById('pay-basic').value = p.basic_salary;
    document.getElementById('pay-allowances').value = p.allowances;
    document.getElementById('pay-bonus').value = p.bonus;
    document.getElementById('pay-deductions').value = p.deductions;
    document.getElementById('pay-status').value = p.payment_status;

    calculateFormTotals();
    document.getElementById('modal-payroll').classList.add('active');
};

async function handlePayrollSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('payroll-id-field').value;
    const isEdit = Boolean(id);

    const payload = {
        employee_id: document.getElementById('pay-modal-employee').value,
        pay_month: parseInt(document.getElementById('pay-modal-month').value, 10),
        pay_year: parseInt(document.getElementById('pay-modal-year').value, 10),
        basic_salary: parseFloat(document.getElementById('pay-basic').value) || 0,
        allowances: parseFloat(document.getElementById('pay-allowances').value) || 0,
        bonus: parseFloat(document.getElementById('pay-bonus').value) || 0,
        deductions: parseFloat(document.getElementById('pay-deductions').value) || 0,
        payment_status: document.getElementById('pay-status').value
    };

    try {
        if (isEdit) {
            await API.put(`/payroll/${id}`, payload);
            showToast('success', 'Payroll Updated', 'Payroll statement updated successfully.');
        } else {
            await API.post('/payroll', payload);
            showToast('success', 'Payroll Generated', 'Payroll record created successfully.');
        }

        document.getElementById('modal-payroll').classList.remove('active');
        document.getElementById('pay-modal-employee').disabled = false;
        await loadPayroll();
    } catch (err) {
        showToast('error', 'Operation Failed', err.message || 'Error processing payroll statement.');
    }
}

window.viewPaySlip = async (id) => {
    const modal = document.getElementById('modal-payslip');
    const container = document.getElementById('payslip-render-area');
    if (!modal || !container) return;

    modal.classList.add('active');
    container.innerHTML = '<div style="text-align: center; padding: 3rem;"><div class="spinner"></div></div>';

    try {
        const response = await API.get(`/payroll/${id}`);
        if (response.success && response.data?.payroll) {
            const p = response.data.payroll;
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            container.innerHTML = `
                <div style="border: 2px solid var(--navy-200); border-radius: var(--radius-lg); padding: 2rem; background-color: var(--white);">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--navy-800); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
                        <div>
                            <h2 style="color: var(--navy-900); font-size: 1.5rem; margin-bottom: 0.25rem;">SALARY STATEMENT</h2>
                            <p style="font-size: 0.88rem; color: var(--navy-600);">Pay Period: <strong>${monthNames[p.pay_month]} ${p.pay_year}</strong></p>
                            <p style="font-size: 0.8rem; color: var(--navy-500);">Status: <strong style="color: var(--success);">${p.payment_status}</strong> ${p.payment_date ? `(Paid on ${formatDate(p.payment_date)})` : ''}</p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.15rem; font-weight: 700; color: var(--primary);">EmployEase Inc.</div>
                            <div style="font-size: 0.8rem; color: var(--navy-500);">Enterprise Workforce Platform</div>
                        </div>
                    </div>

                    <!-- Employee Details -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background-color: var(--navy-50); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; font-size: 0.85rem;">
                        <div>
                            <span style="color: var(--navy-500);">Employee Name:</span> <strong>${escapeHtml(p.employee?.first_name || '')} ${escapeHtml(p.employee?.last_name || '')}</strong>
                        </div>
                        <div>
                            <span style="color: var(--navy-500);">Employee Code:</span> <strong>${escapeHtml(p.employee?.employee_code || '')}</strong>
                        </div>
                        <div>
                            <span style="color: var(--navy-500);">Department:</span> <strong>${escapeHtml(p.employee?.departments?.name || 'General')}</strong>
                        </div>
                        <div>
                            <span style="color: var(--navy-500);">Designation:</span> <strong>${escapeHtml(p.employee?.job_title || '')}</strong>
                        </div>
                    </div>

                    <!-- Breakdown Table -->
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 1.5rem;">
                        <thead>
                            <tr style="background-color: var(--navy-100);">
                                <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--navy-200);">Earnings Component</th>
                                <th style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">Amount</th>
                                <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--navy-200);">Deductions Component</th>
                                <th style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">Basic Salary</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">${formatCurrency(p.basic_salary)}</td>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">Statutory / General Deductions</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200); color: var(--danger);">${formatCurrency(p.deductions)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">Allowances</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">${formatCurrency(p.allowances)}</td>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">—</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">—</td>
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">Incentives / Bonus</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">${formatCurrency(p.bonus)}</td>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">—</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">—</td>
                            </tr>
                            <tr style="background-color: var(--navy-50); font-weight: 700;">
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">Gross Earnings</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200);">${formatCurrency(p.gross_salary)}</td>
                                <td style="padding: 0.75rem; border: 1px solid var(--navy-200);">Total Deductions</td>
                                <td style="padding: 0.75rem; text-align: right; border: 1px solid var(--navy-200); color: var(--danger);">${formatCurrency(p.deductions)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Net Pay Highlight -->
                    <div style="background-color: var(--primary-light); border: 2px solid var(--primary); border-radius: var(--radius-md); padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--primary);">Net Payable Salary</div>
                            <div style="font-size: 0.78rem; color: var(--navy-600);">(Gross Earnings minus Deductions)</div>
                        </div>
                        <div style="font-size: 1.85rem; font-weight: 800; color: var(--primary-dark);">
                            ${formatCurrency(p.net_salary)}
                        </div>
                    </div>

                    <div style="margin-top: 1.5rem; font-size: 0.74rem; color: var(--navy-500); text-align: center; border-top: 1px solid var(--navy-100); padding-top: 0.75rem;">
                        This document is a computer-generated salary statement. Payment status represents an internal administrative record. Tax calculations and statutory filings must adhere to applicable regional jurisdiction regulations.
                    </div>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 2rem;">${escapeHtml(err.message)}</div>`;
    }
};
