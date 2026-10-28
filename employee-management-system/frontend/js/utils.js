/**
 * EMPLOYEE MANAGEMENT SYSTEM (EMS) - CLIENT UTILITIES
 */

// Toast Notifications Container initialization
function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Displays a toast notification.
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {string} title 
 * @param {string} message 
 * @param {number} duration (ms)
 */
function showToast(type = 'info', title = '', message = '', duration = 4000) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title || type.toUpperCase())}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
}

function removeToast(toast) {
    toast.classList.add('toast-hide');
    setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
}

/**
 * Reusable Confirmation Dialog Modal.
 */
function confirmDialog({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmClass = 'btn-danger', cancelText = 'Cancel' }) {
    return new Promise((resolve) => {
        let modal = document.getElementById('ems-global-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ems-global-confirm-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-card" style="max-width: 440px;">
                <div class="modal-header">
                    <h3 class="modal-title">${escapeHtml(title)}</h3>
                    <button class="modal-close" id="confirm-modal-x">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--navy-700); font-size: 0.95rem;">${escapeHtml(message)}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirm-modal-cancel">${escapeHtml(cancelText)}</button>
                    <button class="btn ${confirmClass}" id="confirm-modal-proceed">${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        modal.classList.add('active');

        const cleanUp = (result) => {
            modal.classList.remove('active');
            resolve(result);
        };

        modal.querySelector('#confirm-modal-proceed').onclick = () => cleanUp(true);
        modal.querySelector('#confirm-modal-cancel').onclick = () => cleanUp(false);
        modal.querySelector('#confirm-modal-x').onclick = () => cleanUp(false);
    });
}

/**
 * Currency Formatter (USD / Localized)
 */
function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(num);
}

/**
 * Date Formatter (e.g. Oct 26, 2026)
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Time Formatter (e.g. 09:15 AM)
 */
function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Safe CSV Exporter with Formula Injection Mitigation.
 */
function exportToCsv(filename, headers, rows) {
    const sanitize = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val).trim();
        // CSV Formula injection protection: prepend apostrophe if starting with =, +, -, @, \t, \r
        if (/^[=+\-@\t\r]/.test(str)) {
            str = "'" + str;
        }
        return `"${str.replace(/"/g, '""')}"`;
    };

    const headerLine = headers.map(sanitize).join(',');
    const rowLines = rows.map(row => row.map(sanitize).join(','));
    const csvContent = [headerLine, ...rowLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Debounce helper for search inputs.
 */
function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

window.showToast = showToast;
window.confirmDialog = confirmDialog;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.escapeHtml = escapeHtml;
window.exportToCsv = exportToCsv;
window.debounce = debounce;
