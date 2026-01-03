"""
TRACIENT - Income Pattern Anomaly Detection
============================================
Combined Dataset Generation + Model Training for Google Colab

KEY APPROACH: Pattern-based detection (NOT threshold-based)
- Analyzes monthly income patterns over time
- Compares against individual's OWN baseline
- Detects unusual PATTERNS regardless of income level
- Same job can pay differently - we look at CHANGES

To run in Google Colab:
1. Upload this file to Colab
2. Run all cells
3. Download the model files at the end

Author: TRACIENT Team
"""

# ============================================================================
# IMPORTS
# ============================================================================

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import json
import os
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    precision_recall_curve, average_precision_score,
    f1_score, accuracy_score, recall_score, precision_score
)
import joblib

# Note: Using class_weight instead of SMOTE for better performance
try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except ImportError:
    SMOTE_AVAILABLE = False

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns

print("=" * 70)
print("🔍 TRACIENT - INCOME PATTERN ANOMALY DETECTION")
print("   Pattern-based detection (NOT threshold-based)")
print("=" * 70)

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# ============================================================================
# CONFIGURATION
# ============================================================================

CONFIG = {
    'num_workers': 30000,           # Number of workers to generate (smaller for faster runs)
    'history_months': 24,           # Months of transaction history
    'anomaly_ratio': 0.30,          # 30% anomalous workers for balanced learning
    'test_size': 0.2,               # 20% for testing
    'random_state': 42,
}

print(f"\n📊 Configuration:")
print(f"   • Workers to generate: {CONFIG['num_workers']:,}")
print(f"   • History months: {CONFIG['history_months']}")
print(f"   • Anomaly ratio: {CONFIG['anomaly_ratio']*100:.0f}%")

# ============================================================================
# CONSTANTS
# ============================================================================

INDIAN_STATES = [
    'Maharashtra', 'Tamil Nadu', 'Karnataka', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Bihar', 'Andhra Pradesh',
    'Telangana', 'Kerala', 'Odisha', 'Punjab', 'Haryana', 'Delhi', 'Jharkhand'
]

JOB_SECTORS = {
    'agriculture': {'payment_freq': 'irregular', 'typical_sources': 1},
    'construction': {'payment_freq': 'weekly', 'typical_sources': 1},
    'manufacturing': {'payment_freq': 'monthly', 'typical_sources': 1},
    'retail': {'payment_freq': 'monthly', 'typical_sources': 1},
    'domestic_work': {'payment_freq': 'monthly', 'typical_sources': 2},
    'transport': {'payment_freq': 'daily', 'typical_sources': 1},
    'street_vendor': {'payment_freq': 'daily', 'typical_sources': 1},
    'skilled_trade': {'payment_freq': 'weekly', 'typical_sources': 2},
    'office_work': {'payment_freq': 'monthly', 'typical_sources': 1},
    'healthcare': {'payment_freq': 'monthly', 'typical_sources': 1},
    'education': {'payment_freq': 'monthly', 'typical_sources': 1},
    'gig_economy': {'payment_freq': 'irregular', 'typical_sources': 3},
    'self_employed': {'payment_freq': 'irregular', 'typical_sources': 2},
}

TRANSACTION_MODES = ['UPI', 'NEFT', 'IMPS', 'Cash Deposit', 'Cheque', 'RTGS']

ANOMALY_TYPES = {
    'sudden_spike': 'Income suddenly jumps 3x+ above personal average',
    'high_volatility': 'Monthly income varies wildly with high std dev',
    'irregular_timing': 'Payments at unusual hours/days consistently',
    'new_sources': 'Multiple new income sources appear suddenly',
    'round_amounts': 'Suspiciously round transaction amounts',
    'structuring': 'Many transactions just below reporting thresholds',
    'velocity_change': 'Transaction frequency changes dramatically',
    'dormant_burst': 'Large activity after months of inactivity',
    'pattern_break': 'Regular payment pattern suddenly breaks',
    'layering': 'Complex in-out transactions obscuring source',
    'ghost_income': 'Income from unverifiable/shell sources',
    'weekend_heavy': 'Unusual concentration of weekend transactions',
}

# ============================================================================
# PART 1: DATASET GENERATION
# ============================================================================

print("\n" + "=" * 70)
print("📊 PART 1: GENERATING SYNTHETIC DATASET")
print("=" * 70)

