import api from './api';
import { Family, FamilySurveyData, FamilyMember, SurveySubmitResponse, ClassificationResult } from '@/types/family';

export const familyService = {
  // Get family by ration number
  async getMyFamily(): Promise<{ family: Family | null; members: FamilyMember[] }> {
    const response: any = await api.get('/family/my-family');
    return response.data || response;
  },

  // Check if survey exists for user's family - now includes update detection
  async checkSurveyStatus(): Promise<{ 
    surveyCompleted: boolean; 
    family: Family | null;
    requiresUpdate: boolean;
    autoUpdated: boolean;
    actualMemberCount: number;
    registeredMemberCount: number;
  }> {
    const response: any = await api.get('/family/survey-status');
    return response.data || response;
  },

  // Submit family survey - returns family data with classification result
  async submitSurvey(data: FamilySurveyData): Promise<SurveySubmitResponse> {
    const response: any = await api.post('/family/survey', data);
    return response;
  },

  // Get family details by ration number
  async getFamilyByRation(ration_no: number): Promise<Family> {
    return api.get(`/family/ration/${ration_no}`);
  },

  // Update family details with optional reclassification
  async updateFamily(ration_no: number, data: Partial<FamilySurveyData>, reclassify: boolean = true): Promise<{
    family: Family;
    classification: ClassificationResult | null;
  }> {
    const response: any = await api.put(`/family/ration/${ration_no}?reclassify=${reclassify}`, data);
    return response.data || response;
  },

  // Get all family members by ration number
  async getFamilyMembers(ration_no: number): Promise<FamilyMember[]> {
    return api.get(`/family/ration/${ration_no}/members`);
  },

  // Reclassify existing family
  async reclassifyFamily(): Promise<SurveySubmitResponse> {
    const response: any = await api.post('/family/reclassify');
    return response;
  },
};

export default familyService;
