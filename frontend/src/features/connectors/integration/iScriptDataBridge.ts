import { connectorRegistry } from '../registry/connectorRegistry';
import { executeConnectorRequest, resolveJsonPath } from '../runtime/dataBridgeRuntime';
import { useDataBridgeStore } from '../store/useDataBridgeStore';

export interface IScriptExecutionResult {
  success: boolean;
  connectorName?: string;
  response?: any;
  variableName?: string;
  variableValue?: any;
  error?: string;
}

/**
 * Handles iScript commands like:
 * - CALL CONNECTOR "Product API"
 * - SET VARIABLE productName TO RESPONSE.product.name
 */
export async function executeIScriptConnectorCommand(
  connectorNameOrId: string,
  variables: Record<string, any> = {}
): Promise<IScriptExecutionResult> {
  const connectors = connectorRegistry.listConnectors();
  const connector = connectors.find(
    c => c.id === connectorNameOrId || c.name.toLowerCase() === connectorNameOrId.toLowerCase()
  );

  if (!connector) {
    return {
      success: false,
      error: `iScript Error: Connector '${connectorNameOrId}' not found in DataBridge Registry.`,
    };
  }

  if (connector.state === 'DISABLED') {
    return {
      success: false,
      error: `iScript Error: Connector '${connector.name}' is disabled.`,
    };
  }

  const response = await executeConnectorRequest(connector, { variables });

  if (!response.ok) {
    return {
      success: false,
      connectorName: connector.name,
      error: response.error?.message || `API error ${response.status}`,
    };
  }

  return {
    success: true,
    connectorName: connector.name,
    response: response.data,
  };
}

/**
 * Extracts a value from a DataBridge response for an iScript SET VARIABLE command
 */
export function extractIScriptResponseVariable(
  responseData: any,
  jsonPath: string,
  variableName: string
): IScriptExecutionResult {
  const value = resolveJsonPath(responseData, jsonPath);
  if (value === undefined) {
    return {
      success: false,
      error: `iScript Error: Property path '${jsonPath}' not found in response data.`,
    };
  }

  // Update store bound value
  useDataBridgeStore.getState().setBoundValue(variableName, value);

  return {
    success: true,
    variableName,
    variableValue: value,
  };
}
