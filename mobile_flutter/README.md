# I3DION Spatial Hub Mobile

The canonical new mobile app is a Flutter/Dart project for Android and iOS in
`mobile_flutter/`. The neighboring `mobile/` directory is the pre-existing Expo
starter; it is intentionally left untouched and is not the implementation of
this app.

## Current foundation

- Flutter stable with null safety, Riverpod, and `go_router`.
- Bundled Inter variable font (SIL Open Font License 1.1; see
  `assets/fonts/OFL.txt`) so typography does not depend on network access.
- Presentation, domain, and data boundaries; Explore reads the published
  public 3D product feed from the existing I3DION Node API.
- Light/dark Material 3 theme tokens for the I3DION palette and an Explore /
  Scan / Library / Profile navigation shell.
- Phase 1 QR flow: camera scanner with torch, gallery image scan, verified-link
  history, custom-scheme handling, and exact HTTPS host/path validation.
- Public product feed and detail requests use the existing
  `GET /api/hub/feed` and `GET /api/hub/products/{id}` backend routes. Search
  queries use the feed's `search` parameter. Published GLB/GLTF URLs are loaded
  through the expiring public asset URLs returned with product responses; the
  app does not bundle placeholder product models or connect directly to
  PostgreSQL.
- The live 3D viewer enables Android Scene Viewer and iOS Quick Look AR where
  the platform supports them. Models can be placed at floor scale; unsupported
  devices keep the interactive 3D viewer.
- A Dio client with HTTPS-only requests, timeouts, and bounded retry for
  transient GET failures. The API origin must be explicitly configured.
- No credentials, tokens, or backend secrets are checked in.

Library and Profile remain scaffolding. Private catalogs are not shown; the
feed endpoint is public-only. QR model links load details through the existing
public product routes. Catalog and collection detail screens remain pending.

## Prerequisites and local setup

- Flutter stable 3.44.7 (Dart 3.12.2) or a compatible newer stable SDK.
- Android Studio + Android SDK for Android builds.
- Xcode on macOS for iOS builds. iOS builds cannot be run on Windows.

```powershell
cd I3DION_Spatial\mobile_flutter
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter run
```

## Environments

Choose an environment at build/run time with compile-time defines. The API URL
must be an HTTPS URL when the network client is used. Do not put credentials or
tokens in these defines.

```powershell
# Development (use the HTTPS backend origin; never use database credentials)
flutter run --dart-define=APP_ENV=development --dart-define=API_BASE_URL=https://api.your-domain.com

# Android emulator only: connect to a local backend on the development machine
flutter run --dart-define=APP_ENV=development --dart-define=API_BASE_URL=http://10.0.2.2:4000

# Staging
flutter run --dart-define=APP_ENV=staging --dart-define=API_BASE_URL=https://staging.example.invalid --dart-define=QR_ALLOWED_HOSTS=staging.example.invalid

# Production
flutter build appbundle --release --dart-define=APP_ENV=production --dart-define=API_BASE_URL=https://api.example.invalid --dart-define=QR_ALLOWED_HOSTS=spatial.example.com
```

The example hostnames above are placeholders, not I3DION service addresses.
`API_BASE_URL` is the HTTPS origin only (no `/api` path); the mobile client
calls the existing `/api/hub/feed`, `/api/hub/products/{id}`, and
`/api/public/products/{slug}` routes. An unset/invalid origin fails visibly
instead of falling back to mock products. `QR_ALLOWED_HOSTS` is a
comma-separated, exact hostname allowlist. It defaults to empty, which
blocks all HTTPS QR links until the real content domain is supplied. The
restricted `i3dion://model/ID`, `i3dion://catalog/ID`, and
`i3dion://collection/ID` forms remain available.

The Android emulator development command is a loopback-only exception:
debug builds allow HTTP only to `localhost`, `127.0.0.1`, or Android's
`10.0.2.2` alias on port 4000. Release builds explicitly disallow cleartext.
For physical devices, staging, and production, configure the HTTPS backend
origin instead.

Android and iOS custom-scheme handling is configured for `i3dion://`. HTTPS
Android App Links and iOS Universal Links require the real content domain,
production application identifiers, signing certificate fingerprints, Android
intent-filter host, iOS Associated Domains entitlement, and the corresponding
`assetlinks.json` / `apple-app-site-association` files. These cannot be safely
configured with placeholder values.

## Backend contract

Review [`docs/MOBILE_API_CONTRACT.md`](docs/MOBILE_API_CONTRACT.md) for the
existing public endpoints used by mobile and the future API work needed for
private catalogs, offline downloads, and sync. Existing backend routes are
documented separately in the repository's
[`docs/API_DOCUMENTATION.md`](../docs/API_DOCUMENTATION.md).

Products must be Published and public to appear in Explore. Website updates
are reflected on a feed refresh; realtime push updates and private organization
catalogs are not implemented.

## CI

`.github/workflows/mobile-flutter-ci.yml` runs formatting, analysis, and tests
on mobile changes, caches Flutter packages, and audits the Flutter lockfile
against OSV. Release signing, artifact uploads, and store delivery are
deliberately deferred to Phase 8.

## Security status

- The scaffold uses no secrets and currently reads no account data.
- The Dio client rejects non-HTTPS request URLs and does not log request or
  response bodies.
- QR/deep-link validation blocks non-HTTPS URLs, unconfigured hosts, extra URL
  parameters, unsupported paths, and malformed identifiers. Only verified
  content identifiers are saved to local scan history; original QR strings
  and query data are not persisted.
- The initial app-link allowlist is empty until the canonical content domain is
  supplied.
- The initial threat model and remaining controls are documented in
  [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).
- Token storage, certificate pinning, private offline encryption,
  checksum-verified downloads, and release obfuscation remain for later
  phases. Public viewer URLs are signed by the backend and expire after one
  hour.
