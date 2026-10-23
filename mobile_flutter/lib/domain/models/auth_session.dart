class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.organizationId,
  });

  final String accessToken;
  final String refreshToken;
  final String id;
  final String name;
  final String email;
  final String role;
  final String? organizationId;

  AuthSession copyWithTokens({
    required String accessToken,
    required String refreshToken,
    String? role,
  }) {
    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      id: id,
      name: name,
      email: email,
      role: role ?? this.role,
      organizationId: organizationId,
    );
  }

  Map<String, Object?> toJson() => {
    'accessToken': accessToken,
    'refreshToken': refreshToken,
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    if (organizationId != null) 'organizationId': organizationId,
  };

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    String requiredString(String key) {
      final value = json[key];
      if (value is! String || value.trim().isEmpty) {
        throw FormatException('Stored account session is missing $key.');
      }
      return value;
    }

    final organizationId = json['organizationId'];
    if (organizationId != null &&
        (organizationId is! String || organizationId.isEmpty)) {
      throw const FormatException(
        'Stored account session has an invalid organization.',
      );
    }
    return AuthSession(
      accessToken: requiredString('accessToken'),
      refreshToken: requiredString('refreshToken'),
      id: requiredString('id'),
      name: requiredString('name'),
      email: requiredString('email'),
      role: requiredString('role'),
      organizationId: organizationId as String?,
    );
  }
}
