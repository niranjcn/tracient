"""
TRACIENT - APL/BPL Classification CLI
Interactive command-line tool for household poverty classification
Based on SECC 2011 (Socio Economic and Caste Census) criteria
"""

import joblib
import json
import os
import numpy as np
import pandas as pd
from typing import Dict, Any

# ============================================================================
# CONSTANTS
# ============================================================================

STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir"
]

SOCIAL_CATEGORIES = ["General", "OBC", "SC", "ST"]

HOUSE_TYPES = {
    1: ("houseless", "Houseless / No shelter"),
    2: ("temporary_plastic", "Temporary (plastic/tarpaulin)"),
    3: ("kucha", "Kucha (mud/thatch)"),
    4: ("semi_pucca", "Semi-Pucca (mixed materials)"),
    5: ("pucca", "Pucca (brick/concrete)")
}

EDUCATION_LEVELS = {
    1: ("illiterate", "Illiterate"),
    2: ("below_primary", "Below Primary (1-4)"),
    3: ("primary_5", "Primary (Class 5)"),
    4: ("middle_6_8", "Middle School (6-8)"),
    5: ("secondary_9_10", "Secondary (9-10)"),
    6: ("higher_secondary", "Higher Secondary (11-12)"),
    7: ("graduate", "Graduate"),
    8: ("post_graduate", "Post Graduate")
}

OCCUPATIONS = {
    1: ("unemployed", "Unemployed"),
    2: ("agricultural_labor", "Agricultural Labor"),
    3: ("non_agricultural_labor", "Non-Agricultural Labor"),
    4: ("casual_labor", "Casual/Daily Wage Labor"),
    5: ("cultivator", "Cultivator/Farmer"),
    6: ("small_shop_petty_trade", "Small Shop/Petty Trade"),
    7: ("skilled_worker", "Skilled Worker"),
    8: ("salaried_private", "Salaried Private Employee"),
    9: ("self_employed", "Self Employed"),
    10: ("govt_employee", "Government Employee"),
    11: ("domestic_work", "Domestic Work"),
    12: ("begging", "Begging/Alms"),
    13: ("manual_scavenging", "Manual Scavenging")
}

LOAN_SOURCES = {
    1: ("none", "No Loan"),
    2: ("bank", "Bank"),
    3: ("mfi", "Microfinance Institution"),
    4: ("shg", "Self Help Group"),
    5: ("moneylender", "Moneylender"),
    6: ("relatives", "Relatives/Friends")
}

RATION_CARD_TYPES = {
    1: ("None", "No Ration Card"),
    2: ("APL", "APL Card"),
    3: ("BPL", "BPL Card"),
    4: ("PHH", "PHH (Priority Household)"),
    5: ("AAY", "AAY (Antyodaya)")
}

POVERTY_LINE_RURAL = 816.0  # Rs per month per capita
POVERTY_LINE_URBAN = 1000.0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def clear_screen():
    """Clear terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Print application header"""
    print("\n" + "=" * 70)
    print("🏠 TRACIENT - APL/BPL CLASSIFICATION SYSTEM")
    print("   Blockchain & AI Enabled Income Traceability System")
    print("=" * 70)

def print_section(title: str):
    """Print section header"""
    print(f"\n{'─' * 70}")
    print(f"📋 {title}")
    print("─" * 70)

def get_yes_no(prompt: str, default: bool = False) -> bool:
    """Get yes/no input from user"""
    default_str = "Y/n" if default else "y/N"
    while True:
        response = input(f"{prompt} [{default_str}]: ").strip().lower()
        if response == "":
            return default
        if response in ["y", "yes", "1", "true"]:
            return True
        if response in ["n", "no", "0", "false"]:
            return False
        print("   ⚠️  Please enter 'y' for yes or 'n' for no")

def get_integer(prompt: str, min_val: int = 0, max_val: int = 100, default: int = None) -> int:
    """Get integer input from user"""
    default_str = f" [{default}]" if default is not None else ""
    while True:
        try:
            response = input(f"{prompt}{default_str}: ").strip()
            if response == "" and default is not None:
                return default
            value = int(response)
            if min_val <= value <= max_val:
                return value
            print(f"   ⚠️  Please enter a number between {min_val} and {max_val}")
        except ValueError:
            print("   ⚠️  Please enter a valid number")

