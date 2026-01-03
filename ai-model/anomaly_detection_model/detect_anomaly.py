"""
TRACIENT - Income Pattern Anomaly Detection CLI
==================================================
Interactive tool for detecting suspicious income PATTERNS

KEY APPROACH: Pattern-based detection (NOT threshold-based)
- Analyzes monthly income patterns over time
- Compares against individual OWN baseline
- Detects deviations regardless of income level
- Same job can pay differently - we look at PATTERNS

Detects anomalies like:
- Sudden income spikes (vs personal history)
- High income volatility (erratic patterns)
- Irregular timing (weekend/night transactions)
- New sources appearing suddenly
- Round amount patterns (suspicious)
- Structuring (many small transactions)
- Velocity changes (frequency spikes)
- Dormant bursts (activity after inactivity)
- Pattern breaks (regular pattern suddenly changes)
"""

import joblib
import json
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List

# ============================================================================
# CONSTANTS
# ============================================================================

STATES = [
    "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
    "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
]

JOB_SECTORS = [
    'agricultural_labor', 'construction', 'domestic_work', 'manufacturing',
    'retail_trade', 'transport', 'hospitality', 'healthcare_support',
    'it_services', 'govt_employee', 'self_employed', 'gig_worker', 'skilled_artisan'
]

EDUCATION_LEVELS = ['illiterate', 'primary', 'secondary', 'higher_secondary', 
                    'graduate', 'post_graduate']

PAYMENT_MODES = ['UPI', 'NEFT', 'IMPS', 'RTGS', 'cash_deposit', 'cheque']

