# TRACIENT Website Development - Comprehensive Specification

## 📋 Project Overview

**Project Name:** TRACIENT (TRAnsparent Citizen Income ENablement Tracker)  
**Description:** A blockchain-based income traceability system for equitable welfare distribution in India's informal sector  
**Frontend Stack:** React 18+ with Tailwind CSS  
**Purpose:** Build a complete web application with role-based dashboards for Workers, Employers, Government Officials, and Administrators

---

## 🎯 System Architecture Context

### Backend Infrastructure (Already Implemented)
- **Blockchain:** Hyperledger Fabric 2.5.14 (Operational)
- **Smart Contract:** TRACIENT Chaincode v1.0 (Go)
- **Channel:** mychannel (2 organizations: Org1MSP, Org2MSP)
- **Database:** PostgreSQL (To be integrated)
- **API Backend:** Node.js/Express (To be developed)

### Blockchain Data Structure
```go
type WageRecord struct {
    WorkerIDHash   string  `json:"workerIdHash"`    // SHA256(Aadhaar)
    EmployerIDHash string  `json:"employerIdHash"`  // SHA256(PAN)
    Amount         float64 `json:"amount"`          // Wage amount in INR
    Currency       string  `json:"currency"`        // "INR"
    JobType        string  `json:"jobType"`         // construction/agriculture/retail/etc
    Timestamp      string  `json:"timestamp"`       // ISO 8601 format
    PolicyVersion  string  `json:"policyVersion"`   // Government policy version (e.g., "2025-Q4")
}
```

### Available Chaincode Functions
1. `RecordWage(wageID, workerIDHash, employerIDHash, amount, currency, jobType, timestamp, policyVersion)` - Record new wage
2. `ReadWage(wageID)` - Retrieve single wage record
3. `WageExists(wageID)` - Check if wage exists
4. `QueryWageHistory(wageID)` - Get transaction history

---

## 👥 User Roles & Permissions

### 1. **Worker Role**
**Primary Users:** Daily wage workers, informal sector employees  
**Organization:** WorkerOrg / Self-enrolled  
**Authentication:** Aadhaar-based (hashed), Mobile OTP

**Capabilities:**
- ✅ View personal wage history (all payments received)
- ✅ Check BPL/APL (Below Poverty Line / Above Poverty Line) status
- ✅ View total income statistics (daily/monthly/yearly aggregates)
- ✅ Generate personal QR code for receiving payments (informal work)
- ✅ Verify wage authenticity (blockchain proof)
- ✅ Receive welfare eligibility notifications
- ✅ Update personal profile (limited fields)
- ✅ Download income certificate/proof
- ❌ Cannot modify any wage records
- ❌ Cannot view other workers' data

**Dashboard Requirements:**
- Income overview card (total earnings, last 30 days)
- BPL/APL status indicator with government threshold
- Recent wage transactions table (sortable, filterable)
- Income trend chart (line/bar graph)
- QR code generator for peer-to-peer payments
- Notification center for policy updates
- Profile section with Aadhaar verification status

---

### 2. **Employer Role**
**Primary Users:** Companies, contractors, business owners  
**Organization:** EmployerOrg  
**Authentication:** PAN-based (hashed), Email/Password + 2FA

**Capabilities:**
- ✅ Record wages for their workers (create WageRecord transactions)
- ✅ View their own payment history
- ✅ Manage worker roster (add/remove workers)
- ✅ Bulk wage upload (CSV/Excel import)
- ✅ View workers under their employment
- ✅ Generate payment receipts
- ✅ Download tax compliance reports
- ✅ View pending/completed payments dashboard
- ❌ Cannot modify past wage records (immutability)
- ❌ Cannot view wages paid by other employers
- ❌ Cannot delete transaction records

**Dashboard Requirements:**
- Payment summary cards (total paid, worker count, avg wage)
- Quick wage recording form (single worker)
- Bulk upload interface with validation preview
- Worker management table (search, filter, pagination)
- Payment history with export options (PDF/Excel)
- Monthly/quarterly expense charts
- Compliance status indicators
- Tax deduction calculator (TDS integration)

---

