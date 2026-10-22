import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addPublicAssetAccessUrls,
  addPublicModelDownloadMetadata,
} from '../src/services/hub/publicAssetUrls.js';
import { verifySignature } from '../src/services/storageService.js';

test('adds expiring signatures for local public model and image files', () => {
  const product = addPublicAssetAccessUrls({
    model_url: '/uploads/pump.glb',
    image_url: '/uploads/pump.webp',
  });

  for (const [field, filename] of [
    ['model_access_url', 'pump.glb'],
    ['image_access_url', 'pump.webp'],
  ]) {
    const url = new URL(product[field], 'http://localhost:4000');
    assert.equal(url.pathname, `/api/storage/files/${filename}`);
    assert.equal(
      verifySignature(filename, Object.fromEntries(url.searchParams)).valid,
      true,
    );
  }
});

test('does not sign external or unsafe asset paths', () => {
  const externalUrl = 'https://cdn.example.com/uploads/pump.glb';
  const unsafePath = '/uploads/%2e%2e%2Fprivate.glb';
  const product = addPublicAssetAccessUrls({
    model_url: externalUrl,
    image_url: unsafePath,
  });

  assert.equal(product.model_access_url, externalUrl);
  assert.equal(product.image_access_url, unsafePath);
});

test('returns stored model size and checksum for offline verification', async () => {
  const checksum = 'A'.repeat(64);
  const product = await addPublicModelDownloadMetadata({
    model_url: 'https://cdn.example.com/pump.glb',
    model_size_bytes: '2048',
    model_checksum_sha256: checksum,
  });

  assert.equal(product.model_size_bytes, 2048);
  assert.equal(product.model_checksum_sha256, checksum.toLowerCase());
});

test('does not expose invalid download metadata as verifiable', async () => {
  const product = await addPublicModelDownloadMetadata({
    model_url: 'https://cdn.example.com/pump.glb',
    model_size_bytes: 0,
    model_checksum_sha256: 'not-a-checksum',
  });

  assert.equal('model_size_bytes' in product, false);
  assert.equal('model_checksum_sha256' in product, false);
});