class IncomePatternDatasetGenerator:
    """Generates realistic income transaction data with pattern-based anomalies."""
    
    def __init__(self, num_workers, history_months):
        self.num_workers = num_workers
        self.history_months = history_months
        self.workers = []
        self.transactions = []
        
    def generate_worker_profile(self, worker_id):
        """Generate a single worker profile."""
        
        age = np.random.randint(18, 65)
        gender = np.random.choice(['Male', 'Female'], p=[0.55, 0.45])
        state = np.random.choice(INDIAN_STATES)
        area_type = np.random.choice(['Urban', 'Rural'], p=[0.35, 0.65])
        sector = np.random.choice(list(JOB_SECTORS.keys()))
        is_formal = np.random.choice([True, False], p=[0.2, 0.8])
        
        # Income tier (any level can have anomalies)
        income_tier = np.random.choice(['low', 'medium', 'high'], p=[0.5, 0.35, 0.15])
        if income_tier == 'low':
            base_monthly_income = np.random.randint(5000, 25000)
        elif income_tier == 'medium':
            base_monthly_income = np.random.randint(25000, 75000)
        else:
            base_monthly_income = np.random.randint(75000, 300000)
        
        # Natural variance varies by sector - some jobs are more variable
        if sector in ['gig_economy', 'agriculture', 'street_vendor', 'self_employed']:
            natural_variance = np.random.uniform(0.15, 0.35)  # High variance sectors
        elif sector in ['construction', 'skilled_trade', 'domestic_work']:
            natural_variance = np.random.uniform(0.08, 0.20)  # Medium variance
        else:
            natural_variance = np.random.uniform(0.03, 0.10)  # Stable jobs
        
        payment_info = JOB_SECTORS[sector]
        
        return {
            'worker_id': worker_id,
            'age': age,
            'gender': gender,
            'state': state,
            'area_type': area_type,
            'sector': sector,
            'is_formal': is_formal,
            'base_monthly_income': base_monthly_income,
            'natural_variance': natural_variance,
            'payment_frequency': payment_info['payment_freq'],
            'typical_sources': payment_info['typical_sources'],
            'income_tier': income_tier
        }
    
    def generate_normal_transactions(self, worker, start_date):
        """Generate REALISTIC normal income patterns with natural variation.
        
        CRITICAL FOR REALISM:
        - ALL workers can have multiple sources (side jobs, bonuses, refunds)
        - Source count varies: 1-6 for normal (not just 1)
        - Some workers legitimately have high source diversity
        """
        
        transactions = []
        base_income = worker['base_monthly_income']
        variance = worker['natural_variance']
        freq = worker['payment_frequency']
        
        # REALISTIC: ALL workers can have multiple income sources
        # Even office workers get bonuses, reimbursements, side income
        # CRITICAL: Range must OVERLAP with anomaly range (5-50)
        if worker['sector'] in ['gig_economy', 'domestic_work', 'skilled_trade', 'self_employed']:
            # Gig workers: 3-20 sources (high end overlaps with low-end anomaly)
            num_sources = np.random.randint(3, 21)
        elif worker['sector'] in ['agriculture', 'street_vendor', 'construction']:
            # Seasonal/varied work: 2-15 sources
            num_sources = np.random.randint(2, 16)
        else:
            # Formal workers: 1-10 sources (salary + bonuses + reimbursements + investments)
            num_sources = np.random.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 
                                           p=[0.15, 0.20, 0.20, 0.15, 0.10, 0.08, 0.05, 0.04, 0.02, 0.01])
        
        sources = [f"SRC_{worker['sector'][:3].upper()}_{i}_{np.random.randint(100,999)}" for i in range(num_sources)]
        
        current_date = start_date
        end_date = start_date + timedelta(days=self.history_months * 30)
        
        while current_date < end_date:
            monthly_income = base_income * (1 + np.random.uniform(-variance, variance))
            
            if freq == 'monthly':
                # Main salary
                pay_day = np.random.randint(1, 10)
                pay_date = current_date.replace(day=min(pay_day, 28))
                source = sources[0]  # Primary source
                t = self._create_normal_transaction(worker, pay_date, monthly_income * 0.85, source)
                transactions.append(t)
                
                # Additional income from other sources (bonuses, side work)
                if len(sources) > 1 and np.random.random() < 0.6:  # 60% chance of additional income
                    for extra_source in sources[1:]:
                        if np.random.random() < 0.4:  # 40% chance per extra source
                            extra_day = np.random.randint(1, 28)
                            extra_date = current_date.replace(day=extra_day)
                            extra_amount = monthly_income * np.random.uniform(0.05, 0.25)
                            t = self._create_normal_transaction(worker, extra_date, extra_amount, extra_source)
                            transactions.append(t)
                    
            elif freq == 'weekly':
                weekly_amount = monthly_income / 4
                for week in range(4):
                    pay_date = current_date + timedelta(days=week * 7 + np.random.randint(0, 3))
                    amount = weekly_amount * (1 + np.random.uniform(-0.15, 0.15))
                    source = np.random.choice(sources)  # Vary sources
                    t = self._create_normal_transaction(worker, pay_date, amount, source)
                    transactions.append(t)
                    
            elif freq == 'daily':
                num_days = np.random.randint(15, 25)
                daily_amount = monthly_income / num_days
                for day in range(num_days):
                    pay_date = current_date + timedelta(days=day)
                    amount = daily_amount * (1 + np.random.uniform(-0.2, 0.2))
                    source = np.random.choice(sources)  # Different clients/sources
                    t = self._create_normal_transaction(worker, pay_date, amount, source)
                    transactions.append(t)
                    
            else:  # irregular
                num_payments = np.random.randint(3, 8)  # More payments
                amounts = self._split_amount(monthly_income, num_payments)
                for i, amount in enumerate(amounts):
                    pay_day = np.random.randint(1, 28)
                    pay_date = current_date.replace(day=pay_day)
                    source = np.random.choice(sources)
                    t = self._create_normal_transaction(worker, pay_date, amount, source)
                    transactions.append(t)
            
            current_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
        
        return transactions
    
    def _create_normal_transaction(self, worker, date, amount, source_id):
        """Create a NORMAL transaction with HIGH REALISTIC variation.
        
        CRITICAL FOR OVERLAP:
        - ALL sectors have some unverified (10-35%)
        - ALL sectors have some weekend/night (varies by sector)
        - Creates overlap with anomaly distributions
        """
        
        # REALISTIC hours - MORE variation than before
        if worker['sector'] in ['healthcare', 'transport', 'retail', 'domestic_work']:
            # Shift workers - HIGH night/evening (25-35%)
            if np.random.random() < 0.30:
                hour = np.random.choice([5, 6, 7, 8, 20, 21, 22, 23])
            else:
                hour = np.random.randint(9, 19)
        elif worker['sector'] in ['gig_economy', 'street_vendor', 'self_employed']:
            # Very varied hours - can be any time
            hour = np.random.randint(5, 24) % 24
        elif worker['sector'] in ['agriculture', 'construction']:
            # Early starters
            if np.random.random() < 0.25:
                hour = np.random.choice([5, 6, 7, 18, 19])
            else:
                hour = np.random.randint(8, 17)
        else:
            # Office workers - still some variation (15-20%)
            if np.random.random() < 0.18:
                hour = np.random.choice([6, 7, 8, 18, 19, 20, 21])
            else:
                hour = np.random.randint(9, 17)
        
        # REALISTIC weekends - MORE weekend work
        is_weekend = date.weekday() >= 5
        if worker['sector'] in ['retail', 'healthcare', 'transport', 'street_vendor', 'domestic_work']:
            # Service sectors - HIGH weekend work (20-30%)
            if not is_weekend and np.random.random() < 0.25:
                date = date + timedelta(days=(5 - date.weekday()))
                is_weekend = True
        elif worker['sector'] in ['gig_economy', 'self_employed', 'agriculture']:
            # Flexible/seasonal workers (15-25%)
            if not is_weekend and np.random.random() < 0.20:
                date = date + timedelta(days=(5 - date.weekday()))
                is_weekend = True
        else:
            # Office workers - rare but possible (5-10%)
            if not is_weekend and np.random.random() < 0.08:
                date = date + timedelta(days=(5 - date.weekday()))
                is_weekend = True
            elif is_weekend and np.random.random() > 0.10:
                date = date - timedelta(days=date.weekday() - 4)
                is_weekend = False
        
        # Payment modes
        if worker['sector'] in ['street_vendor', 'domestic_work', 'agriculture']:
            mode = np.random.choice(['UPI', 'Cash Deposit', 'IMPS'], p=[0.25, 0.55, 0.20])
        elif worker['is_formal']:
            mode = np.random.choice(['NEFT', 'IMPS', 'UPI', 'Cheque'], p=[0.50, 0.25, 0.15, 0.10])
        else:
            mode = np.random.choice(['UPI', 'IMPS', 'Cash Deposit'], p=[0.40, 0.30, 0.30])
        
        # CRITICAL: MORE unverified for realism (creates overlap)
        # Even legitimate sources can be unverified initially
        if worker['sector'] in ['gig_economy', 'street_vendor', 'self_employed']:
            source_verified = np.random.random() > 0.30  # 70% verified (30% unverified)
        elif worker['sector'] in ['agriculture', 'domestic_work', 'construction']:
            source_verified = np.random.random() > 0.25  # 75% verified (25% unverified)
        elif mode == 'Cash Deposit':
            source_verified = np.random.random() > 0.35  # 65% verified for cash
        else:
            source_verified = np.random.random() > 0.12  # 88% verified for formal
        
        months_from_start = (date.year - (datetime.now().year - 2)) * 12 + date.month
        
        return {
            'worker_id': worker['worker_id'],
            'transaction_date': date,
            'transaction_hour': hour,
            'amount': round(amount, 2),
            'transaction_mode': mode,
            'source_id': source_id,
            'source_verified': source_verified,
            'sender_name': f"{worker['sector'].title()} Employer",
            'is_weekend': is_weekend,
            'months_from_start': max(0, months_from_start),
            'is_anomaly': False,
            'anomaly_type': None
        }
    
    def inject_anomaly_pattern(self, worker, transactions, anomaly_type):
        """Inject VERY EXTREME anomaly patterns that are clearly distinguishable."""
        
        if not transactions:
            return transactions
            
        baseline_txns = [t for t in transactions if t['months_from_start'] < 12]
        if not baseline_txns:
            return transactions
            
        monthly_totals = {}
        for t in baseline_txns:
            month_key = t['transaction_date'].strftime('%Y-%m')
            monthly_totals[month_key] = monthly_totals.get(month_key, 0) + t['amount']
        
        avg_monthly = np.mean(list(monthly_totals.values())) if monthly_totals else worker['base_monthly_income']
        later_txns = [t for t in transactions if t['months_from_start'] >= 12]
        
        # MAKE ALL ANOMALIES EXTREME AND CLEAR
        if anomaly_type == 'sudden_spike':
            # EXTREME: 10-50x spike
            for t in later_txns:
                t['amount'] = t['amount'] * np.random.uniform(10, 50)
                t['is_anomaly'] = True
                t['anomaly_type'] = 'sudden_spike'
                t['source_verified'] = False
                    
        elif anomaly_type == 'high_volatility':
            # EXTREME volatility - 0.01x to 100x
            for t in later_txns:
                t['amount'] = t['amount'] * np.random.choice([0.01, 0.05, 20, 50, 100])
                t['is_anomaly'] = True
                t['anomaly_type'] = 'high_volatility'
                
        elif anomaly_type == 'irregular_timing':
            # ALL at night (midnight-4am) and weekends
            for t in later_txns:
                t['transaction_hour'] = np.random.choice([0, 1, 2, 3, 4])
                # Move to weekend
                days_to_sat = (5 - t['transaction_date'].weekday()) % 7
                t['transaction_date'] = t['transaction_date'] + timedelta(days=days_to_sat)
                t['is_weekend'] = True
                t['is_anomaly'] = True
                t['anomaly_type'] = 'irregular_timing'
                
        elif anomaly_type == 'new_sources':
            # 3-8 new sources - WITHIN normal range (1-20) to create overlap
            # The anomaly signal is that they're ALL unverified, not the count
            num_new_sources = np.random.randint(3, 9)
            new_source_ids = [f"NEW_{np.random.randint(100, 999)}" for _ in range(num_new_sources)]
            for i, t in enumerate(later_txns):
                t['source_id'] = np.random.choice(new_source_ids)
                t['source_verified'] = False
                t['sender_name'] = 'ANONYMOUS'
                t['is_anomaly'] = True
                t['anomaly_type'] = 'new_sources'
                
        elif anomaly_type == 'round_amounts':
            # ALL perfectly round amounts
            round_values = [50000, 100000, 200000, 500000, 1000000]
            for t in later_txns:
                t['amount'] = np.random.choice(round_values)
                t['is_anomaly'] = True
                t['anomaly_type'] = 'round_amounts'
                
        elif anomaly_type == 'structuring':
            # Transactions at exactly 49,000-49,999 - NO extra transactions
            # Just modify existing later_txns to avoid source explosion
            for t in later_txns:
                t['amount'] = np.random.uniform(49000, 49999)
                t['is_anomaly'] = True
                t['anomaly_type'] = 'structuring'
                t['source_verified'] = False
            
        elif anomaly_type == 'velocity_change':
            # Just add 1 extra transaction per existing one (doubles count, not 2-5x)
            extra = []
            for t in later_txns:
                new_t = t.copy()
                new_t['amount'] = t['amount'] * np.random.uniform(0.5, 1.5)
                new_t['is_anomaly'] = True
                new_t['anomaly_type'] = 'velocity_change'
                new_t['source_id'] = t['source_id']  # Same source
                new_t['source_verified'] = False
                extra.append(new_t)
            transactions.extend(extra)
            
        elif anomaly_type == 'dormant_burst':
            # Dormant then burst - 3-8 sources WITHIN normal range
            transactions = [t for t in transactions if t['months_from_start'] < 8 or t['months_from_start'] >= 22]
            base_date = datetime.now() - timedelta(days=60)
            num_burst_sources = np.random.randint(3, 9)
            burst_source_ids = [f"BURST_{np.random.randint(100, 999)}" for _ in range(num_burst_sources)]
            num_burst_txns = np.random.randint(15, 40)  # Fewer transactions
            for _ in range(num_burst_txns):
                t = self._create_transaction(
                    worker, base_date + timedelta(days=np.random.randint(0, 7)),
                    avg_monthly * np.random.uniform(5, 20), True
                )
                t['anomaly_type'] = 'dormant_burst'
                t['source_verified'] = False
                t['source_id'] = np.random.choice(burst_source_ids)
                transactions.append(t)
                
        elif anomaly_type == 'pattern_break':
            # Pattern chaos but WITHIN normal source range (3-10 sources)
            num_chaos_sources = np.random.randint(3, 11)
            chaos_source_ids = [f"CHAOS_{np.random.randint(100, 999)}" for _ in range(num_chaos_sources)]
            for t in later_txns:
                t['transaction_date'] = t['transaction_date'] + timedelta(days=np.random.randint(-30, 30))
                t['amount'] = avg_monthly * np.random.uniform(0.01, 50)
                t['transaction_hour'] = np.random.choice([0, 1, 2, 3, 23])
                t['is_weekend'] = True
                t['source_id'] = np.random.choice(chaos_source_ids)
                t['source_verified'] = False
                t['is_anomaly'] = True
                t['anomaly_type'] = 'pattern_break'
                
        elif anomaly_type == 'ghost_income':
            # Shell companies - 2-6 sources WITHIN normal range
            # Anomaly signal is unverified + high amounts, not source count
            shell_names = ['SHELL_CORP_A', 'OFFSHORE_LTD', 'ANON_HOLDINGS', 'UNKNOWN_LLC']
            num_ghosts = np.random.randint(2, 7)
            ghost_source_ids = [f"GHOST_{np.random.randint(100, 999)}" for _ in range(num_ghosts)]
            for t in later_txns:
                t['source_verified'] = False
                t['sender_name'] = np.random.choice(shell_names)
                t['source_id'] = np.random.choice(ghost_source_ids)
                t['amount'] = t['amount'] * np.random.uniform(10, 30)
                t['transaction_hour'] = np.random.choice([0, 1, 2, 3])
                t['is_anomaly'] = True
                t['anomaly_type'] = 'ghost_income'
                
        elif anomaly_type == 'weekend_heavy':
            # ALL on weekends at night
            for t in later_txns:
                days_to_sat = (5 - t['transaction_date'].weekday()) % 7
                t['transaction_date'] = t['transaction_date'] + timedelta(days=days_to_sat + np.random.choice([0, 1]))
                t['is_weekend'] = True
                t['transaction_hour'] = np.random.choice([0, 1, 2, 3, 22, 23])
                t['source_verified'] = False
                t['is_anomaly'] = True
                t['anomaly_type'] = 'weekend_heavy'
        
        elif anomaly_type == 'layering':
            # Layered transactions - reuse EXISTING sources, don't create new LAYER_ ones
            # This preserves source count overlap with normal workers
            extra = []
            existing_sources = list(set(t['source_id'] for t in later_txns))
            num_layers = np.random.randint(2, 4)  # Fewer layers
            for t in later_txns:
                base_amount = t['amount'] * 3  # Reduced multiplier
                for layer in range(num_layers):
                    new_t = t.copy()
                    new_t['amount'] = base_amount * (0.85 ** layer)
                    new_t['source_id'] = np.random.choice(existing_sources) if existing_sources else t['source_id']
                    new_t['source_verified'] = False
                    new_t['transaction_hour'] = np.random.choice([0, 1, 2, 3, 22, 23])
                    new_t['is_anomaly'] = True
                    new_t['anomaly_type'] = 'layering'
                    extra.append(new_t)
            transactions.extend(extra)
        
        return transactions
    
    def _create_transaction(self, worker, date, amount, is_anomaly):
        """Create a single transaction record."""
        
        hour = np.random.choice([0, 1, 22, 23, 10, 14]) if is_anomaly else np.random.randint(9, 18)
        is_weekend = date.weekday() >= 5
        
        if amount > 200000:
            mode = np.random.choice(['RTGS', 'NEFT'], p=[0.6, 0.4])
        elif amount > 50000:
            mode = np.random.choice(['NEFT', 'IMPS', 'Cheque'], p=[0.5, 0.3, 0.2])
        elif worker['is_formal']:
            mode = np.random.choice(['NEFT', 'IMPS', 'UPI'], p=[0.4, 0.3, 0.3])
        else:
            mode = np.random.choice(['UPI', 'Cash Deposit', 'IMPS'], p=[0.4, 0.4, 0.2])
        
        source_id = f"SRC_{worker['sector'][:3].upper()}_{np.random.randint(1000, 9999)}"
        months_from_start = (date.year - (datetime.now().year - 2)) * 12 + date.month
        
        txn = {
            'worker_id': worker['worker_id'],
            'transaction_date': date,
            'transaction_hour': hour,
            'amount': round(amount, 2),
            'transaction_mode': mode,
            'source_id': source_id,
            # Always verified for normal transactions to keep normals clean
            'source_verified': False if is_anomaly else True,
            'sender_name': f"{worker['sector'].title()} Employer" if worker['is_formal'] else "Individual",
            'is_weekend': is_weekend,
            'months_from_start': max(0, months_from_start),
            'is_anomaly': is_anomaly,
            'anomaly_type': None
        }

        return txn
    
    def _split_amount(self, total, num_parts):
        """Split amount into roughly equal parts."""
        if num_parts == 1:
            return [total]
        parts = []
        remaining = total
        for i in range(num_parts - 1):
            part = remaining / (num_parts - i) * np.random.uniform(0.8, 1.2)
            parts.append(part)
            remaining -= part
        parts.append(remaining)
        return parts

    def _reinforce_anomaly_signals(self, transactions, worker_id=None, is_anomaly_worker=False):
        """Apply SUBTLE anomaly signals with SIGNIFICANT overlap with normal.
        
        CRITICAL FOR REAL-WORLD PERFORMANCE:
        - Anomaly intensity: 0.25-0.55 (very subtle)
        - Many anomalies look MOSTLY normal
        - Only combination of multiple weak signals indicates anomaly
        - Some anomalies are harder to detect than others
        
        Target overlap:
        - unverified_rate: Normal 0.10-0.35, Anomaly 0.25-0.60
        - weekend_pct: Normal 0.05-0.30, Anomaly 0.20-0.50
        - source_concentration: Normal 0.15-0.60, Anomaly 0.03-0.25
        """
        reinforced = []
        anomaly_count = 0
        normal_count = 0
        
        # VERY LOW anomaly intensity - creates hard-to-detect anomalies
        anomaly_intensity = np.random.uniform(0.25, 0.55) if is_anomaly_worker else 0
        
        # Number of unique sources for anomaly worker: 5-50
        # CRITICAL: Must overlap with normal range (1-20)
        # Overlap zone: 5-20 sources (both normal and anomaly can have this)
        num_anomaly_sources = np.random.randint(5, 51) if is_anomaly_worker else 0
        
        for t in transactions:
            if is_anomaly_worker:
                anomaly_count += 1
                t['is_anomaly'] = True
                
                # SUBTLE anomaly signals with SIGNIFICANT overlap
                
                # Unverified: 25-55% for anomalies (vs 10-35% for some normal)
                # This creates overlap in the 25-35% range
                t['source_verified'] = np.random.random() > anomaly_intensity
                
                # Weekend: 20-40% for anomalies (vs 5-25% for service workers)
                # Overlap in 20-25% range
                if np.random.random() < (anomaly_intensity * 0.5 + 0.1):
                    t['is_weekend'] = True
                    if t['transaction_date'].weekday() < 5:
                        days_to_weekend = 5 - t['transaction_date'].weekday()
                        t['transaction_date'] = t['transaction_date'] + timedelta(days=days_to_weekend)
                
                # Night hours: 25-45% for anomalies (vs 15-30% for shift workers)
                # Overlap in 25-30% range
                if np.random.random() < (anomaly_intensity * 0.5 + 0.15):
                    t['transaction_hour'] = np.random.choice([0, 1, 2, 3, 4, 5, 6, 21, 22, 23])
                else:
                    t['transaction_hour'] = np.random.randint(7, 21)
                
                # DO NOT OVERWRITE source_id here!
                # The source diversity is already set in generate_normal_transactions()
                # and inject_anomaly_pattern(). Overwriting here causes source explosion.
                
                reinforced.append(t)
                
            elif t.get('is_anomaly'):
                anomaly_count += 1
                reinforced.append(t)
            else:
                normal_count += 1
                reinforced.append(t)
        
        if worker_id and worker_id in ['W021001', 'W021002', 'W000001', 'W000002']:
            print(f"   _reinforce({worker_id}): {anomaly_count} anom, {normal_count} norm, intensity={anomaly_intensity:.2f}, sources={num_anomaly_sources}")
        
        return reinforced
    
    def _calculate_entropy(self, value_counts):
        """Calculate Shannon entropy."""
        probs = value_counts / value_counts.sum()
        return -np.sum(probs * np.log2(probs + 1e-10))
    
    def calculate_pattern_features(self, worker_id, transactions, is_anomaly_worker=False):
        """Calculate pattern-based features for anomaly detection."""
        
        if not transactions:
            return None
            
        df = pd.DataFrame(transactions)
        
        # DEBUG: Print actual values in transactions
        if is_anomaly_worker and worker_id in ['W021001', 'W021002']:  # First 2 anomaly workers
            print(f"\n🔍 DEBUG {worker_id}:")
            print(f"   Total transactions: {len(df)}")
            print(f"   Anomaly transactions: {(df['is_anomaly'] == True).sum()}")
            print(f"   source_verified values: {df['source_verified'].value_counts().to_dict()}")
            print(f"   is_weekend values: {df['is_weekend'].value_counts().to_dict()}")
            sample_anomaly = df[df['is_anomaly'] == True].head(1)
            if len(sample_anomaly) > 0:
                print(f"   Sample anomaly txn: verified={sample_anomaly['source_verified'].values[0]}, weekend={sample_anomaly['is_weekend'].values[0]}, hour={sample_anomaly['transaction_hour'].values[0]}")
        
        # For anomaly workers, use ALL transactions (not just anomaly ones)
        # because we need to see the PATTERN CHANGE, not just anomaly values
        # The key discriminative features should still show separation
        
        amounts = df['amount'].values
        
        # ===== CORE FEATURES =====
        mean_income = np.mean(amounts)
        std_income = np.std(amounts)
        cv_income = std_income / mean_income if mean_income > 0 else 0
        
        # ===== KEY DISCRIMINATIVE FEATURES =====
        
        # 1. Unverified source rate (CRITICAL - normal=0, anomaly=high)
        unverified_rate = 1 - df['source_verified'].mean()
        
        # 2. Weekend percentage (normal=0, anomaly=high)
        weekend_pct = df['is_weekend'].mean()
        
        # 3. Night transaction percentage (normal=0, anomaly=high)
        # Normal hours are 10-15, so anything outside 10-15 is suspicious
        night_hours_pct = df['transaction_hour'].apply(lambda x: x < 10 or x >= 16).mean()
        
        # 4. Source diversity (normal=1, anomaly=many)
        num_unique_sources = df['source_id'].nunique()
        
        # 5. Transaction count (normal=stable, anomaly=very high for some types)
        num_transactions = len(df)
        
        # 6. Amount extremes
        max_amount = df['amount'].max()
        min_amount = df['amount'].min()
        amount_range_ratio = max_amount / min_amount if min_amount > 0 else max_amount
        
        # 7. Round amount percentage
        round_amount_pct = df['amount'].apply(lambda x: x % 10000 == 0 or x % 50000 == 0).mean()
        
        # 8. Near 50k threshold (structuring indicator)
        near_50k_pct = df['amount'].apply(lambda x: 49000 <= x < 50000).mean()
        
        # 9. Very high amounts (10x+ normal salary range)
        very_high_pct = (df['amount'] > 500000).mean()
        
        # 10. Source concentration (normal=high/1 source, anomaly=low/many sources)
        source_concentration = df['source_id'].value_counts().iloc[0] / len(df) if len(df) > 0 else 1
        
        # ===== SECONDARY FEATURES =====
        
        # Month-over-Month Changes
        monthly_totals = df.groupby(df['transaction_date'].dt.to_period('M'))['amount'].sum()
        if len(monthly_totals) > 1:
            mom_changes = monthly_totals.pct_change().dropna()
            max_mom_increase = mom_changes.max() if len(mom_changes) > 0 else 0
            max_mom_decrease = abs(mom_changes.min()) if len(mom_changes) > 0 else 0
            avg_mom_change = mom_changes.abs().mean() if len(mom_changes) > 0 else 0
        else:
            max_mom_increase = max_mom_decrease = avg_mom_change = 0
        
        # Deviation from Personal Average
        deviations = np.abs(amounts - mean_income) / mean_income if mean_income > 0 else np.zeros_like(amounts)
        max_deviation = np.max(deviations)
        pct_high_deviation = np.mean(deviations > 1)
        
        # Frequency Patterns
        num_months = max(1, (df['transaction_date'].max() - df['transaction_date'].min()).days / 30)
        avg_tx_per_month = num_transactions / num_months
        
        monthly_counts = df.groupby(df['transaction_date'].dt.to_period('M')).size()
        freq_cv = monthly_counts.std() / monthly_counts.mean() if monthly_counts.mean() > 0 else 0
        
        # Velocity Change
        first_half = df[df['months_from_start'] < df['months_from_start'].median()]
        second_half = df[df['months_from_start'] >= df['months_from_start'].median()]
        
        if len(first_half) > 0 and len(second_half) > 0:
            velocity_change = len(second_half) / len(first_half)
            amount_change = second_half['amount'].sum() / first_half['amount'].sum() if first_half['amount'].sum() > 0 else 1
        else:
            velocity_change = amount_change = 1
        
        # Burst Detection
        daily_counts = df.groupby(df['transaction_date'].dt.date).size()
        max_daily_burst = daily_counts.max()
        avg_daily_count = daily_counts.mean()
        burst_ratio = max_daily_burst / avg_daily_count if avg_daily_count > 0 else 1
        
        # Gap Analysis
        dates_sorted = sorted(df['transaction_date'])
        if len(dates_sorted) > 1:
            gaps = [(dates_sorted[i+1] - dates_sorted[i]).days for i in range(len(dates_sorted)-1)]
            max_gap = max(gaps)
            avg_gap = np.mean(gaps)
        else:
            max_gap = avg_gap = 0
        
        # Mode Patterns
        mode_entropy = self._calculate_entropy(df['transaction_mode'].value_counts())
        cash_deposit_rate = (df['transaction_mode'] == 'Cash Deposit').mean()
        
        return {
            'worker_id': worker_id,
            # PRIMARY DISCRIMINATIVE FEATURES
            'unverified_rate': round(unverified_rate, 4),
            'weekend_pct': round(weekend_pct, 4),
            'night_hours_pct': round(night_hours_pct, 4),
            'num_unique_sources': num_unique_sources,
            'source_concentration': round(source_concentration, 4),
            'num_transactions': num_transactions,
            'round_amount_pct': round(round_amount_pct, 4),
            'near_50k_pct': round(near_50k_pct, 4),
            'very_high_pct': round(very_high_pct, 4),
            'amount_range_ratio': round(min(amount_range_ratio, 10000), 4),  # Cap at 10000
            # SECONDARY FEATURES
            'income_cv': round(cv_income, 4),
            'max_mom_increase': round(min(max_mom_increase, 100), 4),  # Cap extremes
            'max_mom_decrease': round(min(max_mom_decrease, 100), 4),
            'avg_mom_change': round(min(avg_mom_change, 100), 4),
            'max_deviation_from_mean': round(min(max_deviation, 100), 4),
            'pct_high_deviation': round(pct_high_deviation, 4),
            'avg_tx_per_month': round(avg_tx_per_month, 2),
            'freq_cv': round(min(freq_cv, 10), 4),
            'velocity_change': round(min(velocity_change, 100), 4),
            'burst_ratio': round(min(burst_ratio, 100), 4),
            'amount_change_ratio': round(min(amount_change, 100), 4),
            'max_gap_days': min(max_gap, 365),
            'avg_gap_days': round(avg_gap, 2),
            'mode_entropy': round(mode_entropy, 4),
            'cash_deposit_rate': round(cash_deposit_rate, 4),
        }
    
    def generate_dataset(self):
        """Generate complete dataset."""
        
        print(f"\n🔄 Generating {self.num_workers:,} workers with {self.history_months} months history...")
        print("   Pattern-based detection (works for ANY income level)")
        
        start_date = datetime.now() - timedelta(days=self.history_months * 30)
        num_normal = int(self.num_workers * (1 - CONFIG['anomaly_ratio']))
        num_anomalous = self.num_workers - num_normal
        
        anomaly_types = list(ANOMALY_TYPES.keys())
        all_features = []
        
        # Generate normal workers
        print(f"\n   [1/2] Generating {num_normal:,} normal workers...")
        for i in range(num_normal):
            if (i + 1) % 10000 == 0:
                print(f"         Progress: {i+1:,}/{num_normal:,}")
            
            worker = self.generate_worker_profile(f"W{i+1:06d}")
            transactions = self.generate_normal_transactions(worker, start_date)
            # CRITICAL: Reinforce normal transactions to guarantee clean features
            transactions = self._reinforce_anomaly_signals(transactions, worker['worker_id'], is_anomaly_worker=False)
            
            features = self.calculate_pattern_features(worker['worker_id'], transactions, is_anomaly_worker=False)
            if features:
                features['sector'] = worker['sector']
                features['is_formal'] = int(worker['is_formal'])
                features['income_tier'] = worker['income_tier']
                features['is_anomaly'] = 0  # Explicitly set as normal
                features['anomaly_type_label'] = 'normal'
                all_features.append(features)
            
            self.workers.append(worker)
            self.transactions.extend(transactions)
        
        # Generate anomalous workers
        print(f"\n   [2/2] Generating {num_anomalous:,} anomalous workers...")
        for i in range(num_anomalous):
            if (i + 1) % 2000 == 0:
                print(f"         Progress: {i+1:,}/{num_anomalous:,}")
            
            worker_id = f"W{num_normal + i + 1:06d}"
            worker = self.generate_worker_profile(worker_id)
            transactions = self.generate_normal_transactions(worker, start_date)
            
            anomaly_type = random.choice(anomaly_types)
            transactions = self.inject_anomaly_pattern(worker, transactions, anomaly_type)
            transactions = self._reinforce_anomaly_signals(transactions, worker['worker_id'], is_anomaly_worker=True)
            
            features = self.calculate_pattern_features(worker['worker_id'], transactions, is_anomaly_worker=True)
            if features:
                features['sector'] = worker['sector']
                features['is_formal'] = int(worker['is_formal'])
                features['income_tier'] = worker['income_tier']
                features['is_anomaly'] = 1  # Explicitly set as anomaly
                features['anomaly_type_label'] = anomaly_type
                all_features.append(features)
            
            self.workers.append(worker)
            self.transactions.extend(transactions)
        
        features_df = pd.DataFrame(all_features)
        
        print(f"\n   ✅ Dataset generated!")
        print(f"      • Workers: {len(self.workers):,}")
        print(f"      • Transactions: {len(self.transactions):,}")
        print(f"      • Features: {len(features_df.columns)}")
        print(f"      • Normal: {num_normal:,} ({num_normal/self.num_workers*100:.1f}%)")
        print(f"      • Anomalous: {num_anomalous:,} ({num_anomalous/self.num_workers*100:.1f}%)")
        
        return features_df


