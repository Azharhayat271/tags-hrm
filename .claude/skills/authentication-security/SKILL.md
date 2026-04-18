---
name: authentication-security
description: Implement secure authentication and role-based access control for HR systems. Handle user login, JWT tokens, permission management, multi-factor authentication, and sensitive data protection.
license: Complete terms in LICENSE.txt
---

# Authentication & Security Skill

This skill covers comprehensive security implementation for HR systems, including authentication mechanisms, authorization strategies, data protection, and security best practices.

## Authentication Methods

### JWT (JSON Web Tokens)
Best for modern web/mobile applications with stateless authentication

- Token Expiration: Access 15-30 min, Refresh 7-30 days
- Structure: Header.Payload.Signature
- Never store sensitive data in token

### OAuth 2.0
Best for third-party integrations and Single Sign-On (SSO)
- Slack integration for HR notifications
- Google workspace integration
- Microsoft 365 integration

## Role-Based Access Control (RBAC)

### User Roles
- Super Admin: Full system access, manage admins
- Admin: Department-level access, employee management
- Manager: Team access, leave approvals for reports
- Employee: Own data access only
- HR Officer: Employee data, payroll processing

## Login Flow

### Step 1: Credential Validation
- Email exists in system
- Password correct
- Account not locked/suspended

### Step 2: Token Generation
- Return access token (short-lived JWT)
- Return refresh token (long-lived, secure HttpOnly cookie)
- Return user profile data

## Multi-Factor Authentication (MFA)

### Options
1. SMS OTP: 6-digit code via SMS, expires 5 minutes
2. TOTP: Authenticator app generates 6-digit code every 30 seconds
3. Email OTP: 6-digit code via email, expires 10 minutes

## Password Security

### Requirements
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, special characters
- Not containing username/email
- Changed every 90 days
- Last 5 passwords not reused

### Hashing
- Algorithm: bcrypt with salt rounds = 12
- Never: Store plain text passwords

## Session Management

### Timeout
- Active session: 30 minutes
- Idle timeout: 15 minutes
- Concurrent limit: 2 sessions per user

## Data Encryption

### At Rest
- Encrypt salary/payroll: AES-256
- Encrypt personal identifiable info
- Database encryption: Enabled
- Backups: Encrypted

### In Transit
- HTTPS/TLS 1.2 or higher
- All endpoints HTTPS only
- Never log sensitive data

## API Security

### API Keys
- Rotate every 90 days
- Store hashed in database
- Use HTTP header: X-API-Key
- Log all usage

### Rate Limiting
- Brute force: 5 attempts/minute per IP
- API requests: 100 per minute per user
- Login: 5 per minute per email

## Security Checklist

### Authentication
- Passwords hashed with bcrypt
- JWT tokens have expiration
- Refresh tokens secure
- Login attempts rate limited
- Failed attempts logged

### Authorization
- RBAC implemented
- Resource-level permissions
- Admin actions logged
- Least privilege applied

### Data Protection
- Sensitive data encrypted at rest
- HTTPS everywhere
- Database encryption enabled
- Backups encrypted

### API Security
- Rate limiting enabled
- CORS configured
- Input validation
- API keys secured
