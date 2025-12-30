"""
TRACIENT - APL/BPL Classification API
REST API for household poverty classification using Flask
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import os
import numpy as np
import pandas as pd
from typing import Dict, Any

app = Flask(__name__)
CORS(app)

# ============================================================================
# CONSTANTS
# ============================================================================

POVERTY_LINE_RURAL = 816.0  # Rs per month per capita
POVERTY_LINE_URBAN = 1000.0

# ============================================================================
# MODEL PREDICTOR CLASS
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
            print("✅ Model loaded successfully!")
            return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def preprocess(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess data for prediction"""
        
        # Set default values for missing fields
        defaults = {
            'family_size': 4,
            'head_age': 35,
            'children_0_6': 0,
            'children_6_14': 0,
            'adults_16_59': 2,
            'adult_males_16_59': 1,
            'adult_females_16_59': 1,
            'elderly_60_plus': 0,
            'able_bodied_adults': 2,
            'working_members': 1,
            'literate_adults_above_25': 1,
            'children_in_school': 0,
            'is_female_headed': 0,
            'is_pvtg': 0,
            'is_minority': 0,
            'is_informal': 1,
            'education_code': 2,
            'highest_earner_monthly': 5000,
            'total_land_acres': 0,
            'irrigated_land_acres': 0,
            'crop_seasons': 0,
            'kcc_limit': 0,
            'owns_two_wheeler': 0,
            'owns_four_wheeler': 0,
            'owns_tractor': 0,
            'owns_mechanized_equipment': 0,
            'owns_refrigerator': 0,
            'owns_landline': 0,
            'owns_tv': 0,
            'owns_mobile': 1,
            'has_bank_account': 1,
            'has_savings': 0,
            'has_loan': 0,
            'loan_source': 'none',
            'house_type': 'kucha',
            'num_rooms': 1,
            'has_electricity': 1,
            'has_water_tap': 0,
            'has_toilet': 0,
            'is_houseless': 0,
            'state': 'Kerala',
            'area_type': 'rural',
            'social_category': 'General',
            'highest_education': 'primary_5',
            'primary_occupation': 'casual_labor',
            'ration_card_type': 'None',
            'has_disabled_member': 0,
            'has_chronic_illness': 0,
            'is_destitute': 0,
            'is_manual_scavenger': 0,
            'is_bonded_laborer': 0,
            'pays_income_tax': 0,
            'pays_professional_tax': 0,
            'has_govt_employee': 0,
            'receives_welfare': 0
        }
        
        # Merge defaults with provided data
        for key, value in defaults.items():
            if key not in data:
                data[key] = value
        
        # Convert boolean fields to integers
        bool_fields = ['owns_two_wheeler', 'owns_four_wheeler', 'owns_tractor', 
                       'owns_mechanized_equipment', 'owns_refrigerator', 'owns_landline',
                       'owns_tv', 'owns_mobile', 'has_bank_account', 'has_savings', 'has_loan']
        for field in bool_fields:
            if isinstance(data.get(field), bool):
                data[field] = 1 if data[field] else 0
        
        df = pd.DataFrame([data])
        
        # Calculate derived income fields
        family_size = df['family_size'].iloc[0] or 1
        monthly_income = df.get('highest_earner_monthly', pd.Series([5000])).iloc[0] or 5000
        
        df['total_monthly_income'] = monthly_income
        df['monthly_per_capita_income'] = monthly_income / family_size
        df['annual_income'] = monthly_income * 12
        df['income_std'] = monthly_income * 0.2
        df['income_variance'] = (monthly_income * 0.2) ** 2
        
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
        df['housing_score'] = house_scores.get(str(df['house_type'].iloc[0]), 2) + df['num_rooms'].iloc[0] * 0.5
        
        df['financial_score'] = df.get('has_bank_account', 0) + df.get('has_savings', 0) + 0.2
        
        social_cat = str(df.get('social_category', pd.Series(['General'])).iloc[0])
        is_sc_st = social_cat in ['SC', 'ST']
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
        area_type = str(df.get('area_type', pd.Series(['rural'])).iloc[0])
        df['poverty_line_per_capita'] = POVERTY_LINE_RURAL if area_type == 'rural' else POVERTY_LINE_URBAN
        df['bpl_threshold'] = df['poverty_line_per_capita'] * 12 * df['family_size']
        
        # Transaction related defaults
        df['num_transactions'] = 24
        df['avg_transaction_amount'] = monthly_income / 4
        df['digital_payment_ratio'] = 0.2
        
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
        
        if not self.is_loaded:
            return {
                'success': False,
                'error': 'Model not loaded'
            }
        
        try:
            X = self.preprocess(data)
            prediction = self.model.predict(X)[0]
            probabilities = self.model.predict_proba(X)[0]
            
            return {
                'success': True,
                'classification': 'APL' if prediction == 1 else 'BPL',
                'confidence': round(float(max(probabilities) * 100), 2),
                'bpl_probability': round(float(probabilities[0] * 100), 2),
                'apl_probability': round(float(probabilities[1] * 100), 2),
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# ============================================================================
# SECC ANALYSIS
# ============================================================================

def analyze_secc_criteria(data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze household against SECC 2011 criteria"""
    
    # Convert boolean to int for analysis
    def to_int(val):
        if isinstance(val, bool):
            return 1 if val else 0
        return val or 0
    
    # Check exclusion criteria
    exclusion_criteria = {
        'Owns motorized 2-wheeler': to_int(data.get('owns_two_wheeler', 0)) == 1,
        'Owns 3/4 wheeler': to_int(data.get('owns_four_wheeler', 0)) == 1,
        'Owns tractor/harvester': to_int(data.get('owns_tractor', 0)) == 1,
        'Owns mechanized equipment': to_int(data.get('owns_mechanized_equipment', 0)) == 1,
        'KCC limit >= Rs.50,000': data.get('kcc_limit', 0) >= 50000,
        'Has government employee': to_int(data.get('has_govt_employee', 0)) == 1,
        'Pays income tax': to_int(data.get('pays_income_tax', 0)) == 1,
        'Pays professional tax': to_int(data.get('pays_professional_tax', 0)) == 1,
        'Owns refrigerator': to_int(data.get('owns_refrigerator', 0)) == 1,
        'Owns landline phone': to_int(data.get('owns_landline', 0)) == 1,
        'Pucca house with 3+ rooms': (
            data.get('house_type', '') == 'pucca' and 
            data.get('num_rooms', 0) >= 3
        ),
        'Owns 2.5+ acres land': data.get('total_land_acres', 0) >= 2.5,
    }
    
    # Check inclusion criteria (automatic BPL)
    inclusion_criteria = {
        'Houseless': to_int(data.get('is_houseless', 0)) == 1,
        'Destitute (living on alms)': to_int(data.get('is_destitute', 0)) == 1,
        'Manual scavenger': to_int(data.get('is_manual_scavenger', 0)) == 1,
        'Primitive Tribal Group': to_int(data.get('is_pvtg', 0)) == 1,
        'Bonded laborer': to_int(data.get('is_bonded_laborer', 0)) == 1,
    }
    
    # Check deprivation indicators
    deprivation_indicators = {
        'One room kucha house': (
            data.get('house_type', '') in ['kucha', 'houseless', 'temporary_plastic'] and
            data.get('num_rooms', 0) <= 1
        ),
        'No adult member (16-59)': data.get('adults_16_59', 0) == 0,
        'Female-headed, no adult male': (
            to_int(data.get('is_female_headed', 0)) == 1 and
            data.get('adult_males_16_59', 0) == 0
        ),
        'Has disabled member': to_int(data.get('has_disabled_member', 0)) == 1,
        'No literate adult above 25': data.get('literate_adults_above_25', 0) == 0,
        'Landless manual/casual labor': (
            data.get('total_land_acres', 0) == 0 and
            data.get('primary_occupation', '') in ['agricultural_labor', 'casual_labor', 'non_agricultural_labor']
        ),
        'SC/ST household': data.get('social_category', '') in ['SC', 'ST'],
        'Low monthly income': data.get('highest_earner_monthly', 0) < 5000,
    }
    
    has_exclusion = any(exclusion_criteria.values())
    has_inclusion = any(inclusion_criteria.values())
    deprivation_count = sum(deprivation_indicators.values())
    
    # Determine SECC classification
    if has_inclusion:
        secc_class = 'BPL'
        secc_reason = 'Automatic Inclusion'
    elif has_exclusion:
        secc_class = 'APL'
        secc_reason = 'Automatic Exclusion'
    elif deprivation_count >= 1:
        secc_class = 'BPL'
        secc_reason = f'{deprivation_count} deprivation indicator(s)'
    else:
        secc_class = 'APL'
        secc_reason = 'No deprivation indicators'
    
    return {
        'secc_classification': secc_class,
        'secc_reason': secc_reason,
        'has_exclusion': has_exclusion,
        'has_inclusion': has_inclusion,
        'deprivation_count': deprivation_count,
        'exclusion_met': [k for k, v in exclusion_criteria.items() if v],
        'inclusion_met': [k for k, v in inclusion_criteria.items() if v],
        'deprivation_met': [k for k, v in deprivation_indicators.items() if v],
    }

# ============================================================================
# INITIALIZE MODEL
# ============================================================================

predictor = ModelPredictor()
model_loaded = predictor.load()

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor.is_loaded
    })

@app.route('/classify', methods=['POST'])
def classify_household():
    """
    Classify a household as APL or BPL
    
    Expected JSON body with household data from survey
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Get ML prediction
        ml_result = predictor.predict(data)
        
        # Get SECC analysis
        secc_result = analyze_secc_criteria(data)
        
        # Combine results
        final_classification = secc_result['secc_classification']
        
        # If SECC has automatic inclusion/exclusion, use that
        # Otherwise, use ML prediction with SECC deprivation count as tiebreaker
        if secc_result['has_inclusion']:
            final_classification = 'BPL'
            reason = 'Automatic inclusion criteria met'
        elif secc_result['has_exclusion']:
            final_classification = 'APL'
            reason = 'Automatic exclusion criteria met'
        elif ml_result.get('success') and ml_result.get('classification'):
            final_classification = ml_result['classification']
            reason = f"ML model prediction ({ml_result['confidence']}% confidence)"
        else:
            final_classification = secc_result['secc_classification']
            reason = secc_result['secc_reason']
        
        # Build response
        response = {
            'success': True,
            'classification': final_classification,
            'reason': reason,
            'ml_prediction': ml_result if ml_result.get('success') else None,
            'secc_analysis': secc_result,
            'recommendation': get_recommendation(final_classification, secc_result, ml_result)
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def get_recommendation(classification: str, secc: Dict, ml: Dict) -> Dict:
    """Generate recommendation based on classification"""
    
    if classification == 'BPL':
        if secc['has_inclusion']:
            priority = 'HIGH'
            message = 'Qualifies for automatic BPL inclusion. Immediate enrollment in welfare programs recommended.'
        elif secc['deprivation_count'] >= 3:
            priority = 'HIGH'
            message = f'Multiple deprivation indicators ({secc["deprivation_count"]}). Priority enrollment recommended.'
        else:
            priority = 'MEDIUM'
            message = 'Eligible for BPL benefits. Standard enrollment process applies.'
        
        eligible_schemes = [
            'Public Distribution System (PDS)',
            'MGNREGA',
            'PM Awas Yojana',
            'Ayushman Bharat',
            'National Food Security Act benefits'
        ]
    else:
        priority = 'LOW'
        message = 'Above poverty line. Not eligible for BPL benefits.'
        eligible_schemes = []
    
    return {
        'priority': priority,
        'message': message,
        'eligible_schemes': eligible_schemes,
        'deprivation_indicators': secc.get('deprivation_met', []),
        'exclusion_indicators': secc.get('exclusion_met', [])
    }

@app.route('/batch-classify', methods=['POST'])
def batch_classify():
    """Classify multiple households at once"""
    try:
        data = request.get_json()
        
        if not data or not isinstance(data, list):
            return jsonify({
                'success': False,
                'error': 'Expected array of household data'
            }), 400
        
        results = []
        for household in data:
            ml_result = predictor.predict(household)
            secc_result = analyze_secc_criteria(household)
            
            results.append({
                'household_id': household.get('ration_no', 'unknown'),
                'ml_classification': ml_result.get('classification'),
                'secc_classification': secc_result['secc_classification'],
                'confidence': ml_result.get('confidence', 0)
            })
        
        return jsonify({
            'success': True,
            'results': results,
            'total': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('AI_MODEL_PORT', 5001))
    print(f"\n🚀 TRACIENT APL/BPL Classification API")
    print(f"   Running on http://localhost:{port}")
    print(f"   Model loaded: {predictor.is_loaded}\n")
    
    app.run(host='0.0.0.0', port=port, debug=False)