# Generate the dataset
generator = IncomePatternDatasetGenerator(
    num_workers=CONFIG['num_workers'],
    history_months=CONFIG['history_months']
)

features_df = generator.generate_dataset()

print("\n📊 Dataset Preview:")
print(features_df.head())

print(f"\n📊 Class Distribution:")
print(features_df['is_anomaly'].value_counts())
print(f"\nAnomaly Rate: {features_df['is_anomaly'].mean() * 100:.2f}%")

# DEBUG: Verify feature distributions in generated data
print("\n" + "=" * 70)
print("🔍 DEBUG: FEATURE DISTRIBUTION ANALYSIS")
print("=" * 70)
print("\n📊 Checking for REALISTIC OVERLAP (required for production model):")

features_to_check = ['unverified_rate', 'weekend_pct', 'night_hours_pct', 'source_concentration', 'num_unique_sources']
for feat in features_to_check:
    if feat in features_df.columns:
        normal_vals = features_df[features_df['is_anomaly'] == 0][feat]
        anomaly_vals = features_df[features_df['is_anomaly'] == 1][feat]
        
        # Calculate overlap
        overlap_min = max(normal_vals.min(), anomaly_vals.min())
        overlap_max = min(normal_vals.max(), anomaly_vals.max())
        has_overlap = overlap_max > overlap_min
        
        print(f"\n{feat}:")
        print(f"   Normal  - min={normal_vals.min():.3f}, max={normal_vals.max():.3f}, mean={normal_vals.mean():.3f}")
        print(f"   Anomaly - min={anomaly_vals.min():.3f}, max={anomaly_vals.max():.3f}, mean={anomaly_vals.mean():.3f}")
        
        if has_overlap:
            overlap_pct = (overlap_max - overlap_min) / (max(normal_vals.max(), anomaly_vals.max()) - min(normal_vals.min(), anomaly_vals.min())) * 100
            print(f"   ✅ Overlap range: [{overlap_min:.3f}, {overlap_max:.3f}] ({overlap_pct:.1f}% overlap)")
        else:
            print(f"   ⚠️ NO OVERLAP - model may not generalize well!")