### 3. **Government Official Role**
**Primary Users:** Welfare department officers, policy makers, auditors  
**Organization:** GovOrg  
**Authentication:** Government Employee ID, Email + Multi-Factor Authentication

**Capabilities:**
- ✅ View aggregated, anonymized income analytics
- ✅ Monitor sector-wise wage distribution (construction, agriculture, etc.)
- ✅ Access real-time BPL/APL statistics dashboard
- ✅ Audit transaction logs (read-only access)
- ✅ Generate compliance and welfare distribution reports
- ✅ Update policy rules (income thresholds for BPL/APL)
- ✅ View anomaly detection flags (AI-powered)
- ✅ Approve/reject welfare scheme applications
- ✅ Geographic distribution heatmaps (state/district-wise)
- ❌ Cannot modify blockchain records
- ❌ Cannot access personally identifiable information (PII)

**Dashboard Requirements:**
- Executive summary with key metrics (total workers, total wages disbursed)
- Real-time BPL/APL ratio charts (pie/donut charts)
- Sector-wise income distribution (bar charts)
- Geographic heatmap for state/district analysis
- Anomaly detection alerts panel
- Policy configuration interface (threshold settings)
- Audit log viewer with advanced filters
- Welfare scheme management module
- Report generation tool (custom date ranges, filters)

---

### 4. **System Administrator Role**
**Primary Users:** Technical team, DevOps  
**Organization:** GovOrg (Admin privileges)  
**Authentication:** Secure admin credentials + MFA

**Capabilities:**
- ✅ Full ledger access (read-only for audit)
- ✅ Configure network policies
- ✅ Register new organizations to blockchain
- ✅ Manage user accounts (create, disable, reset)
- ✅ Deploy and update AI models
- ✅ Monitor system health (blockchain nodes, APIs)
- ✅ View application logs and errors
- ✅ Configure role-based access control (RBAC)
- ✅ Backup and restore operations
- ❌ Cannot manipulate blockchain data directly

**Dashboard Requirements:**
- System health monitoring (uptime, node status)
- User management interface (CRUD operations)
- Organization registry (add/remove orgs)
- AI model deployment console
- Log viewer with search/filter
- Network topology visualization
- Backup/restore scheduler
- Security audit logs

---

## 🎨 Frontend Technical Specifications

### Technology Stack
- **Framework:** React 18.2+ with TypeScript
- **Styling:** Tailwind CSS 3.4+
- **State Management:** React Context API + Zustand (for complex state)
- **Routing:** React Router v6
- **HTTP Client:** Axios with interceptors
- **Charts:** Recharts or Chart.js
- **Forms:** React Hook Form with Zod validation
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Heroicons or Lucide React
- **Date Handling:** date-fns
- **QR Code:** react-qr-code
- **Notifications:** React Hot Toast
- **File Upload:** react-dropzone

