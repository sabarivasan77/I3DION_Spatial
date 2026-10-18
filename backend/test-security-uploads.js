import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  generatePresignedUploadUrl,
  verifyPresignedUpload,
  generatePresignedDownloadUrl,
  verifyPresignedDownload,
  validateUpload
} from './src/services/storageService.js';
import { sniffMagicMimeType, MAX_FILE_SIZES } from './src/services/uploadValidator.js';

async function runUploadSecurityTests() {
  console.log('--- STARTING PHASE S3: SIGNED UPLOADS & STORAGE SECURITY VERIFICATION ---');

  const testOrgId = crypto.randomUUID();
  const testFilename = 'robot-arm.glb';
  const testMime = 'model/gltf-binary';
  const testByteSize = 1024 * 1024; // 1MB

  // -------------------------------------------------------------
  // TEST UPLOAD-01: Valid signed upload URL generation & verification
  // -------------------------------------------------------------
  console.log('[RUNNING] UPLOAD-01: Valid presigned upload URL signature...');
  const presigned = generatePresignedUploadUrl({
    organizationId: testOrgId,
    filename: testFilename,
    mimeType: testMime,
    byteSize: testByteSize,
    expiresInSeconds: 900
  });

  assert.ok(presigned.uploadUrl.includes('/api/vault/signed-upload'), 'UPLOAD-01: Invalid URL path');
  assert.ok(presigned.signature, 'UPLOAD-01: Missing signature');
  assert.ok(presigned.objectKey.startsWith(`vault/${testOrgId}/`), 'UPLOAD-01: Missing tenant path isolation in objectKey');

  const verifyValid = verifyPresignedUpload({
    organizationId: testOrgId,
    objectKey: presigned.objectKey,
    mimeType: testMime,
    byteSize: testByteSize,
    expiresAt: presigned.expiresAt,
    signature: presigned.signature
  });

  assert.equal(verifyValid.valid, true, 'UPLOAD-01 FAILED: Valid presigned URL failed verification');
  console.log('  -> UPLOAD-01 PASSED (Presigned upload URL generation & signature verified)');

  // -------------------------------------------------------------
  // TEST UPLOAD-02: Expired signed URL rejected
  // -------------------------------------------------------------
  console.log('[RUNNING] UPLOAD-02: Expired signed upload rejection...');
  const expiredTimestamp = Date.now() - 5000; // 5 seconds in the past
  const expiredPresigned = generatePresignedUploadUrl({
    organizationId: testOrgId,
    filename: testFilename,
    mimeType: testMime,
    byteSize: testByteSize,
    expiresInSeconds: -10 // expired
  });

  const verifyExpired = verifyPresignedUpload({
    organizationId: testOrgId,
    objectKey: expiredPresigned.objectKey,
    mimeType: testMime,
    byteSize: testByteSize,
    expiresAt: expiredPresigned.expiresAt,
    signature: expiredPresigned.signature
  });

  assert.equal(verifyExpired.valid, false, 'UPLOAD-02 FAILED: Expired presigned URL was accepted!');
  assert.equal(verifyExpired.error, 'SignatureExpired', 'UPLOAD-02: Expected error SignatureExpired');
  console.log('  -> UPLOAD-02 PASSED (Expired signature rejected with SignatureExpired)');

  // -------------------------------------------------------------
  // TEST UPLOAD-03: Tampered signature or parameters rejected
  // -------------------------------------------------------------
  console.log('[RUNNING] UPLOAD-03: Tampered signature rejection...');
  // Tamper with organizationId
  const attackerOrgId = crypto.randomUUID();
  const verifyTamperedOrg = verifyPresignedUpload({
    organizationId: attackerOrgId,
    objectKey: presigned.objectKey,
    mimeType: testMime,
    byteSize: testByteSize,
    expiresAt: presigned.expiresAt,
    signature: presigned.signature
  });
  assert.equal(verifyTamperedOrg.valid, false, 'UPLOAD-03 FAILED: Tampered orgId was accepted!');

  // Tamper with signature bytes
  const tamperedSig = presigned.signature.slice(0, -4) + 'abcd';
  const verifyTamperedSig = verifyPresignedUpload({
    organizationId: testOrgId,
    objectKey: presigned.objectKey,
    mimeType: testMime,
    byteSize: testByteSize,
    expiresAt: presigned.expiresAt,
    signature: tamperedSig
  });
  assert.equal(verifyTamperedSig.valid, false, 'UPLOAD-03 FAILED: Tampered signature was accepted!');
  console.log('  -> UPLOAD-03 PASSED (Tampered parameters & forged signatures rejected)');

  // -------------------------------------------------------------
  // TEST UPLOAD-04: Spoofed file rejected by MIME magic bytes sniffing
  // -------------------------------------------------------------
  console.log('[RUNNING] UPLOAD-04: Magic byte sniffing and spoof detection...');
  // Create malicious script disguised as a .glb file
  const maliciousScript = Buffer.from('<?php echo "evil"; ?>');
  const spoofValidation = validateUpload(maliciousScript, 'trojan.glb', 'model/gltf-binary', 'model');
  assert.equal(spoofValidation.valid, false, 'UPLOAD-04 FAILED: Malicious PHP script disguised as .glb was accepted!');

  // Valid GLB binary buffer (magic bytes: 'glTF' = 0x676C5446, version 2 = 0x00000002)
  const validGlbHeader = Buffer.alloc(24);
  validGlbHeader.write('glTF', 0, 4, 'ascii');
  validGlbHeader.writeUInt32LE(2, 4);  // version 2
  validGlbHeader.writeUInt32LE(24, 8); // total length
  const glbValidation = validateUpload(validGlbHeader, 'valid_model.glb', 'model/gltf-binary', 'model');
  assert.equal(glbValidation.valid, true, `UPLOAD-04 FAILED: Valid GLB rejected: ${glbValidation.error}`);
  assert.equal(glbValidation.verifiedMime, 'model/gltf-binary');

  // Valid PNG buffer (magic: \x89PNG\r\n\x1a\n)
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const pngValidation = validateUpload(validPngHeader, 'texture.png', 'image/png', 'image');
  assert.equal(pngValidation.valid, true, `UPLOAD-04 FAILED: Valid PNG rejected: ${pngValidation.error}`);
  assert.equal(pngValidation.verifiedMime, 'image/png');

  // Spoofed PNG (HTML file named .png)
  const htmlAsPng = Buffer.from('<html><body><script>alert(1)</script></body></html>');
  const htmlSpoof = validateUpload(htmlAsPng, 'fake_texture.png', 'image/png', 'image');
  assert.equal(htmlSpoof.valid, false, 'UPLOAD-04 FAILED: HTML masquerading as PNG was accepted!');
  console.log('  -> UPLOAD-04 PASSED (Magic byte sniffing catches spoofed/masquerading payloads)');

  // -------------------------------------------------------------
  // TEST UPLOAD-05: File exceeding maximum size rejected
  // -------------------------------------------------------------
  console.log('[RUNNING] UPLOAD-05: Maximum size enforcement...');
  const oversizeBuffer = Buffer.alloc(55 * 1024 * 1024); // 55MB (exceeds 50MB limit)
  oversizeBuffer.write('glTF', 0, 4, 'ascii');
  oversizeBuffer.writeUInt32LE(2, 4);

  const sizeValidation = validateUpload(oversizeBuffer, 'giant.glb', 'model/gltf-binary', 'model');
  assert.equal(sizeValidation.valid, false, 'UPLOAD-05 FAILED: Oversize 55MB file was accepted!');
  assert.ok(sizeValidation.error.includes('exceeds max allowed limit'), 'UPLOAD-05: Expected max allowed limit error');
  console.log('  -> UPLOAD-05 PASSED (Files exceeding maximum size limits rejected)');

  console.log('\n======================================================');
  console.log('ALL PHASE S3 STORAGE & UPLOAD TESTS PASSED (5/5)!');
  console.log('======================================================\n');
}

runUploadSecurityTests().catch((err) => {
  console.error('UPLOAD TEST SUITE FAILED:', err);
  process.exit(1);
});
