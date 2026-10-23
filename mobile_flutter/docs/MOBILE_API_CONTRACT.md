# Mobile API contract proposal

**Status: public read and single-file public GLB offline download use existing
backend routes. Private catalog downloads, background/resumable transfers, and
sync remain proposed.**

The mobile public Explore feed uses the existing `GET /api/hub/feed` route,
filtered by the backend to published public products. Search uses that route's
`search` query parameter. Product details use
`GET /api/hub/products/{uuid}` for UUIDs and
`GET /api/public/products/{slug}` for slugs. The Flutter app prefers the additive `model_access_url` and
`image_access_url` response fields. The backend signs local `/uploads/` assets
for one hour for public published products; external HTTPS asset URLs remain
unchanged. The original `model_url`, `image_url`, and `poster_url` fields are
preserved for compatibility. No mobile request connects directly to PostgreSQL.
UUID product details also return `model_size_bytes` and
`model_checksum_sha256` when the linked product asset has valid metadata. For
legacy local GLB files without stored metadata, the backend calculates the
size and SHA-256 for that detail request. The client only offers offline save
when both values are present and the model is a single-file GLB.

Private catalog access and private asset authorization, background/resumable
downloads, and sync are not implemented and remain proposed contract work.
The mobile app currently authenticates the user but does not use the session
to fetch private products or catalogs.

## Implemented public read operations

| Operation | Existing route | Runtime status |
| --- | --- | --- |
| Public 3D feed | `GET /api/hub/feed?paginated=true&limit=50&sort=popular` | Implemented; requires an HTTPS `API_BASE_URL` origin. |
| Public feed search | `GET /api/hub/feed?search={query}` | Implemented; server performs filtering. |
| Public product details | `GET /api/hub/products/{uuid}` | Implemented for UUID identifiers. |
| Public product details by slug | `GET /api/public/products/{slug}` | Implemented for slug identifiers. |
| Public model download metadata | `GET /api/hub/products/{uuid}` | Returns size and SHA-256 when available; legacy local GLB metadata is calculated on demand. |
| Public GLB offline download | Signed `model_access_url` from product details | Implemented in Flutter with a 50 MB limit, progress, cancellation, and size/SHA-256 verification. |
| Published catalog list | `GET /api/hub/catalogs?search={query}&limit={limit}&offset={offset}` | Implemented; returns published catalog metadata, the count of public published products, and pagination state. |
| Published catalog details | `GET /api/hub/catalogs/{slug-or-uuid}` | Implemented for a published catalog; product data comes from its published snapshot. Fallback product lookup includes only public published products. |
| Account sign-in | `POST /api/auth/login` | Implemented; existing email/password verification and optional MFA challenge. Access token is in JSON; rotating refresh token is returned as an HttpOnly cookie and stored by the native app in secure storage. |
| Session renewal | `POST /api/auth/refresh` | Implemented; mobile submits the stored refresh token in the JSON body and persists the rotated refresh token from `Set-Cookie`. |
| Account sign-out | `POST /api/auth/logout` | Implemented; mobile submits the refresh token to revoke the server session, then deletes the local secure session. |
| Read product likes | `GET /api/hub/personal/liked` | Implemented against the existing authenticated personal Hub route; the mobile client filters the current account's liked products. |
| Set product like | `POST /api/hub/personal/liked`, `DELETE /api/hub/personal/liked/{uuid}` | Implemented against the existing authenticated personal Hub routes, matching the liked-items list. Requires a published product UUID and an active session; reactions are currently online-only. |

Feed items without a published `model_url` are excluded from the 3D Explore
screen. Model and image asset URLs must be HTTPS; relative URLs are resolved
against the configured API origin. The app does not silently fall back to
locally bundled demo products.

Public routes add `model_access_url` and `image_access_url` for local assets.
These are expiring signed routes under `/api/storage/files/`; they do not
expose a storage signing secret or permit arbitrary file access.
Downloads are currently foreground-only and restart from zero after
cancellation or interruption. They are not queued, resumable, or background
transfers. The mobile client does not yet have authoritative free-space
reporting; operating-system write failures are shown as download errors.

## Contract-wide requirements

- HTTPS only. Authenticated routes use a short-lived bearer access token.
- The mobile client reads the access token from secure storage for same-origin
  API requests only; auth endpoints and cross-origin asset URLs do not receive
  the bearer token. Expired-token retry/rotation during an API request is not
  implemented yet; users must restore or sign in again after expiration.
