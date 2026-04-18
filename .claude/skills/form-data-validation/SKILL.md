---
name: form-data-validation
description: Build robust form validation and data integrity systems for HR applications.
license: Complete terms in LICENSE.txt
---

# Form & Data Validation Skill

This skill covers comprehensive validation strategies for HR forms and data input.

## Validation Architecture

Dual-Layer Validation:
1. Client-Side: Immediate feedback, reduces server load
2. Server-Side: Security, data integrity

Never trust client validation. Always validate on server.

## Common HR Forms

### Employee Registration
- Full Name: Required, 2-255 chars
- Email: Required, valid format, unique
- Phone: Required, valid format
- Date of Birth: Required, age > 18
- Employee ID: Required, unique
- Department: Required
- Salary: Required, numeric, >= 0

### Leave Request
- Leave Type: Required [casual, sick, annual]
- From Date: Required, not past
- To Date: Required, >= From Date
- Reason: Required, 10-1000 chars

### Attendance
- Employee ID: Required, exists
- Check-in Time: Auto-filled
- Check-out Time: >= Check-in
- Notes: Optional, max 500 chars

## Validation Rules

### Text Fields
- Required: Check if empty
- Length: Min/max
- Pattern: Regex format
- Sanitization: Remove special chars
- Uniqueness: Check DB

### Numeric Fields
- Type: Verify number
- Range: Min/max values
- Decimal: Precision
- Format: Currency

### Date Fields
- Format: YYYY-MM-DD
- Range: Not future
- Logic: From < To

## Error Response

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": {
      "email": "Email invalid",
      "salary": "Salary > 0"
    }
  }
}

## Input Sanitization

HTML/Script Prevention:
- Use DOMPurify
- Escape output

SQL Injection Prevention:
- Use parameterized queries
- Never concatenate input

XSS Prevention:
- Escape output
- Sanitize inputs
- CSP headers

## Business Logic

### Leave
- Check balance
- Verify no overlaps
- Confirm type valid
- Check probation
- Verify year dates

### Attendance
- Prevent duplicate
- Check not elsewhere
- Check blocked dates
- Prevent backdated

### Payroll
- Verify required fields
- Calculate gross
- Verify deductions <= gross
- Calculate tax
- Verify net pay

## Testing Cases

- Valid data passes
- Empty handled
- Invalid rejected
- Boundary values
- Special chars sanitized
- SQL injection blocked
- HTML injection blocked
- Files validated
- Business rules enforced

## Rate Limiting

- Email check: 1/2 sec per user
- Form: 5/min per IP
- File: 10/hour per user
