// ==========================================
// EMPLOYEE MANAGEMENT SYSTEM
// HTML + CSS + JAVASCRIPT
// ==========================================

// Get HTML elements
const employeeForm = document.getElementById("employeeForm");
const employeeTableBody = document.getElementById("employeeTableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");
const statusFilter = document.getElementById("statusFilter");

const totalEmployeesElement = document.getElementById("totalEmployees");
const totalDepartmentsElement = document.getElementById("totalDepartments");
const activeEmployeesElement = document.getElementById("activeEmployees");
const totalSalaryElement = document.getElementById("totalSalary");
const employeeCountElement = document.getElementById("employeeCount");

const formTitle = document.getElementById("formTitle");
const submitButtonText = document.getElementById("submitButtonText");
const cancelEditButton = document.getElementById("cancelEdit");
const toast = document.getElementById("toast");

// Storage key used by this application
const STORAGE_KEY = "employEaseEmployees";

// Track which employee is being edited
let editingEmployeeId = null;

// Notification timer
let toastTimer;


// ==========================================
// 1. LOAD EMPLOYEE DATA
// ==========================================

function loadEmployees() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        return Array.isArray(parsedData) ? parsedData : [];

    } catch (error) {
        console.error("Unable to load employee data:", error);

        showToast("Unable to load saved data.");
        return [];
    }
}

// Employee records are loaded when the page opens
let employees = loadEmployees();


// ==========================================
// 2. SAVE EMPLOYEE DATA
// ==========================================

function saveEmployees() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(employees)
        );

        return true;

    } catch (error) {
        console.error("Unable to save employee data:", error);

        showToast("Could not save data. Browser storage may be full.");
        return false;
    }
}


// ==========================================
// 3. SHOW NOTIFICATION
// ==========================================

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}


// ==========================================
// 4. FORMAT SALARY
// ==========================================

function formatSalary(salary) {
    return Number(salary).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}


// ==========================================
// 5. CREATE ELEMENTS SAFELY
// ==========================================

// Use textContent rather than inserting employee
// information directly as HTML.

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}


// ==========================================
// 6. UPDATE DASHBOARD STATISTICS
// ==========================================

function updateDashboard() {
    // Total number of employees
    totalEmployeesElement.textContent = employees.length;

    // Count unique departments
    const departments = new Set(
        employees.map(function (employee) {
            return employee.department;
        })
    );

    totalDepartmentsElement.textContent = departments.size;

    // Count active employees
    const activeCount = employees.filter(function (employee) {
        return employee.status === "Active";
    }).length;

    activeEmployeesElement.textContent = activeCount;

    // Calculate combined monthly salary
    const totalSalary = employees.reduce(function (total, employee) {
        return total + Number(employee.salary);
    }, 0);

    totalSalaryElement.textContent = formatSalary(totalSalary);
}


// ==========================================
// 7. DISPLAY EMPLOYEES
// ==========================================

