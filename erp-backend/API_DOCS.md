# ERP API Documentation

Base URL: `https://yourdomain.com/api/v1`

All requests require `Authorization: Bearer {token}` unless noted.

---

## Authentication

### POST /auth/login *(no auth required)*
```json
{ "username": "admin", "password": "admin123" }
```
Response: `{ "token": "...", "user": {...} }`

### POST /auth/logout
Revokes current token.

### GET /auth/me
Returns authenticated user profile.

### POST /auth/change-password
```json
{ "current_password": "...", "new_password": "...", "new_password_confirmation": "..." }
```

---

## Generic CRUD Pattern

Most resources follow this pattern:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/{resource} | List (paginated, filterable) |
| POST | /v1/{resource} | Create |
| GET | /v1/{resource}/{id} | Show |
| PUT | /v1/{resource}/{id} | Update |
| DELETE | /v1/{resource}/{id} | Delete |

### Query Parameters
- `page` – Page number (default: 1)
- `per_page` – Items per page (default: 25, max: 100)
- `sort` – Sort field (default: created_at)
- `order` – asc/desc (default: desc)
- `search` – Full-text search
- `branch_id` – Filter by branch
- `status` – Filter by status

---

## Accounting Module

### Chart of Accounts
`GET|POST /v1/accounts` – List/Create accounts
`GET|PUT|DELETE /v1/accounts/{id}` – Show/Update/Delete
`GET /v1/accounts/tree` – Hierarchical tree view
`GET /v1/accounts/{id}/ledger?from=&to=` – Account ledger

### Vouchers
`GET|POST /v1/vouchers` – List/Create
`GET|PUT /v1/vouchers/{id}` – Show/Update
`POST /v1/vouchers/{id}/approve` – Approve voucher
`POST /v1/vouchers/{id}/reject` – Reject voucher

### Reports
`GET /v1/reports/trial-balance?from=&to=&branch_id=`
`GET /v1/reports/profit-loss?from=&to=&branch_id=`
`GET /v1/reports/balance-sheet?as_of=&branch_id=`
`GET /v1/reports/general-ledger?from=&to=&account_id=`
`GET /v1/reports/cash-book?from=&to=`
`GET /v1/reports/bank-book?from=&to=`

---

## Sales Module

### Customers
`GET|POST /v1/customers`
`GET|PUT|DELETE /v1/customers/{id}`
`GET /v1/customers/{id}/ledger`

### Sales Invoices
`GET|POST /v1/sales-invoices`
`GET|PUT /v1/sales-invoices/{id}`
`POST /v1/sales-invoices/{id}/approve`

### Sales Returns
`GET|POST /v1/sales-returns`
`GET|PUT /v1/sales-returns/{id}`

---

## Purchase Module

### Suppliers
`GET|POST /v1/suppliers`
`GET|PUT|DELETE /v1/suppliers/{id}`
`GET /v1/suppliers/{id}/ledger`

### Purchases
`GET|POST /v1/purchases`
`GET|PUT /v1/purchases/{id}`

### Purchase Returns
`GET|POST /v1/purchase-returns`
`GET|PUT /v1/purchase-returns/{id}`

---

## Inventory Module

### Items
`GET|POST /v1/items`
`GET|PUT|DELETE /v1/items/{id}`
`GET /v1/items/{id}/stock` – Current stock by warehouse
`GET /v1/items/{id}/ledger` – Stock ledger

### Categories
`GET|POST /v1/item-categories`
`GET|PUT|DELETE /v1/item-categories/{id}`

### Units
`GET|POST /v1/units`
`GET|PUT|DELETE /v1/units/{id}`

### Warehouses
`GET|POST /v1/warehouses`
`GET|PUT|DELETE /v1/warehouses/{id}`
`GET /v1/warehouses/{id}/stock` – All stock in warehouse

### Stock Transfers
`POST /v1/stock-transfers` – Transfer between warehouses
`GET /v1/stock-transfers`

### Stock Adjustments
`POST /v1/stock-adjustments`
`GET /v1/stock-adjustments`

### Stock Reports
`GET /v1/reports/stock-summary`
`GET /v1/reports/stock-ledger?item_id=&warehouse_id=&from=&to=`
`GET /v1/reports/low-stock`

---

## Manufacturing Module

### Bill of Materials (BOM)
`GET|POST /v1/bom`
`GET|PUT|DELETE /v1/bom/{id}`

### Production Entries
`GET|POST /v1/production`
`GET|PUT /v1/production/{id}`
`POST /v1/production/{id}/complete`

### Manufacturing Reports
`GET /v1/reports/production-summary?from=&to=`
`GET /v1/reports/material-consumption?from=&to=`

---

## HRM Module

### Employees
`GET|POST /v1/employees`
`GET|PUT|DELETE /v1/employees/{id}`

### Departments
`GET|POST /v1/departments`
`GET|PUT|DELETE /v1/departments/{id}`

### Designations
`GET|POST /v1/designations`
`GET|PUT|DELETE /v1/designations/{id}`

### Shifts
`GET|POST /v1/shifts`
`GET|PUT|DELETE /v1/shifts/{id}`

### Attendance
`GET|POST /v1/attendance`
`PUT /v1/attendance/{id}`
`POST /v1/attendance/bulk-import` – CSV import
`GET /v1/attendance/report?month=&year=`

### Leave
`GET|POST /v1/leave-requests`
`PUT /v1/leave-requests/{id}`
`POST /v1/leave-requests/{id}/approve`
`POST /v1/leave-requests/{id}/reject`

### Leave Types
`GET|POST /v1/leave-types`
`GET|PUT|DELETE /v1/leave-types/{id}`

---

## Payroll Module

### Salary Structures
`GET|POST /v1/salary-structures`
`GET|PUT /v1/salary-structures/{id}`

### Payroll Processing
`POST /v1/payroll/process` – Process monthly payroll
```json
{ "month": 3, "year": 2026, "employee_ids": ["..."] }
```
`GET /v1/payroll?month=&year=` – List payroll records
`GET /v1/payroll/{id}` – Payslip detail
`POST /v1/payroll/{id}/approve` – Approve & post to accounting

---

## Admin / Settings

### Company Settings
`GET|PUT /v1/settings/company`

### Branches
`GET|POST /v1/branches`
`GET|PUT|DELETE /v1/branches/{id}`

### Financial Years
`GET|POST /v1/financial-years`
`GET|PUT /v1/financial-years/{id}`
`POST /v1/financial-years/{id}/activate`

### Users
`GET|POST /v1/users`
`GET|PUT|DELETE /v1/users/{id}`

### Roles & Permissions
`GET|POST /v1/roles`
`GET|PUT|DELETE /v1/roles/{id}`
`GET /v1/permissions` – List all module permissions

### Audit Log
`GET /v1/audit-log?module=&action=&user_id=&from=&to=`

### Number Sequences
`GET|PUT /v1/number-sequences`

### Module Settings
`GET|PUT /v1/module-settings`

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total": 150,
    "last_page": 6
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "field": ["Error message"] }
}
```

## Error Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |
