export type ConnectorProvider = 'REST_API' | 'WEBHOOK' | 'CRM_SALESFORCE' | 'HUB_SPOT';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface DataConnectorConfig {
  id: string;
  name: string;
  provider: ConnectorProvider;
  endpointUrl: string;
  method: HttpMethod;
  headers: Record<string, string>;
  authKey?: string;
  payloadTemplate?: string;
  isEnabled: boolean;
  lastSyncAt?: string;
  createdAt: string;
}
