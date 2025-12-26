import api from './api';
import { Family, FamilySurveyData, FamilyMember } from '@/types/family';

export const familyService = {
  // Get family by ration number
  async getMyFamily(): Promise<{ family: Family | null; members: FamilyMember[] }> {
    const response: any = await api.get('/family/my-family');
    return response.data || response;
  },

  // Check if survey exists for user's family
  async checkSurveyStatus(): Promise<{ surveyCompleted: boolean; family: Family | null }> {
    const response: any = await api.get('/family/survey-status');
    return response.data || response;
  },

  // Submit family survey
  async submitSurvey(data: FamilySurveyData): Promise<Family> {
    return api.post('/family/survey', data);
  },

  // Get family details by ration number
  async getFamilyByRation(ration_no: number): Promise<Family> {
    return api.get(`/family/ration/${ration_no}`);
  },

  // Update family details
  async updateFamily(ration_no: number, data: Partial<FamilySurveyData>): Promise<Family> {
    return api.put(`/family/ration/${ration_no}`, data);
  },

  // Get all family members by ration number
  async getFamilyMembers(ration_no: number): Promise<FamilyMember[]> {
    return api.get(`/family/ration/${ration_no}/members`);
  },
};

export default familyService;