### Folder Structure
```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   └── index.html
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Chart.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Notification.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── OTPVerification.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── worker/
│   │   │   ├── WageHistory.tsx
│   │   │   ├── IncomeStats.tsx
│   │   │   ├── BPLStatus.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── WelfareNotifications.tsx
│   │   ├── employer/
│   │   │   ├── RecordWageForm.tsx
│   │   │   ├── BulkUpload.tsx
│   │   │   ├── WorkerManagement.tsx
│   │   │   ├── PaymentHistory.tsx
│   │   │   └── TaxReports.tsx
│   │   ├── government/
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── SectorDistribution.tsx
│   │   │   ├── GeographicHeatmap.tsx
│   │   │   ├── AnomalyAlerts.tsx
│   │   │   ├── PolicyConfig.tsx
│   │   │   └── AuditLogs.tsx
│   │   └── admin/
│   │       ├── UserManagement.tsx
│   │       ├── SystemHealth.tsx
│   │       ├── NetworkTopology.tsx
│   │       └── AIModelConfig.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── worker/
│   │   │   └── WorkerDashboard.tsx
│   │   ├── employer/
│   │   │   └── EmployerDashboard.tsx
│   │   ├── government/
│   │   │   └── GovernmentDashboard.tsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx
│   │   ├── Home.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── api.ts (Axios instance with interceptors)
│   │   ├── authService.ts
│   │   ├── wageService.ts
│   │   ├── userService.ts
│   │   └── analyticsService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWageData.ts
│   │   ├── useNotification.ts
│   │   └── useDebounce.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── store/
│   │   ├── authStore.ts (Zustand)
│   │   └── dashboardStore.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── wage.ts
│   │   └── api.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   ├── index.tsx
│   └── routes.tsx
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🔐 Authentication & Authorization Flow

### Registration Process

#### Worker Registration
1. User provides Aadhaar number (12 digits)
2. System generates SHA256 hash of Aadhaar
3. OTP sent to registered mobile number
4. User verifies OTP
5. Backend enrolls user with Fabric CA (WorkerOrgMSP)
6. Certificate issued with attributes:
   - `role=worker`
   - `workerID=WORK_<hash>`
7. JWT token issued with claims (userID, role, orgMSP)

#### Employer Registration
1. User provides PAN, GSTIN, business details
2. System generates SHA256 hash of PAN
3. Email verification link sent
4. Admin approval required (optional)
5. Backend enrolls with Fabric CA (EmployerOrgMSP)
6. Certificate issued with attributes:
   - `role=employer`
   - `employerID=EMP_<hash>`
7. JWT token with refresh token issued

#### Government Official Registration
1. Manual registration by System Admin
2. Government employee ID verification
3. Role assignment (officer/auditor/policymaker)
4. MFA setup required (Google Authenticator/SMS)
5. Backend enrollment (GovOrgMSP)
6. Session-based auth with short expiry

### Login Flow
```
┌─────────────┐
│ Login Page  │
└──────┬──────┘
       │
       ├─ Aadhaar/PAN/Email + Password
       │
       ▼
┌──────────────────┐
│ Backend API      │
│ /api/auth/login  │
└────────┬─────────┘
         │
         ├─ Validate credentials
         ├─ Check user role
         ├─ Verify certificate status
         │
         ▼
┌─────────────────────────┐
│ Issue JWT Token         │
│ {                       │
│   userID,               │
│   role,                 │
│   orgMSP,               │
│   expiresIn: "24h"      │
│ }                       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────┐
│ Store in localStorage│
│ + HTTP-only cookie   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Redirect to         │
│ Role-based Dashboard│
└─────────────────────┘
```

### Protected Routes
```typescript
// ProtectedRoute.tsx
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage in routes.tsx
<Route path="/worker/*" element={
  <ProtectedRoute allowedRoles={['worker']}>
    <WorkerDashboard />
  </ProtectedRoute>
} />
```

---

## 📊 Dashboard Component Specifications

### 1. Worker Dashboard Components

#### a) Income Overview Card
```typescript
interface IncomeStats {
  totalIncome: number;
  last30Days: number;
  averageDailyWage: number;
  transactionCount: number;
}

// Component Features:
- Display total income (₹ formatted with commas)
- Last 30 days earnings with percentage change
- Average daily wage calculation
- Transaction count badge
- Animated counters for visual appeal
```

#### b) BPL/APL Status Indicator
```typescript
interface BPLStatus {
  classification: 'BPL' | 'APL';
  annualIncome: number;
  threshold: number;
  lastUpdated: string;
  eligibleSchemes: string[];
}

// Visual Design:
- Large badge with color coding (Red: BPL, Green: APL)
- Progress bar showing income vs threshold
- List of eligible welfare schemes
- Last updated timestamp
```

#### c) Wage History Table
```typescript
interface WageTransaction {
  wageID: string;
  employerName: string;
  amount: number;
  jobType: string;
  timestamp: string;
  verificationStatus: 'verified' | 'pending';
  blockchainHash: string;
}

// Table Features:
- Sortable columns (date, amount, employer)
- Search/filter by date range, job type
- Pagination (10/25/50 rows per page)
- Export to PDF/Excel
- Blockchain verification icon
- Click to view transaction details modal
```

#### d) Income Trend Chart
```typescript
// Chart Type: Line chart (Recharts)
// Data: Monthly income for last 12 months
// Features:
- Tooltip showing exact values
- Legend for multiple job types
- Responsive to screen size
- Download chart as image
```

#### e) QR Code Generator
```typescript
interface WorkerQRCode {
  workerIDHash: string;
  name: string;
  qrData: string; // JSON payload
}