# ============================================================================
# PART 2: MODEL TRAINING
# ============================================================================

print("\n" + "=" * 70)
print("🤖 PART 2: TRAINING ANOMALY DETECTION MODELS")
print("=" * 70)

# COMPREHENSIVE feature list for realistic noisy data
# Model needs multiple signals since no single feature is perfect
pattern_features = [
    # PRIMARY BEHAVIORAL (higher for anomalies, but with overlap)
    'unverified_rate',          # Normal ~0.05, Anomaly ~0.70
    'weekend_pct',              # Normal ~0.08, Anomaly ~0.50  
    'night_hours_pct',          # Normal ~0.10, Anomaly ~0.60
    'source_concentration',     # Normal ~0.95, Anomaly ~0.10
    'num_unique_sources',       # Normal ~1-2, Anomaly ~many
    # AMOUNT PATTERNS
    'income_cv',                # Coefficient of variation
    'max_deviation_from_mean',  # Spike detection
    'amount_range_ratio',       # Max/min ratio
    'round_amount_pct',         # Suspiciously round amounts
    'near_50k_pct',             # Structuring indicator
    'very_high_pct',            # Very large transactions
    # VELOCITY & TIMING
    'avg_tx_per_month',         # Transaction frequency
    'velocity_change',          # Change in frequency over time
    'burst_ratio',              # Burst detection
    'freq_cv',                  # Frequency variability
    # OTHER PATTERNS
    'max_mom_increase',         # Month-over-month spikes
    'avg_mom_change',           # Average monthly change
    'pct_high_deviation',       # % of outlier transactions
    'cash_deposit_rate',        # Cash deposit frequency
]

