import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/domain/content_link.dart';

void main() {
  final validator = ContentLinkValidator(
    allowedHosts: const ['spatial.i3dion.example'],
  );

  group('ContentLinkValidator', () {
    test('accepts a configured HTTPS model link', () {
      final result = validator.validate(
        'https://spatial.i3dion.example/models/pump_42',
      );

      expect(result.isAccepted, isTrue);
      expect(result.content?.kind, ContentKind.model);
      expect(result.content?.id, 'pump_42');
      expect(result.content?.location, '/content/model/pump_42');
      expect(
        result.content?.canonicalUri,
        'https://spatial.i3dion.example/model/pump_42',
      );
    });

    test('accepts the restricted custom scheme content path', () {
      final result = validator.validate('i3dion://catalog/annual-2026');

      expect(result.isAccepted, isTrue);
      expect(result.content?.kind, ContentKind.catalog);
      expect(result.content?.canonicalUri, 'i3dion://catalog/annual-2026');
    });

    test('rejects an unconfigured host and HTTP', () {
      expect(
        validator.validate('https://attacker.example/model/1').isAccepted,
        isFalse,
      );
      expect(
        validator.validate('http://spatial.i3dion.example/model/1').isAccepted,
        isFalse,
      );
    });

    test('rejects malformed or ambiguous content links', () {
      for (final value in [
        '',
        'not a URL',
        'https://spatial.i3dion.example/model/1?token=secret',
        'https://user@spatial.i3dion.example/model/1',
        'https://spatial.i3dion.example:443/model/1',
        'https://spatial.i3dion.example/account/1',
        'i3dion://model/../catalog/1',
        'javascript://model/1',
        'https://spatial.i3dion.example/model/%2F',
      ]) {
        expect(
          validator.validate(value).isAccepted,
          isFalse,
          reason: 'Expected rejection for $value',
        );
      }
    });

    test('disables HTTPS links when no host is configured', () {
      final noHosts = ContentLinkValidator(allowedHosts: const []);

      expect(
        noHosts.validate('https://spatial.i3dion.example/model/1').isAccepted,
        isFalse,
      );
      expect(noHosts.validate('i3dion://model/1').isAccepted, isTrue);
    });

    test('rejects wildcards and URL-shaped entries in the host list', () {
      final strictHosts = ContentLinkValidator(
        allowedHosts: const [
          '*.i3dion.example',
          'https://spatial.i3dion.example',
        ],
      );

      expect(
        strictHosts
            .validate('https://spatial.i3dion.example/model/1')
            .isAccepted,
        isFalse,
      );
    });
  });

  test('canonical scan history values round trip safely', () {
    const original = ContentLink(
      kind: ContentKind.collection,
      id: 'fall_collection',
      scheme: 'i3dion',
    );
    final restored = ContentLink.fromCanonicalUri(original.canonicalUri);

    expect(restored.kind, original.kind);
    expect(restored.id, original.id);
    expect(restored.canonicalUri, original.canonicalUri);
  });
}
