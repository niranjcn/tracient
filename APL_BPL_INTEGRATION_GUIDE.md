# APL/BPL Classification Integration Guide

This guide explains how to run the APL/BPL classification AI model integrated with the TRACIENT website.

## Overview

The integration allows the family survey to automatically classify households as **APL (Above Poverty Line)** or **BPL (Below Poverty Line)** based on:
1. **ML Model Prediction** - Random Forest classifier trained on SECC data
2. **SECC 2011 Criteria Analysis** - Rule-based analysis of exclusion, inclusion, and deprivation indicators

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────>│   Backend       │────>│   Python AI     │
│   (React)       │     │   (Node.js)     │     │   (Flask API)   │
│                 │<────│                 │<────│                 │
│   Survey Form   │     │   Family API    │     │   ML Model      │
│   Result Modal  │     │   Controller    │     │   SECC Analysis │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Prerequisites

1. **Python 3.8+** with pip
2. **Node.js 18+** with npm
3. **MongoDB** (local or Atlas)

## Setup Instructions

### Step 1: Start the AI Model API

```powershell
# Navigate to the AI model directory
cd ai-model\apl_bpl_model

# Option 1: Use the batch script (Windows)
.\start-api.bat

# Option 2: Manual setup
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python api.py
```

The API will start on `http://localhost:5001`

You should see:
```
🚀 TRACIENT APL/BPL Classification API
   Running on http://localhost:5001
   Model loaded: True
```

### Step 2: Start the Backend Server

```powershell
# Navigate to backend directory
cd backend

# Install dependencies (if needed)
npm install

# Start the server
npm run dev
```

The backend will start on `http://localhost:5000`

### Step 3: Start the Frontend

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# AI Model API
AI_API_URL=http://localhost:5001
AI_ENABLED=true
AI_API_TIMEOUT=30000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/tracient

# Other settings...
```

### AI Model Port

To change the AI API port:

```powershell
# Windows
set AI_MODEL_PORT=5002
python api.py

# Or in .env
AI_API_URL=http://localhost:5002
```

## Usage

### Family Survey Flow

1. Worker/Employer logs in to the website
2. Navigate to **Family → Start Family Survey**
3. Complete all 5 steps of the survey:
   - Basic Information (family size, head age, income)
   - Demographics (age distribution)
   - Assets (land, vehicles, equipment)
   - Housing (house type, amenities)
   - Financial (bank account, loans)
4. Click **Submit & Get Classification**
5. Classification result modal appears showing:
   - APL/BPL classification
   - ML model confidence percentage
   - SECC criteria analysis
   - Eligible welfare schemes (for BPL)
   - Recommendation priority

### Classification Result

The classification result includes:

| Field | Description |
|-------|-------------|
| classification | APL or BPL |
| classification_confidence | ML model confidence (0-100%) |
| classification_reason | Why this classification was assigned |
| ml_bpl_probability | Probability of being BPL |
| ml_apl_probability | Probability of being APL |
| secc_classification | SECC rule-based classification |
| secc_exclusion_met | Exclusion criteria that were met |
| secc_inclusion_met | Inclusion criteria that were met |
| secc_deprivation_met | Deprivation indicators present |
| eligible_schemes | List of welfare schemes the family is eligible for |
| recommendation_priority | HIGH, MEDIUM, or LOW priority |

## API Endpoints

### AI Model API (Python Flask)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/classify` | POST | Classify single household |
| `/batch-classify` | POST | Classify multiple households |

### Backend API (Node.js)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/family/survey` | POST | Submit survey with classification |
| `/api/family/my-family` | GET | Get family with classification |
| `/api/family/survey-status` | GET | Check if survey completed |

## Testing

### Test the AI API directly

```powershell
# Health check
curl http://localhost:5001/health

# Test classification
curl -X POST http://localhost:5001/classify -H "Content-Type: application/json" -d '{
  "family_size": 4,
  "head_age": 45,
  "highest_earner_monthly": 8000,
  "house_type": "kucha",
  "has_electricity": 1,
  "is_female_headed": 1,
  "owns_two_wheeler": false
}'
```

### Expected Response

```json
{
  "success": true,
  "classification": "BPL",
  "reason": "ML model prediction (78.5% confidence)",
  "ml_prediction": {
    "classification": "BPL",
    "confidence": 78.5,
    "bpl_probability": 78.5,
    "apl_probability": 21.5
  },
  "secc_analysis": {
    "secc_classification": "BPL",
    "secc_reason": "2 deprivation indicator(s)",
    "deprivation_count": 2,
    "deprivation_met": ["One room kucha house", "Low monthly income"]
  },
  "recommendation": {
    "priority": "MEDIUM",
    "message": "Eligible for BPL benefits. Standard enrollment process applies.",
    "eligible_schemes": ["Public Distribution System (PDS)", "MGNREGA", ...]
  }
}
```

## Troubleshooting

### AI API Not Running

If the backend can't connect to the AI API, it will fallback to rule-based SECC analysis. The classification will still work but without ML predictions.

Check:
1. Is Python installed? `python --version`
2. Is the AI API running? `curl http://localhost:5001/health`
3. Are the model files present in `ai-model/apl_bpl_model/`?

### Model Files Missing

Required files in `ai-model/apl_bpl_model/`:
- `random_forest_model.joblib`
- `scaler.joblib`
- `label_encoders.joblib`
- `feature_names.json`

### Classification Shows "Pending"

If classification shows as pending:
1. Check backend logs for errors
2. Verify AI API is accessible
3. Re-submit the survey

## Files Changed/Created

### New Files
- `ai-model/apl_bpl_model/api.py` - Flask API for classification
- `ai-model/apl_bpl_model/requirements.txt` - Python dependencies
- `ai-model/apl_bpl_model/start-api.bat` - Windows startup script
- `ai-model/apl_bpl_model/start-api.sh` - Unix startup script
- `frontend/src/components/family/ClassificationResultModal.tsx` - Result modal
- `frontend/src/components/family/index.ts` - Component exports

### Modified Files
- `backend/models/Family.js` - Added classification fields
- `backend/controllers/family.controller.js` - Added AI classification call
- `backend/services/ai.service.js` - Added classifyHousehold function
- `backend/config/constants.js` - Added AI config
- `frontend/src/types/family.ts` - Added classification types
- `frontend/src/services/familyService.ts` - Updated response types
- `frontend/src/pages/worker/FamilySurvey.tsx` - Added result modal
- `frontend/src/pages/worker/Family.tsx` - Added classification display