def get_float(prompt: str, min_val: float = 0, max_val: float = 10000000, default: float = None) -> float:
    """Get float input from user"""
    default_str = f" [{default}]" if default is not None else ""
    while True:
        try:
            response = input(f"{prompt}{default_str}: ").strip()
            if response == "" and default is not None:
                return default
            value = float(response)
            if min_val <= value <= max_val:
                return value
            print(f"   ⚠️  Please enter a number between {min_val} and {max_val}")
        except ValueError:
            print("   ⚠️  Please enter a valid number")

def get_choice(prompt: str, options: dict) -> tuple:
    """Get choice from numbered options"""
    print(f"\n{prompt}")
    for key, (code, desc) in options.items():
        print(f"   {key}. {desc}")
    
    while True:
        try:
            choice = int(input("Enter choice number: ").strip())
            if choice in options:
                return options[choice]
            print(f"   ⚠️  Please enter a number between 1 and {len(options)}")
        except ValueError:
            print("   ⚠️  Please enter a valid number")

def get_state() -> str:
    """Get state selection"""
    print("\n📍 Select State:")
    for i, state in enumerate(STATES, 1):
        print(f"   {i:2}. {state}")
    
    while True:
        try:
            choice = int(input("Enter state number: ").strip())
            if 1 <= choice <= len(STATES):
                return STATES[choice - 1]
            print(f"   ⚠️  Please enter a number between 1 and {len(STATES)}")
        except ValueError:
            print("   ⚠️  Please enter a valid number")

def get_social_category() -> str:
    """Get social category selection"""
    print("\n👥 Select Social Category:")
    for i, cat in enumerate(SOCIAL_CATEGORIES, 1):
        print(f"   {i}. {cat}")
    
    while True:
        try:
            choice = int(input("Enter choice number: ").strip())
            if 1 <= choice <= len(SOCIAL_CATEGORIES):
                return SOCIAL_CATEGORIES[choice - 1]
            print(f"   ⚠️  Please enter a number between 1 and {len(SOCIAL_CATEGORIES)}")
        except ValueError:
            print("   ⚠️  Please enter a valid number")

# ============================================================================
# DATA COLLECTION
# ============================================================================

