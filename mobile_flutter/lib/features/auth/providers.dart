import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/data/auth_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/auth_session.dart';

final secureSessionStoreProvider = Provider<SecureSessionStore>(
  (ref) => FlutterSecureSessionStore(),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final store = ref.watch(secureSessionStoreProvider);
  return ApiClient.fromConfig(
    accessTokenProvider: () async {
      final rawSession = await store.read();
      if (rawSession == null) return null;
      final decoded = jsonDecode(rawSession);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Stored account session is invalid.');
      }
      return AuthSession.fromJson(decoded).accessToken;
    },
  );
});

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    dio: ref.watch(apiClientProvider).dio,
    store: ref.watch(secureSessionStoreProvider),
  ),
);

final authSessionProvider =
    AsyncNotifierProvider<AuthSessionController, AuthSession?>(
      AuthSessionController.new,
    );

class AuthSessionController extends AsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() =>
      ref.watch(authRepositoryProvider).restoreSession();

  Future<AuthLoginResult> signIn({
    required String email,
    required String password,
    String? mfaCode,
  }) async {
    try {
      final result = await ref
          .read(authRepositoryProvider)
          .login(email: email, password: password, mfaCode: mfaCode);
      if (result.session != null) state = AsyncData(result.session);
      return result;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }

  Future<void> signOut() async {
    final session = state.asData?.value;
    if (session == null) return;
    try {
      await ref.read(authRepositoryProvider).logout(session);
      state = const AsyncData(null);
    } on Exception {
      state = const AsyncData(null);
      rethrow;
    }
  }
}
