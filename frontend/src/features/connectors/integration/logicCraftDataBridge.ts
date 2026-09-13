import { connectorRegistry } from '../registry/connectorRegistry';
import { executeConnectorRequest, resolveJsonPath } from '../runtime/dataBridgeRuntime';
import { NormalizedResponse } from '../types/dataBridgeTypes';
import { useDataBridgeStore } from '../store/useDataBridgeStore';

export interface LogicCraftApiActionNode {
  connectorId: string;
  variableBindings?: Record<string, any>;
}

export interface LogicCraftApiResponseEvent {
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  response: NormalizedResponse;
  extractedValues: Record<string, any>;
}

/**
 * Invokes a DataBridge API Request from a LogicCraft flow node execution
 */
export async function executeLogicCraftApiNode(
  nodeConfig: LogicCraftApiActionNode,
  contextVariables: Record<string, any> = {}
): Promise<LogicCraftApiResponseEvent> {
  const connector = connectorRegistry.getConnector(nodeConfig.connectorId);

  if (!connector || connector.state === 'DISABLED') {
    const errorResponse: NormalizedResponse = {
      ok: false,
      status: 400,
      headers: {},
      data: null,
      durationMs: 0,
      error: {
        code: 'CONNECTOR_UNAVAILABLE',
        message: `Connector '${nodeConfig.connectorId}' is invalid or disabled.`,
      },
    };
    return {
      status: 'ERROR',
      response: errorResponse,
      extractedValues: {},
    };
  }

  const mergedVariables = { ...contextVariables, ...nodeConfig.variableBindings };
  const response = await executeConnectorRequest(connector, { variables: mergedVariables });

  const extractedValues: Record<string, any> = {};
  if (response.ok && response.data && connector.responseMappings) {
    connector.responseMappings.forEach(mapping => {
      const val = resolveJsonPath(response.data, mapping.jsonPath);
      if (val !== undefined && mapping.targetVariable) {
        extractedValues[mapping.targetVariable] = val;
        useDataBridgeStore.getState().setBoundValue(mapping.targetVariable, val);
      }
    });
  }

  let eventStatus: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'SUCCESS';
  if (!response.ok) {
    eventStatus = response.status === 408 ? 'TIMEOUT' : 'ERROR';
  }

  return {
    status: eventStatus,
    response,
    extractedValues,
  };
}
