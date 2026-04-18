---
name: backend-api-development
description: Design and build robust REST APIs for HR systems. Create well-structured endpoints for employee management, attendance, payroll, and leave systems with proper error handling, validation, and documentation.
license: Complete terms in LICENSE.txt
---

# Backend & API Development Skill

This skill focuses on building production-grade REST APIs for HR system features. Design scalable endpoints, implement proper request/response handling, and maintain clean, maintainable code.

## Core API Principles

### API Structure
- **Base URL**: `/api/v1` for versioning
- **Resource-based**: `/api/v1/employees`, `/api/v1/attendance`, `/api/v1/payroll`
- **HTTPS Only**: All endpoints must use HTTPS in production
- **JSON Format**: All requests/responses in JSON except file downloads

### HTTP Methods
- **GET**: Retrieve resources (no side effects)
- **POST**: Create new resources
- **PUT/PATCH**: Update existing resources
- **DELETE**: Remove resources
- **OPTIONS**: For CORS preflight

## Endpoint Design Patterns

### Employee Management
```
GET    /api/v1/employees                 # List all employees
GET    /api/v1/employees/:id             # Get employee details
POST   /api/v1/employees                 # Create new employee
PATCH  /api/v1/employees/:id             # Update employee
DELETE /api/v1/employees/:id             # Remove employee
GET    /api/v1/employees/:id/attendance  # Get employee attendance
```

### Attendance System
```
GET    /api/v1/attendance                # List attendance records
POST   /api/v1/attendance/check-in       # Employee check-in
POST   /api/v1/attendance/check-out      # Employee check-out
GET    /api/v1/attendance/:id            # Get specific record
```

### Payroll Management
```
GET    /api/v1/payroll/salary-slips      # List salary slips
GET    /api/v1/payroll/salary-slips/:id  # Get specific slip
POST   /api/v1/payroll/process           # Process payroll
GET    /api/v1/payroll/reports           # Generate payroll reports
```

### Leave Management
```
GET    /api/v1/leave/requests            # List leave requests
POST   /api/v1/leave/requests            # Create leave request
PATCH  /api/v1/leave/requests/:id        # Approve/reject leave
GET    /api/v1/leave/balance/:employeeId # Get leave balance
```

## Request/Response Standards

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message",
  "timestamp": "2024-04-19T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "User-friendly error message",
    "details": {...}
  },
  "timestamp": "2024-04-19T10:30:00Z"
}
```

### Error Codes
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing/invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation error
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error
- `503`: Service Unavailable

## Query Parameters

### Pagination
```
GET /api/v1/employees?page=1&limit=20&sort=name&order=asc
```
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Ascending (asc) or Descending (desc)

### Filtering
```
GET /api/v1/employees?department=Engineering&status=active
GET /api/v1/attendance?date_from=2024-01-01&date_to=2024-04-19
```

### Search
```
GET /api/v1/employees?search=john
```

## Input Validation

### Validation Rules
- Validate all input on server-side (never trust client)
- Sanitize inputs to prevent injection attacks
- Check data types, lengths, and formats
- Return specific validation errors

### Example Validation Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": {
      "email": "Invalid email format",
      "employeeId": "Employee ID already exists",
      "salary": "Salary must be greater than 0"
    }
  }
}
```

## Authentication & Authorization

### Authentication Headers
```
Authorization: Bearer {jwt_token}
X-API-Key: {optional_api_key_for_integrations}
```

### Role-Based Access Control (RBAC)
- **Super Admin**: Full system access
- **Admin**: Department-level access
- **Employee**: Own data access only
- **Manager**: Team data access

### Protected Endpoints
- Verify JWT token in Authorization header
- Check user role/permissions
- Verify resource ownership (employee viewing own records)
- Log access attempts for audit

## Rate Limiting

### Limits by Role
- **Public**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Admin**: 500 requests/minute
- **Service Integrations**: Custom limits

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1234567890
```

## Documentation Standards

### Endpoint Documentation Template
```
### GET /api/v1/employees/:id

Get employee details

**Parameters:**
- id (path, required): Employee ID

**Authentication:** Required (JWT)

**Permissions:** Employee (own data), Manager, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "emp_123",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering"
  }
}
```

**Errors:**
- 401: Invalid/missing token
- 404: Employee not found
```

## Common Patterns

### Async Operations
- For long-running operations (payroll processing), return job ID
- Provide status endpoint to check progress
- Send webhook/notification when complete

### Bulk Operations
```
POST /api/v1/employees/bulk-import
POST /api/v1/attendance/bulk-export
```

### Batch Processing
```
POST /api/v1/payroll/process-batch
{
  "employeeIds": [...],
  "month": "2024-04",
  "retro": false
}
```

## Performance Best Practices

- Use database indexes for common queries
- Implement caching (Redis) for frequently accessed data
- Use pagination for large result sets
- Implement query optimization
- Monitor API response times
- Set reasonable timeout limits

## Security Checklist

- [ ] All endpoints use HTTPS
- [ ] API keys/tokens properly validated
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention in responses
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Logging and monitoring in place
- [ ] Sensitive data not logged
- [ ] Error messages don't leak system details
