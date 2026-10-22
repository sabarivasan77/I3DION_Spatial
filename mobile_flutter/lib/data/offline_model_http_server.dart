import 'dart:async';
import 'dart:io';

class OfflineModelHttpServer {
  HttpServer? _server;

  Future<Uri> serve(File file) async {
    await close();
    if (!await file.exists()) {
      throw const FileSystemException('Saved offline model file is missing.');
    }
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    _server = server;
    server.listen((request) => unawaited(_respond(request, file)));
    return Uri(
      scheme: 'http',
      host: InternetAddress.loopbackIPv4.address,
      port: server.port,
      path: '/model.glb',
    );
  }

  Future<void> close() async {
    final server = _server;
    _server = null;
    await server?.close(force: true);
  }

  Future<void> _respond(HttpRequest request, File file) async {
    final response = request.response;
    response.headers
      ..set('Access-Control-Allow-Origin', '*')
      ..set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      ..set('Access-Control-Allow-Headers', 'Range')
      ..set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range');

    if (request.uri.path != '/model.glb') {
      response.statusCode = HttpStatus.notFound;
      await response.close();
      return;
    }
    if (request.method == 'OPTIONS') {
      response.statusCode = HttpStatus.noContent;
      await response.close();
      return;
    }
    if (request.method != 'GET' && request.method != 'HEAD') {
      response.statusCode = HttpStatus.methodNotAllowed;
      response.headers.set('Allow', 'GET, HEAD, OPTIONS');
      await response.close();
      return;
    }

    try {
      final size = await file.length();
      if (size <= 0) {
        response.statusCode = HttpStatus.notFound;
        await response.close();
        return;
      }
      var start = 0;
      var end = size - 1;
      final range = request.headers.value(HttpHeaders.rangeHeader);
      if (range != null) {
        final parsed = _parseRange(range, size);
        if (parsed == null) {
          response
            ..statusCode = HttpStatus.requestedRangeNotSatisfiable
            ..headers.set('Content-Range', 'bytes */$size');
          await response.close();
          return;
        }
        start = parsed.$1;
        end = parsed.$2;
        response
          ..statusCode = HttpStatus.partialContent
          ..headers.set('Content-Range', 'bytes $start-$end/$size');
      } else {
        response.statusCode = HttpStatus.ok;
      }
      final contentLength = end - start + 1;
      response.headers
        ..set(HttpHeaders.contentTypeHeader, 'model/gltf-binary')
        ..set(HttpHeaders.acceptRangesHeader, 'bytes')
        ..contentLength = contentLength;
      if (request.method == 'GET') {
        await response.addStream(file.openRead(start, end + 1));
      }
      await response.close();
    } on FileSystemException {
      response.statusCode = HttpStatus.internalServerError;
      await response.close();
    }
  }

  (int, int)? _parseRange(String value, int size) {
    final match = RegExp(r'^bytes=(\d*)-(\d*)$').firstMatch(value);
    if (match == null || size <= 0) return null;
    final startValue = match.group(1)!;
    final endValue = match.group(2)!;
    if (startValue.isEmpty && endValue.isEmpty) return null;

    if (startValue.isEmpty) {
      final suffixLength = int.tryParse(endValue);
      if (suffixLength == null || suffixLength <= 0) return null;
      final start = (size - suffixLength).clamp(0, size - 1).toInt();
      return (start, size - 1);
    }

    final start = int.tryParse(startValue);
    final requestedEnd = endValue.isEmpty ? size - 1 : int.tryParse(endValue);
    if (start == null ||
        requestedEnd == null ||
        start < 0 ||
        start >= size ||
        requestedEnd < start) {
      return null;
    }
    return (start, requestedEnd.clamp(0, size - 1).toInt());
  }
}