// Functionality:
- Generate unique QR code for worker
- Display worker name + hashed ID
- Download QR as PNG
- Share via WhatsApp/Email
- Used by employers to quickly add worker for payment
```

---

### 2. Employer Dashboard Components

#### a) Quick Wage Recording Form
```typescript
interface WageRecordForm {
  workerID: string; // Autocomplete from roster
  amount: number;
  jobType: 'construction' | 'agriculture' | 'retail' | 'manufacturing' | 'other';
  date: Date;
  notes?: string;
}

// Form Features:
- Worker search with autocomplete (by name/ID)
- Amount input with INR symbol
- Job type dropdown
- Date picker (default: today)
- Optional notes field
- QR code scanner to auto-fill worker ID
- Real-time validation (Zod schema)
- Submit with loading state
- Success/error toast notification
```

#### b) Bulk Upload Interface
```typescript
// File Upload Flow:
1. Download CSV template button
2. react-dropzone for drag-drop CSV/Excel
3. File validation (headers, data types)
4. Preview table with row validation
   - Green checkmarks for valid rows
   - Red errors for invalid rows
5. "Upload Valid Rows" button
6. Progress bar during blockchain submission
7. Results summary (X success, Y failed)
8. Error report download

// CSV Format:
workerID,amount,jobType,date
WORK123,500,construction,2025-01-15
WORK456,750,agriculture,2025-01-15
```

#### c) Worker Management Table
```typescript
interface Worker {
  workerID: string;
  name: string;
  aadhaarHash: string;
  joinDate: string;
  totalPaid: number;
  lastPaymentDate: string;
  status: 'active' | 'inactive';
}

// Table Actions:
- Add new worker (modal form)
- Edit worker details
- Mark as inactive (soft delete)
- View payment history per worker
- Send payment reminder notification
```

#### d) Payment Summary Cards
```typescript
// Four cards in a grid:
1. Total Amount Paid (this month)
2. Active Workers Count
3. Average Wage per Worker
4. Pending Transactions

// Each card:
- Large number display
- Icon representing metric
- Percentage change from last month
- Trend indicator (↑↓)
```

#### e) Expense Analytics Charts
```typescript
// Chart 1: Monthly Expense Trend (Bar chart)
- Last 12 months total payments
- Color-coded by job type

// Chart 2: Job Type Distribution (Pie chart)
- Percentage breakdown by job type
- Interactive hover for details

// Chart 3: Worker-wise Expense (Horizontal bar)
- Top 10 workers by total payment
```

---

### 3. Government Dashboard Components

#### a) Executive Summary Panel
```typescript
interface GovMetrics {
  totalWorkers: number;
  totalWagesDisbursed: number;
  activeEmployers: number;
  bplPercentage: number;
  avgMonthlyIncome: number;
}

// 5 metric cards:
- Total Registered Workers (with growth rate)
- Total Wages Disbursed (₹ in Crores)
- Active Employers
- BPL Population %
- Average Monthly Income
```

#### b) BPL/APL Distribution
```typescript
// Donut Chart showing:
- BPL count and percentage (red)
- APL count and percentage (green)
// Side panel:
- Current threshold value
- Last policy update date
- "Update Threshold" button
```

#### c) Sector-wise Analytics
```typescript
interface SectorData {
  sector: string;
  workerCount: number;
  avgWage: number;
  totalDisbursed: number;
}

// Stacked Bar Chart:
- X-axis: Sectors (construction, agriculture, etc.)
- Y-axis: Total disbursed amount
- Stacked by BPL/APL
// Data Table below chart
```

#### d) Geographic Heatmap
```typescript
// Map of India with state-wise color intensity
// Features:
- Color gradient based on worker count
- Click state for district-level view
- Tooltip showing state statistics
- Filter by sector/BPL status
// Library: react-simple-maps or Google Maps API
```

#### e) Anomaly Detection Alerts
```typescript
interface Anomaly {
  id: string;
  type: 'duplicate_payment' | 'unusual_amount' | 'frequency_spike';
  severity: 'low' | 'medium' | 'high';
  workerID: string;
  employerID: string;
  description: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
}

