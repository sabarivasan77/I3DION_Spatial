import { useDataBridgeStore } from '../store/useDataBridgeStore';
import { executeConnectorRequest, resolveJsonPath } from '../runtime/dataBridgeRuntime';
import { connectorRegistry } from '../registry/connectorRegistry';

/**
 * Binds DataBridge connector responses to OmniStudio widget properties
 */
export async function syncConnectorToWidget(
  connectorId: string,
  widgetId: string,
  targetProp: string,
  jsonPath: string,
  variables: Record<string, any> = {}
): Promise<{ success: boolean; value?: any; error?: string }> {
  const connector = connectorRegistry.getConnector(connectorId);
  if (!connector) {
    return { success: false, error: `Connector '${connectorId}' not found.` };
  }

  if (connector.state === 'DISABLED') {
    return { success: false, error: `Connector '${connector.name}' is currently disabled.` };
  }

  const response = await executeConnectorRequest(connector, { variables });
  if (!response.ok) {
    return { success: false, error: response.error?.message || 'API request failed.' };
  }

  const val = resolveJsonPath(response.data, jsonPath);
  if (val === undefined) {
    return { success: false, error: `JSON path '${jsonPath}' returned undefined.` };
  }

  // Update store bound value
  useDataBridgeStore.getState().setBoundValue(`${widgetId}.${targetProp}`, val);

  return { success: true, value: val };
}

/**
 * Helper to validate safe URL binding for images (http/https only)
 */
export function isSafeImageUrl(url: any): boolean {
  if (typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:image/');
}
