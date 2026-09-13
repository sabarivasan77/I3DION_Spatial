export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthenticationMode = 'NONE' | 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2';

export type ConnectorState = 'DRAFT' | 'VALID' | 'INVALID' | 'TESTING' | 'ACTIVE' | 'DISABLED';

export type ExecutionEnvironment = 'Development' | 'Staging' | 'Production';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret?: boolean;
}

export interface ApiKeyAuthConfig {
  keyName: string;
  keyValue: string;
  in: 'HEADER' | 'QUERY';
}

export interface BearerTokenAuthConfig {
  token: string;
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

export interface OAuth2AuthConfig {
  grantType: 'client_credentials' | 'authorization_code';
  clientId: string;
  tokenUrl: string;
  scopes?: string[];
  note?: string; // Placeholder for phase 7 extension point
}

export interface AuthenticationConfig {
  mode: AuthenticationMode;
  apiKey?: ApiKeyAuthConfig;
  bearerToken?: BearerTokenAuthConfig;
  basicAuth?: BasicAuthConfig;
  oauth2?: OAuth2AuthConfig;
}

export interface ResponseMapping {
  id: string;
  jsonPath: string; // e.g. "product.name" or "items[0].price"
  targetVariable: string; // e.g. "productName"
  targetWidgetId?: string; // e.g. "TextWidget_01"
  targetWidgetProp?: string; // e.g. "text" or "source"
}

export interface ConnectorDefinition {
  id: string;
  name: string;
  version: number;
  description?: string;
  method: HttpMethod;
  baseUrl: string;
  path: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: string | null; // Raw JSON or template string
  authentication: AuthenticationConfig;
  timeoutMs: number; // Default 10000ms
  state: ConnectorState;
  responseMappings: ResponseMapping[];
  environment?: ExecutionEnvironment;
  executionTarget?: 'CLIENT' | 'SERVER';
  createdAt?: string;
  updatedAt?: string;
}

export interface NormalizedResponse<T = any> {
  ok: boolean;
  status: number;
  statusText?: string;
  headers: Record<string, string>;
  data: T;
  durationMs: number;
  error?: {
    code: string;
    message: string;
    details?: any;
    retryAfter?: number;
  };
}

export interface RuntimeContext {
  variables?: Record<string, any>;
  widgetValues?: Record<string, any>;
  tenantId?: string;
  environment?: ExecutionEnvironment;
  signal?: AbortSignal;
}

export interface RetryPolicy {
  maxRetries: number;
  retryableStatuses: number[];
  backoffMs: number;
}