def collect_household_data() -> Dict[str, Any]:
    """Collect all household data from user"""
    
    data = {}
    
    # ── SECTION 1: Basic Information ──
    print_section("SECTION 1: BASIC HOUSEHOLD INFORMATION")
    
    data['family_size'] = get_integer("Total family members", 1, 20)
    data['head_age'] = get_integer("Age of household head", 18, 100, 35)
    data['is_female_headed'] = 1 if get_yes_no("Is this a female-headed household?") else 0
    
    # ── SECTION 2: Family Composition ──
    print_section("SECTION 2: FAMILY COMPOSITION")
    
    data['children_0_6'] = get_integer("Number of children aged 0-6 years", 0, 10, 0)
    data['children_6_14'] = get_integer("Number of children aged 6-14 years", 0, 10, 0)
    data['adults_16_59'] = get_integer("Number of adults aged 16-59 years", 0, 15, 1)
    data['adult_males_16_59'] = get_integer("Number of adult males (16-59)", 0, 10, 0)
    data['adult_females_16_59'] = get_integer("Number of adult females (16-59)", 0, 10, 0)
    data['elderly_60_plus'] = get_integer("Number of elderly (60+ years)", 0, 10, 0)
    data['able_bodied_adults'] = get_integer("Number of able-bodied adults", 0, 15, 1)
    
    # ── SECTION 3: Location ──
    print_section("SECTION 3: LOCATION")
    
    data['state'] = get_state()
    
    print("\n🏘️ Area Type:")
    print("   1. Rural")
    print("   2. Urban")
    area_choice = get_integer("Enter choice", 1, 2)
    data['area_type'] = "rural" if area_choice == 1 else "urban"
    
    # ── SECTION 4: Social Category ──
    print_section("SECTION 4: SOCIAL CATEGORY")
    
    data['social_category'] = get_social_category()
    data['is_pvtg'] = 1 if get_yes_no("Is the household a Primitive Tribal Group (PVTG)?") else 0
    data['is_minority'] = 1 if get_yes_no("Is the household a religious minority?") else 0
    
    # ── SECTION 5: Housing ──
    print_section("SECTION 5: HOUSING DETAILS")
    
    house_code, house_desc = get_choice("🏠 Type of House:", HOUSE_TYPES)
    data['house_type'] = house_code
    data['is_houseless'] = 1 if house_code == "houseless" else 0
    
    data['num_rooms'] = get_integer("Number of rooms in the house", 0, 10, 2)
    data['has_electricity'] = 1 if get_yes_no("Does the house have electricity?", True) else 0
    data['has_water_tap'] = 1 if get_yes_no("Does the house have water tap connection?") else 0
    data['has_toilet'] = 1 if get_yes_no("Does the house have toilet facility?", True) else 0
    
    # ── SECTION 6: Education ──
    print_section("SECTION 6: EDUCATION")
    
    edu_code, edu_desc = get_choice("📚 Highest education level in family:", EDUCATION_LEVELS)
    data['highest_education'] = edu_code
    data['education_code'] = list(EDUCATION_LEVELS.keys())[list(EDUCATION_LEVELS.values()).index((edu_code, edu_desc))] - 1
    
    data['literate_adults_above_25'] = get_integer("Number of literate adults above 25 years", 0, 10, 1)
    data['children_in_school'] = get_integer("Number of children currently in school", 0, 10, 0)
    
    # ── SECTION 7: Occupation & Income ──
    print_section("SECTION 7: OCCUPATION & INCOME")
    
    occ_code, occ_desc = get_choice("💼 Primary occupation of household:", OCCUPATIONS)
    data['primary_occupation'] = occ_code
    data['is_manual_scavenger'] = 1 if occ_code == "manual_scavenging" else 0
    
    data['is_informal'] = 1 if get_yes_no("Is the primary earner in informal/unorganized sector?", True) else 0
    data['working_members'] = get_integer("Number of working/earning members", 0, 10, 1)
    
    data['total_monthly_income'] = get_float("Total monthly household income (₹)", 0, 1000000)
    data['monthly_per_capita_income'] = data['total_monthly_income'] / data['family_size']
    data['annual_income'] = data['total_monthly_income'] * 12
    data['highest_earner_monthly'] = get_float("Highest earner's monthly income (₹)", 0, 500000, data['total_monthly_income'] * 0.7)
    
    # ── SECTION 8: Land Ownership ──
    print_section("SECTION 8: LAND OWNERSHIP")
    
    data['total_land_acres'] = get_float("Total land owned (in acres)", 0, 100, 0)
    data['irrigated_land_acres'] = get_float("Irrigated land (in acres)", 0, data['total_land_acres'], 0)
    data['crop_seasons'] = get_integer("Number of crop seasons per year", 0, 3, 0)
    
    # ── SECTION 9: Assets (SECC Exclusion Criteria) ──
    print_section("SECTION 9: ASSETS OWNED")
    print("   (These are SECC 2011 automatic exclusion criteria)")
    
    data['owns_two_wheeler'] = 1 if get_yes_no("Owns motorized 2-wheeler (scooter/motorcycle)?") else 0
    data['owns_four_wheeler'] = 1 if get_yes_no("Owns 3-wheeler or 4-wheeler (car/auto)?") else 0
    data['owns_tractor'] = 1 if get_yes_no("Owns tractor or harvester?") else 0
    data['owns_mechanized_equipment'] = 1 if get_yes_no("Owns mechanized agricultural equipment?") else 0
    data['owns_refrigerator'] = 1 if get_yes_no("Owns refrigerator?") else 0
    data['owns_landline'] = 1 if get_yes_no("Owns landline phone?") else 0
    data['owns_tv'] = 1 if get_yes_no("Owns television?") else 0
    data['owns_mobile'] = 1 if get_yes_no("Owns mobile phone?", True) else 0
    
    # ── SECTION 10: Financial Details ──
    print_section("SECTION 10: FINANCIAL DETAILS")
    
    data['kcc_limit'] = get_float("Kisan Credit Card limit (₹, 0 if none)", 0, 500000, 0)
    data['has_bank_account'] = 1 if get_yes_no("Has bank account?", True) else 0
    data['has_savings'] = 1 if get_yes_no("Has any savings?") else 0
    data['has_loan'] = 1 if get_yes_no("Has any active loan?") else 0
    
    if data['has_loan']:
        loan_code, loan_desc = get_choice("💳 Primary source of loan:", LOAN_SOURCES)
        data['loan_source'] = loan_code
    else:
        data['loan_source'] = "none"
    
    # ── SECTION 11: Tax & Government Employment ──
    print_section("SECTION 11: TAX & GOVERNMENT EMPLOYMENT")
    
    data['pays_income_tax'] = 1 if get_yes_no("Does any family member pay income tax?") else 0
    data['pays_professional_tax'] = 1 if get_yes_no("Does any family member pay professional tax?") else 0
    data['has_govt_employee'] = 1 if get_yes_no("Is any family member a government employee?") else 0
    
    # ── SECTION 12: Vulnerability ──
    print_section("SECTION 12: VULNERABILITY INDICATORS")
    
    data['has_disabled_member'] = 1 if get_yes_no("Does the household have any disabled member?") else 0
    data['has_chronic_illness'] = 1 if get_yes_no("Does any member have chronic illness?") else 0
    
    # ── SECTION 13: Welfare & Special Status ──
    print_section("SECTION 13: WELFARE & SPECIAL STATUS")
    
    ration_code, ration_desc = get_choice("🎫 Type of Ration Card:", RATION_CARD_TYPES)
    data['ration_card_type'] = ration_code
    
    data['receives_welfare'] = 1 if get_yes_no("Does the household receive any government welfare?") else 0
    data['is_destitute'] = 1 if get_yes_no("Is the household destitute (living on alms)?") else 0
    data['is_bonded_laborer'] = 1 if get_yes_no("Is any member a legally released bonded laborer?") else 0
    
    # ── Add derived fields ──
    data['household_id'] = 'CLI_INPUT'
    data['case_type'] = 'normal'
    data['num_transactions'] = 24
    data['avg_transaction_amount'] = data['total_monthly_income'] / 4
    data['digital_payment_ratio'] = 0.2
    data['income_std'] = data['total_monthly_income'] * 0.2
    data['income_variance'] = data['income_std'] ** 2
    
    return data

