/**
 * uploadValidator.js
 * Validates uploads using MIME magic byte sniffing, file size bounds, and extension integrity.
 * Strictly prevents malicious file masquerading (Phase S3 / Annex A10).
 */

export const MAX_FILE_SIZES = {
  model: 50 * 1024 * 1024,     // 50 MB for 3D assets (GLB, USDZ, GLTF)
  video: 50 * 1024 * 1024,     // 50 MB for videos
  image: 10 * 1024 * 1024,     // 10 MB for textures/images
  thumbnail: 5 * 1024 * 1024,  // 5 MB for preview thumbnails
  document: 25 * 1024 * 1024,  // 25 MB for PDF documentation
  qr: 2 * 1024 * 1024,         // 2 MB for QR codes
};

/**
 * Sniffs the real MIME type from binary buffer header.
 * @param {Buffer} buffer
 * @returns {string|null}
 */
export function sniffMagicMimeType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // GLB: magic bytes 'glTF' (0x676C5446)
  if (buffer.length >= 12) {
    const magic = buffer.toString('ascii', 0, 4);
    if (magic === 'glTF') {
      return 'model/gltf-binary';
    }
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: \xff\xd8\xff
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // PDF: %PDF-
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // MP4: ....ftyp
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }

  // USDZ / ZIP: PK\x03\x04
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'model/vnd.usdz+zip';
  }

  // Text/JSON based glTF check
  try {
    const headText = buffer.slice(0, 512).toString('utf8').trim();
    if (headText.startsWith('{') && headText.includes('"asset"') && headText.includes('"version"')) {
      return 'model/gltf+json';
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Validates an upload buffer against declared filename, claimed mime, and size limits.
 * @param {Buffer} buffer
 * @param {string} originalname
 * @param {string} claimedMime
 * @param {string} category
 * @returns {{ valid: boolean, error?: string, verifiedMime?: string }}
 */
export function validateUpload(buffer, originalname, claimedMime, category = 'model') {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file payload' };
  }

  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.model;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File size ${buffer.length} exceeds max allowed limit of ${maxSize} bytes for ${category}`
    };
  }

  const extension = originalname?.includes('.') ? originalname.split('.').pop().toLowerCase() : '';
  const sniffedMime = sniffMagicMimeType(buffer);

  if (!sniffedMime) {
    return {
      valid: false,
      error: `Security verification failed: unrecognized file format or signature for ${originalname}`
    };
  }

  // Extension to Sniffed MIME validation
  const extValidations = {
    glb: 'model/gltf-binary',
    gltf: ['model/gltf+json', 'model/gltf-binary'],
    usdz: 'model/vnd.usdz+zip',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
  };

  const expectedMimes = extValidations[extension];
  if (!expectedMimes) {
    return {
      valid: false,
      error: `Unsupported file extension .${extension}`
    };
  }

  const mimeMatch = Array.isArray(expectedMimes)
    ? expectedMimes.includes(sniffedMime)
    : expectedMimes === sniffedMime;

  if (!mimeMatch) {
    return {
      valid: false,
      error: `Spoofed file detected: extension .${extension} does not match detected format ${sniffedMime}`
    };
  }

  return {
    valid: true,
    verifiedMime: sniffedMime
  };
}
