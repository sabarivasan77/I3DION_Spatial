import {
  LensLead,
  LensProjectMetric,
  LensVisualization,
  LensDataset,
  LensSavedView,
  LensReport
} from '../types/lensTypes';

export const INITIAL_LENS_LEADS: LensLead[] = [
  {
    id: 'lead_001',
    name: 'Rahul Sharma',
    company: 'Sharma Engineering',
    email: 'rahul.sharma@sharmaengg.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra, India',
    productProject: 'Industrial Compressor',
    status: 'New',
    source: 'Website',
    date: 'Jun 30, 2024',
    assignedTo: 'Anita Patil',
    notes: ['Inquired about 3D CAD step export and high pressure rating.'],
    tags: ['Industrial', 'Compressor', 'High Priority'],
    interestedIn: '3D Model, Technical Specs',
    activityTimeline: [
      { id: 'act_1', type: 'viewed_product', description: 'Viewed Industrial Compressor 3D model (4m 20s)', timestamp: 'Jun 30, 2024, 02:15 PM' },
      { id: 'act_2', type: 'status_change', description: 'Lead captured via website interactive form', timestamp: 'Jun 30, 2024, 10:24 AM' }
    ]
  },
  {
    id: 'lead_002',
    name: 'Anita Patil',
    company: 'Patil Industries',
    email: 'anita@patilindustries.in',
    phone: '+91 98220 11223',
    location: 'Pune, Maharashtra, India',
    productProject: 'HVAC System',
    status: 'Qualified',
    source: 'QR Code',
    date: 'Jun 30, 2024',
    assignedTo: 'Michael Kim',
    notes: ['Requested custom quotation for 5 units with indoor AR installation scan.'],
    tags: ['HVAC', 'Enterprise', 'AR Scan'],
    interestedIn: 'Commercial HVAC Assembly & AR Placement',
    activityTimeline: [
      { id: 'act_3', type: 'ar_session', description: 'Launched 1:1 scale WebXR AR placement session', timestamp: 'Jun 30, 2024, 01:10 PM' },
      { id: 'act_4', type: 'status_change', description: 'Status updated to Qualified by Michael Kim', timestamp: 'Jun 30, 2024, 11:30 AM' }
    ]
  },
  {
    id: 'lead_003',
    name: 'Michael Kim',
    company: 'Tech Solutions',
    email: 'm.kim@techsolutions.com',
    phone: '+1 415 555 0192',
    location: 'San Francisco, CA, USA',
    productProject: 'Valve Assembly',
    status: 'Contacted',
    source: 'Direct',
    date: 'Jun 29, 2024',
    assignedTo: 'Sarah Lee',
    notes: ['Discussed integration with existing SCADA pipeline telemetry.'],
    tags: ['Valve', 'SCADA'],
    interestedIn: 'High-pressure hydraulic valve inspection',
    activityTimeline: [
      { id: 'act_5', type: 'email_sent', description: 'Sent follow-up proposal email with 3D link', timestamp: 'Jun 29, 2024, 04:00 PM' }
    ]
  },
  {
    id: 'lead_004',
    name: 'Sarah Lee',
    company: 'BuildTech',
    email: 's.lee@buildtech.org',
    phone: '+44 20 7946 0912',
    location: 'London, UK',
    productProject: 'Factory Line',
    status: 'In Progress',
    source: 'AR Experience',
    date: 'Jun 29, 2024',
    assignedTo: 'Daniel Turner',
    notes: ['Exploring robotic arm conveyor line simulation for new factory branch.'],
    tags: ['Robotics', 'Factory Automation'],
    interestedIn: 'Automated robotic arm conveyor line',
    activityTimeline: [
      { id: 'act_6', type: 'ar_session', description: 'AR spatial layout test completed in warehouse', timestamp: 'Jun 29, 2024, 03:22 PM' }
    ]
  },
  {
    id: 'lead_005',
    name: 'Daniel Turner',
    company: 'Turner & Co',
    email: 'd.turner@turnerco.com',
    phone: '+1 212 555 0188',
    location: 'New York, NY, USA',
    productProject: 'Pump Series',
    status: 'Converted',
    source: 'Partner',
    date: 'Jun 28, 2024',
    assignedTo: 'Rahul Sharma',
    notes: ['Contract signed for annual 50-unit procurement.'],
    tags: ['Procurement', 'Closed Deal'],
    interestedIn: 'Multi-stage Centrifugal Water Pump',
    activityTimeline: [
      { id: 'act_7', type: 'status_change', description: 'Deal closed! Converted lead to customer account.', timestamp: 'Jun 28, 2024, 05:45 PM' }
    ]
  },
  {
    id: 'lead_006',
    name: 'Lisa Wong',
    company: 'Wong Enterprises',
    email: 'l.wong@wongenterprises.com',
    phone: '+65 6789 0123',
    location: 'Singapore',
    productProject: 'Cooling System',
    status: 'New',
    source: 'Website',
    date: 'Jun 28, 2024',
    assignedTo: 'Anita Patil',
    notes: ['Initial inquiry from Asian trade show landing page.'],
    tags: ['Cooling', 'APAC'],
    interestedIn: 'Industrial Chiller Unit Specs',
    activityTimeline: [
      { id: 'act_8', type: 'viewed_product', description: 'Exploded view hotspot clicked on Compressor motor', timestamp: 'Jun 28, 2024, 09:12 AM' }
    ]
  },
  {
    id: 'lead_007',
    name: 'Priya Mehta',
    company: 'Mehta Corp',
    email: 'priya@mehtacorp.com',
    phone: '+91 99800 77665',
    location: 'Bengaluru, Karnataka, India',
    productProject: 'Industrial Compressor',
    status: 'Qualified',
    source: 'Direct',
    date: 'Jun 27, 2024',
    assignedTo: 'Michael Kim',
    notes: ['Requires enterprise SSO & private Vault catalog sharing.'],
    tags: ['Enterprise', 'Compressor'],
    interestedIn: 'Industrial Compressor Series 2026',
    activityTimeline: [
      { id: 'act_9', type: 'status_change', description: 'Qualified after technical demo meeting', timestamp: 'Jun 27, 2024, 02:30 PM' }
    ]
  },
  {
    id: 'lead_008',
    name: 'James Carter',
    company: 'Carter Industries',
    email: 'jcarter@carterind.com',
    phone: '+1 312 555 0144',
    location: 'Chicago, IL, USA',
    productProject: 'Generator Set',
    status: 'Lost',
    source: 'Other',
    date: 'Jun 26, 2024',
    assignedTo: 'Sarah Lee',
    notes: ['Selected alternative vendor due to local delivery timeline constraint.'],
    tags: ['Generator', 'Closed Lost'],
    interestedIn: 'Diesel Silent Generator',
    activityTimeline: [
      { id: 'act_10', type: 'status_change', description: 'Marked as Lost', timestamp: 'Jun 26, 2024, 11:00 AM' }
    ]
  }
];