ANOMALY_DESCRIPTIONS = {
    'sudden_spike': '⚠️ SUDDEN SPIKE: Income jumped 3x+ above YOUR personal average',
    'high_volatility': '⚠️ HIGH VOLATILITY: Your income varies wildly month-to-month',
    'irregular_timing': '⚠️ IRREGULAR TIMING: Transactions at unusual hours/weekends consistently',
    'new_sources': '⚠️ NEW SOURCES: Multiple new income sources appeared suddenly',
    'round_amounts': '⚠️ ROUND AMOUNTS: Suspiciously round transaction amounts',
    'structuring': '⚠️ STRUCTURING: Many transactions just below reporting thresholds',
    'velocity_change': '⚠️ VELOCITY CHANGE: Transaction frequency changed dramatically',
    'dormant_burst': '⚠️ DORMANT BURST: Large activity after months of inactivity',
    'pattern_break': '⚠️ PATTERN BREAK: Your regular payment pattern suddenly broke',
    'layering': '⚠️ LAYERING: Complex in-out transactions obscuring source',
    'ghost_income': '⚠️ GHOST INCOME: Income from unverifiable/shell sources',
    'weekend_heavy': '⚠️ WEEKEND HEAVY: Unusual concentration of weekend transactions',
    'low_verification': '⚠️ LOW VERIFICATION: Most income sources are unverified',
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def clear_screen():
    """Clear terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Print application header"""
    print("\n" + "=" * 70)
    print("🔍 TRACIENT - INCOME ANOMALY DETECTION SYSTEM")
    print("   Blockchain & AI Enabled Income Traceability")
    print("=" * 70)

def print_section(title: str):
    """Print section header"""
    print(f"\n{'─' * 70}")
    print(f"📋 {title}")
    print("─" * 70)

def get_yes_no(prompt: str, default: bool = False) -> bool:
    """Get yes/no input"""
    default_str = "Y/n" if default else "y/N"
    while True:
        response = input(f"{prompt} [{default_str}]: ").strip().lower()
        if response == "":
            return default
        if response in ["y", "yes", "1"]:
            return True
        if response in ["n", "no", "0"]:
            return False
        print("   ⚠️ Please enter 'y' or 'n'")

def get_integer(prompt: str, min_val: int = 0, max_val: int = 999999999, default: int = None) -> int:
    """Get integer input"""
    default_str = f" [{default}]" if default is not None else ""
    while True:
        try:
            response = input(f"{prompt}{default_str}: ").strip()
            if response == "" and default is not None:
                return default
            value = int(response)
            if min_val <= value <= max_val:
                return value
            print(f"   ⚠️ Enter a number between {min_val} and {max_val}")
        except ValueError:
            print("   ⚠️ Please enter a valid number")

def get_float(prompt: str, min_val: float = 0, max_val: float = 999999999, default: float = None) -> float:
    """Get float input"""
    default_str = f" [{default}]" if default is not None else ""
    while True:
        try:
            response = input(f"{prompt}{default_str}: ").strip()
            if response == "" and default is not None:
                return default
            value = float(response)
            if min_val <= value <= max_val:
                return value
            print(f"   ⚠️ Enter a number between {min_val} and {max_val}")
        except ValueError:
            print("   ⚠️ Please enter a valid number")

def get_choice(prompt: str, options: list) -> str:
    """Get choice from list"""
    print(f"\n{prompt}")
    for i, opt in enumerate(options, 1):
        print(f"   {i}. {opt}")
    
    while True:
        try:
            choice = int(input("Enter choice number: ").strip())
            if 1 <= choice <= len(options):
                return options[choice - 1]
            print(f"   ⚠️ Enter a number between 1 and {len(options)}")
        except ValueError:
            print("   ⚠️ Please enter a valid number")

# ============================================================================
# DATA COLLECTION
# ============================================================================

def collect_worker_data() -> Dict[str, Any]:
    """Collect worker profile data"""
    
    data = {}
    
    print_section("SECTION 1: BASIC PROFILE")
    print("   (For context only - we detect anomalies based on YOUR patterns)")
    
    data['sector'] = get_choice("Job sector:", JOB_SECTORS)
    data['is_formal'] = 1 if get_yes_no("Works in formal sector?") else 0
    data['income_tier'] = get_choice("Income tier:", ['low', 'medium', 'high'])
    data['account_age_months'] = get_integer("Bank account age (months)", 1, 600, 24)
    
    return data

def collect_monthly_income() -> Dict[str, Any]:
    """Collect monthly income history (last 12-24 months)"""
    
    print_section("SECTION 2: MONTHLY INCOME HISTORY")
    
    print("\n   Enter your monthly income for each month (we'll detect patterns)")
    print("   Note: Different amounts are NORMAL - we look for unusual PATTERNS")
    print("   Enter 0 if no income that month\n")
    
    monthly_incomes = []
    num_months = get_integer("How many months of history?", 6, 24, 12)
    
    print(f"\n   Enter income for last {num_months} months (most recent first):")
    
    for i in range(num_months):
        month_name = f"Month {i+1} (most recent)" if i == 0 else f"Month {i+1}"
        income = get_float(f"   {month_name} income (₹)", 0, 100000000)
        monthly_incomes.append(income)
    
    # Calculate pattern features
    incomes = np.array(monthly_incomes)
    mean_income = np.mean(incomes) if len(incomes) > 0 else 0
    std_income = np.std(incomes) if len(incomes) > 1 else 0
    
    # Month-over-month changes
    if len(incomes) > 1:
        mom_changes = np.diff(incomes) / (incomes[:-1] + 1)  # Avoid division by zero
        max_increase = np.max(mom_changes) if len(mom_changes) > 0 else 0
        max_decrease = abs(np.min(mom_changes)) if len(mom_changes) > 0 else 0
        avg_change = np.mean(np.abs(mom_changes)) if len(mom_changes) > 0 else 0
    else:
        max_increase = max_decrease = avg_change = 0
    
    data = {
        'monthly_incomes': monthly_incomes,
        'income_cv': std_income / mean_income if mean_income > 0 else 0,
        'max_mom_increase': max_increase,
        'max_mom_decrease': max_decrease,
        'avg_mom_change': avg_change,
        'max_deviation_from_mean': np.max(np.abs(incomes - mean_income) / mean_income) if mean_income > 0 else 0,
        'pct_high_deviation': np.mean(np.abs(incomes - mean_income) / (mean_income + 1) > 1),
    }
    
    return data

def collect_pattern_data() -> Dict[str, Any]:
    """Collect transaction pattern data"""
    
    print_section("SECTION 3: TRANSACTION PATTERNS")
    
    data = {}
    
    # Frequency patterns
    print("\n📅 FREQUENCY PATTERNS:")
    data['avg_tx_per_month'] = get_float("   Average transactions per month", 1, 500, 10)
    max_tx = get_integer("   Maximum transactions in single month", 1, 500, 20)
    data['freq_cv'] = (max_tx - data['avg_tx_per_month']) / data['avg_tx_per_month'] if data['avg_tx_per_month'] > 0 else 0
    
    # Velocity change
    old_avg = get_float("   Avg transactions/month (first 6 months)", 1, 500, data['avg_tx_per_month'])
    new_avg = get_float("   Avg transactions/month (last 6 months)", 1, 500, data['avg_tx_per_month'])
    data['velocity_change'] = new_avg / old_avg if old_avg > 0 else 1
    
    data['burst_ratio'] = max_tx / data['avg_tx_per_month'] if data['avg_tx_per_month'] > 0 else 1
    
    # Timing patterns
    print("\n⏰ TIMING PATTERNS:")
    data['weekend_pct'] = get_float("   % of transactions on weekends", 0, 100, 10) / 100
    data['night_hours_pct'] = get_float("   % of transactions at odd hours (before 6am or after 10pm)", 0, 100, 5) / 100
    
    # Suspicious patterns
    print("\n⚠️ SUSPICIOUS PATTERNS:")
    data['round_amount_pct'] = get_float("   % of round amounts (like 10000, 50000)", 0, 100, 15) / 100
    data['near_50k_pct'] = get_float("   % of transactions just below ₹50,000", 0, 100, 5) / 100
    data['near_200k_pct'] = get_float("   % of transactions just below ₹2,00,000", 0, 100, 2) / 100
    
    # Source patterns
    print("\n💰 SOURCE PATTERNS:")
    data['num_unique_sources'] = get_integer("   Number of unique income sources", 1, 50, 2)
    data['source_concentration'] = get_float("   % income from main source", 0, 100, 80) / 100
    data['new_source_rate'] = get_float("   % of sources that are NEW (last 6 months)", 0, 100, 10) / 100
    data['unverified_rate'] = get_float("   % of unverified sources", 0, 100, 20) / 100
    
    # Payment mode patterns
    print("\n💳 PAYMENT MODE PATTERNS:")
    data['cash_deposit_rate'] = get_float("   % of income from cash deposits", 0, 100, 15) / 100
    upi_pct = get_float("   % from UPI", 0, 100, 40)
    neft_pct = get_float("   % from NEFT/IMPS", 0, 100, 40)
    # Calculate mode entropy (diversity)
    modes = [upi_pct, neft_pct, data['cash_deposit_rate']*100, 100-upi_pct-neft_pct-data['cash_deposit_rate']*100]
    modes = [m/100 for m in modes if m > 0]
    data['mode_entropy'] = -sum(p * np.log2(p + 1e-10) for p in modes) if modes else 0
    
    # Amount change
    print("\n📈 INCOME CHANGE PATTERN:")
    first_half_total = get_float("   Total income (first 6 months) ₹", 0, 100000000)
    second_half_total = get_float("   Total income (last 6 months) ₹", 0, 100000000)
    data['amount_change_ratio'] = second_half_total / first_half_total if first_half_total > 0 else 1
    
    # Gap patterns
    print("\n⏳ GAP PATTERNS:")
    data['max_gap_days'] = get_integer("   Maximum gap between income (days)", 0, 365, 45)
    data['avg_gap_days'] = get_float("   Average gap between income (days)", 1, 365, 15)
    data['gap_irregularity'] = abs(data['max_gap_days'] - data['avg_gap_days']) / data['avg_gap_days'] if data['avg_gap_days'] > 0 else 0
    
    return data

# ============================================================================
# ANOMALY DETECTION
# ============================================================================

class AnomalyDetector:
    """ML-based anomaly detector"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.feature_names = None
        self.is_loaded = False
    
    def load(self):
        """Load model components"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        try:
            self.model = joblib.load(os.path.join(script_dir, 'anomaly_detection_model.joblib'))
            self.scaler = joblib.load(os.path.join(script_dir, 'anomaly_scaler.joblib'))
            self.label_encoders = joblib.load(os.path.join(script_dir, 'anomaly_label_encoders.joblib'))
            
            with open(os.path.join(script_dir, 'anomaly_feature_names.json'), 'r') as f:
                self.feature_names = json.load(f)
            
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"   ⚠️ Error loading model: {e}")
            return False
    
    def preprocess(self, worker_data: Dict, pattern_data: Dict, income_data: Dict) -> np.ndarray:
        """Preprocess data for prediction using pattern features"""
        
        # Combine all data
        data = {**worker_data, **pattern_data, **income_data}
        
        # Encode categorical variables
        categorical_cols = ['sector', 'income_tier']
        for col in categorical_cols:
            if col in self.label_encoders and col in data:
                try:
                    data[col + '_encoded'] = self.label_encoders[col].transform([data[col]])[0]
                except:
                    data[col + '_encoded'] = 0
        
        # Create feature vector using pattern-based features
        feature_vector = []
        feature_names = self.feature_names if isinstance(self.feature_names, list) else self.feature_names.get('feature_names', [])
        
        for feature in feature_names:
            if feature in data:
                feature_vector.append(data[feature])
            else:
                feature_vector.append(0)
        
        # Scale features
        X = np.array(feature_vector).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        
        return X_scaled
    
    def detect(self, worker_data: Dict, pattern_data: Dict, income_data: Dict) -> Dict[str, Any]:
        """Detect anomalies based on patterns"""
        
        X = self.preprocess(worker_data, pattern_data, income_data)
        
        # Get prediction
        if hasattr(self.model, 'predict_proba'):
            prediction = self.model.predict(X)[0]
            probabilities = self.model.predict_proba(X)[0]
            anomaly_score = probabilities[1] * 100
        else:
            # For Isolation Forest
            prediction = self.model.predict(X)[0]
            prediction = 1 if prediction == -1 else 0
            anomaly_score = 50 if prediction == 1 else 10
        
        return {
            'is_anomaly': bool(prediction == 1),
            'anomaly_score': round(anomaly_score, 2),
            'confidence': round(max(anomaly_score, 100 - anomaly_score), 2),
        }

