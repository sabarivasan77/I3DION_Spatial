import { Tracker, AnalyticsEventRecord } from './Tracker';

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
  productInterested?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Closed' | 'Lost';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  source?: string;
  notes?: string;
  score: number;
  intent_level: 'COLD' | 'WARM' | 'HOT' | 'HIGH INTENT';
  score_reasons: string[];
  total_events: number;
  total_qr_scans: number;
  total_ar_sessions: number;
  total_products_viewed: number;
  active_viewing_seconds: number;
  products_viewed: string[];
  timeline: {
    timestamp: string;
    action: string;
    productId?: string;
    productName?: string;
  }[];
  created_at: string;
  updated_at: string;
}

const LEADS_STORAGE_KEY = 'i3dion.leads';

// Seed demo leads if none exist
const SEED_LEADS: LeadRecord[] = [
  {
    id: 'lead-1',
    name: 'Vikram Sharma',
    email: 'vikram.sharma@tata-advanced.com',
    phone: '+91 98450 12345',
    company: 'Tata Advanced Systems',
    designation: 'Chief Procurement Engineer',
    productInterested: 'Industrial Valve System 3000',
    status: 'Qualified',
    priority: 'Urgent',
    source: 'Public Product QR',
    notes: 'Interested in bulk deployment of 3D AR visualizations for engineering catalogues.',
    score: 95,
    intent_level: 'HIGH INTENT',
    score_reasons: [
      '4 product visits',
      '6m 40s active viewing duration',
      'Technical Datasheet downloaded',
      'AR QuickLook launched 3 times',
      'Clicked Request Quote'
    ],
    total_events: 18,
    total_qr_scans: 2,
    total_ar_sessions: 3,
    total_products_viewed: 2,
    active_viewing_seconds: 400,
    products_viewed: ['Industrial Valve System 3000', 'Precision AR Robotic Arm'],
    timeline: [
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), action: 'Opened Product Page', productName: 'Industrial Valve System 3000' },
      { timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(), action: 'Inspected 3D Wireframe & X-Ray Modes' },
      { timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), action: 'Downloaded Technical Datasheet PDF' },
      { timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(), action: 'Launched Mobile AR Experience' },
      { timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), action: 'Submitted Quote & Qualification Form' }
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'lead-2',
    name: 'Ananya Roy',
    email: 'ananya.roy@reliance-energy.com',
    phone: '+91 98112 87654',
    company: 'Reliance Energy Infra',
    designation: 'Lead Plant Manager',
    productInterested: 'Spatial Turbine Generator',
    status: 'New',
    priority: 'High',
    source: 'Spatial Hub',
    notes: 'Inquired about integration into spatial digital twin catalog.',
    score: 72,
    intent_level: 'HOT',
    score_reasons: [
      '2 product visits',
      '3m 15s active viewing duration',
      '3D Model rotated & zoomed 12 times',
      'Viewed image gallery'
    ],
    total_events: 11,
    total_qr_scans: 1,
    total_ar_sessions: 1,
    total_products_viewed: 1,
    active_viewing_seconds: 195,
    products_viewed: ['Spatial Turbine Generator'],
    timeline: [
      { timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'Discovered product in Spatial Hub' },
      { timestamp: new Date(Date.now() - 86400000 + 120000).toISOString(), action: 'Interacted with 3D model controls' },
      { timestamp: new Date(Date.now() - 86400000 + 300000).toISOString(), action: 'Requested product specification sheet' }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

class LeadEngineService {
  public getStoredLeads(): LeadRecord[] {
    if (typeof localStorage === 'undefined') return SEED_LEADS;
    try {
      const stored = localStorage.getItem(LEADS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(SEED_LEADS));
        return SEED_LEADS;
      }
      return JSON.parse(stored) as LeadRecord[];
    } catch {
      return SEED_LEADS;
    }
  }

  public saveLeads(leads: LeadRecord[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch (err) {
      console.warn('Failed to save leads to localStorage:', err);
    }
  }

  /**
   * Save or Update Lead identity
   */
  public submitLeadForm(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    designation?: string;
    productInterested?: string;
    notes?: string;
    source?: string;
    productId?: string;
  }): LeadRecord {
    const leads = this.getStoredLeads();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = (data.phone || '').trim();

    // Deduplication check by email or non-empty phone
    let existingIndex = leads.findIndex((l) => l.email.toLowerCase() === cleanEmail);
    if (existingIndex === -1 && cleanPhone.length > 5) {
      existingIndex = leads.findIndex((l) => l.phone && l.phone.trim() === cleanPhone);
    }

    const events = Tracker.getLocalEvents();
    const productEvents = events.filter((e) => !data.productId || e.productId === data.productId);
    const activeSecs = Math.max(Tracker.getActiveTimeSeconds(), 45);

    let lead: LeadRecord;

    if (existingIndex !== -1) {
      // Update existing lead record
      lead = { ...leads[existingIndex] };
      lead.name = data.name || lead.name;
      lead.phone = data.phone || lead.phone;
      lead.company = data.company || lead.company;
      lead.designation = data.designation || lead.designation;
      lead.productInterested = data.productInterested || lead.productInterested;
      lead.notes = data.notes ? `${lead.notes}\n[Update]: ${data.notes}` : lead.notes;
      lead.updated_at = new Date().toISOString();

      if (data.productInterested && !lead.products_viewed.includes(data.productInterested)) {
        lead.products_viewed.push(data.productInterested);
        lead.total_products_viewed = lead.products_viewed.length;
      }

      lead.timeline.unshift({
        timestamp: new Date().toISOString(),
        action: `Submitted Form / Updated Interest: ${data.productInterested || 'General Inquiry'}`,
        productId: data.productId,
        productName: data.productInterested,
      });

      // Recalculate score & classification
      this.recalculateLeadScore(lead, productEvents, activeSecs);
      leads[existingIndex] = lead;
    } else {
      // Create new lead record
      lead = {
        id: `lead-${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: data.name,
        email: cleanEmail,
        phone: data.phone || '',
        company: data.company || '',
        designation: data.designation || '',
        productInterested: data.productInterested || '3D Industrial Visualization',
        status: 'New',
        priority: 'Normal',
        source: data.source || 'Public Viewer',
        notes: data.notes || '',
        score: 50,
        intent_level: 'WARM',
        score_reasons: ['Contact form submitted'],
        total_events: productEvents.length + 1,
        total_qr_scans: events.filter((e) => e.eventName === 'qr_viewed' || e.eventName === 'qr_generated').length,
        total_ar_sessions: events.filter((e) => e.eventName === 'ar_launch_success' || e.eventName === 'ar_clicked').length,
        total_products_viewed: 1,
        active_viewing_seconds: activeSecs,
        products_viewed: data.productInterested ? [data.productInterested] : ['Industrial 3D Asset'],
        timeline: [
          {
            timestamp: new Date().toISOString(),
            action: `Initiated Lead Inquiry for ${data.productInterested || 'Product'}`,
            productId: data.productId,
            productName: data.productInterested,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.recalculateLeadScore(lead, productEvents, activeSecs);
      leads.unshift(lead);
    }

    this.saveLeads(leads);
    void Tracker.track('lead_form_submitted', data.productId, { email: cleanEmail, name: data.name });
    return lead;
  }

  private recalculateLeadScore(lead: LeadRecord, events: AnalyticsEventRecord[], activeSecs: number) {
    let score = 30; // base contact score
    const reasons: string[] = [];

    // Views & Visits
    if (lead.products_viewed.length > 1) {
      score += 15;
      reasons.push(`${lead.products_viewed.length} products viewed`);
    } else {
      score += 10;
      reasons.push('Product view recorded');
    }

    // Active Duration
    if (activeSecs >= 180) {
      score += 25;
      reasons.push(`${Math.floor(activeSecs / 60)}m ${activeSecs % 60}s active viewing time`);
    } else if (activeSecs >= 45) {
      score += 15;
      reasons.push(`${activeSecs}s active viewing time`);
    }

    // 3D Interactions (rotate, zoom, pan)
    const has3D = events.some((e) => ['model_rotate', 'model_zoom', 'model_pan', 'viewer_mode_changed'].includes(e.eventName));
    if (has3D) {
      score += 15;
      reasons.push('Interactive 3D model manipulation');
    }

    // Technical Specs / Document access
    const hasDoc = events.some((e) => ['document_opened', 'document_downloaded'].includes(e.eventName));
    if (hasDoc) {
      score += 20;
      reasons.push('Technical document/datasheet accessed');
    }

    // AR Launches
    const hasAR = events.some((e) => ['ar_clicked', 'ar_launch_success'].includes(e.eventName)) || lead.total_ar_sessions > 0;
    if (hasAR) {
      score += 25;
      reasons.push('AR session launched on mobile');
    }

    // Contact Form / CTA
    score += 25;
    reasons.push('Direct lead qualification form submitted');

    lead.score = Math.min(score, 100);
    lead.score_reasons = reasons;

    // Classification
    if (lead.score >= 90) {
      lead.intent_level = 'HIGH INTENT';
      lead.priority = 'Urgent';
    } else if (lead.score >= 65) {
      lead.intent_level = 'HOT';
      lead.priority = 'High';
    } else if (lead.score >= 40) {
      lead.intent_level = 'WARM';
      lead.priority = 'Normal';
    } else {
      lead.intent_level = 'COLD';
      lead.priority = 'Low';
    }
  }
}

export const LeadEngine = new LeadEngineService();
