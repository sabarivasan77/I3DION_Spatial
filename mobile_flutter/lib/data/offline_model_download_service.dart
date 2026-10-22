import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/local_library_item.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/public_product.dart';
import 'package:path_provider/path_provider.dart';

class OfflineDownloadException implements Exception {
  const OfflineDownloadException(this.message);

  final String message;

  @override
  String toString() => message;
}

class OfflineDownloadedModel {
  const OfflineDownloadedModel({
    required this.path,
    required this.sizeBytes,
    required this.checksumSha256,
  });

  final String path;
  final int sizeBytes;
  final String checksumSha256;
}

class OfflineModelDownloadService {
  OfflineModelDownloadService({required this.client, this._storageDirectory});

  static const maxModelSizeBytes = 50 * 1024 * 1024;
  static const largeModelWarningBytes = 15 * 1024 * 1024;

  final ApiClient client;
  final Directory? _storageDirectory;

  Future<OfflineDownloadedModel> download(
    PublicProduct product, {
    required CancelToken cancelToken,
    required void Function(int received, int total) onProgress,
  }) async {
    final expectedSize = product.modelSizeBytes;
    final expectedChecksum = product.modelChecksumSha256;
    if (expectedSize == null || expectedChecksum == null) {
      throw const OfflineDownloadException(
        'A verified file size and SHA-256 checksum are not available.',
      );
    }
    if (expectedSize > maxModelSizeBytes) {
      throw const OfflineDownloadException(
        'This model exceeds the 50 MB offline-download limit.',
      );
    }
    if (!product.modelUrl.path.toLowerCase().endsWith('.glb')) {
      throw const OfflineDownloadException(
        'Only single-file GLB models can currently be saved offline.',
      );
    }
    if (!client.permitsUri(product.modelUrl)) {
      throw const OfflineDownloadException(
        'The model download URL is not permitted.',
      );
    }

    final root = _storageDirectory ?? await getApplicationSupportDirectory();
    final directory = Directory(
      '${root.path}${Platform.pathSeparator}i3dion${Platform.pathSeparator}offline-models',
    );
    await directory.create(recursive: true);
    final idHash = sha256.convert(utf8.encode(product.id)).toString();
    final destination = File(
      '${directory.path}${Platform.pathSeparator}$idHash.glb',
    );
    final partial = File('${destination.path}.part');
    final existing = await _verifyExisting(
      destination,
      expectedSize,
      expectedChecksum,
    );
    if (existing) {
      return OfflineDownloadedModel(
        path: destination.path,
        sizeBytes: expectedSize,
        checksumSha256: expectedChecksum,
      );
    }

    try {
      await client.dio.download(
        product.modelUrl.toString(),
        partial.path,
        cancelToken: cancelToken,
        deleteOnError: false,
        onReceiveProgress: onProgress,
      );
      await verifyOfflineModelFile(
        partial,
        expectedSize: expectedSize,
        expectedChecksum: expectedChecksum,
      );
      if (await destination.exists()) await destination.delete();
      final completed = await partial.rename(destination.path);
      return OfflineDownloadedModel(
        path: completed.path,
        sizeBytes: expectedSize,
        checksumSha256: expectedChecksum,
      );
    } on DioException catch (error) {
      await _deleteIfExists(partial);
      if (CancelToken.isCancel(error)) {
        throw const OfflineDownloadException(
          'The model download was canceled.',
        );
      }
      throw const OfflineDownloadException(
        'The model could not be downloaded. Check your connection and retry.',
      );
    } on Object {
      await _deleteIfExists(partial);
      rethrow;
    }
  }

  Future<void> delete(LocalLibraryItem item) async {
    final root = _storageDirectory ?? await getApplicationSupportDirectory();
    final directory = Directory(
      '${root.path}${Platform.pathSeparator}i3dion${Platform.pathSeparator}offline-models',
    );
    final idHash = sha256.convert(utf8.encode(item.id)).toString();
    final expectedPath =
        '${directory.path}${Platform.pathSeparator}$idHash.glb';
    if (item.modelPath != expectedPath) {
      throw const OfflineDownloadException(
        'The saved model path is invalid and was not deleted.',
      );
    }
    await _deleteIfExists(File(expectedPath));
  }

  Future<bool> _verifyExisting(
    File file,
    int expectedSize,
    String expectedChecksum,
  ) async {
    if (!await file.exists()) return false;
    try {
      await verifyOfflineModelFile(
        file,
        expectedSize: expectedSize,
        expectedChecksum: expectedChecksum,
      );
      return true;
    } on OfflineDownloadException {
      await file.delete();
      return false;
    }
  }
}

Future<void> verifyOfflineModelFile(
  File file, {
  required int expectedSize,
  required String expectedChecksum,
}) async {
  if (expectedSize <= 0 ||
      !RegExp(
        r'^[a-f\d]{64}$',
        caseSensitive: false,
      ).hasMatch(expectedChecksum)) {
    throw const OfflineDownloadException(
      'The model integrity metadata is invalid.',
    );
  }
  if (!await file.exists() || await file.length() != expectedSize) {
    throw const OfflineDownloadException(
      'The downloaded model size does not match the catalog.',
    );
  }
  final digest = await sha256.bind(file.openRead()).first;
  if (digest.toString() != expectedChecksum.toLowerCase()) {
    throw const OfflineDownloadException(
      'The downloaded model failed SHA-256 verification.',
    );
  }
}

Future<void> _deleteIfExists(File file) async {
  if (await file.exists()) await file.delete();
}
