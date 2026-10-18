import crypto from 'node:crypto';
import { config } from '../config.js';
import { validateUpload } from './uploadValidator.js';

function getSecret() {
  return config.jwtSecret || 'i3dion_secure_storage_signing_key_default';
}

/**
 * Creates an HMAC-SHA256 signature for given data elements.
 */
function signPayload(elements) {
  const payload = elements.join(':');
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/**
 * Timing-safe string comparison.
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a pre-signed URL for uploading an asset.
 * Default expiration: 15 minutes (900 seconds).
 */
export function generatePresignedUploadUrl({ organizationId, filename, mimeType, byteSize, expiresInSeconds = 900 }) {
  if (!organizationId) throw new Error('organizationId is required for presigned upload');
  if (!filename) throw new Error('filename is required');

  const cleanFilename = pathSafeFilename(filename);
  const objectKey = `vault/${organizationId}/${crypto.randomUUID()}-${cleanFilename}`;
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  const signature = signPayload([organizationId, objectKey, mimeType, String(byteSize), String(expiresAt)]);

  const params = new URLSearchParams({
    orgId: organizationId,
    key: objectKey,
    mime: mimeType,
    size: String(byteSize),
    expires: String(expiresAt),
    sig: signature,
  });

  const uploadUrl = `${config.apiUrl}/api/vault/signed-upload?${params.toString()}`;

  return {
    uploadUrl,
    objectKey,
    expiresAt,
    signature,
  };
}

/**
 * Verify pre-signed upload parameters and signature.
 */
export function verifyPresignedUpload({ organizationId, objectKey, mimeType, byteSize, expiresAt, signature }) {
  if (!organizationId || !objectKey || !mimeType || !byteSize || !expiresAt || !signature) {
    return { valid: false, error: 'Missing required signature parameters' };
  }

  const expTime = Number(expiresAt);
  if (isNaN(expTime) || Date.now() > expTime) {
    return { valid: false, error: 'SignatureExpired' };
  }

  const expectedSig = signPayload([organizationId, objectKey, mimeType, String(byteSize), String(expiresAt)]);
  if (!safeEqual(signature, expectedSig)) {
    return { valid: false, error: 'InvalidSignature' };
  }

  return { valid: true };
}

/**
 * Generate a pre-signed download / viewing URL.
 */
export function generatePresignedDownloadUrl({ objectKey, expiresInSeconds = 900 }) {
  if (!objectKey) throw new Error('objectKey is required');

  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const signature = signPayload(['download', objectKey, String(expiresAt)]);

  const params = new URLSearchParams({
    key: objectKey,
    expires: String(expiresAt),
    sig: signature,
  });

  const downloadUrl = `${config.apiUrl}/api/vault/signed-download?${params.toString()}`;

  return {
    downloadUrl,
    expiresAt,
    signature,
  };
}

/**
 * Verify pre-signed download signature.
 */
export function verifyPresignedDownload({ objectKey, expiresAt, signature }) {
  if (!objectKey || !expiresAt || !signature) {
    return { valid: false, error: 'Missing parameters' };
  }

  const expTime = Number(expiresAt);
  if (isNaN(expTime) || Date.now() > expTime) {
    return { valid: false, error: 'SignatureExpired' };
  }

  const expectedSig = signPayload(['download', objectKey, String(expiresAt)]);
  if (!safeEqual(signature, expectedSig)) {
    return { valid: false, error: 'InvalidSignature' };
  }

  return { valid: true };
}

function pathSafeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export { validateUpload };
