import { ConnectorDefinition, NormalizedResponse, RuntimeContext } from '../types/dataBridgeTypes';

/**
 * Safely resolves nested property paths (e.g., "product.name" or "items[0].price") from data objects
 * WITHOUT using eval() or new Function().
 */
export function resolveJsonPath(data: any, path: string): any {
  if (data === null || data === undefined || !path) return undefined;
  
  // Normalize array access e.g. "items[0].name" -> ["items", "0", "name"]
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);

  let current = data;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Replaces {{variableName}} in a string using values from context.
 * Strict controlled template matching with ZERO eval/new Function.
 */
export function interpolateVariables(template: string, context: RuntimeContext): string {
  if (!template) return template;
  
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, varName) => {
    // Check direct variables
    if (context.variables && context.variables[varName] !== undefined) {
      return String(context.variables[varName]);
    }
    // Check widget values
    if (context.widgetValues && context.widgetValues[varName] !== undefined) {
      return String(context.widgetValues[varName]);
    }
    // Fall back to path lookup e.g. {{response.product.name}}
    const resolved = resolveJsonPath({ ...context.variables, ...context.widgetValues }, varName);
    if (resolved !== undefined) return String(resolved);

    return `{{${varName}}}`;
  });
}

/**
 * Main DataBridge HTTP Request Execution Engine
 */
export async function executeConnectorRequest<T = any>(
  connector: ConnectorDefinition,
  context: RuntimeContext = {}
): Promise<NormalizedResponse<T>> {
  const startTime = Date.now();

  // 1. Build interpolated Base URL and Path
  const interpolatedBaseUrl = interpolateVariables(connector.baseUrl, context).replace(/\/+$/, '');
  let interpolatedPath = interpolateVariables(connector.path, context);
  if (!interpolatedPath.startsWith('/') && interpolatedPath.length > 0) {
    interpolatedPath = '/' + interpolatedPath;
  }

  // 2. Build Query Parameters
  const queryParams = new URLSearchParams();
  connector.queryParams.filter(q => q.enabled).forEach(q => {
    const val = interpolateVariables(q.value, context);
    queryParams.append(q.key, val);
  });

  if (connector.authentication.mode === 'API_KEY' && connector.authentication.apiKey?.in === 'QUERY') {
    queryParams.append(
      connector.authentication.apiKey.keyName,
      interpolateVariables(connector.authentication.apiKey.keyValue, context)
    );
  }

  const queryString = queryParams.toString();
  const fullUrl = `${interpolatedBaseUrl}${interpolatedPath}${queryString ? '?' + queryString : ''}`;

  // 3. Build Headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (connector.body && ['POST', 'PUT', 'PATCH'].includes(connector.method)) {
    headers['Content-Type'] = 'application/json';
  }

  connector.headers.filter(h => h.enabled).forEach(h => {
    headers[h.key] = interpolateVariables(h.value, context);
  });

  // Apply Authentication
  if (connector.authentication.mode === 'BEARER_TOKEN' && connector.authentication.bearerToken?.token) {
    headers['Authorization'] = `Bearer ${interpolateVariables(connector.authentication.bearerToken.token, context)}`;
  } else if (connector.authentication.mode === 'BASIC_AUTH' && connector.authentication.basicAuth) {
    const username = interpolateVariables(connector.authentication.basicAuth.username, context);
    const password = interpolateVariables(connector.authentication.basicAuth.password, context);
    const b64 = btoa(`${username}:${password}`);
    headers['Authorization'] = `Basic ${b64}`;
  } else if (connector.authentication.mode === 'API_KEY' && connector.authentication.apiKey?.in === 'HEADER') {
    headers[connector.authentication.apiKey.keyName] = interpolateVariables(connector.authentication.apiKey.keyValue, context);
  }

  // 4. Build Body
  let requestBody: string | null = null;
  if (['POST', 'PUT', 'PATCH'].includes(connector.method) && connector.body) {
    requestBody = interpolateVariables(connector.body, context);
  }

  // 5. Setup AbortController & Timeout
  const controller = new AbortController();
  const timeoutMs = connector.timeoutMs || 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine caller signal with timeout controller if passed
  if (context.signal) {
    context.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(fullUrl, {
      method: connector.method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    // Parse response headers safely
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    // Parse body text/json safely
    const rawText = await response.text();
    let responseData: any = rawText;
    try {
      responseData = JSON.parse(rawText);
    } catch {
      // Keep as string if not JSON
    }

    if (!response.ok) {
      let friendlyMessage = 'Unable to connect to the API.';
      let code = 'HTTP_ERROR';

      if (response.status === 401) {
        friendlyMessage = 'Authentication failed. Please check your credentials.';
        code = 'UNAUTHORIZED';
      } else if (response.status === 403) {
        friendlyMessage = 'Access denied. You do not have permission for this resource.';
        code = 'FORBIDDEN';
      } else if (response.status === 404) {
        friendlyMessage = 'The requested resource was not found.';
        code = 'NOT_FOUND';
      } else if (response.status === 429) {
        friendlyMessage = 'API rate limit reached. Please try again later.';
        code = 'RATE_LIMIT_EXCEEDED';
      } else if (response.status >= 500) {
        friendlyMessage = 'Target API service returned a server error.';
        code = 'SERVER_ERROR';
      }

      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        durationMs,
        error: {
          code,
          message: friendlyMessage,
          details: responseData,
          retryAfter,
        },
      };
    }

    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      durationMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        headers: {},
        data: null,
        durationMs,
        error: {
          code: 'TIMEOUT_OR_CANCELLED',
          message: `Request timed out after ${timeoutMs}ms or was cancelled.`,
        },
      };
    }

    return {
      ok: false,
      status: 0,
      headers: {},
      data: null,
      durationMs,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Could not reach the service. Please check network connectivity or CORS settings.',
        details: err?.message || String(err),
      },
    };
  }
}
