# Income Pattern Anomaly Detection Model

**AI-powered detection of suspicious income PATTERNS - not fixed thresholds**

## Key Approach: Pattern-Based Detection

⚠️ **Important**: This model does NOT use fixed salary thresholds!

Different jobs pay differently. A daily wage worker earning ₹500/day and an IT professional earning ₹2,00,000/month can BOTH have normal or anomalous patterns. We detect anomalies by:

1. **Analyzing individual's OWN history** (not comparing to others)
2. **Detecting CHANGES and PATTERNS** (not absolute amounts)
3. **Looking at behavioral signals** (timing, frequency, sources)

## What We Detect

| Anomaly Type | Description |
|--------------|-------------|
| **Sudden Spike** | Income jumped 3x+ above YOUR personal average |
| **High Volatility** | YOUR income varies wildly month-to-month |
| **Irregular Timing** | Transactions at unusual hours/weekends consistently |
| **New Sources** | Multiple new income sources appeared suddenly |
| **Round Amounts** | Suspiciously round transaction amounts |
| **Structuring** | Many transactions just below reporting thresholds |
| **Velocity Change** | Transaction frequency changed dramatically |
| **Dormant Burst** | Large activity after months of inactivity |
| **Pattern Break** | YOUR regular payment pattern suddenly broke |
| **Ghost Income** | Income from unverifiable sources |

## Files

| File | Description |
|------|-------------|
| `generate_dataset.py` | Generates synthetic training dataset (50,000 workers) |
| `train_model.py` | Trains and evaluates anomaly detection models |
| `detect_anomaly.py` | Interactive CLI for anomaly detection |
| `anomaly_detection_model.joblib` | Trained model (after training) |
| `anomaly_scaler.joblib` | Feature scaler (after training) |
| `anomaly_label_encoders.joblib` | Categorical encoders (after training) |
| `anomaly_feature_names.json` | Feature list (after training) |

## Quick Start

### Step 1: Generate Dataset
```bash
py generate_dataset.py
```
This creates:
- `workers_dataset.csv` - 50,000 worker profiles
- `transactions_dataset.csv` - Transaction history (24 months each)
- `features_dataset.csv` - Pattern-based features for training

### Step 2: Train Model
```bash
py train_model.py
```
Or run in **Google Colab** for faster training.

### Step 3: Run Detection
```bash
py detect_anomaly.py
```

## Pattern-Based Features (NOT Thresholds)

The model uses these pattern features that work for ANY income level:

### Income Pattern Features
| Feature | What it measures |
|---------|-----------------|
| `income_cv` | How variable is YOUR income (coefficient of variation) |
| `max_mom_increase` | Maximum month-over-month increase in YOUR history |
| `max_mom_decrease` | Maximum month-over-month decrease in YOUR history |
| `max_deviation_from_mean` | Biggest deviation from YOUR personal average |

### Frequency Pattern Features
| Feature | What it measures |
|---------|-----------------|
| `avg_tx_per_month` | YOUR average transactions per month |
| `freq_cv` | How variable is YOUR transaction frequency |
| `velocity_change` | Change in YOUR transaction velocity over time |
| `burst_ratio` | Maximum burst vs YOUR average activity |

### Timing Pattern Features
| Feature | What it measures |
|---------|-----------------|
| `weekend_pct` | % of YOUR transactions on weekends |
| `night_hours_pct` | % of YOUR transactions at odd hours |

### Suspicious Pattern Features
| Feature | What it measures |
|---------|-----------------|
| `round_amount_pct` | % of suspiciously round amounts |
| `near_50k_pct` | % of transactions just below ₹50,000 |
| `near_200k_pct` | % of transactions just below ₹2,00,000 |

### Source Pattern Features
| Feature | What it measures |
|---------|-----------------|
| `num_unique_sources` | Number of unique income sources |
| `new_source_rate` | Rate of new sources appearing |
| `unverified_rate` | % of unverified sources |

### Gap Pattern Features
| Feature | What it measures |
|---------|-----------------|
| `max_gap_days` | Maximum gap between YOUR transactions |
| `gap_irregularity` | How irregular YOUR gaps are |

## Models Trained

| Model | Purpose |
|-------|---------|
| Random Forest | Primary classifier (best F1 score) |
| Gradient Boosting | High accuracy alternative |
| Isolation Forest | Unsupervised anomaly detection |
| Logistic Regression | Baseline model |
| MLP Neural Network | Deep learning approach |

## Why Pattern-Based Detection?

### ❌ Problem with Threshold-Based Detection:
```
Rule: "Flag if income > ₹50,000/month"

This would:
- Flag a legitimate IT professional earning ₹80,000
- Miss a daily wager getting ₹40,000 of black money
- Penalize higher-paying legitimate jobs
```

### ✅ Pattern-Based Detection:
```
Rule: "Flag if income jumps 3x above YOUR average"

This would:
- NOT flag IT professional consistently earning ₹80,000
- FLAG daily wager suddenly getting ₹40,000 (if usual is ₹10,000)
- Work fairly for any income level
```

## Example Scenarios

### Scenario 1: Low-income worker with suspicious pattern
```
Worker: Daily wage labor, usual income ₹8,000-12,000/month
Pattern: Suddenly receives ₹45,000 x 3 months
Result: ⚠️ FLAGGED - sudden_spike, pattern_break
```

### Scenario 2: High-income professional with normal pattern
```
Worker: IT consultant, income ₹1,50,000-2,00,000/month
Pattern: Consistent monthly salary + quarterly bonus
Result: ✅ NORMAL - patterns are consistent
```

### Scenario 3: Structuring detection
```
Worker: Any income level
Pattern: 15 transactions of ₹48,000-49,900 each
Result: ⚠️ FLAGGED - structuring, near_50k_pct high
```

## Integration with Blockchain

This model is designed to work with the TRACIENT blockchain layer:

1. **Transactions recorded on blockchain** → immutable wage records
2. **AI model analyzes transaction patterns** → flags anomalies based on individual history
3. **Dashboard displays alerts** → for government review
4. **Fair detection** → works equally for all income levels

## Key Benefits

| Traditional Approach | Our Pattern-Based Approach |
|---------------------|---------------------------|
| Fixed thresholds discriminate by income | Fair for all income levels |
| Same rules for everyone | Personalized baseline per individual |
| High false positives for high earners | Based on behavioral change |
| Misses low-income fraud | Detects any unusual pattern |

## Performance Metrics (Expected)

| Metric | Target |
|--------|--------|
| Accuracy | >90% |
| Precision | >85% |
| Recall | >80% |
| F1 Score | >82% |
| ROC AUC | >0.90 |

## Next Steps

1. Train on real (anonymized) transaction data
2. Integrate with Hyperledger Fabric chaincode
3. Build real-time monitoring API
4. Deploy on government infrastructure
