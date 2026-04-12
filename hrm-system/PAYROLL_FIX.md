# Payroll Upload Fix

## Problem
When trying to upload a salary slip, the API was throwing an error:
```
TypeError: Request.formData: Could not parse content as FormData
```

## Root Cause
The `useApiCall` hook was automatically:
1. Setting `Content-Type: application/json` header for ALL requests
2. Stringifying the body with `JSON.stringify()`

This caused FormData to be converted to a string instead of being sent as multipart/form-data.

## Solution

### 1. Updated `useApiCall` Hook
**File**: `hrm-system/lib/hooks/useApiCall.ts`

Changes:
- Detect if body is FormData using `instanceof FormData`
- Only set `Content-Type: application/json` for non-FormData requests
- Only stringify body for non-FormData requests
- Let browser automatically set correct `Content-Type` with boundary for FormData

```typescript
// Check if body is FormData
const isFormData = options.body instanceof FormData;

// Build headers - don't set Content-Type for FormData
const headers: Record<string, string> = {
  Authorization: `Bearer ${session.access_token}`,
  ...options.headers,
};

if (!isFormData) {
  headers["Content-Type"] = "application/json";
}

// Send body as-is for FormData, stringify for JSON
body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
```

### 2. Standardized API Response Format
**File**: `hrm-system/app/api/payroll/upload-slip/route.ts`

Changed all error responses to use `message` instead of `error` for consistency:
- `{ error: "..." }` → `{ message: "..." }`
- Success response: `{ data: { message: "..." } }`

This matches the expected format in the `useApiCall` hook.

## Testing
After this fix:
1. Admin can upload PDF files via the form
2. FormData is correctly parsed by the API
3. Files are uploaded to Supabase storage
4. Database records are created successfully

## Why This Works
When sending FormData, the browser needs to:
1. Set `Content-Type: multipart/form-data`
2. Add a boundary parameter (e.g., `boundary=----WebKitFormBoundary...`)
3. Encode the data in multipart format

If we manually set `Content-Type: application/json`, the browser can't do this, and the server receives malformed data.

By letting the browser handle FormData automatically, everything works correctly.
