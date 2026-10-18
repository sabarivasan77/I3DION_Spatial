/**
 * Column Security Service for Spatial Vault (Phase P3)
 * Implements Dataverse-style column-level security and audience-safe projections.
 */

/**
 * Filter record data based on column permissions and caller role/context.
 * 
 * @param {Object} recordData - The JSONB data object of the record
 * @param {Array} fields - Array of schema field definitions
 * @param {Object} caller - { role: string, isPublicAudience?: boolean }
 * @returns {Object} Sanitized data object with restricted columns pruned
 */
export function sanitizeRecordForCaller(recordData, fields = [], caller = {}) {
  if (!recordData || typeof recordData !== 'object') {
    return recordData;
  }

  const role = caller.role || 'Viewer';
  const isPublicAudience = Boolean(caller.isPublicAudience);

  // Owners and Platform Super Admins see everything
  if (!isPublicAudience && (role === 'Owner' || role === 'Super Admin')) {
    return { ...recordData };
  }

  const sanitized = { ...recordData };

  for (const field of fields) {
    const fieldKey = field.internal_name || field.name;
    if (!fieldKey || !(fieldKey in sanitized)) continue;

    // 1. Audience restriction check (for public links or viewer audience)
    if (isPublicAudience && field.audience_restricted) {
      delete sanitized[fieldKey];
      continue;
    }

    // 2. Visibility level check
    if (field.visibility === 'ADMIN_ONLY' && !['Admin', 'Owner', 'Super Admin'].includes(role)) {
      delete sanitized[fieldKey];
      continue;
    }

    if (field.visibility === 'SYSTEM_ONLY' && !['Owner', 'Super Admin'].includes(role)) {
      delete sanitized[fieldKey];
      continue;
    }

    // 3. Allowed roles check
    if (Array.isArray(field.allowed_roles) && field.allowed_roles.length > 0) {
      const isAllowed = field.allowed_roles.some(allowed => 
        allowed.toLowerCase() === role.toLowerCase()
      );
      if (!isAllowed) {
        delete sanitized[fieldKey];
        continue;
      }
    }
  }

  return sanitized;
}

/**
 * Batch sanitize multiple records
 */
export function sanitizeRecordsForCaller(records = [], fields = [], caller = {}) {
  return records.map(record => {
    if (record.data) {
      return {
        ...record,
        data: sanitizeRecordForCaller(record.data, fields, caller)
      };
    }
    return sanitizeRecordForCaller(record, fields, caller);
  });
}