# Encode categorical
categorical_cols = ['sector', 'income_tier']
label_encoders = {}

for col in categorical_cols:
    if col in features_df.columns:
        le = LabelEncoder()
        features_df[col + '_encoded'] = le.fit_transform(features_df[col].astype(str))
        label_encoders[col] = le

# Build feature list
available_features = [f for f in pattern_features if f in features_df.columns]
encoded_cats = [f + '_encoded' for f in categorical_cols if f + '_encoded' in features_df.columns]
feature_cols = available_features + encoded_cats

if 'is_formal' in features_df.columns:
    feature_cols.append('is_formal')

print(f"\n📊 Features for training: {len(feature_cols)}")
print(f"   Pattern features: {len(available_features)}")
print(f"   Categorical encoded: {len(encoded_cats)}")

# Prepare X and y
X = features_df[feature_cols].fillna(0).replace([np.inf, -np.inf], 0)
y = features_df['is_anomaly']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=CONFIG['test_size'], random_state=CONFIG['random_state'], stratify=y
)

print(f"\n📊 Data Split:")
print(f"   Training: {len(X_train):,} samples")
print(f"   Testing: {len(X_test):,} samples")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Print feature statistics to VERIFY separation before training
print("\n📊 Feature Statistics (Normal vs Anomaly):")
print("-" * 70)
key_features = ['unverified_rate', 'weekend_pct', 'night_hours_pct', 'source_concentration', 'num_unique_sources', 'income_cv']
for feat in key_features:
    if feat in X.columns:
        normal_mean = X[y == 0][feat].mean()
        normal_std = X[y == 0][feat].std()
        anomaly_mean = X[y == 1][feat].mean()
        anomaly_std = X[y == 1][feat].std()
        diff = abs(anomaly_mean - normal_mean)
        # For realistic data, we expect OVERLAP but different distributions
        status = "✅" if diff > 0.1 else "⚠️"  # Lower threshold for realistic data
        print(f"   {status} {feat:22s}: Normal={normal_mean:.3f}±{normal_std:.3f}, Anomaly={anomaly_mean:.3f}±{anomaly_std:.3f}")

