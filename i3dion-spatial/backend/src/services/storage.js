import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';

const megabyte = 1024 * 1024;

export const maxFileSizeBytes = config.maxFileSize;

const fileRules = {
  image: {
    maxSize: 15 * megabyte,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
    mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
  },
  thumbnail: {
    maxSize: 15 * megabyte,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
    mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
  },
  video: {
    maxSize: 150 * megabyte,
    extensions: new Set(['mp4']),
    mimeTypes: new Set(['video/mp4']),
  },
  model: {
    maxSize: 150 * megabyte,
    extensions: new Set(['glb', 'gltf']),
    mimeTypes: new Set(['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'application/json']),
  },
  document: {
    maxSize: 50 * megabyte,
    extensions: new Set(['pdf']),
    mimeTypes: new Set(['application/pdf']),
  },
  qr: {
    maxSize: 5 * megabyte,
    extensions: new Set(['png', 'svg']),
    mimeTypes: new Set(['image/png', 'image/svg+xml']),
  },
};

const categoryFolders = {
  image: 'images',
  thumbnail: 'images',   // Thumbnails stored in images/ folder
  video: 'videos',
  model: 'models',
  document: 'documents',
  qr: 'qr',
};

export async function ensureBucket() {
  const baseDir = path.resolve(process.cwd(), config.uploadDir);
  const dirs = [
    baseDir,
    path.join(baseDir, 'images'),
    path.join(baseDir, 'videos'),
    path.join(baseDir, 'models'),
    path.join(baseDir, 'qr'),
    path.join(baseDir, 'documents'),
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

function extensionOf(originalname) {
  return originalname.includes('.') ? originalname.split('.').pop().toLowerCase() : '';
}

/**
 * Infer file category from file metadata.
 * If a preferredCategory is given and is valid for the file extension, it is used.
 */
export function inferFileCategory(file, preferredCategory) {
  const extension = extensionOf(file.originalname);

  // If a preferred category is provided and it accepts this extension, use it
  if (preferredCategory && fileRules[preferredCategory]) {
    const rule = fileRules[preferredCategory];
    if (rule.extensions.has(extension)) {
      if (file.size > rule.maxSize) {
        throw new ApiError(400, `${preferredCategory} file exceeds the ${(rule.maxSize / megabyte).toFixed(0)} MB limit`);
      }
      return preferredCategory;
    }
  }

  // Otherwise auto-detect
  const entry = Object.entries(fileRules).find(([, rule]) => rule.extensions.has(extension));

  if (!entry) {
    throw new ApiError(400, 'Unsupported file extension');
  }

  const [category, rule] = entry;
  if (!rule.mimeTypes.has(file.mimetype)) {
    throw new ApiError(400, `Unsupported ${category} file type`);
  }

  if (file.size > rule.maxSize) {
    throw new ApiError(400, `${category} file exceeds the ${(rule.maxSize / megabyte).toFixed(0)} MB limit`);
  }

  return category;
}

export async function uploadBuffer(file) {
  return storeBuffer(file);
}

export async function storeBuffer(file, preferredCategory) {
  const category = inferFileCategory(file, preferredCategory);
  const extension = extensionOf(file.originalname);
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  
  const filename = `${crypto.randomUUID()}.${extension}`;
  const folder = categoryFolders[preferredCategory ?? category] ?? categoryFolders.image;
  const objectKey = `${folder}/${filename}`;
  const absolutePath = path.resolve(process.cwd(), config.uploadDir, objectKey);

  await ensureBucket();
  await fs.writeFile(absolutePath, file.buffer);

  const url = `${config.apiUrl}/${config.uploadDir}/${objectKey}`;
  return { category, checksum, objectKey, url };
}

export async function writeTextFile({ contents, filename, folder = 'qr', mimeType = 'image/svg+xml' }) {
  await ensureBucket();
  const objectKey = `${folder}/${filename}`;
  const absolutePath = path.resolve(process.cwd(), config.uploadDir, objectKey);
  await fs.writeFile(absolutePath, contents);
  return {
    objectKey,
    mimeType,
    url: `${config.apiUrl}/${config.uploadDir}/${objectKey}`,
    checksum: crypto.createHash('sha256').update(contents).digest('hex'),
  };
}

export async function deleteObject(objectKey) {
  try {
    const absolutePath = path.resolve(process.cwd(), config.uploadDir, objectKey);
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}
