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

  // 11. Ingest 3D Spatial Event (Hub / Engine / Studio)
  ingestSpatialEvent: async (payload: {
    eventType: string;
    payload?: Record<string, any>;
    sourceApp?: string;
  }) => {
    const res = await apiRequest<{
      success: boolean;
      eventType: string;
      sourceApp: string;
      triggeredFlowsCount: number;
      flowRunIds: string[];
    }>('/flows/events/spatial', {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify(payload),
    });
    return res;
  },

  // 12. Process Outbox batch
  processOutbox: async (limit = 20) => {
    const res = await apiRequest<{ summary: { processedCount: number; deliveredCount: number; failedCount: number } }>(
      '/flows/outbox/process',
      {
        method: 'POST',
        token: localStorage.getItem('i3dion_token') || '',
        body: JSON.stringify({ limit }),
      }
    );
    return res.summary;
  },

  // 13. List Outbox events
  listOutbox: async () => {
    const res = await apiRequest<{ outbox: any[] }>('/flows/outbox', {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.outbox || [];
  },

  // 14. List all organization runs
  listAllRuns: async (params?: { flowId?: string; status?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.flowId) query.set('flowId', params.flowId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ runs: any[]; total: number }>(`/flows/runs/all${qs}`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
  },

  // 15. Get single run details with full step outputs
  getRun: async (runId: string) => {
    const res = await apiRequest<{ run: any }>(`/flows/runs/${runId}`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.run;
  },

  // 16. Retry run with original or overridden payload
  retryRun: async (runId: string, triggerPayload?: Record<string, any>) => {
    const res = await apiRequest<{ run: any }>(`/flows/runs/${runId}/retry`, {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify({ triggerPayload }),
    });
    return res.run;
  },

  // 17. Get per-flow analytics
  getFlowAnalytics: async (flowId: string) => {
    return apiRequest<{
      overview: {
        totalRuns: number;
        completedRuns: number;
        failedRuns: number;
        runningRuns: number;
        successRate: number;
        avgDurationMs: number;
        p50DurationMs: number;
        p90DurationMs: number;
        p95DurationMs: number;
      };
      dailyHistory: any[];
      topErrors: any[];
    }>(`/flows/${flowId}/analytics`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
  },

  // 18. Get organization-wide analytics overview
  getOverviewAnalytics: async () => {
    return apiRequest<{
      overview: {
        totalRuns: number;
        completedRuns: number;
        failedRuns: number;
        runningRuns: number;
        successRate: number;
        avgDurationMs: number;
        p50DurationMs: number;
        p90DurationMs: number;
        p95DurationMs: number;
      };
      dailyHistory: any[];
      topErrors: any[];
    }>('/flows/analytics/overview', {
      token: localStorage.getItem('i3dion_token') || '',
    });
  },

  // 19. List industrial workflow recipes
  listRecipes: async () => {
    const res = await apiRequest<{ recipes: any[] }>('/flows/recipes', {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res.recipes || [];
  },

  // 20. Instantiate flow from pre-built recipe
  instantiateRecipe: async (recipeKey: string, nameOverride?: string) => {
    const res = await apiRequest<{ flow: any }>(`/flows/recipes/${recipeKey}/instantiate`, {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify({ nameOverride }),
    });
    return res.flow;
  },

  // 21. Export flow definition as downloadable JSON package
  exportFlow: async (id: string) => {
    const res = await apiRequest<any>(`/flows/${id}/export`, {
      token: localStorage.getItem('i3dion_token') || '',
    });
    return res;
  },

  // 22. Import flow package
  importFlow: async (packageData: any) => {
    const res = await apiRequest<{ flow: any }>('/flows/import', {
      method: 'POST',
      token: localStorage.getItem('i3dion_token') || '',
      body: JSON.stringify(packageData),
    });
    return res.flow;
  },
};

