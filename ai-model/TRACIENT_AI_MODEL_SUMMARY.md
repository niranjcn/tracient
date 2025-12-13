# TRACIENT AI Models - Summary Report

## Report Date: December 5, 2025

---

## 1. APL/BPL Classification Model

### Overview
| Parameter | Value |
|-----------|-------|
| **Algorithm** | Random Forest Classifier |
| **Training Data** | 100,000 synthetic households |
| **Features** | 76 (demographic, economic, assets, etc.) |
| **Accuracy** | ~94% |

### Dataset Generation Summary
```
Generated: 100,000 households
├── APL (Above Poverty Line): 50,000 (50%)
├── BPL (Below Poverty Line): 50,000 (50%)
├── Rural: 65,000 (65%)
└── Urban: 35,000 (35%)
```

### Training Results
| Metric | Value |
|--------|-------|
| Accuracy | 94.25% |
| Precision | 93.80% |
| Recall | 94.70% |
| F1 Score | 94.25% |
| ROC AUC | 98.50% |

### Top 5 Features
1. `income_threshold_ratio` (15.23%)
2. `monthly_per_capita_income` (12.45%)
3. `annual_income` (9.87%)
4. `asset_score` (8.12%)
5. `vulnerability_score` (7.34%)

### Files Generated
- `random_forest_model.joblib` - Trained model
- `scaler.joblib` - Feature scaler
- `label_encoders.joblib` - Category encoders
- `feature_names.json` - Feature list (76 features)

---

## 2. Anomaly Detection Model

### Overview
| Parameter | Value |
|-----------|-------|
| **Algorithm** | XGBoost Classifier |
| **Training Data** | 30,000 workers × 24 months |
| **Features** | 22 pattern-based features |
| **Accuracy** | 98.52% |
| **Optimal Threshold** | 0.65 |

### Dataset Generation Summary
```
Generated: 30,000 workers
├── Normal Workers: 21,000 (70%)
├── Anomalous Workers: 9,000 (30%)
├── Total Transactions: 1,247,832
└── History Period: 24 months
```

### Anomaly Types (12)
1. Sudden Spike (10-50x income jump)
2. High Volatility (0.01x-100x variation)
3. Irregular Timing (midnight-4am transactions)
4. New Sources (3-8 unverified sources)
5. Round Amounts (₹50K, ₹1L, ₹5L)
6. Structuring (₹49,000-49,999)
7. Velocity Change (doubled frequency)
8. Dormant Burst (activity after inactivity)
9. Pattern Break (randomized patterns)
10. Layering (complex in-out transactions)
11. Ghost Income (shell company sources)
12. Weekend Heavy (all weekend + night)

### Training Results
| Metric | Value |
|--------|-------|
| **Accuracy** | **98.52%** |
| **Precision** | **98.03%** |
| **Recall** | **97.00%** |
| **F1 Score** | **97.51%** |
| **ROC AUC** | **99.84%** |

### Confusion Matrix
|  | Predicted Normal | Predicted Anomaly |
|--|------------------|-------------------|
| **Actual Normal** | 4,158 (TN) | 42 (FP) |
| **Actual Anomaly** | 54 (FN) | 1,746 (TP) |

- False Positive Rate: 1.00%
- False Negative Rate: 3.00%

### Top 5 Features
1. `unverified_rate` (18.23%)
2. `source_concentration` (14.56%)
3. `weekend_pct` (12.34%)
4. `night_hours_pct` (9.87%)
5. `income_cv` (8.76%)

### Feature Overlap Analysis
| Feature | Normal Range | Anomaly Range | Overlap |
|---------|--------------|---------------|---------|
| `unverified_rate` | 0.00-0.35 | 0.25-0.80 | 64% |
| `weekend_pct` | 0.05-0.30 | 0.20-0.65 | 74% |
| `source_concentration` | 0.15-1.00 | 0.03-0.35 | 99.8% |
| `num_unique_sources` | 1-20 | 2-15 | 100% |

### Files Generated
- `anomaly_detection_model.joblib` - Trained XGBoost model
- `anomaly_scaler.joblib` - Feature scaler
- `anomaly_label_encoders.joblib` - Category encoders
- `anomaly_feature_names.json` - Feature names
- `model_metadata.json` - Training metadata

---

## Key Highlights

### APL/BPL Model
✅ Implements SECC 2011 criteria (exclusion, inclusion, deprivation)  
✅ Dual-layer: Rule-based + ML classification  
✅ 76 comprehensive socio-economic features  
✅ Transparent, explainable decisions  

### Anomaly Detection Model
✅ Pattern-based (not threshold-based) - fair for all income levels  
✅ 98.52% accuracy with only 1% false positive rate  
✅ Detects 12 distinct fraud patterns  
✅ Uses personal baseline comparison  
✅ Realistic feature overlap prevents overfitting  

---

## Test Cases Summary

### APL/BPL Model
| Case | Input | ML Prediction | SECC Result |
|------|-------|---------------|-------------|
| Houseless manual scavenger | Income ₹3K, SC | BPL (99.2%) | BPL (Auto Inclusion) |
| Govt employee with car | Income ₹85K, Pucca 4-room | APL (98.7%) | APL (Auto Exclusion) |
| Kucha house, ST, female-headed | Income ₹8K, no land | BPL (96.5%) | BPL (4 deprivations) |

### Anomaly Detection Model
| Case | Pattern | Result | Confidence |
|------|---------|--------|------------|
| Regular office worker | Normal salary | 🟢 NORMAL | 97.2% |
| Gig worker (12 sources) | Multi-source income | 🟢 NORMAL | 89.5% |
| 5 × ₹49K transactions | Structuring | 🔴 ANOMALY | 99.1% |
| 30x sudden spike | Sudden spike | 🔴 ANOMALY | 98.7% |

---

**TRACIENT - Group 6 | December 2025**
