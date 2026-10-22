import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/offline_model_download_service.dart';

void main() {
  test('verifies downloaded model size and SHA-256 checksum', () async {
    final directory = await Directory.systemTemp.createTemp(
      'i3dion-offline-model-test-',
    );
    addTearDown(() => directory.delete(recursive: true));
    final bytes = [1, 2, 3, 4, 5];
    final file = File('${directory.path}${Platform.pathSeparator}model.glb');
    await file.writeAsBytes(bytes);
    final checksum = sha256.convert(bytes).toString();

    await expectLater(
      verifyOfflineModelFile(
        file,
        expectedSize: bytes.length,
        expectedChecksum: checksum,
      ),
      completes,
    );
    await expectLater(
      verifyOfflineModelFile(
        file,
        expectedSize: bytes.length + 1,
        expectedChecksum: checksum,
      ),
      throwsA(isA<OfflineDownloadException>()),
    );
    await expectLater(
      verifyOfflineModelFile(
        file,
        expectedSize: bytes.length,
        expectedChecksum: List.filled(64, '0').join(),
      ),
      throwsA(isA<OfflineDownloadException>()),
    );
  });
}