// Alert Panel:
- Badge with count of unresolved anomalies
- List of alerts sorted by severity
- Click to view details + blockchain proof
- Mark as investigated/resolved
- AI confidence score
```

#### f) Policy Configuration Interface
```typescript
interface PolicyConfig {
  bplThreshold: number; // Annual income in INR
  aplThreshold: number;
  effectiveDate: Date;
  version: string; // e.g., "2025-Q4"
}

// Form Features:
- Input fields for thresholds
- Date picker for effective date
- Version auto-generation
- Preview impact (X workers will shift BPL→APL)
- Confirmation dialog before submitting
- Audit log of policy changes
```

#### g) Audit Log Viewer
```typescript
interface AuditLog {
  timestamp: string;
  userID: string;
  role: string;
  action: string; // RecordWage, UpdatePolicy, etc.
  txID: string; // Blockchain transaction ID
  status: 'success' | 'failed';
  details: object;
}

// Features:
- Date range filter
- Role filter (worker/employer/gov)
- Action type filter
- Search by userID/txID
- Export filtered logs to CSV
- Click to view full transaction details
```

---

### 4. Admin Dashboard Components

#### a) System Health Monitor
```typescript
interface SystemHealth {
  blockchainNodes: NodeStatus[];
  apiStatus: 'healthy' | 'degraded' | 'down';
  databaseStatus: 'connected' | 'disconnected';
  uptime: number; // seconds
  requestsPerMinute: number;
}

// Visual Display:
- Node status cards (peer0-org1, orderer, etc.)
- Uptime counter (99.9%)
- Real-time request chart (line graph)
- Alert system for downtime
```

#### b) User Management Interface
```typescript
interface User {
  userID: string;
  name: string;
  role: string;
  organization: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin: string;
}

// CRUD Operations:
- Create new user (modal with role selection)
- Edit user details
- Suspend/activate account
- Reset password
- View login history
- Bulk actions (suspend multiple users)
```

#### c) Organization Registry
```typescript
interface Organization {
  orgID: string;
  orgName: string;
  mspID: string;
  peerCount: number;
  userCount: number;
  status: 'active' | 'inactive';
}

// Features:
- List all organizations
- Add new org (triggers Fabric CA setup)
- Remove org (requires confirmation)
- View org certificate details
- Generate new crypto materials
```

---

## 🎨 UI/UX Design Guidelines

### Color Palette (Tailwind CSS)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',  // Main primary
          600: '#0284c7',
          700: '#0369a1',
        },
        // Accent
        accent: {
          500: '#f59e0b',  // Amber
          600: '#d97706',
        },
        // Status
        success: '#10b981',  // Green
        warning: '#f59e0b',  // Amber
        error: '#ef4444',    // Red
        info: '#3b82f6',     // Blue
        // BPL/APL
        bpl: '#dc2626',      // Red-600
        apl: '#059669',      // Green-600
      }
    }
  }
}
```

### Typography
```css
/* globals.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  h1 { @apply text-4xl font-bold text-gray-900; }
  h2 { @apply text-3xl font-semibold text-gray-800; }
  h3 { @apply text-2xl font-semibold text-gray-700; }
  h4 { @apply text-xl font-medium text-gray-700; }
  p  { @apply text-base text-gray-600; }
}
```

### Component Styling Standards

#### Card Component
```tsx
<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
  {children}
</div>
```

#### Button Variants
```tsx
// Primary Button
<button className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 active:bg-primary-700 transition-colors">
  Submit
</button>

// Secondary Button
<button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
  Cancel
</button>

// Danger Button
<button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
  Delete
</button>
```

#### Input Fields
```tsx
<input 
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  type="text"
/>
```

### Responsive Design Breakpoints
- Mobile: `< 640px` - Single column layout
- Tablet: `640px - 1024px` - 2-column grid
- Desktop: `> 1024px` - 3-4 column grid

### Accessibility Requirements
- ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Esc)
- Color contrast ratio ≥ 4.5:1 for text
- Screen reader compatible
- Form error messages with clear descriptions
- Focus indicators on all inputs