- JSON errors use a stable shape, for example
  `{ "code": "TOKEN_EXPIRED", "message": "..." }`; never include secrets.
- List endpoints are cursor-paginated and return `items`, `nextCursor`, and
  `updatedAt`. Responses support ETag or an equivalent version for caching.
- IDs are opaque strings. Times are UTC ISO-8601. Model versions are immutable
  identifiers, not timestamps alone.
- Public content can be read without a session. Private content is scoped to
  the authenticated user's current organization and membership.
- Every model asset includes a SHA-256 checksum, byte size, media type, model
  version, and an expiring signed HTTPS download URL when access is permitted.
- A catalog's `downloadPolicy` is explicit (`allowed` or `view_only`). Signed
  URLs are issued only after checking that policy and the caller's access.

## Proposed mobile-specific operations

| Operation | Proposed route | Purpose |
| --- | --- | --- |
| Explore feed | `GET /api/mobile/v1/explore` | Public and authorized organization content; accepts `query`, `categoryId`, `organizationId`, and `cursor`. |
| Categories | `GET /api/mobile/v1/categories` | Search/filter category metadata, optionally scoped to an organization. |
| Catalog download policy | `GET /api/mobile/v1/catalogs/{catalogId}` | Return catalog access policy and complete offline asset references when organization-scoped catalogs are supported. |
| Collection details | `GET /api/mobile/v1/collections/{collectionId}` | Collection metadata and ordered model references. |
| Model/product details | `GET /api/mobile/v1/models/{modelId}` | Product information, model version, thumbnail, variants, and asset descriptors. |
| Asset authorization | `POST /api/mobile/v1/models/{modelId}/assets/{format}/download` | Return a short-lived signed URL only after access/download-policy checks. `format` includes `glb` or `usdz`. |
| QR resolution | `GET /api/mobile/v1/resolve?url={canonicalUrl}` | Resolve an allowlisted I3DION content URL to a public model/catalog/collection ID. |
| Organizations | `GET /api/mobile/v1/organizations` | Return the caller's memberships and roles. |
| Reactions | `PUT /api/mobile/v1/models/{modelId}/reactions/{reaction}` | Idempotently set a reaction; accept an `Idempotency-Key`. |
| Sync queue | `POST /api/mobile/v1/sync/events` | Idempotently submit queued favorites, reactions, and recent-view events; return per-event accepted/conflict/rejected results. |

The backend must also define how search shares the explore endpoint (or provide
a dedicated search route), authorization errors, rate limits, token rotation,
signed-URL expiry behavior, and conflict resolution for each sync event type.

## Model response fields needed by the app

At minimum, model details and asset authorization must provide:

```json
{
  "id": "opaque-model-id",
  "title": "Public product title",
  "description": "Product information",
  "thumbnailUrl": "https://...",
  "version": "immutable-version-id",
  "assets": [
    {
      "format": "glb",
      "url": "https://...",
      "expiresAt": "UTC ISO-8601",
      "sizeBytes": 123456,
      "sha256": "64 lowercase hexadecimal characters"
    }
  ],
  "downloadPolicy": "allowed"
}
```

Private responses must not expose persistent, unsigned object-storage URLs.
The client will verify the asset size and SHA-256 after download; the server
must provide stable version metadata so offline copies can be compared later.

## Universal Links and Android App Links

The app currently accepts only these content path forms, with a URL-safe
identifier of 1-128 ASCII letters, digits, underscores, or hyphens:

- `/{model|models}/{id}`
- `/{catalog|catalogs}/{id}`
- `/{collection|collections}/{id}`
- `i3dion://{model|catalog|collection}/{id}` for the custom-scheme fallback.

HTTPS URLs are accepted only when the exact hostname appears in the
`QR_ALLOWED_HOSTS` build define. The allowlist is empty by default; do not add
wildcards. The parser rejects HTTP, user-info, ports, query strings, fragments,
and all other paths. The app routes a validated ID to its native content route;
resolving full catalog/product data remains a backend integration task.

The QR content domain must serve a valid Apple
`/.well-known/apple-app-site-association` document and Android
`/.well-known/assetlinks.json`, with the production app identifiers and signing
fingerprints. The same HTTPS content URL must remain a valid web destination
when the app is absent. A custom `i3dion://` scheme is only a fallback and must
be restricted by the app to the supported content types and identifier format.
Deferred deep-link continuation after installation depends on a separately
selected provider or web implementation and is not promised by this contract.