def rule_based_detection(income_data: Dict, pattern_data: Dict) -> List[str]:
    """Pattern-based anomaly detection using rules"""
    
    anomalies = []
    
    # 1. Check income volatility (CV > 0.5 is suspicious)
    if income_data.get('income_cv', 0) > 0.5:
        anomalies.append('high_volatility')
    
    # 2. Check for sudden spikes (>3x month-over-month increase)
    if income_data.get('max_mom_increase', 0) > 3:
        anomalies.append('sudden_spike')
    
    # 3. Check for pattern breaks (high deviation from personal average)
    if income_data.get('max_deviation_from_mean', 0) > 2:
        anomalies.append('pattern_break')
    
    # 4. Check for structuring (many transactions near thresholds)
    if pattern_data.get('near_50k_pct', 0) > 0.3 or pattern_data.get('near_200k_pct', 0) > 0.2:
        anomalies.append('structuring')
    
    # 5. Check for round amount suspicion
    if pattern_data.get('round_amount_pct', 0) > 0.6:
        anomalies.append('round_amounts')
    
    # 6. Check for unusual timing
    if pattern_data.get('night_hours_pct', 0) > 0.3 or pattern_data.get('weekend_pct', 0) > 0.5:
        anomalies.append('irregular_timing')
    
    # 7. Check for velocity changes
    if pattern_data.get('velocity_change', 1) > 3 or pattern_data.get('velocity_change', 1) < 0.3:
        anomalies.append('velocity_change')
    
    # 8. Check for transaction bursts
    if pattern_data.get('burst_ratio', 1) > 5:
        anomalies.append('dormant_burst')
    
    # 9. Check for new sources suddenly appearing
    if pattern_data.get('new_source_rate', 0) > 0.5:
        anomalies.append('new_sources')
    
    # 10. Check for low verification
    if pattern_data.get('unverified_rate', 0) > 0.5:
        anomalies.append('ghost_income')
    
    # 11. Check for dormancy patterns (long gaps)
    if pattern_data.get('max_gap_days', 0) > 90 and pattern_data.get('amount_change_ratio', 1) > 2:
        anomalies.append('dormant_burst')
    
    # 12. Check for excessive weekend transactions
    if pattern_data.get('weekend_pct', 0) > 0.4:
        anomalies.append('weekend_heavy')
    
    # Remove duplicates
    return list(set(anomalies))