# ============================================================================
# SECC ANALYSIS
# ============================================================================

def analyze_secc_criteria(data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze household against SECC 2011 criteria"""
    
    # Check exclusion criteria
    exclusion_criteria = {
        'Owns motorized 2-wheeler': data.get('owns_two_wheeler', 0) == 1,
        'Owns 3/4 wheeler': data.get('owns_four_wheeler', 0) == 1,
        'Owns tractor/harvester': data.get('owns_tractor', 0) == 1,
        'Owns mechanized equipment': data.get('owns_mechanized_equipment', 0) == 1,
        'KCC limit ≥ ₹50,000': data.get('kcc_limit', 0) >= 50000,
        'Has government employee': data.get('has_govt_employee', 0) == 1,
        'Pays income tax': data.get('pays_income_tax', 0) == 1,
        'Pays professional tax': data.get('pays_professional_tax', 0) == 1,
        'Owns refrigerator': data.get('owns_refrigerator', 0) == 1,
        'Owns landline phone': data.get('owns_landline', 0) == 1,
        'Pucca house with 3+ rooms': (
            data.get('house_type', '') == 'pucca' and 
            data.get('num_rooms', 0) >= 3
        ),
        'Owns 2.5+ acres land': data.get('total_land_acres', 0) >= 2.5,
    }
    
    # Check inclusion criteria
    inclusion_criteria = {
        'Houseless': data.get('is_houseless', 0) == 1,
        'Destitute (living on alms)': data.get('is_destitute', 0) == 1,
        'Manual scavenger': data.get('is_manual_scavenger', 0) == 1,
        'Primitive Tribal Group': data.get('is_pvtg', 0) == 1,
        'Bonded laborer': data.get('is_bonded_laborer', 0) == 1,
    }
    
    # Check deprivation indicators
    deprivation_indicators = {
        'One room kucha house': (
            data.get('house_type', '') in ['kucha', 'houseless', 'temporary_plastic'] and
            data.get('num_rooms', 0) <= 1
        ),
        'No adult member (16-59)': data.get('adults_16_59', 0) == 0,
        'Female-headed, no adult male': (
            data.get('is_female_headed', 0) == 1 and
            data.get('adult_males_16_59', 0) == 0
        ),
        'Has disabled member': data.get('has_disabled_member', 0) == 1,
        'No literate adult above 25': data.get('literate_adults_above_25', 0) == 0,
        'Landless manual/casual labor': (
            data.get('total_land_acres', 0) == 0 and
            data.get('primary_occupation', '') in ['agricultural_labor', 'casual_labor', 'non_agricultural_labor']
        ),
        'SC/ST household': data.get('social_category', '') in ['SC', 'ST'],
    }
    
    has_exclusion = any(exclusion_criteria.values())
    has_inclusion = any(inclusion_criteria.values())
    deprivation_count = sum(deprivation_indicators.values())
    
    # Determine SECC classification
    if has_inclusion:
        secc_class = 'BPL (Automatic Inclusion)'
    elif has_exclusion:
        secc_class = 'APL (Automatic Exclusion)'
    elif deprivation_count >= 1:
        secc_class = f'BPL ({deprivation_count} deprivation indicators)'
    else:
        secc_class = 'APL (No deprivation)'
    
    return {
        'secc_classification': secc_class,
        'has_exclusion': has_exclusion,
        'has_inclusion': has_inclusion,
        'deprivation_count': deprivation_count,
        'exclusion_met': {k: v for k, v in exclusion_criteria.items() if v},
        'inclusion_met': {k: v for k, v in inclusion_criteria.items() if v},
        'deprivation_met': {k: v for k, v in deprivation_indicators.items() if v},
    }

# ============================================================================
# MODEL PREDICTION
# ============================================================================

class ModelPredictor:
    """ML Model for APL/BPL classification"""
    
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
            self.model = joblib.load(os.path.join(script_dir, 'random_forest_model.joblib'))
            self.scaler = joblib.load(os.path.join(script_dir, 'scaler.joblib'))
            self.label_encoders = joblib.load(os.path.join(script_dir, 'label_encoders.joblib'))
            
            with open(os.path.join(script_dir, 'feature_names.json'), 'r') as f:
                self.feature_names = json.load(f)
            
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"   ⚠️  Error loading model: {e}")
            return False
    
    def preprocess(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess data for prediction"""
        
        df = pd.DataFrame([data])
        
        # Add engineered features
        df['income_threshold_ratio'] = df['monthly_per_capita_income'] / POVERTY_LINE_RURAL
        df['income_per_member'] = df['annual_income'] / df['family_size']
        df['working_ratio'] = df['working_members'] / (df['adults_16_59'] + 0.01)
        df['dependency_ratio'] = (df['children_0_6'] + df['children_6_14'] + df['elderly_60_plus']) / (df['adults_16_59'] + 0.01)
        
        df['asset_score'] = (
            df.get('owns_two_wheeler', 0) + 
            df.get('owns_four_wheeler', 0) * 3 + 
            df.get('owns_tractor', 0) * 3 + 
            df.get('owns_refrigerator', 0) + 
            df.get('owns_tv', 0) + 
            df.get('has_bank_account', 0)
        )
        
        house_scores = {'houseless': 0, 'temporary_plastic': 1, 'kucha': 2, 'semi_pucca': 3, 'pucca': 4}
        df['housing_score'] = house_scores.get(df['house_type'].iloc[0], 2) + df['num_rooms'].iloc[0] * 0.5
        
        df['financial_score'] = df.get('has_bank_account', 0) + df.get('has_savings', 0) + df.get('digital_payment_ratio', 0)
        
        is_sc_st = df['social_category'].iloc[0] in ['SC', 'ST']
        df['vulnerability_score'] = (
            df.get('is_female_headed', 0) + 
            df.get('has_disabled_member', 0) + 
            df.get('has_chronic_illness', 0) + 
            int(is_sc_st)
        )
        
        df['has_exclusion_criteria'] = (
            (df.get('owns_two_wheeler', 0) == 1) | 
            (df.get('owns_four_wheeler', 0) == 1) |
            (df.get('has_govt_employee', 0) == 1) |
            (df.get('pays_income_tax', 0) == 1)
        ).astype(int)
        
        df['has_inclusion_criteria'] = (
            (df.get('is_houseless', 0) == 1) | 
            (df.get('is_destitute', 0) == 1) |
            (df.get('is_manual_scavenger', 0) == 1) |
            (df.get('is_bonded_laborer', 0) == 1) |
            (df.get('is_pvtg', 0) == 1)
        ).astype(int)
        
        df['deprivation_score'] = 0
        df['poverty_line_per_capita'] = POVERTY_LINE_RURAL if df['area_type'].iloc[0] == 'rural' else POVERTY_LINE_URBAN
        df['bpl_threshold'] = df['poverty_line_per_capita'] * 12 * df['family_size']
        
        # Encode categorical features
        categorical_cols = ['state', 'area_type', 'social_category', 'house_type',
                           'highest_education', 'primary_occupation', 'loan_source', 'ration_card_type']
        
        for col in categorical_cols:
            if col in self.label_encoders and col in df.columns:
                try:
                    df[col] = self.label_encoders[col].transform(df[col].astype(str))
                except ValueError:
                    df[col] = 0
        
        # Create feature DataFrame
        X = pd.DataFrame(columns=self.feature_names)
        for col in self.feature_names:
            if col in df.columns:
                X[col] = df[col].values
            else:
                X[col] = 0
        
        X = X.astype(float)
        
        try:
            X_scaled = self.scaler.transform(X)
            X = pd.DataFrame(X_scaled, columns=self.feature_names)
        except:
            pass
        
        return X
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction"""
        
        X = self.preprocess(data)
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        return {
            'classification': 'APL' if prediction == 1 else 'BPL',
            'confidence': round(float(max(probabilities) * 100), 2),
            'bpl_probability': round(float(probabilities[0] * 100), 2),
            'apl_probability': round(float(probabilities[1] * 100), 2),
        }

# ============================================================================
# RESULTS DISPLAY
# ============================================================================

def display_results(data: Dict, ml_result: Dict, secc_result: Dict):
    """Display classification results"""
    
    clear_screen()
    print_header()
    
    # ── Household Summary ──
    print_section("HOUSEHOLD SUMMARY")
    print(f"   • State: {data['state']}")
    print(f"   • Area: {data['area_type'].title()}")
    print(f"   • Family Size: {data['family_size']} members")
    print(f"   • Social Category: {data['social_category']}")
    print(f"   • Monthly Income: ₹{data['total_monthly_income']:,.0f}")
    print(f"   • Per Capita Income: ₹{data['monthly_per_capita_income']:,.0f}/month")
    
    poverty_line = POVERTY_LINE_RURAL if data['area_type'] == 'rural' else POVERTY_LINE_URBAN
    print(f"   • Poverty Line: ₹{poverty_line:,.0f}/month per capita")
    
    # ── ML Prediction ──
    print_section("🤖 ML MODEL PREDICTION")
    
    if ml_result['classification'] == 'BPL':
        print(f"   🔴 Classification: BPL (Below Poverty Line)")
    else:
        print(f"   🟢 Classification: APL (Above Poverty Line)")
    
    print(f"   📊 Confidence: {ml_result['confidence']}%")
    print(f"   📈 BPL Probability: {ml_result['bpl_probability']}%")
    print(f"   📈 APL Probability: {ml_result['apl_probability']}%")
    
    # ── SECC Analysis ──
    print_section("📋 SECC 2011 CRITERIA ANALYSIS")
    
    print(f"\n   Classification: {secc_result['secc_classification']}")
    
    if secc_result['has_inclusion']:
        print(f"\n   ✅ AUTOMATIC INCLUSION CRITERIA MET:")
        for criteria in secc_result['inclusion_met']:
            print(f"      • {criteria}")
    
    if secc_result['has_exclusion']:
        print(f"\n   ❌ AUTOMATIC EXCLUSION CRITERIA MET:")
        for criteria in secc_result['exclusion_met']:
            print(f"      • {criteria}")
    
    if secc_result['deprivation_count'] > 0:
        print(f"\n   ⚠️  DEPRIVATION INDICATORS ({secc_result['deprivation_count']}/7):")
        for indicator in secc_result['deprivation_met']:
            print(f"      • {indicator}")
    
    # ── Final Recommendation ──
    print_section("📝 FINAL RECOMMENDATION")
    
    if secc_result['has_inclusion']:
        print("   🔴 PRIORITY: Qualifies for AUTOMATIC BPL INCLUSION")
        print("      Recommended: Immediate enrollment in welfare programs")
    elif secc_result['has_exclusion']:
        print("   🟢 EXCLUDED: Household is AUTOMATICALLY EXCLUDED from BPL")
        print("      Status: Not eligible for BPL benefits")
    elif secc_result['deprivation_count'] >= 3:
        print(f"   🔴 HIGH PRIORITY: {secc_result['deprivation_count']} deprivation indicators")
        print("      Recommended: Priority enrollment in welfare programs")
    elif secc_result['deprivation_count'] >= 1:
        print(f"   🟡 ELIGIBLE: {secc_result['deprivation_count']} deprivation indicator(s)")
        print("      Recommended: Consider for welfare programs")
    else:
        print("   🟢 NOT ELIGIBLE: No deprivation indicators")
        print("      Status: Above Poverty Line")
    
    # ── Comparison ──
    if ml_result['classification'] != ('BPL' if 'BPL' in secc_result['secc_classification'] else 'APL'):
        print("\n   ⚠️  NOTE: ML prediction differs from SECC criteria.")
        print("      Manual review recommended for accurate classification.")
    
    print("\n" + "=" * 70)

# ============================================================================
# MAIN PROGRAM
# ============================================================================

def main():
    """Main program entry point"""
    
    clear_screen()
    print_header()
    
    print("\n📌 This tool classifies households as APL (Above Poverty Line)")
    print("   or BPL (Below Poverty Line) based on SECC 2011 criteria.")
    print("\n   Please answer the following questions about the household.")
    
    input("\n   Press ENTER to continue...")
    
    # Load model
    print("\n📦 Loading ML model...")
    predictor = ModelPredictor()
    if not predictor.load():
        print("   ❌ Failed to load ML model. SECC analysis will still work.")
        ml_available = False
    else:
        print("   ✅ Model loaded successfully!")
        ml_available = True
    
    input("\n   Press ENTER to start data collection...")
    
    while True:
        clear_screen()
        print_header()
        
        # Collect data
        data = collect_household_data()
        
        # Process
        print_section("PROCESSING")
        print("   ⏳ Analyzing data...")
        
        # SECC Analysis
        secc_result = analyze_secc_criteria(data)
        
        # ML Prediction
        if ml_available:
            ml_result = predictor.predict(data)
        else:
            ml_result = {
                'classification': 'BPL' if 'BPL' in secc_result['secc_classification'] else 'APL',
                'confidence': 0,
                'bpl_probability': 0,
                'apl_probability': 0,
            }
        
        # Display results
        display_results(data, ml_result, secc_result)
        
        # Continue?
        if not get_yes_no("\n🔄 Would you like to classify another household?"):
            break
    
    print("\n👋 Thank you for using TRACIENT!")
    print("   Blockchain & AI Enabled Income Traceability System\n")

if __name__ == "__main__":
    main()
