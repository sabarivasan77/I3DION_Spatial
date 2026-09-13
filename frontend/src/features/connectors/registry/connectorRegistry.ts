import { ConnectorDefinition } from '../types/dataBridgeTypes';
import { validateConnector } from '../validation/connectorValidation';

export const INITIAL_CONNECTORS: ConnectorDefinition[] = [
  {
    id: 'connector_products',
    name: 'Product API',
    version: 1,
    description: 'Fetch product details and inventory specifications',
    method: 'GET',
    baseUrl: 'https://api.example.com/v1',
    path: '/products/{productId}',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    queryParams: [
      { id: 'q1', key: 'includeSpecs', value: 'true', enabled: true },
    ],
    body: null,
    authentication: {
      mode: 'NONE',
    },
    timeoutMs: 10000,
    state: 'ACTIVE',
    responseMappings: [
      { id: 'm1', jsonPath: 'product.name', targetVariable: 'productName' },
      { id: 'm2', jsonPath: 'product.price', targetVariable: 'productPrice' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'connector_crm',
    name: 'CRM Customer Service',
    version: 1,
    description: 'Retrieve and create customer leads',
    method: 'POST',
    baseUrl: 'https://api.example.com/v1',
    path: '/leads',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    queryParams: [],
    body: JSON.stringify({ name: '{{customerName}}', email: '{{email}}' }, null, 2),
    authentication: {
      mode: 'BEARER_TOKEN',
      bearerToken: { token: 'sample_bearer_token' },
    },
    timeoutMs: 10000,
    state: 'ACTIVE',
    responseMappings: [
      { id: 'm1', jsonPath: 'lead.id', targetVariable: 'createdLeadId' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'connector_inventory',
    name: 'Inventory Status API',
    version: 1,
    description: 'Check real-time warehouse stock levels',
    method: 'GET',
    baseUrl: 'https://api.example.com/v1',
    path: '/inventory/check',
    headers: [],
    queryParams: [
      { id: 'q1', key: 'sku', value: '{{sku}}', enabled: true },
    ],
    body: null,
    authentication: {
      mode: 'API_KEY',
      apiKey: { keyName: 'X-API-KEY', keyValue: 'sample_key_value', in: 'HEADER' },
    },
    timeoutMs: 8000,
    state: 'ACTIVE',
    responseMappings: [
      { id: 'm1', jsonPath: 'stock.available', targetVariable: 'availableStock' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class ConnectorRegistry {
  private connectors: Map<string, ConnectorDefinition> = new Map();

  constructor() {
    INITIAL_CONNECTORS.forEach(c => this.registerConnector(c));
  }

  public registerConnector(connector: ConnectorDefinition): boolean {
    const validation = validateConnector(connector);
    if (!validation.isValid) {
      console.warn(`[DataBridge] Cannot register invalid connector ${connector.id}:`, validation.errors);
    }
    this.connectors.set(connector.id, { ...connector, updatedAt: new Date().toISOString() });
    return true;
  }

  public getConnector(id: string): ConnectorDefinition | undefined {
    return this.connectors.get(id);
  }

  public listConnectors(): ConnectorDefinition[] {
    return Array.from(this.connectors.values());
  }

  public removeConnector(id: string): boolean {
    return this.connectors.delete(id);
  }

  public duplicateConnector(id: string): ConnectorDefinition | undefined {
    const original = this.getConnector(id);
    if (!original) return undefined;

    const newId = `${original.id}_copy_${Date.now().toString().slice(-4)}`;
    const duplicate: ConnectorDefinition = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.registerConnector(duplicate);
    return duplicate;
  }

  public resetToDefaults(): void {
    this.connectors.clear();
    INITIAL_CONNECTORS.forEach(c => this.registerConnector(c));
  }
}

export const connectorRegistry = new ConnectorRegistry();