# ============================================================================
# RESULTS DISPLAY
# ============================================================================

def display_results(worker_data: Dict, income_data: Dict, pattern_data: Dict,
                   ml_result: Dict, rule_anomalies: List[str]):
    """Display detection results based on pattern analysis"""
    
    clear_screen()
    print_header()
    
    # Summary
    print_section("PATTERN ANALYSIS SUMMARY")
    print("   📊 KEY INSIGHT: We analyze YOUR patterns, not fixed thresholds")
    print("   📊 Same job can pay differently - we look for unusual CHANGES\n")
    
    print(f"   • Income Volatility (CV): {income_data.get('income_cv', 0):.2f}")
    cv = income_data.get('income_cv', 0)
    if cv < 0.2:
        print("     (🟢 Very stable income)")
    elif cv < 0.4:
        print("     (🟡 Normal variation)")
    else:
        print("     (🔴 High volatility - unusual)")
    
    print(f"   • Max Month-over-Month Increase: {income_data.get('max_mom_increase', 0)*100:.0f}%")
    print(f"   • Velocity Change: {pattern_data.get('velocity_change', 1):.2f}x")
    print(f"   • Transactions Near Thresholds: {pattern_data.get('near_50k_pct', 0)*100:.0f}%")
    print(f"   • Unverified Sources: {pattern_data.get('unverified_rate', 0)*100:.0f}%")
    
    # ML Detection Result
    print_section("🤖 ML MODEL DETECTION")
    
    if ml_result['is_anomaly']:
        print(f"   🔴 ANOMALY DETECTED")
    else:
        print(f"   🟢 NO ANOMALY DETECTED")
    
    print(f"   📊 Anomaly Score: {ml_result['anomaly_score']:.1f}%")
    print(f"   📈 Confidence: {ml_result['confidence']:.1f}%")
    
    # Rule-based Detection
    print_section("📋 PATTERN-BASED ANALYSIS")
    
    if rule_anomalies:
        print(f"   ⚠️ {len(rule_anomalies)} SUSPICIOUS PATTERN(S) DETECTED:\n")
        for anomaly in rule_anomalies:
            if anomaly in ANOMALY_DESCRIPTIONS:
                print(f"   {ANOMALY_DESCRIPTIONS[anomaly]}")
    else:
        print("   ✅ No suspicious patterns detected")
        print("   Your income patterns appear consistent with your history")
    
    # Risk Assessment
    print_section("⚡ RISK ASSESSMENT")
    
    risk_score = ml_result['anomaly_score']
    if rule_anomalies:
        risk_score += len(rule_anomalies) * 10
    risk_score = min(risk_score, 100)
    
    if risk_score >= 70:
        risk_level = "🔴 HIGH RISK"
        recommendation = "IMMEDIATE REVIEW REQUIRED - Unusual patterns detected"
    elif risk_score >= 40:
        risk_level = "🟡 MEDIUM RISK"
        recommendation = "MONITORING RECOMMENDED - Some unusual patterns"
    else:
        risk_level = "🟢 LOW RISK"
        recommendation = "NORMAL - Patterns consistent with history"
    
    print(f"   Risk Score: {risk_score:.0f}/100")
    print(f"   Risk Level: {risk_level}")
    print(f"\n   📝 Recommendation: {recommendation}")
    
    # Explanation of patterns detected
    if ml_result['is_anomaly'] or rule_anomalies:
        print_section("🔍 PATTERN EXPLANATION")
        
        if 'sudden_spike' in rule_anomalies:
            print("   • Your income jumped significantly compared to YOUR normal")
        if 'high_volatility' in rule_anomalies:
            print("   • Your monthly income varies more than typical for you")
        if 'structuring' in rule_anomalies:
            print("   • Many transactions cluster near reporting thresholds")
        if 'velocity_change' in rule_anomalies:
            print("   • Transaction frequency changed dramatically")
        if 'new_sources' in rule_anomalies:
            print("   • Many new income sources appeared recently")
        if 'ghost_income' in rule_anomalies:
            print("   • High rate of unverified income sources")
        if 'irregular_timing' in rule_anomalies:
            print("   • Transactions at unusual times (nights/weekends)")
    
    print("\n" + "=" * 70)

