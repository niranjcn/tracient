# APL/BPL Classification Model

**Household Poverty Classification based on SECC 2011 Criteria**

## Overview
This model classifies Indian households as APL (Above Poverty Line) or BPL (Below Poverty Line) using:
- **Machine Learning**: Random Forest Classifier trained on 100,000 synthetic households
- **Rule-based Analysis**: SECC 2011 (Socio Economic and Caste Census) criteria

## Files
| File | Description |
|------|-------------|
| `classify_household.py` | Interactive CLI tool |
| `random_forest_model.joblib` | Trained Random Forest model |
| `scaler.joblib` | StandardScaler for features |
| `label_encoders.joblib` | LabelEncoders for categorical features |
| `feature_names.json` | List of 76 features |

## Usage

```bash
cd ai-model/apl_bpl_model
py classify_household.py
```

## SECC 2011 Criteria

### Automatic Exclusion (→ APL)
- Owns motorized 2/3/4 wheeler
- Owns tractor/mechanized equipment
- KCC limit ≥ ₹50,000
- Government employee in family
- Pays income tax
- Owns refrigerator/landline
- Pucca house with 3+ rooms
- Owns 2.5+ acres irrigated land

### Automatic Inclusion (→ BPL)
- Houseless
- Destitute (living on alms)
- Manual scavenger
- Primitive Tribal Group (PVTG)
- Bonded laborer

### Deprivation Indicators (1+ → BPL eligible)
1. One-room kucha house
2. No adult member (16-59)
3. Female-headed, no adult male
4. Disabled member, no able-bodied adult
5. SC/ST household
6. No literate adult above 25
7. Landless manual/casual labor

## Model Performance
- **Algorithm**: Random Forest Classifier
- **Training Data**: 100,000 synthetic households
- **Features**: 76 (demographic, economic, assets, etc.)
