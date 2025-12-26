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
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface FamilySurveyData extends Omit<Family, '_id' | 'createdAt' | 'updatedAt'> {}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