function renderEmployees() {
    // Clear the previous table contents
    employeeTableBody.replaceChildren();

    // Read search and filter values
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedDepartment = departmentFilter.value;
    const selectedStatus = statusFilter.value;

    // Apply search and filters
    const filteredEmployees = employees.filter(function (employee) {
        const matchesSearch = [
            employee.employeeId,
            employee.fullName,
            employee.email,
            employee.department,
            employee.position
        ].some(function (value) {
            return String(value).toLowerCase().includes(searchText);
        });

        const matchesDepartment =
            !selectedDepartment ||
            employee.department === selectedDepartment;

        const matchesStatus =
            !selectedStatus ||
            employee.status === selectedStatus;

        return (
            matchesSearch &&
            matchesDepartment &&
            matchesStatus
        );
    });

    // Update employee count
    employeeCountElement.textContent =
        filteredEmployees.length +
        (filteredEmployees.length === 1 ? " employee" : " employees");

    // Show empty state if no matching employees exist
    emptyState.hidden = filteredEmployees.length > 0;

    // Build table rows
    filteredEmployees.forEach(function (employee) {
        const row = document.createElement("tr");

        // Employee information
        const employeeCell = document.createElement("td");
        const employeeInfo = createElement("div", "employee-info");

        const initials = employee.fullName
            .trim()
            .split(/\s+/)
            .map(function (part) {
                return part.charAt(0);
            })
            .join("")
            .slice(0, 2)
            .toUpperCase();

        const avatar = createElement(
            "div",
            "employee-avatar",
            initials
        );

        const details = document.createElement("div");

        const name = createElement(
            "div",
            "employee-name",
            employee.fullName
        );

        const email = createElement(
            "span",
            "employee-email",
            employee.email
        );

        details.append(name, email);
        employeeInfo.append(avatar, details);
        employeeCell.append(employeeInfo);

        // Department
        const departmentCell = document.createElement("td");

        departmentCell.append(
            createElement(
                "span",
                "department-tag",
                employee.department
            )
        );

        // Position
        const positionCell = createElement(
            "td",
            "",
            employee.position
        );

        // Salary
        const salaryCell = createElement(
            "td",
            "",
            formatSalary(employee.salary)
        );

        // Status
        const statusCell = document.createElement("td");

        let statusClass = "status-inactive";

        if (employee.status === "Active") {
            statusClass = "status-active";
        } else if (employee.status === "On Leave") {
            statusClass = "status-on-leave";
        }

        statusCell.append(
            createElement(
                "span",
                "status-tag " + statusClass,
                employee.status
            )
        );

        // Action buttons
        const actionsCell = document.createElement("td");
        const actions = createElement("div", "action-buttons");

        const editButton = createElement(
            "button",
            "action-btn",
            "Edit"
        );

        editButton.type = "button";
        editButton.addEventListener("click", function () {
            editEmployee(employee.employeeId);
        });

        const deleteButton = createElement(
            "button",
            "action-btn delete",
            "Delete"
        );

        deleteButton.type = "button";
        deleteButton.addEventListener("click", function () {
            deleteEmployee(employee.employeeId);
        });

        actions.append(editButton, deleteButton);
        actionsCell.append(actions);

        // Add all cells to the row
        row.append(
            employeeCell,
            departmentCell,
            positionCell,
            salaryCell,
            statusCell,
            actionsCell
        );

        // Add row to the table
        employeeTableBody.append(row);
    });

    // Refresh dashboard numbers
    updateDashboard();
}


// ==========================================
// 8. ADD OR UPDATE AN EMPLOYEE
// ==========================================

employeeForm.addEventListener("submit", function (event) {
    // Prevent the page from refreshing
    event.preventDefault();

    // Collect form information
    const employeeId = document
        .getElementById("employeeId")
        .value.trim();

    const fullName = document
        .getElementById("fullName")
        .value.trim();

    const email = document
        .getElementById("email")
        .value.trim();

    const phone = document
        .getElementById("phone")
        .value.trim();

    const department = document
        .getElementById("department")
        .value;

    const position = document
        .getElementById("position")
        .value.trim();

    const salary = Number(
        document.getElementById("salary").value
    );

    const status = document
        .getElementById("status")
        .value;

    // Check salary
    if (!Number.isFinite(salary) || salary < 0) {
        showToast("Please enter a valid salary.");
        return;
    }

    // Check for duplicate employee ID
    const duplicateId = employees.some(function (employee) {
        return (
            employee.employeeId.toLowerCase() ===
                employeeId.toLowerCase() &&
            employee.employeeId !== editingEmployeeId
        );
    });

    if (duplicateId) {
        showToast("This employee ID already exists.");
        return;
    }

    // Check for duplicate email
    const duplicateEmail = employees.some(function (employee) {
        return (
            employee.email.toLowerCase() === email.toLowerCase() &&
            employee.employeeId !== editingEmployeeId
        );
    });

    if (duplicateEmail) {
        showToast("This email address is already registered.");
        return;
    }

    // Create the employee record
    const employeeData = {
        employeeId: employeeId,
        fullName: fullName,
        email: email,
        phone: phone,
        department: department,
        position: position,
        salary: salary,
        status: status
    };

    // Update existing employee or add a new employee
    if (editingEmployeeId !== null) {
        const employeeIndex = employees.findIndex(function (employee) {
            return employee.employeeId === editingEmployeeId;
        });

        if (employeeIndex === -1) {
            showToast("Employee record not found.");
            resetForm();
            return;
        }

        employees[employeeIndex] = employeeData;

        if (!saveEmployees()) {
            return;
        }

        showToast("Employee updated successfully!");

    } else {
        employees.push(employeeData);

        if (!saveEmployees()) {
            employees.pop();
            return;
        }

        showToast("Employee added successfully!");
    }

    // Reset form and refresh table
    resetForm();
    renderEmployees();
});