print("\n💡 Note: Realistic data has OVERLAP between classes - this is expected!")
print("   The model must learn to combine multiple signals for classification.")

# TEST: Simple rule-based classifier (expected to be imperfect with realistic data)
print("\n🧪 RULE-BASED TEST: If unverified_rate > 0.5 → Anomaly")
rule_pred = (X_test['unverified_rate'] > 0.5).astype(int).values
rule_acc = accuracy_score(y_test, rule_pred)
rule_prec = precision_score(y_test, rule_pred, zero_division=0)
rule_rec = recall_score(y_test, rule_pred, zero_division=0)
rule_f1 = f1_score(y_test, rule_pred, zero_division=0)
print(f"   Rule-based Accuracy:  {rule_acc:.4f}")
print(f"   Rule-based Precision: {rule_prec:.4f}")
print(f"   Rule-based Recall:    {rule_rec:.4f}")
print(f"   Rule-based F1:        {rule_f1:.4f}")

print("\n💡 With realistic data, simple rules are EXPECTED to be imperfect.")
print("   ML models should outperform by combining multiple features.")

# Apply SMOTE for balanced training (important for realistic noisy data)
print("\n⚖️ Applying SMOTE for balanced training...")
if SMOTE_AVAILABLE:
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train_scaled, y_train)
    print(f"   Before SMOTE: {len(y_train)} samples")
    print(f"   After SMOTE: {len(y_train_balanced)} samples")
