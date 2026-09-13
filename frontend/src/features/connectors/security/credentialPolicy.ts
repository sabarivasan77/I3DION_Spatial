import { ConnectorDefinition, KeyValuePair, AuthenticationConfig } from '../types/dataBridgeTypes';

const MASK_STRING = '••••••••';

/**
 * Mask string value safely for UI display / logging
 */
export function maskSecret(secret?: string): string {
  if (!secret) return '';
  if (secret.length <= 4) return MASK_STRING;
  return `${secret.substring(0, 2)}${MASK_STRING}${secret.substring(secret.length - 2)}`;
}

/**
 * Sanitizes headers object to ensure sensitive authorization tokens are hidden in previews / logs
 */
export function sanitizeHeadersForDisplay(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveKeys = ['authorization', 'api-key', 'x-api-key', 'token', 'secret', 'cookie'];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      sanitized[key] = maskSecret(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Creates a sanitized copy of a ConnectorDefinition suitable for client-side export or serialization
 */
export function sanitizeConnectorForExport(connector: ConnectorDefinition): ConnectorDefinition {
  const sanitized = JSON.parse(JSON.stringify(connector)) as ConnectorDefinition;

  // Mask headers flagged as secrets
  sanitized.headers = sanitized.headers.map(h => ({
    ...h,
    value: h.isSecret ? maskSecret(h.value) : h.value,
  }));

  // Mask authentication values
  if (sanitized.authentication.apiKey?.keyValue) {
    sanitized.authentication.apiKey.keyValue = maskSecret(sanitized.authentication.apiKey.keyValue);
  }
  if (sanitized.authentication.bearerToken?.token) {
    sanitized.authentication.bearerToken.token = maskSecret(sanitized.authentication.bearerToken.token);
  }
  if (sanitized.authentication.basicAuth?.password) {
    sanitized.authentication.basicAuth.password = maskSecret(sanitized.authentication.basicAuth.password);
  }

  return sanitized;
}

/**
 * Validates that no sensitive values are present in plain text inside local storage keys
 */
export function validateNoSecretsInStorage(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('connector_secret')) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}
