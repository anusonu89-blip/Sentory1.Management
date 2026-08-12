SENTORY1 - CUSTOM LOGIN / USER MANAGEMENT
==============================================

Features added:
1. Create New Account from the Login page.
2. New self-created accounts are Employee accounts by default.
3. Change Password from the Login page.
4. Director/Admin can open User Management after login.
5. Director/Admin can add, edit, delete users and assign Director/Admin or Employee.
6. Users are stored in browser Local Storage.
7. Existing demo accounts remain available on first run.

Demo:
Director/Admin: admin / admin123
Employee: emp1 / emp123
Employee: emp2 / emp456

IMPORTANT SECURITY NOTE:
This is still an offline HTML + Local Storage application. Passwords are stored locally in the browser, not on a secure server. For a production/online financial system, use a backend database, password hashing (bcrypt/Argon2), sessions and server-side authorization.

HOW TO RUN:
Extract the ZIP and double-click index.html.
