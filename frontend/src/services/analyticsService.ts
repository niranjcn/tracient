import { get, put, post } from './api';
import { 
  GovAnalytics, 
  SectorData, 
  GeoData, 
  Anomaly, 
  PolicyConfig, 
  AuditLog,
  PaginatedResponse,
  SystemHealth,
  Organization
} from '@/types';

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  state?: string;
  district?: string;
  sector?: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  role?: string;
  action?: string;
  userID?: string;
}

export const analyticsService = {
  // Government Dashboard Analytics
  
  // Get summary metrics
  getSummary: async (): Promise<GovAnalytics> => {
    return get('/gov/analytics/summary');
  },

  // Get BPL/APL distribution
  getBPLDistribution: async (): Promise<{ bplCount: number; aplCount: number; bplPercentage: number; threshold: number }> => {
    return get('/gov/analytics/bpl-distribution');
  },

  // Get sector-wise distribution
  getSectorDistribution: async (params?: AnalyticsParams): Promise<SectorData[]> => {
    return get('/gov/analytics/sector-distribution', params);
  },

  // Get geographic data
  getGeographicData: async (params?: AnalyticsParams): Promise<GeoData[]> => {
    return get('/gov/analytics/geographic', params);
  },

  // Get state details
  getStateDetails: async (state: string): Promise<{ districts: GeoData[]; summary: GovAnalytics }> => {
    return get(`/gov/analytics/state/${state}`);
  },

  // Anomaly Detection
  
  // Get anomalies
  getAnomalies: async (params?: { status?: string; severity?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Anomaly>> => {
    return get('/gov/anomalies', params);
  },

  // Get anomaly details
  getAnomalyDetails: async (anomalyID: string): Promise<Anomaly & { transactions: Array<{ wageID: string; amount: number; date: string }> }> => {
    return get(`/gov/anomalies/${anomalyID}`);
  },

  // Update anomaly status
  updateAnomalyStatus: async (anomalyID: string, status: 'investigating' | 'resolved', notes?: string): Promise<{ success: boolean }> => {
    return put(`/gov/anomalies/${anomalyID}/status`, { status, notes });
  },

  // Policy Management
  
  // Get current policy
  getCurrentPolicy: async (): Promise<PolicyConfig> => {
    return get('/gov/policy/current');
  },

  // Get policy history
  getPolicyHistory: async (): Promise<PolicyConfig[]> => {
    return get('/gov/policy/history');
  },

  // Update policy
  updatePolicy: async (policy: Omit<PolicyConfig, 'version'>): Promise<{ success: boolean; newVersion: string; affectedWorkers: number }> => {
    return put('/gov/policy/update', policy);
  },

  // Preview policy impact
  previewPolicyImpact: async (bplThreshold: number, aplThreshold: number): Promise<{ currentBPL: number; newBPL: number; affected: number }> => {
    return post('/gov/policy/preview', { bplThreshold, aplThreshold });
  },

  // Audit Logs
  
  // Get audit logs
  getAuditLogs: async (params?: AuditLogParams): Promise<PaginatedResponse<AuditLog>> => {
    return get('/gov/audit-logs', params);
  },

  // Get audit log details
  getAuditLogDetails: async (logID: string): Promise<AuditLog & { fullDetails: Record<string, unknown> }> => {
    return get(`/gov/audit-logs/${logID}`);
  },

  // Export audit logs
  exportAuditLogs: async (params?: AuditLogParams): Promise<Blob> => {
    return get('/gov/audit-logs/export', params);
  },

  // Reports
  
  // Generate welfare report
  generateWelfareReport: async (params?: AnalyticsParams): Promise<{ reportID: string; downloadUrl: string }> => {
    return post('/gov/reports/welfare', params);
  },

  // Generate compliance report
  generateComplianceReport: async (params?: AnalyticsParams): Promise<{ reportID: string; downloadUrl: string }> => {
    return post('/gov/reports/compliance', params);
  },

  // Admin System Management
  
  // Get system health
  getSystemHealth: async (): Promise<SystemHealth> => {
    return get('/admin/system-health');
  },

  // Get organizations
  getOrganizations: async (): Promise<Organization[]> => {
    return get('/admin/organizations');
  },

  // Create organization
  createOrganization: async (data: Partial<Organization>): Promise<{ success: boolean; orgID: string }> => {
    return post('/admin/organizations', data);
  },

  // Update organization status
  updateOrganizationStatus: async (orgID: string, status: 'active' | 'inactive'): Promise<{ success: boolean }> => {
    return put(`/admin/organizations/${orgID}/status`, { status });
  },

  // Get system logs
  getSystemLogs: async (params?: { level?: string; service?: string; page?: number; limit?: number }): Promise<PaginatedResponse<{ timestamp: string; level: string; service: string; message: string }>> => {
    return get('/admin/logs', params);
  },

  // Trigger system backup
  triggerBackup: async (): Promise<{ success: boolean; backupID: string }> => {
    return post('/admin/backup');
  },

  // Get backup history
  getBackupHistory: async (): Promise<Array<{ backupID: string; timestamp: string; size: number; status: string }>> => {
    return get('/admin/backup/history');
  },

  // Trending data for charts
  getTrendingData: async (metric: string, days: number = 30): Promise<Array<{ date: string; value: number }>> => {
    return get('/gov/analytics/trending', { metric, days });
  },
};

export default analyticsService;