// ==========================================
// 9. EDIT AN EMPLOYEE
// ==========================================

function editEmployee(employeeId) {
    const employee = employees.find(function (item) {
        return item.employeeId === employeeId;
    });

    if (!employee) {
        showToast("Employee not found.");
        return;
    }

    // Remember which record is being edited
    editingEmployeeId = employeeId;

    // Fill form with existing information
    document.getElementById("employeeId").value =
        employee.employeeId;

    document.getElementById("fullName").value =
        employee.fullName;

    document.getElementById("email").value =
        employee.email;

    document.getElementById("phone").value =
        employee.phone;

    document.getElementById("department").value =
        employee.department;

    document.getElementById("position").value =
        employee.position;

    document.getElementById("salary").value =
        employee.salary;

    document.getElementById("status").value =
        employee.status;

    // Update form labels
    formTitle.textContent = "Edit Employee";
    submitButtonText.textContent = "Save Changes";

    cancelEditButton.hidden = false;

    // Bring the form into view
    document.getElementById("employee-form").scrollIntoView({
        behavior: "smooth"
    });
}


// ==========================================
// 10. DELETE AN EMPLOYEE
// ==========================================

function deleteEmployee(employeeId) {
    const employee = employees.find(function (item) {
        return item.employeeId === employeeId;
    });

    if (!employee) {
        showToast("Employee not found.");
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete " +
        employee.fullName +
        "?"
    );

    if (!confirmed) {
        return;
    }

    const previousEmployees = [...employees];

    employees = employees.filter(function (item) {
        return item.employeeId !== employeeId;
    });

    if (!saveEmployees()) {
        employees = previousEmployees;
        return;
    }

    // If the deleted record was being edited, reset the form
    if (editingEmployeeId === employeeId) {
        resetForm();
    }

    renderEmployees();
    showToast("Employee deleted successfully.");
}


// ==========================================
// 11. RESET THE FORM
// ==========================================

function resetForm() {
    employeeForm.reset();

    editingEmployeeId = null;

    formTitle.textContent = "Add New Employee";
    submitButtonText.textContent = "＋ Add Employee";

    cancelEditButton.hidden = true;
}

// Cancel editing
cancelEditButton.addEventListener("click", function () {
    resetForm();
    showToast("Editing cancelled.");
});

// Clear form also exits edit mode
employeeForm.addEventListener("reset", function () {
    setTimeout(function () {
        editingEmployeeId = null;

        formTitle.textContent = "Add New Employee";
        submitButtonText.textContent = "＋ Add Employee";

        cancelEditButton.hidden = true;
    }, 0);
});


// ==========================================
// 12. SEARCH AND FILTER EMPLOYEES
// ==========================================

searchInput.addEventListener("input", renderEmployees);

departmentFilter.addEventListener("change", renderEmployees);

statusFilter.addEventListener("change", renderEmployees);


// ==========================================
// 13. INITIALIZE THE APPLICATION
// ==========================================

// Display saved employees when the page opens
renderEmployees();