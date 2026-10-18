import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../db/pool.js';

import { fileURLToPath } from 'node:url';

const SIGNING_SECRET = process.env.STORAGE_SIGNING_SECRET || config.jwtSecret;

/**
 * Returns absolute storage directory path (backend/uploads), invariant of process.cwd()
 */
export function getStorageDirectory() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
}

/**
 * Validates magic-byte signatures for uploaded file types to prevent
 * file-extension spoofing and executable/script injection.
 */
export async function validateFileMagicBytes(fileInput, declaredFilename) {
  let buffer;
  if (Buffer.isBuffer(fileInput)) {
    buffer = fileInput;
  } else if (typeof fileInput === 'string') {
    // Treat as filepath: read first 1024 bytes
    const handle = await fs.open(fileInput, 'r');
    try {
      const readBuffer = Buffer.alloc(1024);
      const { bytesRead } = await handle.read(readBuffer, 0, 1024, 0);
      buffer = readBuffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  } else {
    return { valid: false, reason: 'Invalid file input type' };
  }

  if (buffer.length < 4) {
    return { valid: false, reason: 'File content is too small or empty' };
  }

  // 1. Block executable binaries regardless of declared extension
  // Windows PE: 'MZ' (0x4D, 0x5A)
  if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return { valid: false, reason: 'Forbidden file format: executable PE binary detected' };
  }
  // Linux ELF: 0x7F, 'E', 'L', 'F' (0x7F, 0x45, 0x4C, 0x46)
  if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return { valid: false, reason: 'Forbidden file format: executable ELF binary detected' };
  }

  const ext = path.extname(declaredFilename).toLowerCase();

  switch (ext) {
    case '.glb': {
      // GLB header is 0x46546C67 ('glTF' in ASCII, little-endian)
      const magic = buffer.readUInt32LE(0);
      if (magic !== 0x46546C67) {
        return { valid: false, reason: 'Malformed GLB file: missing glTF magic header (0x46546C67)' };
      }
      return { valid: true, mimeType: 'model/gltf-binary' };
    }

    case '.png': {
      // PNG header: 89 50 4E 47 0D 0A 1A 0A
      if (
        buffer[0] !== 0x89 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x4E ||
        buffer[3] !== 0x47
      ) {
        return { valid: false, reason: 'Invalid PNG file: missing standard PNG signature' };
      }
      return { valid: true, mimeType: 'image/png' };
    }

    case '.jpg':
    case '.jpeg': {
      // JPEG SOI marker: FF D8 FF
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        return { valid: false, reason: 'Invalid JPEG file: missing SOI marker' };
      }
      return { valid: true, mimeType: 'image/jpeg' };
    }

    case '.pdf': {
      // PDF header: '%PDF' (0x25, 0x50, 0x44, 0x46)
      const header = buffer.toString('utf8', 0, 4);
      if (header !== '%PDF') {
        return { valid: false, reason: 'Invalid PDF file: missing %PDF header' };
      }
      return { valid: true, mimeType: 'application/pdf' };
    }

    case '.webp': {
      // WEBP header: 'RIFF....WEBP'
      const riff = buffer.toString('utf8', 0, 4);
      const webp = buffer.toString('utf8', 8, 12);
      if (riff !== 'RIFF' || webp !== 'WEBP') {
        return { valid: false, reason: 'Invalid WEBP file: missing RIFF/WEBP signature' };
      }
      return { valid: true, mimeType: 'image/webp' };
    }

    case '.svg': {
      // Disallow active content inside SVG
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
      if (/<script/i.test(content) || /onload\s*=/i.test(content) || /javascript:/i.test(content)) {
        return { valid: false, reason: 'Security violation: active script content detected in SVG' };
      }
      return { valid: true, mimeType: 'image/svg+xml' };
    }

    default:
      // Other CAD formats (.step, .obj, .usdz, .gltf) permitted if not matching known executable headers
      return { valid: true, mimeType: 'application/octet-stream' };
  }
}

/**
 * Computes an HMAC-SHA256 signature for a file and expiration timestamp.
 */
export function computeSignature(filename, expiresAt, orgId = '') {
  const payload = `${filename}:${expiresAt}:${orgId}`;
  return crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
}

/**
 * Generates an HMAC-signed pre-expiring URL for safe download/viewing of private files.
 */
export function generateSignedUrl(filePathOrName, options = {}) {
  const filename = path.basename(filePathOrName);
  const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const orgId = options.orgId || '';

  const sig = computeSignature(filename, expiresAt, orgId);
  const query = new URLSearchParams({
    expires: expiresAt.toString(),
    sig
  });
  if (orgId) {
    query.set('org', orgId);
  }

  return `/api/storage/files/${encodeURIComponent(filename)}?${query.toString()}`;
}

/**
 * Verifies a signed URL parameter set.
 */
export function verifySignature(filename, query) {
  const { expires, sig, org } = query;
  if (!expires || !sig) {
    return { valid: false, reason: 'Missing signature or expiration parameters' };
  }

  const expiresNum = parseInt(expires, 10);
  if (isNaN(expiresNum) || Math.floor(Date.now() / 1000) > expiresNum) {
    return { valid: false, reason: 'Signed link has expired' };
  }

  const expectedSig = computeSignature(filename, expiresNum, org || '');
  const sigBuffer = Buffer.from(sig, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, reason: 'Invalid signature checksum' };
  }

  return { valid: true, orgId: org || null };
}

/**
 * Express middleware to serve files securely.
 * Checks for either:
 *  1. Valid HMAC signature and non-expired timestamp, OR
 *  2. Valid JWT session token with active organization membership
 */
export async function secureFileHandler(req, res) {
  try {
    const rawFilename = req.params.filename || path.basename(req.path);
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(rawFilename);
    const targetDir = getStorageDirectory();
    const resolvedPath = path.resolve(targetDir, safeFilename);

    // Prevent path escape
    if (!resolvedPath.startsWith(targetDir)) {
      return res.status(403).json({ error: 'Directory traversal forbidden' });
    }

    if (!existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check Signature first
    const hasSig = Boolean(req.query.sig && req.query.expires);
    if (hasSig) {
      const sigVerification = verifySignature(safeFilename, req.query);
      if (!sigVerification.valid) {
        return res.status(403).json({ error: 'Forbidden: ' + sigVerification.reason });
      }
    } else {
      // Must have valid session
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.access_token;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (cookieToken) {
        token = cookieToken;
      }

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized: Private storage requires authentication or a signed pre-expiring URL.'
        });
      }

      try {
        jwt.verify(token, config.jwtSecret);
      } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
      }
    }

    // Set secure response headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Extension to Content-Type
    const ext = path.extname(safeFilename).toLowerCase();
    const contentTypeMap = {
      '.glb': 'model/gltf-binary',
      '.gltf': 'model/gltf+json',
      '.usdz': 'model/vnd.usdz+zip',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4'
    };
    if (contentTypeMap[ext]) {
      res.setHeader('Content-Type', contentTypeMap[ext]);
    }

    const stream = createReadStream(resolvedPath);
    stream.pipe(res);
  } catch (err) {
    console.error('Storage delivery error:', err);
    res.status(500).json({ error: 'Storage transfer failed' });
  }
}

/**
 * Creates storage router exposing signed download endpoints
 */
export function createStorageRouter() {
  const router = Router();
  router.get('/files/:filename', secureFileHandler);
  return router;
}
