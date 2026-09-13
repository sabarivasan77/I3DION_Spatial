import { DataConnectorConfig } from '../types/connector';

export class DataBridgeService {
  public async dispatchConnector(
    connector: DataConnectorConfig,
    payload: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!connector.isEnabled) {
      return { success: false, error: 'Connector is currently disabled' };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...connector.headers,
      };

      if (connector.authKey) {
        headers['Authorization'] = `Bearer ${connector.authKey}`;
      }

      const response = await fetch(connector.endpointUrl, {
        method: connector.method,
        headers,
        body: connector.method !== 'GET' ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));
      return { success: true, data };
    } catch (err: any) {
      console.error(`[I3DION DataBridge] Connector "${connector.name}" dispatch failed:`, err);
      return { success: false, error: err.message || 'Network request failed' };
    }
  }
}

export const dataBridgeService = new DataBridgeService();
