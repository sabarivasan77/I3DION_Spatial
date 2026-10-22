import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';
import {
  generateSignedUrl,
  getStorageDirectory,
} from '../storageService.js';

const uploadDirectory = config.uploadDir.replace(/^[/\\]+|[/\\]+$/g, '');
const uploadPrefix = `/${uploadDirectory}/`;
const apiOrigin = config.apiUrl
  ? new URL(config.apiUrl).origin
  : `http://localhost:${config.port}`;

function signedPublicAssetUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return value;

  let assetUrl;
  try {
    assetUrl = new URL(value, apiOrigin);
  } catch {
    return value;
  }

  if (
    !assetUrl.pathname.startsWith(uploadPrefix) ||
    (assetUrl.origin !== apiOrigin && /^[a-z][a-z\d+.-]*:/i.test(value))
  ) {
    return value;
  }

  let filename;
  try {
    filename = decodeURIComponent(assetUrl.pathname.slice(uploadPrefix.length));
  } catch {
    return value;
  }

  if (
    !filename ||
    filename.includes('/') ||
    filename.includes('\\') ||
    path.basename(filename) !== filename
  ) {
    return value;
  }

  return generateSignedUrl(filename, { expiresInSeconds: 3600 });
}

export function addPublicAssetAccessUrls(product) {
  return {
    ...product,
    model_access_url: signedPublicAssetUrl(product.model_url),
    image_access_url: signedPublicAssetUrl(
      product.image_url ?? product.poster_url,
    ),
  };
}

export async function addPublicModelDownloadMetadata(product) {
  const response = addPublicAssetAccessUrls(product);
  const storedSize = Number(product.model_size_bytes);
  const storedChecksum = product.model_checksum_sha256;
  delete response.model_size_bytes;
  delete response.model_checksum_sha256;
  if (
    Number.isSafeInteger(storedSize) &&
    storedSize > 0 &&
    typeof storedChecksum === 'string' &&
    /^[a-f\d]{64}$/i.test(storedChecksum)
  ) {
    return {
      ...response,
      model_size_bytes: storedSize,
      model_checksum_sha256: storedChecksum.toLowerCase(),
    };
  }

  const localFile = _localModelFile(product.model_url);
  if (localFile == null) return response;

  try {
    const stat = await fs.stat(localFile);
    if (!stat.isFile() || stat.size <= 0) return response;

    const hash = createHash('sha256');
    for await (const chunk of createReadStream(localFile)) {
      hash.update(chunk);
    }
    return {
      ...response,
      model_size_bytes: stat.size,
      model_checksum_sha256: hash.digest('hex'),
    };
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EACCES') return response;
    throw error;
  }
}

function _localModelFile(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let assetUrl;
  try {
    assetUrl = new URL(value, apiOrigin);
  } catch {
    return null;
  }
  if (assetUrl.origin !== apiOrigin || !assetUrl.pathname.startsWith(uploadPrefix)) {
    return null;
  }

  let filename;
  try {
    filename = decodeURIComponent(assetUrl.pathname.slice(uploadPrefix.length));
  } catch {
    return null;
  }
  if (
    !filename ||
    filename.includes('/') ||
    filename.includes('\\') ||
    path.basename(filename) !== filename ||
    !/\.(glb|gltf)$/i.test(filename)
  ) {
    return null;
  }

  const storageRoot = path.resolve(getStorageDirectory());
  const resolved = path.resolve(storageRoot, filename);
  if (!resolved.startsWith(`${storageRoot}${path.sep}`)) return null;
  return resolved;
}
