# Ration Number Field - Collection Guide

## Overview
The `ration_no` field has been added to the Tracient application to link family members together. This document explains which collections use this field and how it's implemented.

---

## Collections with `ration_no` Field

### 1. **User Collection** (PRIMARY - Used for Login)
**Location:** `backend/models/User.js`

**Purpose:** The User collection is the PRIMARY collection used for authentication and login. All users (workers, employers, government officials, admins) are stored here.

**Field Details:**
```javascript
ration_no: {
  type: Number,
  sparse: true,
  index: true,
  min: 100000000000,
  max: 999999999999,
  validate: {
    validator: function(v) {
      if (v === null || v === undefined) return true;
      return /^\d{12}$/.test(v.toString());
    },
    message: 'Ration number must be exactly 12 digits'
  }
}
```

**Key Points:**
- ✅ **Used for Login:** Yes - User collection handles all authentication
- ✅ **Indexed:** Yes - for efficient family member queries
- ✅ **Optional:** Yes - users can register without a ration number
- ✅ **Unique per Family:** No - multiple users share the same ration_no (family members)
- ✅ **Migration Added:** Yes - existing users will have null values

**Usage:**
- Links family members together
- Used to find all users in the same family
- Referenced when displaying family information

---

### 2. **Family Collection** (NEW)
**Location:** `backend/models/Family.js`

**Purpose:** Stores comprehensive family demographic and welfare information.

**Field Details:**
```javascript
ration_no: {
  type: Number,
  required: true,
  unique: true,
  index: true,
  min: 100000000000,
  max: 999999999999
}
```

**Key Points:**
- ✅ **Unique:** Yes - one family record per ration number
- ✅ **Required:** Yes - cannot create family without ration number
- ✅ **Relationship:** One-to-Many with User (one family, many users)

---

### 3. **Worker Collection** (SECONDARY)
**Location:** `backend/models/Worker.js`

**Status:** 
- ⚠️ **Does NOT currently have ration_no field**
- ℹ️ Worker records are linked to User via `userId` reference
- ✅ Ration number can be accessed through the User relationship

**Current Structure:**
```javascript
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  unique: true
}
```

**To access ration_no for a worker:**
```javascript
const worker = await Worker.findOne({...}).populate('userId');
const rationNo = worker.userId.ration_no;
```

**Migration Note:** 
- No migration needed - use User collection relationship
- If direct access is needed frequently, consider adding ration_no field to Worker model

---

### 4. **Employer Collection** (SECONDARY)
**Location:** `backend/models/Employer.js`

**Status:** 
- ⚠️ **Does NOT currently have ration_no field**
- ℹ️ Employer records are linked to User via `userId` reference
- ✅ Ration number can be accessed through the User relationship

**Current Structure:**
```javascript
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  unique: true
}
```

**To access ration_no for an employer:**
```javascript
const employer = await Employer.findOne({...}).populate('userId');
const rationNo = employer.userId.ration_no;
```

---

### 5. **Other Collections** (NO ration_no needed)

#### GovOfficial, Admin Collections
- ❌ No ration_no field needed
- Government officials and admins typically don't register as family members
- They only VIEW family information, not participate in families

#### WageRecord Collection
- ❌ No ration_no field needed
- Wage records link to workers, not directly to families
- Family information accessed through worker → user → ration_no

#### UPITransaction, QRToken Collections
- ❌ No ration_no field needed
- These are transaction records, not user profiles

---

## Login Process and Collections

### Authentication Flow:
1. **Login:** User enters email/password
2. **Lookup:** System searches `User` collection
3. **Validation:** Password verified against User.password
4. **Token Generation:** JWT token created with user.id and user.role
5. **Access Control:** Role-based permissions applied

### Collections Accessed During Login:
```
Login Request
    ↓
User Collection (PRIMARY)
    ↓
[Based on role, additional data may be fetched:]
    ├─→ Worker Collection (if role = 'worker')
    ├─→ Employer Collection (if role = 'employer')
    ├─→ GovOfficial Collection (if role = 'government')
    └─→ Admin Collection (if role = 'admin')
```

---

## Family Member Linking

### How Family Members Are Linked:

