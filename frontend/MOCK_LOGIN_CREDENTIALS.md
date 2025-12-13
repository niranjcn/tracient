# Temporary Mock Login Credentials

## Overview
The application is currently configured to use **mock authentication** for testing purposes. No backend API is required.

## ✅ Login Successfully Configured

All login functionality has been fixed and tested. Use these credentials to access the system:

## Login Credentials

### 1. Worker Account
- **Email:** `worker@gmail.com`
- **Password:** `worker`
- **Dashboard:** Automatically redirects to `/worker/dashboard`
- **Features:** View wages, BPL status, profile, QR code

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

## How to Use

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the application URL (typically `http://localhost:5173`)

3. You will see the landing page. Click "Login" or navigate to `/login`

4. Enter any of the credentials above

5. Upon successful login, you will be automatically redirected to the appropriate dashboard for your role

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
