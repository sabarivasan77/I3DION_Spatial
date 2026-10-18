import { apiRequest } from '../../../services/api';
import type { FlowDocument, TestRunResult } from '../types/flow';

export interface FlowListItem {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  trigger_type: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  version: number;
  flow_definition?: any;
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  run_count?: number;
}

export interface FlowRunItem {
  id: string;
  flow_id: string;
  organization_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_payload: Record<string, any>;
  step_results: Record<string, any>;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  triggered_by_name?: string;
}

export interface FlowVersionItem {
  id: string;
  flow_id: string;
  version: number;
  flow_definition: any;
  change_summary: string;
  published_by: string;
  created_at: string;
}

export const flowApi = {
  // 1. List flows for current tenant
  listFlows: async (params?: { status?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest<{ flows: FlowListItem[] }>(`/flows${qs}`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.flows || [];
  },

  // 2. Get single flow by ID
  getFlow: async (id: string) => {
    const res = await apiRequest<{ flow: any }>(`/flows/${id}`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.flow;
  },

  // 3. Create flow
  createFlow: async (payload: {
    name: string;
    description?: string;
    triggerType?: string;
    triggerConfig?: Record<string, any>;
    flowDefinition?: any;
  }) => {
    const res = await apiRequest<{ flow: any }>('/flows', {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify(payload),
    });
    return res.flow;
  },

  // 4. Update flow
  updateFlow: async (
    id: string,
    payload: {
      name?: string;
      description?: string;
      triggerType?: string;
      triggerConfig?: Record<string, any>;
      flowDefinition?: any;
      status?: string;
    }
  ) => {
    const res = await apiRequest<{ flow: any }>(`/flows/${id}`, {
      method: 'PUT',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify(payload),
    });
    return res.flow;
  },

  // 5. Publish flow version
  publishFlow: async (id: string, changeSummary?: string) => {
    const res = await apiRequest<{ flow: any }>(`/flows/${id}/publish`, {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify({ changeSummary }),
    });
    return res.flow;
  },

  // 6. Duplicate flow
  duplicateFlow: async (id: string) => {
    const res = await apiRequest<{ flow: any }>(`/flows/${id}/duplicate`, {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.flow;
  },

  // 7. Archive / Delete flow
  archiveFlow: async (id: string) => {
    const res = await apiRequest<{ success: boolean; flow: any }>(`/flows/${id}`, {
      method: 'DELETE',
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res;
  },

  // 8. List flow versions
  listFlowVersions: async (id: string) => {
    const res = await apiRequest<{ versions: FlowVersionItem[] }>(`/flows/${id}/versions`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.versions || [];
  },

  // 9. Trigger test run / execution
  triggerRun: async (id: string, payload: Record<string, any>) => {
    const res = await apiRequest<{ run: FlowRunItem }>(`/flows/${id}/trigger`, {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify(payload),
    });
    return res.run;
  },

  // 10. List execution runs
  listRuns: async (id: string) => {
    const res = await apiRequest<{ runs: FlowRunItem[] }>(`/flows/${id}/runs`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.runs || [];
  },
};
