import { ConnectorDefinition, HttpMethod } from '../types/dataBridgeTypes';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

const VALID_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function validateConnector(connector: Partial<ConnectorDefinition>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!connector.id || connector.id.trim() === '') {
    errors.push({ field: 'id', message: 'Connector ID is required.' });
  } else if (!/^[a-zA-Z0-9_-]+$/.test(connector.id)) {
    errors.push({ field: 'id', message: 'Connector ID must contain only alphanumeric characters, underscores, or hyphens.' });
  }

  if (!connector.name || connector.name.trim() === '') {
    errors.push({ field: 'name', message: 'Connector Name is required.' });
  }

  if (!connector.method || !VALID_METHODS.includes(connector.method)) {
    errors.push({ field: 'method', message: `Invalid HTTP method. Must be one of ${VALID_METHODS.join(', ')}.` });
  }

  if (!connector.baseUrl || connector.baseUrl.trim() === '') {
    errors.push({ field: 'baseUrl', message: 'Base URL is required.' });
  } else {
    try {
      // Check basic URL format (or variable pattern like {{baseUrl}})
      if (!connector.baseUrl.startsWith('http://') && !connector.baseUrl.startsWith('https://') && !connector.baseUrl.startsWith('{{')) {
        errors.push({ field: 'baseUrl', message: 'Base URL must start with http:// or https://' });
      }
    } catch {
      errors.push({ field: 'baseUrl', message: 'Invalid Base URL format.' });
    }
  }

  if (connector.timeoutMs !== undefined) {
    if (connector.timeoutMs < 500 || connector.timeoutMs > 60000) {
      errors.push({ field: 'timeoutMs', message: 'Timeout must be between 500ms and 60,000ms.' });
    }
  }

  if (connector.body && connector.body.trim() !== '') {
    // If body is present and doesn't contain variable interpolation tags, check JSON syntax
    const cleanedBody = connector.body.replace(/\{\{[^}]+\}\}/g, '"__placeholder__"');
    try {
      JSON.parse(cleanedBody);
    } catch {
      errors.push({ field: 'body', message: 'Body must be valid JSON format.' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