---

## 🔌 API Integration Specifications

### Base Configuration
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor (Add JWT token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Handle errors)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Endpoints (Backend to implement)

#### Authentication
```typescript
POST /api/auth/register
Body: { role, aadhaar?, pan?, email, password, phone }
Response: { success, message, userID }

POST /api/auth/login
Body: { identifier (aadhaar/pan/email), password }
Response: { success, token, user: { userID, role, orgMSP } }

POST /api/auth/verify-otp
Body: { userID, otp }
Response: { success, token }

POST /api/auth/logout
Response: { success }

POST /api/auth/refresh-token
Response: { success, token }
```

#### Wage Operations
```typescript
POST /api/wages/record
Body: { workerIDHash, amount, jobType, timestamp }
Response: { success, wageID, txID, blockNumber }

GET /api/wages/:wageID
Response: { wage: WageRecord, blockchainProof }

GET /api/wages/worker/:workerIDHash
Query: ?page=1&limit=10&startDate&endDate&jobType
Response: { wages: WageRecord[], total, page, pages }

GET /api/wages/employer/:employerIDHash
Query: ?page=1&limit=10
Response: { wages: WageRecord[], total }

POST /api/wages/bulk-upload
Body: FormData (CSV file)
Response: { success: number, failed: number, errors: [] }

GET /api/wages/verify/:wageID
Response: { valid: boolean, blockchainHash, timestamp }
```

#### Worker Services
```typescript
GET /api/worker/stats/:workerIDHash
Response: { totalIncome, last30Days, avgDailyWage, transactionCount }

GET /api/worker/bpl-status/:workerIDHash
Response: { classification, annualIncome, threshold, eligibleSchemes }

POST /api/worker/generate-qr/:workerIDHash
Response: { qrData: string, expiresAt }
```

#### Employer Services
```typescript
GET /api/employer/roster/:employerIDHash
Response: { workers: Worker[] }

POST /api/employer/add-worker
Body: { employerIDHash, workerName, workerAadhaar }
Response: { success, workerID }

GET /api/employer/payment-summary/:employerIDHash
Query: ?month=1&year=2025
Response: { totalPaid, workerCount, avgWage, breakdown }
```

#### Government Analytics
```typescript
GET /api/gov/analytics/summary
Response: { totalWorkers, totalDisbursed, activeEmployers, bplPercentage }

GET /api/gov/analytics/sector-distribution
Query: ?startDate&endDate
Response: { sectors: SectorData[] }

GET /api/gov/analytics/geographic
Query: ?state&district
Response: { geoData: [] }

GET /api/gov/anomalies
Query: ?status=new&severity
Response: { anomalies: Anomaly[] }

PUT /api/gov/policy/update
Body: { bplThreshold, aplThreshold, effectiveDate }
Response: { success, newVersion, affectedWorkers }

GET /api/gov/audit-logs
Query: ?startDate&endDate&role&action
Response: { logs: AuditLog[], total }
```

#### Admin Services
```typescript
GET /api/admin/system-health
Response: { nodes, apiStatus, dbStatus, uptime, rpm }

GET /api/admin/users
Query: ?role&status&page
Response: { users: User[], total }

POST /api/admin/users/create
Body: { name, email, role, organization }
Response: { success, userID, enrollmentSecret }

PUT /api/admin/users/:userID/status
Body: { status: 'active' | 'suspended' }
Response: { success }

GET /api/admin/organizations
Response: { orgs: Organization[] }
```

---

## 🔒 Security Best Practices

### Frontend Security Measures
1. **Input Validation:**
   - Sanitize all user inputs (XSS prevention)
   - Use Zod for schema validation
   - Escape HTML in user-generated content

2. **Authentication:**
   - Store JWT in HTTP-only cookies + localStorage
   - Implement token refresh mechanism
   - Auto-logout on token expiry
   - Session timeout after 15 min inactivity

3. **Authorization:**
   - Client-side role checks (UX only)
   - Server enforces all permissions
   - Hide UI elements based on role

4. **Data Protection:**
   - Never display raw Aadhaar/PAN
   - Show only hashed or masked values
   - HTTPS only in production

