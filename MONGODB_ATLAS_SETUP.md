# MongoDB Atlas Integration Guide

## ✅ MongoDB Atlas Integration Complete!

Your backend is now configured to use MongoDB Atlas (cloud database) instead of in-memory storage.

## 🔧 Setup Steps

### Step 1: Get Your MongoDB Atlas Connection String

1. **Go to** [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Sign up / Log in** to MongoDB Atlas
3. **Create a Free Cluster:**
   - Click "Create" → Choose "Shared" (Free tier)
   - Select cloud provider (AWS recommended) and region closest to you
   - Click "Create Cluster" (takes 3-5 minutes)

4. **Create Database User:**
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Username: `tracient_admin` (or your choice)
   - Password: Generate a strong password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Allow Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your current IP address
   - Click "Confirm"

6. **Get Connection String:**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string:
     ```
     mongodb+srv://tracient_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

### Step 2: Configure Your Backend

1. **Open** `backend/.env` file
2. **Replace** the `MONGODB_URI` with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://tracient_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tracient?retryWrites=true&w=majority
   ```
   **Important:** 
   - Replace `YOUR_PASSWORD` with your actual password
   - Replace `cluster0.xxxxx` with your actual cluster name
   - Add `/tracient` before the `?` to specify the database name

### Step 3: Seed the Database

Run this command to populate the database with predefined workers:

```powershell
cd backend
npm run seed
```

**Expected Output:**
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: tracient

🗑️  Cleared existing workers
✅ Seeded 3 predefined workers
```

### Step 4: Start the Backend

```powershell
cd backend
npm start
```

**Expected Output:**
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: tracient

╔════════════════════════════════════════════════════════════════╗
║     TRACIENT Backend - Mock UPI & QR Token Service            ║
╠════════════════════════════════════════════════════════════════╣
║ Server running at: http://localhost:5000                      ║
...
╚════════════════════════════════════════════════════════════════╝
```

### Step 5: Test the Integration

1. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Login:** `worker@gmail.com` / `worker`
3. **Go to:** `/worker/qr-code`
4. **Generate QR Code** — Should work!
5. **Make a test payment** using the token

## 📦 What Changed?

### New Files Created:
1. **`backend/.env`** — Environment variables (connection string)
2. **`backend/config/database.js`** — MongoDB connection setup
3. **`backend/models/Worker.js`** — Worker schema/model
4. **`backend/models/UPITransaction.js`** — Transaction schema/model
5. **`backend/seed.js`** — Database seeding script

### Updated Files:
1. **`backend/index.js`** — All endpoints now use MongoDB instead of in-memory
2. **`backend/package.json`** — Added mongoose, dotenv, and seed script

## 🔍 Verify Data in MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click "Browse Collections" on your cluster
3. You should see:
   - Database: `tracient`
   - Collections: `workers`, `upitransactions`
   - 3 workers in the `workers` collection

## 🎯 Predefined Workers

| idHash | Name | Phone | Bank Account |
|---|---|---|---|
| aadhar-hash-001 | Rajesh Kumar | 9876543210 | TRCNT-0001-001 |
| aadhar-hash-002 | Priya Singh | 9876543211 | TRCNT-0002-002 |
| aadhar-hash-003 | Amit Patel | 9876543212 | TRCNT-0003-003 |

## ⚠️ Important Notes

- **Never commit `.env` file** to git (it's already in `.gitignore`)
- **Use different credentials** for production
- **Free tier limits:** 512 MB storage, shared resources
- **Data persistence:** All data is now saved permanently (survives restarts)

## 🐛 Troubleshooting

### Error: "MongoServerError: bad auth"
- Check your username and password in `.env`
- Make sure you copied the correct credentials

### Error: "Network timeout"
- Check Network Access settings in Atlas
- Make sure your IP is allowed

### Error: "Database user not found"
- Create a database user in Atlas
- Check username/password match in `.env`

### Workers not showing up
- Run `npm run seed` again
- Check MongoDB Atlas "Browse Collections" to verify data

## 🚀 Next Steps

1. ✅ MongoDB Atlas integrated
2. ✅ All endpoints using database
3. ⏭️ Test QR code generation
4. ⏭️ Test UPI payments
5. ⏭️ Integrate with Hyperledger Fabric

---

**Integration Status:** ✅ Complete and ready to use!
