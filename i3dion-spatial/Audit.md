# I3DION Spatial Project Audit

Audit date: 2026-06-22

Scope: Current React/Vite frontend, Express backend, PostgreSQL schema, MinIO storage service, routing, UI actions, and documented functional requirements.

## Executive Summary

The project has a strong UI foundation and a partial backend foundation. Authentication, protected routes, PostgreSQL schema migration, MinIO upload service, product/catalog/lead/QR/analytics endpoints, and development fallback auth exist. However, most UI actions beyond navigation and auth are not fully connected to backend APIs. The most important gaps are product CRUD UI handlers, upload wizard persistence, catalog publishing, QR download/display, public product/catalog pages, lead capture, analytics data binding, and AR/WebXR behavior.

## Working Features

- Vite React application starts and builds.
- Tailwind design system and existing UI screens render.
- Public routes exist for landing, login, signup, forgot password, and reset password.
- Protected app routes redirect unauthenticated users to login.
- Signup/login call the backend API when available.
- Offline development fallback creates a temporary Admin session if API is unreachable.
- App shell navigation works.
- Dashboard, Products, Upload Wizard, Catalog Builder, Catalog Preview, Product Experience, AR Viewer, Animation Panel, Hotspots, Leads, Analytics, and Settings screens exist.
- Product Management attempts to load live products from `/api/products` and falls back to mock data.
- Express API server exists.
- JWT signing and auth middleware exist.
- RBAC middleware exists for Admin, Manager, Sales User, Viewer.
- PostgreSQL base schema exists for companies, users, products, files, catalogs, catalog_products, qr_codes, leads, analytics_events.
- MinIO upload service exists with MIME and size validation.
- QR generation endpoint exists for product/catalog entity types.
- Lead list/create/update endpoints exist.
- Analytics event creation and summary endpoints exist.
- Development fallback API exists when PostgreSQL is unavailable.

## Broken Features

- Full backend startup fails when PostgreSQL is not running.
- Docker CLI exists on the user machine, but Docker Desktop daemon is not running.
- `dev:full` starts frontend but API exits if database is unavailable unless fallback mode is used.
- Backend API does not fully run against persistent storage until PostgreSQL and MinIO are available.
- Signup/login are not persistent in fallback mode.
- Logout only clears local frontend state; backend logout endpoint is not called.
- Role-based backend checks exist, but frontend navigation/actions are not role-aware.
- Product Upload Wizard does not persist form fields or validate per step.
- Media upload zones do not open file pickers or call upload API.
- Product Add/Edit/Delete buttons are not wired.
- Catalog Publish button is not wired.
- Catalog Builder search is not wired.
- Catalog Preview Generate QR button is not wired.
- QR download UI is missing.
- Product Experience Datasheet button is not wired.
- Request Quote / Contact Sales CTA is missing on Product Experience.
- AR controls are visual only.
- Animation Panel Save Changes is not wired.
- Hotspot Panel Save Changes is not wired.
- Leads Filter and Contact Lead buttons are not wired.
- Settings Save and settings section tabs are not wired.
- Dashboard date filter and export buttons are not wired.
- Analytics uses mock data.

## Missing Features

- Public product page backed by published product slug/ID.
- Public catalog page backed by published catalog slug.
- Public lead capture.
- Product detail route.
- Product create/edit modals or full wizard integration.
- Product archive/publish/draft state transitions from UI.
- File upload progress UI.
- Product image/video/document/model association UI.
- GLB/GLTF validation beyond MIME checks.
- Model preview image generation.
- Real GLB/GLTF model loading in viewer.
- Orbit controls, reset camera, fullscreen, model info, loading state, model error state.
- WebXR AR launch/place/move/rotate/scale/lock/unlock/reset.
- AR session analytics.
- Product hotspot CRUD UI and API.
- Product animation CRUD UI and API.
- Lead activities, notes, follow-up workflow.
- Dashboard/analytics date filters.
- Analytics top products/top catalogs/timeseries APIs.
- Notifications.
- Integrations management.
- User/team management.
- Audit logging.
- Production email for password reset.
- Server-side token revocation/session tracking.

## Missing APIs

Critical:

- `GET /api/public/products/:id`
- `GET /api/public/catalogs/:slug`
- `POST /api/public/leads`
- `GET /api/products?search=&status=`
- `GET /api/products/:id/document`
- `GET /api/qr/:id/download`

High:

- `GET /api/analytics/timeseries`
- `GET /api/analytics/top-products`
- `GET /api/analytics/top-catalogs`
- `PUT /api/products/:id/animations`
- `GET /api/products/:id/animations`
- `PUT /api/products/:id/hotspots`
- `GET /api/products/:id/hotspots`
- `POST /api/leads/:id/activities`
- `GET /api/leads/:id/activities`
- `/api/users` CRUD

Medium:

- `GET /api/search`
- `GET /api/public/search`
- `GET /api/analytics/export`
- `/api/integrations`
- `/api/company/preferences`

Low:

- `/api/notifications`
- `/api/help`

## Missing Database Tables

Required by attached plan and not present before Phase 2:

