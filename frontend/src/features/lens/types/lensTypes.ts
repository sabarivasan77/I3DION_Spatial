export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'In Progress' | 'Converted' | 'Lost';
export type LeadSource = 'Website' | 'QR Code' | 'AR Experience' | 'Direct' | 'Partner' | 'Other';
export type DateRangeOption = '7d' | '30d' | '90d' | 'ytd' | 'custom';
export type DealStage = 'Discovery' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface CrmAccount {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  tier: 'Standard' | 'Strategic' | 'Enterprise';
  annual_revenue?: number;
  contact_count?: number;
  deal_count?: number;
  total_won_revenue?: number;
  owner_name?: string;
  created_at: string;
}

export interface CrmContact {
  id: string;
  account_id?: string;
  account_name?: string;
  lead_id?: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  is_primary: boolean;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  account_id: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  contact_email?: string;
  name: string;
  amount: number | string;
  currency: string;
  stage: DealStage;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  loss_reason?: string;
  next_step?: string;
  owner_name?: string;
  created_at: string;
}

export interface CrmTask {
  id: string;
  title: string;
  description?: string;
  task_type: 'follow_up' | 'call' | 'meeting' | 'demo' | 'quote' | 'task';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  due_date: string;
  status: 'Pending' | 'Completed' | 'Canceled';
  completed_at?: string;
  assigned_name?: string;
  lead_name?: string;
  account_name?: string;
  deal_name?: string;
  created_at: string;
}

export interface CrmEnquiry {
  id: string;
  account_id?: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  customer_name?: string;
  customer_email?: string;
  subject: string;
  message: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  created_at: string;
}

export interface CrmDocument {
  id: string;
  account_id?: string;
  account_name?: string;
  deal_id?: string;
  deal_name?: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  category: 'quote' | 'contract' | 'specification' | 'nda' | 'general';
  uploader_name?: string;
  created_at: string;
}

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
