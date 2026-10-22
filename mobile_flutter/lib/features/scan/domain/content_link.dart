enum ContentKind {
  model,
  catalog,
  collection;

  static ContentKind? fromPathSegment(String segment) {
    return switch (segment) {
      'model' || 'models' => model,
      'catalog' || 'catalogs' => catalog,
      'collection' || 'collections' => collection,
      _ => null,
    };
  }

  String get routeName => name;

  String get displayName => switch (this) {
    model => 'Model',
    catalog => 'Catalog',
    collection => 'Collection',
  };
}

class ContentLink {
  const ContentLink({
    required this.kind,
    required this.id,
    required this.scheme,
    this.host,
  });

  final ContentKind kind;
  final String id;
  final String scheme;
  final String? host;

  String get location => '/content/${kind.routeName}/$id';

  String get canonicalUri => scheme == 'i3dion'
      ? 'i3dion://${kind.routeName}/$id'
      : 'https://$host/${kind.routeName}/$id';

  factory ContentLink.fromCanonicalUri(String value) {
    final uri = Uri.parse(value);
    if (uri.userInfo.isNotEmpty ||
        uri.hasPort ||
        _hasExplicitHttpsPort(value) ||
        uri.hasQuery ||
        uri.hasFragment) {
      throw FormatException('Invalid canonical I3DION content link.');
    }
    if (uri.scheme == 'i3dion' &&
        uri.host.isNotEmpty &&
        uri.pathSegments.length == 1) {
      final kind = ContentKind.fromPathSegment(uri.host);
      final id = uri.pathSegments.single;
      if (kind != null && _validId.hasMatch(id)) {
        return ContentLink(kind: kind, id: id, scheme: 'i3dion');
      }
    }
    if (uri.scheme == 'https' &&
        uri.host.isNotEmpty &&
        uri.pathSegments.length == 2) {
      final kind = ContentKind.fromPathSegment(uri.pathSegments[0]);
      final id = uri.pathSegments[1];
      if (kind == null ||
          !_validId.hasMatch(id) ||
          !_validHost.hasMatch(uri.host)) {
        throw FormatException('Invalid canonical I3DION content link.');
      }
      return ContentLink(kind: kind, id: id, scheme: 'https', host: uri.host);
    }
    throw FormatException('Unsupported canonical I3DION content link.');
  }
}

class LinkValidationResult {
  const LinkValidationResult.accepted(this.content) : errorMessage = null;

  const LinkValidationResult.rejected(this.errorMessage) : content = null;

  final ContentLink? content;
  final String? errorMessage;

  bool get isAccepted => content != null;
}

final RegExp _validId = RegExp(r'^[A-Za-z0-9_-]{1,128}$');
final RegExp _validHost = RegExp(
  r'^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$',
);

bool isValidContentId(String value) => _validId.hasMatch(value);

bool _hasExplicitHttpsPort(String value) {
  return RegExp(
    r'^https://[^/?#]*:\d+(?:[/?#]|$)',
    caseSensitive: false,
  ).hasMatch(value);
}

class ContentLinkValidator {
  ContentLinkValidator({required Iterable<String> allowedHosts})
    : _allowedHosts = allowedHosts
          .map((host) => host.trim().toLowerCase())
          .where((host) => _validHost.hasMatch(host))
          .toSet();

  final Set<String> _allowedHosts;

  LinkValidationResult validate(String value) {
    final input = value.trim();
    if (input.isEmpty || input.length > 2048) {
      return const LinkValidationResult.rejected(
        'This QR code does not contain a valid I3DION link.',
      );
    }

    final uri = Uri.tryParse(input);
    if (uri == null || !uri.isAbsolute) {
      return const LinkValidationResult.rejected(
        'This QR code is not a valid I3DION link.',
      );
    }
    if (uri.userInfo.isNotEmpty ||
        uri.hasPort ||
        _hasExplicitHttpsPort(input) ||
        uri.hasQuery ||
        uri.hasFragment) {
      return const LinkValidationResult.rejected(
        'This link contains unsupported extra information.',
      );
    }

    if (uri.scheme == 'i3dion') {
      return _parseContentUri(uri, expectedHost: null);
    }
    if (uri.scheme != 'https') {
      return const LinkValidationResult.rejected(
        'Only secure HTTPS I3DION links are allowed.',
      );
    }
    final host = uri.host.toLowerCase();
    if (!_allowedHosts.contains(host)) {
      return const LinkValidationResult.rejected(
        'This link is not from an approved I3DION domain.',
      );
    }
    return _parseContentUri(uri, expectedHost: host);
  }

  LinkValidationResult _parseContentUri(
    Uri uri, {
    required String? expectedHost,
  }) {
    final segments = uri.pathSegments;
    final ContentKind? kind;
    final String id;

    if (uri.scheme == 'i3dion') {
      if (uri.host.isEmpty || segments.length != 1) {
        return const LinkValidationResult.rejected(
          'Use an I3DION link in the format i3dion://model/ID.',
        );
      }
      kind = ContentKind.fromPathSegment(uri.host);
      id = segments.single;
    } else {
      if (segments.length != 2) {
        return const LinkValidationResult.rejected(
          'This I3DION link does not point to a supported item.',
        );
      }
      kind = ContentKind.fromPathSegment(segments[0]);
      id = segments[1];
    }

    if (kind == null || !_validId.hasMatch(id)) {
      return const LinkValidationResult.rejected(
        'This I3DION link contains an unsupported item or identifier.',
      );
    }
    return LinkValidationResult.accepted(
      ContentLink(kind: kind, id: id, scheme: uri.scheme, host: expectedHost),
    );
  }
}