- `product_animations`
- `product_hotspots`
- `lead_activities`
- `audit_logs`
- `company_preferences`
- `notifications`
- `integrations`
- `user_sessions`
- `viewer_sessions`

Additional recommended later:

- `password_reset_tokens` if reset tokens should be separated from `users`.
- `product_model_previews` if generated preview images require history/versioning.
- `webhooks` if integrations need outbound event delivery.

## Missing Storage Integrations

- Frontend file picker/dropzone behavior.
- Upload progress state.
- Product field updates after upload.
- Company logo upload path.
- Public/signed URL strategy.
- MinIO bucket policy for browser access.
- File deletion cleanup.
- GLB/GLTF model validation beyond MIME type.
- Model preview image generation.

## Missing AR Integrations

- WebXR availability detection.
- AR session start/stop.
- Hit testing / placement.
- Move/rotate/scale transforms.
- Lock/unlock placement.
- Reset placement.
- Session duration tracking.
- AR launch analytics.
- Fallback for unsupported devices.

## Missing Analytics

- Page view tracking.
- Product view tracking from public product pages.
- Catalog view tracking from public catalog pages.
- QR scan tracking.
- AR launch/session tracking.
- Lead generation tracking.
- Animation usage tracking.
- Hotspot interaction tracking.
- Date-filtered dashboard metrics.
- Top products and top catalogs.
- Exportable reports.

## Phase Completion Status

| Phase | Area | Status |
|---|---|---|
| 1 | Project Audit | Complete |
| 2 | Database Completion | In progress |
| 3 | Authentication | Complete backend core; partial production hardening |
| 4 | File Storage | Complete core upload path; partial production hardening |
| 5 | Product Management | Complete core CRUD; partial asset pipeline integration |
| 6 | 3D Model Pipeline | Partial viewer, missing real model pipeline |
| 7 | Catalog Builder | Partial backend, missing frontend persistence |
| 8 | QR Engine | Partial backend, missing frontend display/download |
| 9 | Public Product Experience | Missing backend integration |
| 10 | Lead Management | Partial backend, missing frontend integration |
| 11 | Analytics | Partial backend, mock frontend |
| 12 | AR System | UI only |
| 13 | Hotspots | Missing |
| 14 | Animations | Missing |
| 15 | Settings | Partial backend, missing frontend save |
| 16 | QA Pass | Pending |
| 17 | Production Readiness | Pending |

## Highest Priority Task List

1. Complete missing PostgreSQL tables, constraints, indexes, and foreign keys.
2. Connect product create/update/delete/archive/publish UI to API.
3. Connect upload wizard and MinIO upload flow.
4. Connect catalog builder create/update/publish/product assignment.
5. Connect QR generation and download.
6. Add public product/catalog routes and lead capture.
7. Connect leads dashboard to backend data and activities.
8. Connect analytics dashboard to backend metrics.
9. Implement WebXR/AR, hotspots, and animations after core CRUD flows are complete.

## Phase 3 Authentication Completion Notes

- Signup creates company and Admin user.
- Login verifies bcrypt password hash.
- JWTs are issued with role, company ID, and session ID claims.
- JWTs are now backed by `user_sessions`.
- `requireAuth` verifies token signature, active session, non-revoked session, and expiry.
- Logout now revokes the active server session and clears frontend state.
- Protected frontend routes require a token.
- Backend RBAC supports Admin, Manager, Sales User, and Viewer rank checks.
- Remaining production hardening: email delivery for password reset, frontend role-aware hiding/disabling of unauthorized actions, and optional refresh token/session renewal flow.

## Phase 4 File Storage Completion Notes

- MinIO upload service supports images, videos, PDFs, GLB, and GLTF.
- Backend validates file extension, MIME type, and per-category file size limits.
- Current limits: images 15 MB, PDFs 50 MB, videos/models 150 MB.
- Upload metadata is stored in `files`, including product association, category, MIME type, size, URL, object key, and SHA-256 checksum.
- Upload object keys are scoped by company and file category.
- Product association is validated before storing metadata.
- Product Upload Wizard Step 3 now has real file inputs on the existing media tiles.
- Frontend upload progress is implemented with `XMLHttpRequest.upload.onprogress`.
- Upload success and error states are displayed without changing the screen layout.
- Remaining production hardening: signed URL strategy, MinIO bucket policy, file delete cleanup, virus scanning, image/model preview generation, resumable large uploads, and direct-to-MinIO presigned uploads for very large files.

## Phase 5 Product Management Completion Notes

- Product Management now supports create, read, update, and delete from the existing screen.
- Add Product opens a product form without changing the page layout.
- Edit reuses the same product form and updates the selected product.
- Delete confirms before removing a product.
- Product status can be set to Draft, Published, or Archived.
- Core product specifications can be captured as structured key/value data.
- Search now filters both product cards and the product table.
- Status filters now work for All, Published, Draft, and Archived.
- API helpers now exist for `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id`.
- When the backend is unavailable, CRUD works in offline preview state so QA can continue reviewing the UI.
- Remaining production work: connect upload wizard final publish/save to product CRUD, attach uploaded files to product URL fields, add product detail route, and add richer specification/document management.
