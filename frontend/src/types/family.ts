// Family types
export interface Family {
  _id: string;
  ration_no: number;
  
  // Demographics
  family_size: number;
  head_age: number;
  children_0_6: number;
  children_6_14: number;
  adults_16_59: number;
  adult_males_16_59: number;
  adult_females_16_59: number;
  elderly_60_plus: number;
  able_bodied_adults: number;
  working_members: number;
  literate_adults_above_25: number;
  children_in_school: number;
  
  // Household Type
  is_female_headed: 0 | 1;
  is_pvtg: 0 | 1;
  is_minority: 0 | 1;
  is_informal: 0 | 1;
  
  // Education & Income
  education_code: number;
  highest_earner_monthly: number;
  
  // Land & Agriculture
  total_land_acres: number;
  irrigated_land_acres: number;
  crop_seasons: number;
  kcc_limit: number;
  
  // Assets - Exclusion Criteria
  owns_two_wheeler: boolean;
  owns_four_wheeler: boolean;
  owns_tractor: boolean;
  owns_mechanized_equipment: boolean;
  owns_refrigerator: boolean;
  owns_landline: boolean;
  
  // Assets - General
  owns_tv: boolean;
  owns_mobile: boolean;
  
  // Financial
  has_bank_account: boolean;
  has_savings: boolean;
  has_loan: boolean;
  loan_source: 'none' | 'bank' | 'cooperative' | 'moneylender' | 'family' | 'other';
  
  // Housing
  house_type: 'houseless' | 'temporary_plastic' | 'kucha' | 'semi_pucca' | 'pucca';
  num_rooms: number;
  has_electricity: 0 | 1;
  has_water_tap: 0 | 1;
  has_toilet: 0 | 1;
  is_houseless: 0 | 1;
  
  // APL/BPL Classification Results
  classification: 'APL' | 'BPL' | 'pending';
  classification_confidence: number;
  classification_reason: string;
  
  // ML Model Results
  ml_classification: 'APL' | 'BPL' | null;
  ml_bpl_probability: number;
  ml_apl_probability: number;
  
  // SECC Analysis Results
  secc_classification: 'APL' | 'BPL' | null;
  secc_reason: string;
  secc_has_exclusion: boolean;
  secc_has_inclusion: boolean;
  secc_deprivation_count: number;
  secc_exclusion_met: string[];
  secc_inclusion_met: string[];
  secc_deprivation_met: string[];
  
  // Recommendation
  recommendation_priority: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  recommendation_message: string;
  eligible_schemes: string[];
  
  // Classification metadata
  classified_at: string | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Classification response from API
export interface ClassificationResult {
  success: boolean;
  classification: 'APL' | 'BPL';
  reason: string;
  ml_prediction: {
    classification: 'APL' | 'BPL';
    confidence: number;
    bpl_probability: number;
    apl_probability: number;
  } | null;
  secc_analysis: {
    secc_classification: 'APL' | 'BPL';
    secc_reason: string;
    has_exclusion: boolean;
    has_inclusion: boolean;
    deprivation_count: number;
    exclusion_met: string[];
    inclusion_met: string[];
    deprivation_met: string[];
  };
  recommendation: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    eligible_schemes: string[];
    deprivation_indicators: string[];
    exclusion_indicators: string[];
  };
}

// Survey submission response
export interface SurveySubmitResponse {
  success: boolean;
  message: string;
  data: {
    family: Family;
    classification: ClassificationResult | null;
  };
}

export interface FamilySurveyData extends Omit<Family, '_id' | 'createdAt' | 'updatedAt' | 'classification' | 'classification_confidence' | 'classification_reason' | 'ml_classification' | 'ml_bpl_probability' | 'ml_apl_probability' | 'secc_classification' | 'secc_reason' | 'secc_has_exclusion' | 'secc_has_inclusion' | 'secc_deprivation_count' | 'secc_exclusion_met' | 'secc_inclusion_met' | 'secc_deprivation_met' | 'recommendation_priority' | 'recommendation_message' | 'eligible_schemes' | 'classified_at'> {}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
