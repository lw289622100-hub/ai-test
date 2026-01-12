
export enum ComplianceStatus {
  PASSED = 'Passed',
  RESTRICTED = 'Restricted',
  PROHIBITED = 'Prohibited',
  UNKNOWN = 'Unknown'
}

export enum AppModule {
  DASHBOARD = 'dashboard',
  LIBRARY = 'library',
  ALERTS = 'alerts',
  SETTINGS = 'settings'
}

export interface ApprovedIngredient {
  id: string;
  name: string;
  cas?: string;
  date: string;
  region: 'CN' | 'US' | 'EU';
  agency: string;
  category: string;
  regulatoryId: string;
  url?: string;
}

export interface RegionDetail {
  region: string;
  status: ComplianceStatus;
  regulatoryId: string; 
  approvalDate: string; 
  applicant: string;    
  dosageForm: string;   
  materialSource: string; 
  limit: string;        
  notes: string;        
  sources: string[];    
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface IngredientResult {
  name: string;
  cas?: string;
  summary: string;
  details: RegionDetail[];
  groundingSources?: GroundingLink[]; // 存储来自 Google Search 的原始参考链接
}

export interface Alert {
  id: string;
  date: string;
  region: string;
  type: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
}
