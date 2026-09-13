export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'In Progress' | 'Converted' | 'Lost';
export type LeadSource = 'Website' | 'QR Code' | 'AR Experience' | 'Direct' | 'Partner' | 'Other';
export type DateRangeOption = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface LeadActivityItem {
  id: string;
  type: 'status_change' | 'note_added' | 'viewed_product' | 'ar_session' | 'email_sent';
  description: string;
  timestamp: string;
  author?: string;
}

export interface LensLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  productProject: string;
  status: LeadStatus;
  source: LeadSource;
  date: string;
  assignedTo: string;
  notes: string[];
  tags: string[];
  interestedIn: string;
  activityTimeline: LeadActivityItem[];
}

export interface LensProjectMetric {
  id: string;
  name: string;
  category: string;
  viewsCount: number;
  leadsCount: number;
  arSessionsCount: number;
  conversionRate: number;
  trendPercentage: number;
  status: 'Published' | 'Draft';
  updatedAt: string;
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'kpi'
  | 'table'
  | 'progress'
  | 'funnel';

export interface LensVisualization {
  id: string;
  title: string;
  datasetId: string;
  chartType: ChartType;
  primaryMetric: string;
  secondaryMetric?: string;
  groupByField?: string;
  description?: string;
  position: { x: number; y: number; w: number; h: number };
}

export interface LensDatasetField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string;
}

export interface LensDataset {
  id: string;
  name: string;
  source: string;
  recordsCount: number;
  updatedAt: string;
  accessLevel: 'Vault Public' | 'Vault Restricted' | 'Vault Admin';
  fields: LensDatasetField[];
  sampleData: Record<string, any>[];
}

export interface LensSavedView {
  id: string;
  name: string;
  type: 'Leads Filter' | 'Custom Dashboard' | 'Explorer View';
  projectName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  filterState: LensFilterState;
}

export interface LensReport {
  id: string;
  title: string;
  datasetName: string;
  format: 'PDF' | 'CSV' | 'JSON' | 'Excel';
  dateRange: string;
  metricsCount: number;
  createdBy: string;
  createdAt: string;
  fileSize: string;
}

export interface LensFilterState {
  dateRange: DateRangeOption;
  projectFilter: string;
  productFilter: string;
  sourceFilter: string;
  statusFilter: string;
  assignedUserFilter: string;
  searchKeyword: string;
}
