# Field Consistency Report

This document lists all field naming inconsistencies between frontend and backend that have been identified and fixed.

## Fixed Issues

### 1. ✅ Employer GST Field
**Issue:** Mismatch between frontend and backend field names for GST identification number.
- **Frontend:** Uses `gstin` (as per Indian standard terminology)
- **Backend Model (OLD):** Used `gstNumber`
- **Backend Routes:** Already validated `gstin`

**Fix Applied:**
- Updated `backend/models/Employer.js` to use `gstin` instead of `gstNumber`
- Now consistent across all layers

### 2. ✅ Worker/Employer Registration Fields
**Issue:** Field naming mismatch during registration causing validation failures.
- **Frontend form fields:** `aadhaar`, `businessName`
- **Backend expects:** `aadhaarNumber`, `companyName` or `organizationName`

**Fix Applied:**
- Updated `frontend/src/context/AuthContext.tsx` to map `aadhaar` → `aadhaarNumber`, `businessName` → `companyName`
- Updated `frontend/src/components/auth/RegisterForm.tsx` to explicitly map form data to API format

## Remaining Inconsistencies (Need Review)

### 3. ⚠️ Wage Record Worker Identification
**Frontend:**
- Form validator (`validators.ts`): Uses `workerID` (optional field)
- Type definition (`types/wage.ts`): `WageRecordForm` interface uses `workerID: string`
- Service (`wageService.ts`): Sends form data as-is to backend

**Backend:**
- Route validator (`validators/transaction.validator.js`): Expects `workerIdHash` (required, 64 chars)
- Controller (`wage.controller.js`): Destructures `workerIdHash` from request body
- Model (`WageRecord.js`): Stores both `workerId` (ObjectId) and `workerIdHash` (string)

**Potential Issue:** The frontend form collects `workerID` (likely a display ID like "W001"), but the backend expects `workerIdHash` (a 64-character hash). There needs to be a mapping layer that:
1. Takes the user-selected worker (by ID or search)
2. Retrieves their `idHash` from the worker profile
3. Sends `workerIdHash` to the backend

**Status:** Needs implementation review. Current RecordWage.tsx uses mock data and doesn't call the actual API yet.

### 4. ⚠️ ID Field Naming Convention
**Inconsistency across codebase:**
- Some places use `workerId` (camelCase with lowercase 'id')
- Some places use `workerID` (camelCase with uppercase 'ID')
- Some places use `worker_id` (snake_case)

**Examples:**
- Backend models: `workerId`, `employerId` (lowercase id)
- Frontend types: Mixed usage - `workerID` in forms, `workerIdHash` in WageRecord
- Frontend mock data: Uses `workerId` in some places, `workerID` in others

**Recommendation:** Standardize on:
- **Database fields & API responses:** `workerId`, `employerId` (lowercase id)
- **Frontend types:** Match backend - `workerId`, `employerId`
- **Hash fields:** `workerIdHash`, `employerIdHash` (compound word with lowercase id)

## Field Mapping Reference

### User Registration
| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `aadhaar` | `aadhaarNumber` | Mapped in AuthContext |
| `businessName` | `companyName` | Mapped in RegisterForm |
| `organizationName` | `companyName` | Alternative mapping |
| `pan` | `panNumber` | Direct pass-through |
| `gstin` | `gstin` | ✅ Now consistent |

### Wage Records
| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `workerID` | `workerIdHash` | ⚠️ Needs mapping implementation |
| `amount` | `amount` | Direct |
| `paymentMethod` | `paymentMethod` | Direct |
| `description` | `description` | Direct |
| `workPeriod` | `workPeriod` | Direct (nested object) |

### Employer Profile
| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `gstin` | `gstin` | ✅ Fixed |
| `companyName` | `companyName` | Direct |
| `contactPerson` | `contactPerson` | Direct |
| `address` | `address` | Direct (nested object) |

## Validation Schema Alignment

### GSTIN Format
Both frontend and backend now use the same regex pattern:
```regex
^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
```

### Aadhaar
- Frontend: 12 digits
- Backend: Stores only last 4 digits as `aadhaarLast4`

### Phone
- Frontend: 10 digits starting with 6-9
- Backend: String field, no built-in validation

## Recommendations

1. **Immediate Actions:**
   - ✅ Update Employer model to use `gstin` (DONE)
   - ⚠️ Implement worker ID to hash mapping in wage recording flow
   - Standardize all ID fields to lowercase `id` suffix

2. **Testing Priorities:**
   - Test employer registration with GSTIN field
   - Test worker registration with Aadhaar field
   - Test wage recording with proper workerIdHash mapping

3. **Future Improvements:**
   - Create a TypeScript type mapping utility for frontend-backend field conversions
   - Add automated tests to catch field name mismatches
   - Document field naming conventions in CONTRIBUTING.md

## Files Modified

1. `backend/models/Employer.js` - Changed `gstNumber` to `gstin`
2. `frontend/src/context/AuthContext.tsx` - Added field mappings for registration
3. `frontend/src/components/auth/RegisterForm.tsx` - Explicit field mapping in submit handlers
4. `backend/routes/employer.routes.js` - Fixed pagination imports (separate issue)
5. `backend/routes/admin.routes.js` - Fixed pagination imports (separate issue)
6. `backend/routes/blockchain.routes.js` - Fixed fabricService import (separate issue)
7. `backend/routes/government.routes.js` - Commented unimplemented routes (separate issue)

## Summary

- **Total Issues Identified:** 4
- **Issues Fixed:** 2 (gstin, registration fields)
- **Issues Pending:** 2 (wage workerID mapping, ID naming convention)

Last Updated: 2024 (Current Session)