export const INITIAL_PROJECT_METRICS: LensProjectMetric[] = [
  {
    id: 'proj_comp',
    name: 'Industrial Compressor',
    category: 'Heavy Machinery',
    viewsCount: 4320,
    leadsCount: 186,
    arSessionsCount: 1240,
    conversionRate: 28.5,
    trendPercentage: 14.2,
    status: 'Published',
    updatedAt: '2 hours ago'
  },
  {
    id: 'proj_hvac',
    name: 'HVAC System',
    category: 'Commercial Building',
    viewsCount: 3210,
    leadsCount: 124,
    arSessionsCount: 980,
    conversionRate: 22.4,
    trendPercentage: 9.8,
    status: 'Published',
    updatedAt: '1 day ago'
  },
  {
    id: 'proj_valve',
    name: 'Valve Assembly',
    category: 'Hydraulic Systems',
    viewsCount: 2980,
    leadsCount: 98,
    arSessionsCount: 650,
    conversionRate: 19.1,
    trendPercentage: 5.4,
    status: 'Published',
    updatedAt: '3 days ago'
  },
  {
    id: 'proj_factory',
    name: 'Factory Line',
    category: 'Robotics & Automation',
    viewsCount: 1870,
    leadsCount: 76,
    arSessionsCount: 410,
    conversionRate: 16.8,
    trendPercentage: 12.0,
    status: 'Published',
    updatedAt: '5 days ago'
  },
  {
    id: 'proj_pump',
    name: 'Pump Series',
    category: 'Fluid Handling',
    viewsCount: 1432,
    leadsCount: 54,
    arSessionsCount: 280,
    conversionRate: 14.2,
    trendPercentage: 3.1,
    status: 'Draft',
    updatedAt: '1 week ago'
  }
];

