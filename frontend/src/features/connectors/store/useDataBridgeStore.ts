import { create } from 'zustand';
import { ConnectorDefinition, NormalizedResponse, ResponseMapping } from '../types/dataBridgeTypes';
import { connectorRegistry, INITIAL_CONNECTORS } from '../registry/connectorRegistry';
import { executeConnectorRequest, resolveJsonPath } from '../runtime/dataBridgeRuntime';

interface DataBridgeStore {
  connectors: ConnectorDefinition[];
  selectedConnectorId: string | null;
  activeResponse: NormalizedResponse | null;
  isTesting: boolean;
  isModalOpen: boolean;
  boundValues: Record<string, any>;
  
  // Actions
  setModalOpen: (open: boolean) => void;
  selectConnector: (id: string | null) => void;
  saveConnector: (connector: ConnectorDefinition) => void;
  deleteConnector: (id: string) => void;
  duplicateConnector: (id: string) => void;
  toggleConnectorState: (id: string) => void;
  executeTest: (id: string, testVariables?: Record<string, any>) => Promise<NormalizedResponse>;
  clearActiveResponse: () => void;
  updateResponseMappings: (connectorId: string, mappings: ResponseMapping[]) => void;
  setBoundValue: (key: string, value: any) => void;
}

export const useDataBridgeStore = create<DataBridgeStore>((set, get) => ({
  connectors: connectorRegistry.listConnectors(),
  selectedConnectorId: INITIAL_CONNECTORS[0]?.id || null,
  activeResponse: null,
  isTesting: false,
  isModalOpen: false,
  boundValues: {},

  setModalOpen: (open) => set({ isModalOpen: open }),

  selectConnector: (id) => set({ selectedConnectorId: id, activeResponse: null }),

  saveConnector: (connector) => {
    connectorRegistry.registerConnector(connector);
    set({
      connectors: connectorRegistry.listConnectors(),
      selectedConnectorId: connector.id,
    });
  },

  deleteConnector: (id) => {
    connectorRegistry.removeConnector(id);
    const updated = connectorRegistry.listConnectors();
    set({
      connectors: updated,
      selectedConnectorId: updated.length > 0 ? updated[0].id : null,
      activeResponse: null,
    });
  },

  duplicateConnector: (id) => {
    const dup = connectorRegistry.duplicateConnector(id);
    if (dup) {
      set({
        connectors: connectorRegistry.listConnectors(),
        selectedConnectorId: dup.id,
      });
    }
  },

  toggleConnectorState: (id) => {
    const connector = connectorRegistry.getConnector(id);
    if (connector) {
      const newState = connector.state === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
      const updated = { ...connector, state: newState as any };
      connectorRegistry.registerConnector(updated);
      set({ connectors: connectorRegistry.listConnectors() });
    }
  },

  executeTest: async (id, testVariables = {}) => {
    const connector = connectorRegistry.getConnector(id);
    if (!connector) {
      const errRes: NormalizedResponse = {
        ok: false,
        status: 400,
        headers: {},
        data: null,
        durationMs: 0,
        error: { code: 'NOT_FOUND', message: 'Connector not found in registry.' },
      };
      set({ activeResponse: errRes });
      return errRes;
    }

    set({ isTesting: true, activeResponse: null });
    const response = await executeConnectorRequest(connector, { variables: testVariables });

    // Apply response mappings to store boundValues if response is OK
    if (response.ok && response.data && connector.responseMappings) {
      const currentBound = { ...get().boundValues };
      connector.responseMappings.forEach(mapping => {
        const val = resolveJsonPath(response.data, mapping.jsonPath);
        if (val !== undefined && mapping.targetVariable) {
          currentBound[mapping.targetVariable] = val;
        }
      });
      set({ boundValues: currentBound });
    }

    set({ isTesting: false, activeResponse: response });
    return response;
  },

  clearActiveResponse: () => set({ activeResponse: null }),

  updateResponseMappings: (connectorId, mappings) => {
    const connector = connectorRegistry.getConnector(connectorId);
    if (connector) {
      const updated = { ...connector, responseMappings: mappings };
      connectorRegistry.registerConnector(updated);
      set({ connectors: connectorRegistry.listConnectors() });
    }
  },

  setBoundValue: (key, value) => set((state) => ({
    boundValues: { ...state.boundValues, [key]: value },
  })),
}));
