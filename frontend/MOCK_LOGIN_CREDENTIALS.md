# Temporary Mock Login Credentials

## Overview
The application is currently configured to use **mock authentication** for testing purposes. No backend API is required for login.

## ✅ Login & QR Testing Configured

All login and QR code generation functionality has been set up with predefined worker accounts.

## Login Credentials

### 1. Worker Account (with pre-registered ID)
- **Email:** `worker@gmail.com`
- **Password:** `worker`
- **Worker ID Hash (Aadhaar):** `aadhar-hash-001`
- **Dashboard:** Automatically redirects to `/worker/dashboard`
- **Features:** View wages, BPL status, profile, generate QR code

### 2. Employer Account
- **Email:** `employer@gmail.com`
- **Password:** `employer`
- **Dashboard:** Automatically redirects to `/employer/dashboard`
- **Features:** Record wages, manage workers, bulk upload, reports

### 3. Government Official Account
- **Email:** `government@gmail.com`
- **Password:** `government`
- **Dashboard:** Automatically redirects to `/government/dashboard`
- **Features:** Analytics, sector analysis, geographic insights, anomaly detection, policy management

### 4. System Administrator Account
- **Email:** `admin@gmail.com`
- **Password:** `admin`
- **Dashboard:** Automatically redirects to `/admin/dashboard`
- **Features:** User management, organization management, system monitoring, audit logs

## Testing QR Code & UPI Payments

### Available Pre-Registered Workers
These worker accounts are pre-registered in the backend and can generate QR codes:

| Worker Hash | Name | Phone | Bank Account |
|---|---|---|---|
| `aadhar-hash-001` | Rajesh Kumar | 9876543210 | TRCNT-0001-001 |
| `aadhar-hash-002` | Priya Singh | 9876543211 | TRCNT-0002-002 |
| `aadhar-hash-003` | Amit Patel | 9876543212 | TRCNT-0003-003 |

### How to Test QR Code & Payment

1. **Login as Worker:** Use credentials above
2. **Go to QR Code Page:** Navigate to `/worker/qr-code`
3. **Generate QR Code:** Click "Generate QR Code"
4. **Copy Token:** Copy the token from the "Token (for testing)" box
5. **Simulate Payment:** Run in PowerShell (see backend README):

```powershell
$body = @{
    token = "YOUR_COPIED_TOKEN"
    senderName = "Payer Name"
    senderUPI = "payer@upi"
    amount = 500
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/upi/receive" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

## How to Use

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173`

4. Click "Login" or navigate to `/login`

5. Enter any of the credentials above

6. Upon successful login, you will be automatically redirected to the appropriate dashboard for your role

## Important Notes

- **Workers must be pre-registered** in the backend system before they can generate QR codes
- **idHash (Aadhaar Hash)** is the unique identifier for each worker and is assigned at registration
- In production, workers will be registered only after Aadhaar verification
- All data is stored in-memory; restart the backend to reset balances

## What Was Fixed

1. ✅ **AuthContext Response Handling** - Updated to handle both mock auth and real API response formats
2. ✅ **Login Form Field Names** - Changed from `email` to `identifier` to match schema
3. ✅ **Route Constants** - Fixed dashboard routes to include `/dashboard` suffix
4. ✅ **Home Page Redirect** - Added automatic redirect for authenticated users
5. ✅ **Login Validation** - Simplified password requirements for mock auth
6. ✅ **Demo Buttons Removed** - Cleaned up non-functional demo account buttons
7. ✅ **Error Handling** - Improved error messages and toast notifications

## Switching to Real Authentication

To switch from mock authentication to real backend API:

1. Open `src/services/authService.ts`
2. Change `USE_MOCK_AUTH` from `true` to `false`:
   ```typescript
   const USE_MOCK_AUTH = false; // Changed from true
   ```
3. Ensure your backend API is running
4. Update API endpoint in `.env` file:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

## Notes

- Mock authentication simulates a 500ms network delay
- User data is stored in localStorage with keys: `accessToken`, `refreshToken`, `user`, `mockUser`
- Token is a base64-encoded mock JWT
- All authentication checks work with the mock system
- No actual API calls are made when mock auth is enabled
- Toast notifications appear on successful login/logout
- Role-based routing is fully functional
