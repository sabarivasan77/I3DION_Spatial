import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/offline_model_http_server.dart';

void main() {
  test('streams the offline GLB and supports byte range requests', () async {
    final directory = await Directory.systemTemp.createTemp(
      'i3dion-offline-server-test-',
    );
    addTearDown(() => directory.delete(recursive: true));
    final file = File('${directory.path}${Platform.pathSeparator}model.glb');
    final modelBytes = [1, 2, 3, 4, 5, 6];
    await file.writeAsBytes(modelBytes);
    final server = OfflineModelHttpServer();
    addTearDown(server.close);
    final uri = await server.serve(file);
    final client = HttpClient();
    addTearDown(client.close);

    final fullRequest = await client.getUrl(uri);
    final fullResponse = await fullRequest.close();
    expect(fullResponse.statusCode, HttpStatus.ok);
    expect(fullResponse.headers.value('Access-Control-Allow-Origin'), '*');
    expect(
      await fullResponse.fold<List<int>>(
        [],
        (bytes, chunk) => bytes..addAll(chunk),
      ),
      modelBytes,
    );

    final rangeRequest = await client.getUrl(uri);
    rangeRequest.headers.set(HttpHeaders.rangeHeader, 'bytes=1-3');
    final rangeResponse = await rangeRequest.close();
    expect(rangeResponse.statusCode, HttpStatus.partialContent);
    expect(rangeResponse.headers.value('Content-Range'), 'bytes 1-3/6');
    expect(
      await rangeResponse.fold<List<int>>(
        [],
        (bytes, chunk) => bytes..addAll(chunk),
      ),
      [2, 3, 4],
    );
  });
}