export const INITIAL_VISUALIZATIONS: LensVisualization[] = [
  {
    id: 'vis_lead_trend',
    title: 'Lead Trend Over Time',
    datasetId: 'ds_leads_vault',
    chartType: 'line',
    primaryMetric: 'Total Leads',
    secondaryMetric: 'Qualified Leads',
    description: 'Daily captured leads vs qualified leads timeline',
    position: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    id: 'vis_lead_source',
    title: 'Leads by Acquisition Source',
    datasetId: 'ds_leads_vault',
    chartType: 'donut',
    primaryMetric: 'Leads Count',
    groupByField: 'Source',
    description: 'Percentage distribution of website, QR, AR & direct leads',
    position: { x: 6, y: 0, w: 6, h: 4 }
  },
  {
    id: 'vis_top_projects',
    title: 'Top Projects by Engagement',
    datasetId: 'ds_projects_vault',
    chartType: 'progress',
    primaryMetric: 'Views Count',
    secondaryMetric: 'Leads Count',
    description: 'Comparative view counts across active 3D projects',
    position: { x: 0, y: 4, w: 12, h: 4 }
  }
];

export const INITIAL_DATASETS: LensDataset[] = [
  {
    id: 'ds_leads_vault',
    name: 'Vault Leads & Intelligence',
    source: 'I3DION Spatial Vault',
    recordsCount: 1248,
    updatedAt: '2 minutes ago',
    accessLevel: 'Vault Public',
    fields: [
      { name: 'id', type: 'string', description: 'Unique lead identifier' },
      { name: 'name', type: 'string', description: 'Contact full name' },
      { name: 'company', type: 'string', description: 'Organization name' },
      { name: 'status', type: 'string', description: 'Lead qualification status' },
      { name: 'source', type: 'string', description: 'Acquisition channel' },
      { name: 'date', type: 'date', description: 'Creation timestamp' },
      { name: 'productProject', type: 'string', description: 'Associated 3D product or project' }
    ],
    sampleData: INITIAL_LENS_LEADS.map(l => ({
      id: l.id,
      name: l.name,
      company: l.company,
      status: l.status,
      source: l.source,
      date: l.date,
      productProject: l.productProject
    }))
  },
  {
    id: 'ds_projects_vault',
    name: '3D Project & Model Telemetry',
    source: 'I3DION Spatial Vault',
    recordsCount: 28,
    updatedAt: '5 minutes ago',
    accessLevel: 'Vault Public',
    fields: [
      { name: 'id', type: 'string', description: 'Project ID' },
      { name: 'name', type: 'string', description: 'Project title' },
      { name: 'viewsCount', type: 'number', description: 'Total 3D canvas views' },
      { name: 'arSessionsCount', type: 'number', description: 'WebXR AR placement sessions' },
      { name: 'conversionRate', type: 'number', description: 'Lead conversion percentage' }
    ],
    sampleData: INITIAL_PROJECT_METRICS
  },
  {
    id: 'ds_ar_telemetry',
    name: 'Spatial AR & WebXR Analytics',
    source: 'I3DION Spatial Vault',
    recordsCount: 3276,
    updatedAt: '10 minutes ago',
    accessLevel: 'Vault Restricted',
    fields: [
      { name: 'sessionId', type: 'string', description: 'AR session ID' },
      { name: 'deviceType', type: 'string', description: 'iOS QuickLook / Android ModelViewer' },
      { name: 'durationSeconds', type: 'number', description: 'Session duration in seconds' },
      { name: 'placedInRealWorld', type: 'boolean', description: 'Anchor placed on floor' }
    ],
    sampleData: [
      { sessionId: 'ar_881', deviceType: 'iOS WebXR', durationSeconds: 145, placedInRealWorld: true },
      { sessionId: 'ar_882', deviceType: 'Android SceneViewer', durationSeconds: 98, placedInRealWorld: true },
      { sessionId: 'ar_883', deviceType: 'iOS QuickLook', durationSeconds: 210, placedInRealWorld: true }
    ]
  }
];