5. **CSRF Protection:**
   - CSRF tokens for state-changing operations
   - SameSite cookie attribute

6. **Content Security Policy:**
   - Restrict script sources
   - No inline scripts
   - Use nonces for inline styles

---

## 📱 Responsive Design Requirements

### Mobile (< 640px)
- Hamburger menu for navigation
- Stacked card layouts
- Simplified charts (mobile-optimized)
- Bottom navigation bar for quick actions
- Swipeable tables
- Collapsible filters

### Tablet (640px - 1024px)
- Sidebar navigation (collapsible)
- 2-column grid for cards
- Horizontal scrollable tables
- Touch-friendly buttons (min 44px height)

### Desktop (> 1024px)
- Fixed sidebar navigation
- 3-4 column dashboard grid
- Full-featured tables with sorting
- Hover interactions
- Keyboard shortcuts

---

## 🧪 Testing Requirements

### Unit Tests (Jest + React Testing Library)
```typescript
// Example test for WageRecordForm
describe('WageRecordForm', () => {
  it('validates amount is positive', async () => {
    render(<WageRecordForm />);
    const amountInput = screen.getByLabelText(/amount/i);
    
    await userEvent.type(amountInput, '-100');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
  });
});
```

### Integration Tests
- Test full authentication flow
- Test wage recording → blockchain confirmation
- Test role-based dashboard rendering

### E2E Tests (Playwright/Cypress)
```typescript
// Example: Worker login → view wage history
test('worker can view wage history', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="aadhaar"]', '123456789012');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/worker/dashboard');
  await expect(page.locator('.wage-history-table')).toBeVisible();
});
```

---

## 🚀 Deployment Configuration

### Environment Variables
```env
# .env.example
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BLOCKCHAIN_EXPLORER_URL=http://localhost:8080
REACT_APP_ENV=development
REACT_APP_ENABLE_ANALYTICS=false
```

### Build Optimization
```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

### Docker Setup
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📚 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Setup React + Tailwind project
- [ ] Create folder structure
- [ ] Setup routing (React Router)
- [ ] Implement base layout components (Header, Sidebar, Footer)
- [ ] Create common UI components (Button, Card, Input, Modal)
- [ ] Setup Axios API client with interceptors
- [ ] Implement AuthContext and useAuth hook
- [ ] Create login/register pages

### Phase 2: Worker Module (Week 3)
- [ ] Worker dashboard layout
- [ ] Income stats API integration
- [ ] Wage history table with pagination
- [ ] BPL/APL status display
- [ ] Income trend chart (Recharts)
- [ ] QR code generator
- [ ] Profile page

### Phase 3: Employer Module (Week 4)
- [ ] Employer dashboard layout
- [ ] Quick wage recording form
- [ ] Worker management table (CRUD)
- [ ] Bulk CSV upload with validation
- [ ] Payment history with filters
- [ ] Expense analytics charts
- [ ] Tax report generation

### Phase 4: Government Module (Week 5-6)
- [ ] Government dashboard layout
- [ ] Executive summary cards
- [ ] BPL/APL distribution charts
- [ ] Sector-wise analytics
- [ ] Geographic heatmap
- [ ] Anomaly alerts panel
- [ ] Policy configuration interface
- [ ] Audit log viewer

### Phase 5: Admin Module (Week 7)
- [ ] Admin dashboard
- [ ] System health monitoring
- [ ] User management (CRUD)
- [ ] Organization registry
- [ ] Network topology visualization
- [ ] Log viewer

### Phase 6: Testing & Polish (Week 8)
- [ ] Write unit tests (80% coverage)
- [ ] E2E tests for critical flows
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization (Lighthouse score > 90)
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

### Phase 7: Deployment (Week 9)
- [ ] Docker containerization
- [ ] Environment configuration
- [ ] CI/CD pipeline setup
- [ ] Production build optimization
- [ ] Documentation (README, API docs)

---

## 📖 Additional Features (Future Enhancements)

### Phase 8+
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Dark mode toggle
- [ ] Offline mode with service workers
- [ ] Push notifications for wage credits
- [ ] Biometric authentication (fingerprint)
- [ ] WhatsApp integration for notifications
- [ ] Voice-based navigation (accessibility)
- [ ] Blockchain explorer integration
- [ ] Real-time WebSocket updates
- [ ] Advanced data export (PDF reports with charts)
- [ ] Calendar view for wage payments
- [ ] Wage dispute resolution module
- [ ] Employer rating system
- [ ] Worker skill tagging system

---

## 🎯 Success Metrics

### Performance Targets
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.5s
- Bundle size < 500KB (gzipped)

### User Experience
- Task completion rate > 95%
- Error rate < 2%
- Average session duration > 5 min
- Mobile usage > 60%

### Technical
- Test coverage > 80%
- Lighthouse score > 90
- Accessibility score (WCAG AA) 100%
- Zero critical security vulnerabilities

---

## 🤝 Team Collaboration Guidelines

### Git Workflow
```bash
# Feature branch naming
feature/worker-dashboard
feature/employer-bulk-upload
fix/login-validation-error
chore/update-dependencies

