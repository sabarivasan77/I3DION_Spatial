import path from 'node:path';
import { config } from '../../config.js';
import { generateSignedUrl } from '../storageService.js';

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