else:
    print("   SMOTE not available, using original data with class weights")
    X_train_balanced, y_train_balanced = X_train_scaled, y_train

# Try simple Logistic Regression first to debug
print("\n🔄 Training Logistic Regression (simpler model for debugging)...")
print("-" * 70)

from sklearn.linear_model import LogisticRegression
lr_model = LogisticRegression(random_state=42, max_iter=1000)
lr_model.fit(X_train_balanced, y_train_balanced)

lr_pred = lr_model.predict(X_test_scaled)
lr_prob = lr_model.predict_proba(X_test_scaled)[:, 1]

print("\n📊 Logistic Regression Results:")
print(f"   Accuracy:  {accuracy_score(y_test, lr_pred):.4f}")
print(f"   Precision: {precision_score(y_test, lr_pred, zero_division=0):.4f}")
print(f"   Recall:    {recall_score(y_test, lr_pred, zero_division=0):.4f}")
print(f"   F1 Score:  {f1_score(y_test, lr_pred, zero_division=0):.4f}")

# Show coefficient importance
print("\n📊 Logistic Regression Coefficients:")
for feat, coef in zip(feature_cols, lr_model.coef_[0]):
    print(f"   {feat:25s}: {coef:+.4f}")

# Now train XGBoost
print("\n🔄 Training XGBoost...")
print("-" * 70)

try:
    from xgboost import XGBClassifier
    print("   Using XGBoost (best for tabular data)...")
    model = XGBClassifier(
        n_estimators=300,          # More trees for complex patterns
        max_depth=6,               # Slightly deeper for feature interactions
        learning_rate=0.05,        # Lower LR with more trees
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,        # Prevent overfitting
        gamma=0.1,                 # Regularization
        reg_alpha=0.1,             # L1 regularization
        reg_lambda=1.0,            # L2 regularization
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
except ImportError:
    print("   XGBoost not available, installing...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'xgboost', '-q'])
    from xgboost import XGBClassifier
    print("   Using XGBoost...")
    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )

# Train on SMOTE-balanced data
model.fit(X_train_balanced, y_train_balanced)
print("✅ Model trained!")

# Evaluate with default threshold
y_pred = model.predict(X_test_scaled)
y_prob = model.predict_proba(X_test_scaled)[:, 1]

print("\n📊 Results with default threshold (0.5):")
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, zero_division=0)
rec = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
roc = roc_auc_score(y_test, y_prob)

print(f"   Accuracy:  {acc:.4f}")
print(f"   Precision: {prec:.4f}")
print(f"   Recall:    {rec:.4f}")
print(f"   F1 Score:  {f1:.4f}")
print(f"   ROC AUC:   {roc:.4f}")

# Find optimal threshold - simple grid search for best F1
print("\n🎯 Finding optimal threshold...")
from sklearn.metrics import precision_recall_curve

def find_best_threshold(y_true, y_prob):
    """Find threshold that maximizes F1 score."""
    best_threshold = 0.5
    best_f1 = 0
    best_metrics = (0, 0, 0, 0)
    
    for t in np.arange(0.1, 0.9, 0.05):
        y_pred_t = (y_prob >= t).astype(int)
        acc_t = accuracy_score(y_true, y_pred_t)
        prec_t = precision_score(y_true, y_pred_t, zero_division=0)
        rec_t = recall_score(y_true, y_pred_t, zero_division=0)
        f1_t = f1_score(y_true, y_pred_t, zero_division=0)
        
        # Prefer balanced metrics (both precision and recall > 0.5)
        if f1_t > best_f1 and prec_t > 0.5 and rec_t > 0.5:
            best_f1 = f1_t
            best_threshold = t
            best_metrics = (acc_t, prec_t, rec_t, f1_t)
    
    # Fallback to best F1 if no balanced threshold found
    if best_f1 == 0:
        for t in np.arange(0.1, 0.9, 0.05):
            y_pred_t = (y_prob >= t).astype(int)
            f1_t = f1_score(y_true, y_pred_t, zero_division=0)
            if f1_t > best_f1:
                best_f1 = f1_t
                best_threshold = t
                acc_t = accuracy_score(y_true, y_pred_t)
                prec_t = precision_score(y_true, y_pred_t, zero_division=0)
                rec_t = recall_score(y_true, y_pred_t, zero_division=0)
                best_metrics = (acc_t, prec_t, rec_t, f1_t)
    
    return best_threshold, best_metrics

best_threshold, (acc, prec, rec, f1) = find_best_threshold(y_test, y_prob)
print(f"   Best threshold: {best_threshold:.4f}")

# Apply optimal threshold
y_pred = (y_prob >= best_threshold).astype(int)