```javascript
// All users with the same ration_no are family members
const familyMembers = await User.find({ 
  ration_no: 123456789012 
});

// Get family details
const family = await Family.findOne({ 
  ration_no: 123456789012 
});

// Display family members in Family page
{
  family: {
    ration_no: 123456789012,
    family_size: 4,
    // ... other family data
  },
  members: [
    { name: 'John Doe', email: 'john@example.com', role: 'worker' },
    { name: 'Jane Doe', email: 'jane@example.com', role: 'worker' },
    { name: 'ABC Company', email: 'abc@company.com', role: 'employer' }
  ]
}
```

### Family Page Display Logic:

1. **User navigates to /worker/family or /employer/family**
2. **System fetches user's ration_no from User collection**
3. **If ration_no exists:**
   - Fetch Family record by ration_no
   - Fetch all Users with same ration_no (family members)
   - Display comprehensive family information
4. **If ration_no is null:**
   - Show "Survey Available" prompt
   - User can fill survey to create family record
   - Survey submission creates Family record and updates User.ration_no

---

## Migration Steps

### To Run Migration:

```bash
cd backend
node migrations.js
```

### What the Migration Does:

1. ✅ Adds `ration_no` field (null) to existing users
2. ✅ Creates sparse index on User.ration_no
3. ✅ Validates existing ration numbers (if any)
4. ✅ Links users to families (shows family groups)
5. ✅ Generates statistics report

### After Migration:

- Existing users will have `ration_no: null`
- They can fill it during profile update or family survey
- New users can enter ration_no during registration

---

## Summary Table

| Collection | Has ration_no? | Required? | Indexed? | Used for Login? | Notes |
|------------|---------------|-----------|----------|-----------------|-------|
| **User** | ✅ Yes | ❌ No | ✅ Yes | ✅ **PRIMARY** | Main authentication collection |
| **Family** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Family demographic data |
| **Worker** | ❌ No* | - | - | ❌ No | Access via User.userId |
| **Employer** | ❌ No* | - | - | ❌ No | Access via User.userId |
| **GovOfficial** | ❌ No | - | - | ❌ No | Not family members |
| **Admin** | ❌ No | - | - | ❌ No | Not family members |
| **WageRecord** | ❌ No | - | - | ❌ No | Not needed |

*Note: Worker and Employer can access ration_no through User relationship

---

## API Endpoints Using ration_no

### Family Endpoints:
- `GET /api/family/my-family` - Get user's family by ration_no
- `GET /api/family/survey-status` - Check if family survey exists
- `POST /api/family/survey` - Submit family survey (creates Family record)
- `GET /api/family/ration/:ration_no` - Get family by ration number
- `GET /api/family/ration/:ration_no/members` - Get all family members

### Registration Endpoints:
- `POST /api/auth/register` - Now accepts optional ration_no field

---

## Frontend Integration

### Registration Forms:
- ✅ Worker registration: Optional ration_no field added
- ✅ Employer registration: Optional ration_no field added
- ✅ Validation: 12-digit number validation

### Family Pages:
- ✅ Worker family page: Shows family info and members
- ✅ Employer family page: Shows family info and members
- ✅ Survey form: 5-step wizard to create family record
- ✅ Family members display: Shows all users with same ration_no

---

## Best Practices

### For Developers:
1. Always query User collection for ration_no (it's the source of truth)
2. Use population to access ration_no from Worker/Employer: `.populate('userId')`
3. Check if ration_no exists before querying Family collection
4. Handle null ration_no gracefully in UI

### For Users:
1. Ration number is optional during registration
2. Can be added later through family survey
3. Once family survey is completed by one member, all members can see it
4. Multiple family members can share the same ration number

---

## Questions & Answers

**Q: Can I add ration_no to Worker/Employer models?**
A: You can, but it's not necessary. The current design uses User as the single source of truth, which reduces data duplication and maintains consistency.

**Q: What if a user changes their ration number?**
A: Currently, ration numbers should be immutable once set. If changes are needed, it should be handled through admin interface with proper validation.

**Q: Can government users have ration numbers?**
A: The field exists in User collection but is typically null for government/admin users. The family feature is designed for workers and employers.

**Q: How do I find all families in the system?**
A: Query the Family collection: `Family.find({})` or use the API endpoint `/api/family/all`