# ============================================================================
# MAIN PROGRAM
# ============================================================================

def main():
    """Main program entry point"""
    
    clear_screen()
    print_header()
    
    print("\n📌 PATTERN-BASED ANOMALY DETECTION")
    print("   This tool analyzes your income PATTERNS over time to detect:")
    print("   • Sudden income spikes (vs YOUR normal)")
    print("   • Unusual volatility in your income")
    print("   • Suspicious transaction timing patterns")
    print("   • Structuring behavior (threshold avoidance)")
    print("   • Unusual source changes")
    print("")
    print("   💡 KEY: We compare against YOUR history, not fixed thresholds")
    print("   💡 Same job can pay differently - we look for unusual CHANGES")
    
    input("\n   Press ENTER to continue...")
    
    # Load ML model
    print("\n📦 Loading ML model...")
    detector = AnomalyDetector()
    ml_available = detector.load()
    
    if ml_available:
        print("   ✅ Model loaded successfully!")
    else:
        print("   ⚠️ ML model not found. Using pattern-based rules only.")
    
    input("\n   Press ENTER to start analysis...")
    
    while True:
        clear_screen()
        print_header()
        
        # Collect data using pattern-based approach
        worker_data = collect_worker_data()
        income_data = collect_monthly_income()
        pattern_data = collect_pattern_data()
        
        # Detect anomalies
        print_section("ANALYZING PATTERNS...")
        print("   ⏳ Processing your income history...")
        print("   ⏳ Comparing against YOUR baseline...")
        print("   ⏳ Detecting unusual patterns...")
        
        # ML detection
        if ml_available:
            ml_result = detector.detect(worker_data, pattern_data, income_data)
        else:
            ml_result = {'is_anomaly': False, 'anomaly_score': 0, 'confidence': 0}
        
        # Rule-based detection (pattern-based)
        rule_anomalies = rule_based_detection(income_data, pattern_data)
        
        # Display results
        display_results(worker_data, income_data, pattern_data, ml_result, rule_anomalies)
        
        # Continue?
        if not get_yes_no("\n🔄 Analyze another case?"):
            break
    
    print("\n👋 Thank you for using TRACIENT Pattern Anomaly Detection!")
    print("   Pattern-based analysis for fair and accurate detection\n")

if __name__ == "__main__":
    main()