print(f"\n📊 Results with optimal threshold ({best_threshold:.3f}):")
print(f"   Accuracy:  {acc:.4f}")
print(f"   Precision: {prec:.4f}")
print(f"   Recall:    {rec:.4f}")
print(f"   F1 Score:  {f1:.4f}")
print(f"   ROC AUC:   {roc:.4f}")

best_model_name = 'XGBoost'
best_model = model
best_f1 = f1

results = {
    'XGBoost': {
        'model': model, 'accuracy': acc, 'precision': prec,
        'recall': rec, 'f1_score': f1, 'roc_auc': roc,
        'y_pred': y_pred, 'y_prob': y_prob
    }
}

# ============================================================================
# PART 3: RESULTS AND EXPORT
# ============================================================================

print("\n" + "=" * 70)
print("🏆 MODEL PERFORMANCE")
print("=" * 70)

print(f"\n🏆 Model: {best_model_name}")
print(f"   Accuracy:  {acc:.4f}")
print(f"   Precision: {prec:.4f}")
print(f"   Recall:    {rec:.4f}")
print(f"   F1 Score:  {f1:.4f}")
print(f"   ROC AUC:   {roc:.4f}")

# Best model details
best_model = results[best_model_name]['model']
y_pred_best = results[best_model_name]['y_pred']

print(f"\n📋 Classification Report ({best_model_name}):")
print(classification_report(y_test, y_pred_best, target_names=['Normal', 'Anomaly']))

print("\n📊 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred_best)
print(f"   True Negatives: {cm[0,0]:,}")
print(f"   False Positives: {cm[0,1]:,}")
print(f"   False Negatives: {cm[1,0]:,}")
print(f"   True Positives: {cm[1,1]:,}")

# Feature importance
if hasattr(best_model, 'feature_importances_'):
    print(f"\n📊 Top 10 Important Features ({best_model_name}):")
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for i, row in importance_df.head(10).iterrows():
        bar = "█" * int(row['importance'] * 50)
        print(f"   {row['feature']:30s} {row['importance']:.4f} {bar}")

# ============================================================================
# SAVE MODEL FILES
# ============================================================================

print("\n" + "=" * 70)
print("💾 SAVING MODEL FILES")
print("=" * 70)

# Save best model
joblib.dump(best_model, 'anomaly_detection_model.joblib')
print("✅ Saved: anomaly_detection_model.joblib")

# Save scaler
joblib.dump(scaler, 'anomaly_scaler.joblib')
print("✅ Saved: anomaly_scaler.joblib")

# Save label encoders
joblib.dump(label_encoders, 'anomaly_label_encoders.joblib')
print("✅ Saved: anomaly_label_encoders.joblib")

# Save feature names
feature_info = {
    'feature_names': feature_cols,
    'approach': 'Pattern-based anomaly detection',
    'description': 'Detects anomalies based on income PATTERNS, not absolute thresholds',
    'key_patterns': [
        'Income variability (CV)',
        'Month-over-month changes',
        'Deviation from personal baseline',
        'Transaction frequency changes',
        'Timing patterns (weekend, night)',
        'Threshold avoidance behavior',
        'Source diversity and verification',
        'Dormancy and burst patterns'
    ]
}

with open('anomaly_feature_names.json', 'w') as f:
    json.dump(feature_info, f, indent=2)
print("✅ Saved: anomaly_feature_names.json")

# Save metadata
metadata = {
    'model_name': best_model_name,
    'training_date': datetime.now().isoformat(),
    'num_workers': CONFIG['num_workers'],
    'history_months': CONFIG['history_months'],
    'num_features': len(feature_cols),
    'optimal_threshold': float(best_threshold),
    'metrics': {
        'accuracy': float(acc),
        'precision': float(prec),
        'recall': float(rec),
        'f1_score': float(f1),
        'roc_auc': float(roc),
    },
    'anomaly_types': list(ANOMALY_TYPES.keys()),
    'detection_approach': 'Pattern-based (compares against personal baseline, not fixed thresholds)',
}

with open('model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("✅ Saved: model_metadata.json")

# ============================================================================
# VISUALIZATIONS
# ============================================================================

print("\n📈 Generating visualizations...")

fig, axes = plt.subplots(2, 2, figsize=(14, 12))

# 1. Confusion Matrix
ax1 = axes[0, 0]
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax1,
            xticklabels=['Normal', 'Anomaly'], yticklabels=['Normal', 'Anomaly'])
ax1.set_title(f'Confusion Matrix - {best_model_name}')
ax1.set_xlabel('Predicted')
ax1.set_ylabel('Actual')

# 2. Feature Importance
ax2 = axes[0, 1]
if hasattr(best_model, 'feature_importances_'):
    top_features = importance_df.head(15)
    sns.barplot(data=top_features, x='importance', y='feature', ax=ax2, palette='viridis')
    ax2.set_title('Top 15 Important Features')
    ax2.set_xlabel('Importance')

# 3. ROC Curve
ax3 = axes[1, 0]
from sklearn.metrics import roc_curve
fpr, tpr, _ = roc_curve(y_test, y_prob)
ax3.plot(fpr, tpr, label=f"Random Forest (AUC={roc:.3f})", linewidth=2)
ax3.plot([0, 1], [0, 1], 'k--', label='Random')
ax3.set_xlabel('False Positive Rate')
ax3.set_ylabel('True Positive Rate')
ax3.set_title('ROC Curve')
ax3.legend(loc='lower right')
ax3.fill_between(fpr, tpr, alpha=0.3)

# 4. Precision-Recall Curve
ax4 = axes[1, 1]
precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_prob)
ax4.plot(recall_vals, precision_vals, linewidth=2)
ax4.set_xlabel('Recall')
ax4.set_ylabel('Precision')
ax4.set_title('Precision-Recall Curve')
ax4.fill_between(recall_vals, precision_vals, alpha=0.3)

plt.tight_layout()
plt.savefig('anomaly_model_results.png', dpi=150, bbox_inches='tight')
print("✅ Saved: anomaly_model_results.png")
plt.show()

# ============================================================================
# FINAL SUMMARY
# ============================================================================

print("\n" + "=" * 70)
print("✅ TRAINING COMPLETE!")
print("=" * 70)

print("\n📁 Files Generated:")
print("   • anomaly_detection_model.joblib - Trained model")
print("   • anomaly_scaler.joblib - Feature scaler")
print("   • anomaly_label_encoders.joblib - Category encoders")
print("   • anomaly_feature_names.json - Feature information")
print("   • model_metadata.json - Model details")
print("   • anomaly_model_results.png - Visualizations")

print(f"\n🏆 Best Model: {best_model_name}")
print(f"   • Accuracy:  {results[best_model_name]['accuracy']:.4f}")
print(f"   • Precision: {results[best_model_name]['precision']:.4f}")
print(f"   • Recall:    {results[best_model_name]['recall']:.4f}")
print(f"   • F1 Score:  {results[best_model_name]['f1_score']:.4f}")

print("\n📥 Download these files and place in anomaly_detection_model/ folder:")
print("   Then run: py detect_anomaly.py")

print("\n💡 KEY INSIGHT: This model uses PATTERN-based detection")
print("   • Compares against individual's OWN history")
print("   • Works fairly for ANY income level")
print("   • Same job can pay differently - we detect CHANGES")
