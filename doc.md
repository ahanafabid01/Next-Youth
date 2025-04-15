# Multi-Role Authentication System

This project implements a **three-type login system** for different user roles:

- **Admin** (single hardcoded admin)
- **Employee** (users looking for jobs)
- **Employer** (users hiring employees)

Each user type will be directed to a different dashboard after login.

---

## 🔐 User Roles and Access

### 1. Admin
- Only one admin is allowed in the system.
- Login credentials are hardcoded:
  - **Email:** `admin@example.com`
  - **Password:** `admin123`
- On successful login:
  - Redirect to `admin_dashboard.html`
- No registration option for Admin.
- Other users cannot access the admin page.

---

### 2. Employee
- Registered through the option: **"Are you looking for a job?"**
- On successful login:
  - Redirect to `employee_dashboard.html`

---

### 3. Employer
- Registered through the option: **"Are you hiring people?"**
- On successful login:
  - Redirect to `employer_dashboard.html`

---

## 🧾 Registration Flow

During registration:
- UI presents two radio buttons or dropdown options:
  - [ ] Are you looking for a job? → sets `user_type = employee`
  - [ ] Are you hiring people? → sets `user_type = employer`
- `user_type` is saved in the database with the user.

---

## 🚪 Login Flow

1. **Check for Admin:**
   - If email and password match the hardcoded admin credentials, redirect to Admin Dashboard.

2. **Check for Registered Users:**
   - Fetch user by email.
   - Match password.
   - Redirect based on stored `user_type`:
     - `employee` → Employee Dashboard
     - `employer` → Employer Dashboard

---

## 🛠️ Backend Requirements

- Add a `user_type` field to the user model (if using a database or ORM):
  - Enum/String options: `admin`, `employee`, `employer`
- During registration, save selected `user_type` with the user.
- On login, use `user_type` to determine correct redirection.

---

## ✅ Security Notes

- Only admin with hardcoded credentials can access admin dashboard.
- Employees and Employers cannot access each other’s dashboards.
- Ensure all dashboards are protected routes and cannot be accessed via direct URL.

---

## 📁 To-Do (for Developer)

- [ ] Implement registration UI with role selection.
- [ ] Add login logic to check user type.
- [ ] Create separate dashboard views for each role.
- [ ] Implement backend login validation and routing.
- [ ] Restrict admin access using hardcoded credentials.

---