export const INITIAL_SAVED_VIEWS: LensSavedView[] = [
  {
    id: 'sv_001',
    name: 'High-Value Qualified Leads',
    type: 'Leads Filter',
    createdBy: 'John Doe',
    createdAt: 'Jun 28, 2024',
    updatedAt: 'Jun 30, 2024',
    filterState: {
      dateRange: '30d',
      projectFilter: 'all',
      productFilter: 'all',
      sourceFilter: 'all',
      statusFilter: 'Qualified',
      assignedUserFilter: 'all',
      searchKeyword: ''
    }
  },
  {
    id: 'sv_002',
    name: 'Industrial Compressor AR Campaign',
    type: 'Custom Dashboard',
    projectName: 'Industrial Compressor',
    createdBy: 'John Doe',
    createdAt: 'Jun 25, 2024',
    updatedAt: 'Jun 29, 2024',
    filterState: {
      dateRange: '30d',
      projectFilter: 'Industrial Compressor',
      productFilter: 'all',
      sourceFilter: 'AR Experience',
      statusFilter: 'all',
      assignedUserFilter: 'all',
      searchKeyword: ''
    }
  },
  {
    id: 'sv_003',
    name: 'Website & QR Lead Conversion Overview',
    type: 'Explorer View',
    createdBy: 'Anita Patil',
    createdAt: 'Jun 20, 2024',
    updatedAt: 'Jun 28, 2024',
    filterState: {
      dateRange: '90d',
      projectFilter: 'all',
      productFilter: 'all',
      sourceFilter: 'QR Code',
      statusFilter: 'all',
      assignedUserFilter: 'all',
      searchKeyword: ''
    }
  }
];

export const INITIAL_REPORTS: LensReport[] = [
  {
    id: 'rep_001',
    title: 'Monthly Executive Lead & Conversion Summary',
    datasetName: 'Vault Leads & Intelligence',
    format: 'PDF',
    dateRange: 'Jun 01 - Jun 30, 2024',
    metricsCount: 12,
    createdBy: 'John Doe',
    createdAt: 'Jun 30, 2024',
    fileSize: '2.4 MB'
  },
  {
    id: 'rep_002',
    title: '3D Model Hotspot & AR Session Telemetry Report',
    datasetName: 'Spatial AR & WebXR Analytics',
    format: 'CSV',
    dateRange: 'Last 30 Days',
    metricsCount: 8,
    createdBy: 'Michael Kim',
    createdAt: 'Jun 28, 2024',
    fileSize: '1.1 MB'
  },
  {
    id: 'rep_003',
    title: 'Q2 Product Line Engagement & Sales Pipeline',
    datasetName: '3D Project & Model Telemetry',
    format: 'Excel',
    dateRange: 'Q2 2024',
    metricsCount: 15,
    createdBy: 'Anita Patil',
    createdAt: 'Jun 25, 2024',
    fileSize: '4.8 MB'
  }
];