# Commit message format
feat: add wage history table with pagination
fix: resolve QR code generation error
docs: update API integration guide
style: format code with prettier
```

### Code Review Checklist
- [ ] Code follows ESLint rules
- [ ] TypeScript types defined
- [ ] Component has proper prop types
- [ ] Accessibility attributes added
- [ ] Responsive design tested
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Unit tests written

### Documentation
- Inline comments for complex logic
- JSDoc comments for utility functions
- README for each major module
- API integration examples

---

## 📞 Support & Resources

### Blockchain Integration Help
- Hyperledger Fabric Documentation: https://hyperledger-fabric.readthedocs.io/
- Fabric Gateway API: https://github.com/hyperledger/fabric-gateway
- Existing chaincode location: `e:\Major-Project\blockchain\chaincode\tracient\chaincode.go`

### UI/UX Resources
- Tailwind CSS Docs: https://tailwindcss.com/docs
- shadcn/ui Components: https://ui.shadcn.com/
- Heroicons: https://heroicons.com/
- React Charts Library: https://recharts.org/

### Development Tools
- React DevTools
- Redux DevTools (if using Redux)
- Axios DevTools
- VS Code Extensions: ESLint, Prettier, Tailwind IntelliSense

---

## ✅ Final Checklist

Before deploying to production:
- [ ] All authentication flows tested
- [ ] Role-based access control verified
- [ ] Blockchain integration confirmed (record + query wages)
- [ ] All charts rendering correctly
- [ ] Forms validated with proper error messages
- [ ] Mobile responsive on iOS/Android
- [ ] Accessibility tested with screen reader
- [ ] Security audit completed (OWASP Top 10)
- [ ] Performance optimization done (lazy loading, code splitting)
- [ ] Error boundaries implemented
- [ ] Analytics tracking configured
- [ ] Backup/restore procedures documented
- [ ] User training materials prepared

---

## 🎓 Technical Handover Notes

### Key Design Decisions
1. **Why Tailwind CSS?** Utility-first approach for rapid prototyping, smaller bundle size than Bootstrap, easy customization
2. **Why Zustand over Redux?** Simpler API, less boilerplate, TypeScript support, smaller bundle (1KB vs 12KB)
3. **Why shadcn/ui?** Unstyled primitives allow full customization, accessible by default, copy-paste components (no npm bloat)
4. **Why Recharts?** React-native, composable chart components, responsive, smaller than Chart.js

### Potential Challenges
1. **Blockchain transaction latency:** Implement optimistic UI updates with rollback on failure
2. **Large data tables:** Implement virtual scrolling (react-window) for 1000+ rows
3. **Real-time updates:** Use WebSockets or Server-Sent Events for live dashboard updates
4. **Mobile performance:** Code splitting per route, lazy load charts, optimize images

### Migration Path from Current State
Since blockchain is already operational:
1. Start with authentication module (Worker login only)
2. Integrate worker wage history (test with WAGE001, WAGE002)
3. Add employer wage recording
4. Build government analytics last
5. Admin module for internal use

---

**This specification is comprehensive and production-ready. Begin implementation with Phase 1 and iterate based on feedback from blockchain integration testing.**

**Good luck building TRACIENT! 🚀**
