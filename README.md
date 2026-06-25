# I3DION Spatial Functional Specification

Industrial AR Catalog & Sales Visualization Platform

Document purpose: product, QA, backend, and frontend handoff specification for the current codebase. This document audits implemented UI screens, interactive elements, required backend behavior, database dependencies, and remaining production work.

Status key:

- Implemented: UI and functional integration exist.
- Partial: UI exists and some state/API behavior exists, but end-to-end functionality is incomplete.
- Missing: UI exists but action is placeholder, or required backend/API/database work is absent.

## Product Scope

I3DION Spatial enables industrial companies to manage 3D products, upload AR-ready assets, build product catalogs, generate QR experiences, capture leads, and analyze buyer engagement.

Core roles:

- Admin: full company, user, product, catalog, lead, analytics access.
- Manager: company settings, product/catalog publishing, lead management.
- Sales User: catalog/product sharing, QR generation, lead follow-up, uploads.
- Viewer: read-only dashboard/catalog/product access.

## Current Technical Architecture

Frontend:

- React, Vite, TypeScript, Tailwind CSS.
- Routing via React Router.
- State via Zustand.
- Forms via React Hook Form and Zod.
- Tables via TanStack Table.
- Charts via Recharts.
- 3D viewer via React Three Fiber.

Backend:

- Node.js and Express.
- JWT authentication.
- Zod API validation.
- PostgreSQL schema and migration on API start.
- MinIO upload service.
- Development fallback API for local signup/login when PostgreSQL is unavailable.

Database tables currently defined:

- `companies`
- `users`
- `products`
- `files`
- `catalogs`
- `catalog_products`
- `qr_codes`
- `leads`
- `analytics_events`

## Screen Functional Specifications

### Landing Page

Component Name: Public Navigation

Button Name: Brand Logo / I3DION Spatial

Purpose: Return users to the landing page.

Expected Functionality: Navigate to `/`.

Frontend Action: React Router `NavLink`.

Backend Requirement: None.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: None.

Success Response: Landing page is displayed.

Error Response: Route fallback redirects to `/`.

User Role Access: Public.

Dependencies: React Router.

Priority: Medium.

Status: Implemented.

Component Name: Public Navigation

Button Name: Products

Purpose: Jump to feature/product section.

Expected Functionality: Scroll to `#features`.

Frontend Action: Anchor link.

Backend Requirement: None.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: None.

Success Response: Features section visible.

Error Response: No explicit error state.

User Role Access: Public.

Dependencies: Browser anchor navigation.

Priority: Low.

Status: Implemented.

Component Name: Public Navigation

Button Name: How It Works

Purpose: Jump to workflow section.

Expected Functionality: Scroll to `#how-it-works`.

Frontend Action: Anchor link.

Backend Requirement: None.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: None.

Success Response: How It Works section visible.

Error Response: No explicit error state.

User Role Access: Public.

Dependencies: Browser anchor navigation.

Priority: Low.

Status: Implemented.

Component Name: Public Navigation

Button Name: Solutions

Purpose: Jump to industries/solutions section.

Expected Functionality: Scroll to `#industries`.

Frontend Action: Anchor link.

Backend Requirement: None.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: None.

Success Response: Industries section visible.

Error Response: No explicit error state.

User Role Access: Public.

Dependencies: Browser anchor navigation.

Priority: Low.

Status: Implemented.

Component Name: Public Search

Button Name: Search catalog input

Purpose: Let visitors search catalog content.

Expected Functionality: Query public products/catalogs and show results.

Frontend Action: Input exists, no search handler.

Backend Requirement: Search API across public catalogs/products.

Database Requirement: `products`, `catalogs`, optional full-text indexes.

API Endpoint Required: `GET /api/public/search?q=...`

Validation Rules: Trim query, minimum 2 characters, rate limit.

Success Response: Matching products/catalogs.

Error Response: Empty state or network error.

User Role Access: Public.

Dependencies: Search backend.

Priority: Medium.

Status: Missing.

Component Name: Hero Section

Button Name: Request Demo

Purpose: Start signup/demo funnel.

Expected Functionality: Navigate to signup or create demo request lead.

Frontend Action: Links to `/signup`.

Backend Requirement: Optional demo request capture.

Database Requirement: `leads` if captured as lead.

API Endpoint Required: Optional `POST /api/leads`.

Validation Rules: Lead name/email/company required if form is introduced.

Success Response: Signup page or demo lead confirmation.

Error Response: Form validation/network error if lead capture added.

User Role Access: Public.

Dependencies: React Router; optional Lead API.

Priority: High.

Status: Partial.

Component Name: Hero Section

Button Name: View Examples

Purpose: Show buyer-facing product experience example.

Expected Functionality: Navigate to product experience page.

Frontend Action: Links to `/product-experience`.

Backend Requirement: Public product retrieval and analytics tracking.

Database Requirement: `products`, `analytics_events`.

API Endpoint Required: `GET /api/public/products/:id`, `POST /api/analytics/events`.

Validation Rules: Product ID required when using live products.

Success Response: Product experience rendered.

Error Response: Product not found state.

User Role Access: Public or authenticated depending product visibility.

Dependencies: Product API.

Priority: Medium.

Status: Partial.

Component Name: CTA Section

Button Name: Start Workspace

Purpose: Start account creation.

Expected Functionality: Navigate to signup.

Frontend Action: Links to `/signup`.

Backend Requirement: Signup API.

Database Requirement: `companies`, `users`.

API Endpoint Required: `POST /api/auth/signup`.

Validation Rules: Name, company, email, password.

Success Response: Auth session created.

Error Response: Email exists, validation error, API unavailable.

User Role Access: Public.

Dependencies: Auth store and API.

Priority: Critical.

Status: Partial.

### Login

Component Name: Login Form

Button Name: Sign In

Purpose: Authenticate an existing user.

Expected Functionality: Validate email/password, call backend, store JWT/user, navigate to dashboard.

Frontend Action: React Hook Form submit; `useAuthStore.login`.

Backend Requirement: Verify password hash and return JWT.

Database Requirement: `users`.

API Endpoint Required: `POST /api/auth/login`.

Validation Rules: Valid email, password minimum 8 characters.

Success Response: `{ token, user }`.

Error Response: 401 invalid credentials; 400 validation error; API unavailable message.

User Role Access: Public.

Dependencies: JWT secret, bcrypt, user table.

Priority: Critical.

Status: Implemented with offline fallback.

Component Name: Login Form

Button Name: Create account link

Purpose: Move new users to signup.

Expected Functionality: Navigate to `/signup`.

Frontend Action: React Router `NavLink`.

Backend Requirement: None for navigation.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: None.

Success Response: Signup page rendered.

Error Response: Route fallback if route unavailable.

User Role Access: Public.

Dependencies: React Router.

Priority: Medium.

Status: Implemented.

Component Name: Login Form

Button Name: Forgot Password

Purpose: Allow users to request password reset.

Expected Functionality: Navigate to forgot password page.

Frontend Action: Page exists but no link is displayed in login form.

Backend Requirement: Generate reset token and email link.

Database Requirement: `users.reset_token_hash`, `users.reset_token_expires_at`.

API Endpoint Required: `POST /api/auth/forgot-password`.

Validation Rules: Valid email.

Success Response: Generic confirmation.

Error Response: Validation error.

User Role Access: Public.

Dependencies: Email service still missing.

Priority: High.

Status: Partial.

### Signup

Component Name: Signup Form

Button Name: Create Account

Purpose: Register company and admin user.

Expected Functionality: Validate form, create company/user, store JWT session, navigate to dashboard.

Frontend Action: React Hook Form submit; `useAuthStore.signup`.

Backend Requirement: Hash password, create company, create Admin user, return JWT.

Database Requirement: `companies`, `users`.

API Endpoint Required: `POST /api/auth/signup`.

Validation Rules: Name minimum 2 chars; company minimum 2 chars; valid email; password minimum 8 chars.

Success Response: `{ token, user }`.

Error Response: 409 email exists; 400 validation; API unavailable; fallback session in development.

User Role Access: Public.

Dependencies: bcrypt, JWT, PostgreSQL or development fallback.

Priority: Critical.

Status: Implemented with offline fallback.

Component Name: Signup Form

Button Name: Enable guided onboarding checkbox

Purpose: Toggle guided onboarding/sample data.

Expected Functionality: Store onboarding preference and seed demo catalog data.

Frontend Action: Checkbox exists, value is not submitted.

Backend Requirement: Persist onboarding flag and optionally seed demo data.

Database Requirement: Add `companies.onboarding_enabled` or `company_preferences`; seed products/catalogs.

API Endpoint Required: Included in `POST /api/auth/signup` or `POST /api/onboarding`.

Validation Rules: Boolean.

Success Response: Workspace created with preference.

Error Response: Validation error if invalid.

User Role Access: Public during signup.

Dependencies: Onboarding service.

Priority: Medium.

Status: Missing.

### Forgot Password

Component Name: Forgot Password Form

Button Name: Send Reset Link

Purpose: Generate password reset token.

Expected Functionality: Accept email and initiate reset workflow.

Frontend Action: Calls `api.forgotPassword`.

Backend Requirement: Generate token hash and expiry; send email in production.

Database Requirement: `users.reset_token_hash`, `users.reset_token_expires_at`.

API Endpoint Required: `POST /api/auth/forgot-password`.

Validation Rules: Valid email required.

Success Response: Generic confirmation; current dev response includes token.

Error Response: Validation/network error.

User Role Access: Public.

Dependencies: Email provider missing.

Priority: High.

Status: Partial.

### Reset Password

Component Name: Reset Password Form

Button Name: Reset Password

Purpose: Set a new password using reset token.

Expected Functionality: Validate token/password, update password hash.

Frontend Action: Calls `api.resetPassword`.

Backend Requirement: Validate token hash and expiry; hash new password.

Database Requirement: `users`.

API Endpoint Required: `POST /api/auth/reset-password`.

Validation Rules: Token minimum 24 chars; password minimum 8 chars.

Success Response: Password reset confirmation.

Error Response: Invalid/expired token; validation error.

User Role Access: Public.

Dependencies: bcrypt, reset token.

Priority: High.

Status: Partial.

### Dashboard

Component Name: KPI Cards

Button Name: KPI card click target

Purpose: Drill into products, catalog views, QR scans, AR sessions, or leads.

Expected Functionality: Navigate to filtered analytics or source module.

Frontend Action: Cards render from dummy data and are not clickable.

Backend Requirement: Aggregated metrics API.

Database Requirement: `products`, `catalogs`, `leads`, `analytics_events`, `qr_codes`.

API Endpoint Required: `GET /api/analytics/summary`.

Validation Rules: Auth required; optional date range.

Success Response: Metric counts and trend deltas.

Error Response: Empty or network error state.

User Role Access: Admin, Manager, Sales User, Viewer read-only.

Dependencies: Analytics event tracking.

Priority: High.

Status: Partial.

Component Name: Dashboard Header

Button Name: Last 30 Days

Purpose: Change dashboard date range.

Expected Functionality: Open date range menu and refresh metrics.

Frontend Action: Button exists, no handler.

Backend Requirement: Date-filtered analytics.

Database Requirement: `analytics_events.created_at`, indexed by company/date/type.

API Endpoint Required: `GET /api/analytics/summary?from=&to=`.

Validation Rules: Valid ISO dates; from <= to.

Success Response: Metrics for selected date range.

Error Response: Invalid date range; network error.

User Role Access: Admin, Manager, Sales User, Viewer.

Dependencies: Date picker/menu missing.

Priority: High.

Status: Missing.

Component Name: Dashboard Header

Button Name: Export

Purpose: Export dashboard metrics.

Expected Functionality: Download CSV/PDF report.

Frontend Action: Button exists, no handler.

Backend Requirement: Report generation.

Database Requirement: `analytics_events`, `leads`, `products`, `catalogs`.

API Endpoint Required: `GET /api/analytics/export?format=csv|pdf`.

Validation Rules: Supported format; date range validation.

Success Response: File download.

Error Response: Export failure.

User Role Access: Admin, Manager.

Dependencies: Export service missing.

Priority: Medium.

Status: Missing.

Component Name: Analytics Overview Chart

Button Name: Chart tooltip/hover

Purpose: Inspect daily views and AR sessions.

Expected Functionality: Tooltip displays metric values from API.

Frontend Action: Recharts tooltip implemented using dummy chart data.

Backend Requirement: Time series analytics.

Database Requirement: `analytics_events`.

API Endpoint Required: `GET /api/analytics/timeseries?from=&to=&groupBy=day`.

Validation Rules: Auth and valid date filters.

Success Response: Time series rows.

Error Response: Empty chart or error state.

User Role Access: Admin, Manager, Sales User, Viewer.

Dependencies: Analytics aggregation.

Priority: High.

Status: Partial.

### Products

Component Name: Product Management Header

Button Name: Add Product

Purpose: Start product creation.

Expected Functionality: Open Product Upload Wizard or creation modal.

Frontend Action: Button exists, no handler.

Backend Requirement: Product creation.

Database Requirement: `products`.

API Endpoint Required: `POST /api/products`.

Validation Rules: Product name, category, status, specs schema.

Success Response: Product created.

Error Response: Validation or permission error.

User Role Access: Admin, Manager.

Dependencies: Product Upload Wizard integration.

Priority: Critical.

Status: Missing.

Component Name: Product Search

Button Name: Search industrial assets input

Purpose: Filter product grid/table.

Expected Functionality: Filter by name/category/status.

Frontend Action: TanStack global filter for table; card grid is not filtered.

Backend Requirement: Server-side search for large datasets.

Database Requirement: `products`; optional full-text index.

API Endpoint Required: `GET /api/products?search=...`.

Validation Rules: Trim query; max length.

Success Response: Filtered products.

Error Response: Empty state.

User Role Access: Authenticated.

Dependencies: Product API.

Priority: High.

Status: Partial.

Component Name: Product Filters

Button Name: All / Published / Draft / Archived

Purpose: Filter products by status.

Expected Functionality: Update grid/table filter.

Frontend Action: Buttons exist, no state handler.

Backend Requirement: Status filter query.

Database Requirement: `products.status`.

API Endpoint Required: `GET /api/products?status=Published`.

Validation Rules: Status enum: Draft, Published, Archived.

Success Response: Filtered products.

Error Response: Empty state.

User Role Access: Authenticated.

Dependencies: Product filter state.

Priority: High.

Status: Missing.

Component Name: Product Table

Button Name: Edit

Purpose: Update product details.

Expected Functionality: Open edit form or wizard populated with selected product.

Frontend Action: Button exists, no handler.

Backend Requirement: Update product.

Database Requirement: `products`.

API Endpoint Required: `PUT /api/products/:id`.

Validation Rules: Same as product creation.

Success Response: Updated product.

Error Response: 404 not found; validation; permission error.

User Role Access: Admin, Manager.

Dependencies: Product form/edit modal missing.

Priority: Critical.

Status: Missing.

Component Name: Product Table

Button Name: Delete

Purpose: Delete product.

Expected Functionality: Confirm deletion, call API, update table/grid.

Frontend Action: Button exists, no handler.

Backend Requirement: Delete product and clean catalog relationships.

Database Requirement: `products`, `catalog_products`, `files`, `analytics_events`.

API Endpoint Required: `DELETE /api/products/:id`.

Validation Rules: UUID required; role check.

Success Response: 204 No Content.

Error Response: 404 not found; permission error.

User Role Access: Admin, Manager.

Dependencies: Confirmation modal missing.

Priority: Critical.

Status: Missing.

Component Name: Product Grid Cards

Button Name: Product Card

Purpose: View product details.

Expected Functionality: Navigate to product detail/experience.

Frontend Action: Card is not clickable.

Backend Requirement: Product detail retrieval.

Database Requirement: `products`, `files`, `analytics_events`.

API Endpoint Required: `GET /api/products/:id`.

Validation Rules: UUID required.

Success Response: Product details.

Error Response: 404 not found.

User Role Access: Authenticated; public if published.

Dependencies: Product detail route missing.

Priority: High.

Status: Missing.

### Product Upload

Component Name: Wizard Step Navigation

Button Name: Step 1 Basic Information

Purpose: Edit product name/category/description.

Expected Functionality: Navigate to step and preserve form state.

Frontend Action: Changes local `activeStep`.

Backend Requirement: None until submit/save draft.

Database Requirement: `products`.

API Endpoint Required: `POST /api/products` or `PUT /api/products/:id`.

Validation Rules: Name and category required.

Success Response: Step selected.

Error Response: Prevent progression if required fields missing.

User Role Access: Admin, Manager.

Dependencies: Form state missing.

Priority: Critical.

Status: Partial.

Component Name: Wizard Step Navigation

Button Name: Step 2 Specifications

Purpose: Capture technical specs.

Expected Functionality: Edit structured spec fields.

Frontend Action: Changes local step; inputs are uncontrolled and not persisted.

Backend Requirement: Store specs JSON.

Database Requirement: `products.specs`.

API Endpoint Required: `POST /api/products`, `PUT /api/products/:id`.

Validation Rules: Spec keys and values max length; JSON object.

Success Response: Specs stored.

Error Response: Validation error.

User Role Access: Admin, Manager.

Dependencies: Product form schema.

Priority: High.

Status: Partial.

Component Name: Wizard Step Navigation

Button Name: Step 3 Media Upload

Purpose: Upload CAD/GLB, images, documents.

Expected Functionality: Select files, upload with progress to MinIO.

Frontend Action: Static upload drop zones only.

Backend Requirement: File upload handling.

Database Requirement: `files`, product URL columns.

API Endpoint Required: `POST /api/uploads`.

Validation Rules: Allowed MIME types; 150 MB limit; image/video/model/document categories.

Success Response: File metadata and URL.

Error Response: File too large; unsupported type; storage unavailable.

User Role Access: Admin, Manager, Sales User.

Dependencies: MinIO running; progress UI missing.

Priority: Critical.

Status: Partial backend, missing frontend.

Component Name: Wizard Step Navigation

Button Name: Step 4 Animations

Purpose: Select product animation sequences.

Expected Functionality: Persist animation configuration.

Frontend Action: Checkboxes exist, not persisted.

Backend Requirement: Product animation config API.

Database Requirement: Missing `product_animations` or `product_interactions` table.

API Endpoint Required: `POST /api/products/:id/animations`, `PUT /api/products/:id/animations/:animationId`.

Validation Rules: Animation name/type/order; linked model required.

Success Response: Animation sequence saved.

Error Response: Validation/storage error.

User Role Access: Admin, Manager.

Dependencies: Animation schema missing.

Priority: High.

Status: Missing.

Component Name: Wizard Footer

Button Name: Back

Purpose: Move to previous wizard step.

Expected Functionality: Decrement step without losing state.

Frontend Action: Decrements local `activeStep`.

Backend Requirement: None.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: Cannot go below first step.

Success Response: Previous step visible.

Error Response: None.

User Role Access: Admin, Manager.

Dependencies: Local state.

Priority: Medium.

Status: Implemented.

Component Name: Wizard Footer

Button Name: Continue

Purpose: Move to next wizard step.

Expected Functionality: Validate current step and persist draft.

Frontend Action: Increments local `activeStep`; no validation/persistence.

Backend Requirement: Draft product save.

Database Requirement: `products`, `files`.

API Endpoint Required: `POST /api/products`, `PUT /api/products/:id`.

Validation Rules: Step-specific required fields.

Success Response: Next step visible; draft saved.

Error Response: Validation errors displayed inline.

User Role Access: Admin, Manager.

Dependencies: Form state and API integration missing.

Priority: Critical.

Status: Partial.

### Catalog Builder

Component Name: Catalog Builder Header

Button Name: Publish

Purpose: Publish catalog.

Expected Functionality: Persist catalog, assigned products, status Published.

Frontend Action: Button exists, no handler.

Backend Requirement: Create/update catalog and catalog product assignments.

Database Requirement: `catalogs`, `catalog_products`.

API Endpoint Required: `POST /api/catalogs`, `PUT /api/catalogs/:id`.

Validation Rules: Name required; at least one product recommended; product IDs valid.

Success Response: Published catalog object.

Error Response: Validation or permission error.

User Role Access: Admin, Manager.

Dependencies: Catalog form state.

Priority: Critical.

Status: Missing.

Component Name: Product Library

Button Name: Search products input

Purpose: Find products to add to catalog.

Expected Functionality: Filter library list.

Frontend Action: Input exists, no handler.

Backend Requirement: Search product API.

Database Requirement: `products`.

API Endpoint Required: `GET /api/products?search=...`.

Validation Rules: Query max length.

Success Response: Filtered product list.

Error Response: Empty state.

User Role Access: Admin, Manager, Sales User.

Dependencies: Search state.

Priority: High.

Status: Missing.

Component Name: Product Library

Button Name: Product row / drag item

Purpose: Add or remove product from catalog.

Expected Functionality: Toggle product assignment and order.

Frontend Action: Toggles Zustand `catalogProductIds`; drag end also toggles.

Backend Requirement: Persist catalog-product assignments and sort order.

Database Requirement: `catalog_products`.

API Endpoint Required: `PUT /api/catalogs/:id`.

Validation Rules: Product must belong to same company; no duplicates.

Success Response: Updated catalog.

Error Response: Invalid product ID; permission error.

User Role Access: Admin, Manager.

Dependencies: Catalog ID and persistence missing.

Priority: Critical.

Status: Partial.

### Catalog Preview

Component Name: Catalog Preview Header

Button Name: Generate QR

Purpose: Generate QR code for catalog.

Expected Functionality: Call QR API, display/download QR image.

Frontend Action: Button exists, no handler.

Backend Requirement: Generate QR data URL and target URL.

Database Requirement: `qr_codes`.

API Endpoint Required: `POST /api/qr/catalog/:id`.

Validation Rules: Catalog UUID required; catalog must belong to company.

Success Response: QR record with `qr_data_url`.

Error Response: 404 catalog not found; permission error.

User Role Access: Admin, Manager, Sales User.

Dependencies: Catalog ID and QR modal/download missing.

Priority: Critical.

Status: Missing.

Component Name: Catalog Product Cards

Button Name: Product card

Purpose: Open product experience from catalog.

Expected Functionality: Navigate to product experience with product ID.

Frontend Action: Cards render but are not clickable.

Backend Requirement: Public product retrieval and catalog view analytics.

Database Requirement: `products`, `analytics_events`.

API Endpoint Required: `GET /api/public/products/:id`, `POST /api/analytics/events`.

Validation Rules: Published product only for public users.

Success Response: Product page rendered.

Error Response: Product unavailable.

User Role Access: Public if catalog published; authenticated preview otherwise.

Dependencies: Public routes missing.

Priority: High.

Status: Missing.

### QR Generator

Component Name: QR Engine

Button Name: Generate Product QR

Purpose: Generate QR for a product experience page.

Expected Functionality: Generate and store QR target for product.

Frontend Action: No dedicated product QR button currently visible.

Backend Requirement: QR generation.

Database Requirement: `qr_codes`, `products`.

API Endpoint Required: `POST /api/qr/product/:id`.

Validation Rules: Product UUID; product belongs to company; product is published for shareable QR.

Success Response: QR image data URL and target URL.

Error Response: Product not found; invalid status.

User Role Access: Admin, Manager, Sales User.

Dependencies: QR UI screen/modal missing.

Priority: Critical.

Status: Backend partial, frontend missing.

Component Name: QR Engine

Button Name: Download QR

Purpose: Download QR as PNG/SVG.

Expected Functionality: Download generated QR.

Frontend Action: Not implemented.

Backend Requirement: Return image or data URL.

Database Requirement: `qr_codes`.

API Endpoint Required: `GET /api/qr/:id/download`.

Validation Rules: QR ID required.

Success Response: File download.

Error Response: QR not found.

User Role Access: Admin, Manager, Sales User.

Dependencies: Download endpoint missing.

Priority: High.

Status: Missing.

### Product Experience Page

Component Name: Product Viewer

Button Name: View in AR

Purpose: Launch AR viewer for the current product.

Expected Functionality: Track AR launch and navigate to AR viewer.

Frontend Action: Links to `/ar-viewer`.

Backend Requirement: Store AR launch event.

Database Requirement: `analytics_events`.

API Endpoint Required: `POST /api/analytics/events`.

Validation Rules: `eventType=ar_launch`, optional product ID.

Success Response: Event recorded; AR viewer opened.

Error Response: Event failure should not block navigation.

User Role Access: Public for published products; authenticated for preview.

Dependencies: Product ID not wired.

Priority: High.

Status: Partial.

Component Name: Product Details

Button Name: Datasheet

Purpose: Download product PDF/document.

Expected Functionality: Open/download product document.

Frontend Action: Button exists, no handler.

Backend Requirement: Serve signed or public document URL.

Database Requirement: `files`, `products.document_url`.

API Endpoint Required: `GET /api/products/:id/document` or direct file URL.

Validation Rules: Product/document exists.

Success Response: PDF download/open.

Error Response: Document missing.

User Role Access: Public if product published; authenticated otherwise.

Dependencies: File upload and document association.

Priority: High.

Status: Missing.

Component Name: Product Experience CTA

Button Name: Request Quote

Purpose: Capture buyer lead.

Expected Functionality: Open lead form and submit lead.

Frontend Action: Not currently present.

Backend Requirement: Lead capture.

Database Requirement: `leads`, optional `analytics_events`.

API Endpoint Required: `POST /api/leads`.

Validation Rules: Name, email, company/product, consent if required.

Success Response: Lead created; confirmation shown.

Error Response: Validation/network error.

User Role Access: Public.

Dependencies: Lead form missing.

Priority: Critical.

Status: Missing.

### AR Viewer

Component Name: AR Floating Toolbar

Button Name: Move

Purpose: Enable move/translate mode.

Expected Functionality: Set transform mode to move.

Frontend Action: Icon button exists, no handler.

Backend Requirement: None unless saving viewer state.

Database Requirement: Optional `viewer_sessions`.

API Endpoint Required: Optional `POST /api/analytics/events`.

Validation Rules: None.

Success Response: Move mode active.

Error Response: Unsupported device state.

User Role Access: Public/authenticated based on product.

Dependencies: AR engine not implemented.

Priority: Medium.

Status: Missing.

Component Name: AR Floating Toolbar

Button Name: Rotate

Purpose: Enable rotate mode.

Expected Functionality: Set transform mode to rotate.

Frontend Action: Icon button exists, no handler.

Backend Requirement: None unless saving state.

Database Requirement: Optional `viewer_sessions`.

API Endpoint Required: Optional analytics event.

Validation Rules: None.

Success Response: Rotate mode active.

Error Response: Unsupported device state.

User Role Access: Public/authenticated.

Dependencies: AR controls missing.

Priority: Medium.

Status: Missing.

Component Name: AR Floating Toolbar

Button Name: Scale

Purpose: Enable scaling mode.

Expected Functionality: Set transform mode to scale.

Frontend Action: Icon button exists, no handler.

Backend Requirement: None.

Database Requirement: Optional `viewer_sessions`.

API Endpoint Required: Optional analytics event.

Validation Rules: Scale min/max.

Success Response: Scale mode active.

Error Response: Invalid scale.

User Role Access: Public/authenticated.

Dependencies: AR controls missing.

Priority: Medium.

Status: Missing.

Component Name: AR Floating Toolbar

Button Name: Lock / Unlock

Purpose: Lock or unlock placed model.

Expected Functionality: Toggle placement lock state.

Frontend Action: Icon buttons exist, no handler.

Backend Requirement: None.

Database Requirement: Optional `viewer_sessions`.

API Endpoint Required: None.

Validation Rules: Model must be placed.

Success Response: Lock state updated.

Error Response: No active model.

User Role Access: Public/authenticated.

Dependencies: AR placement state missing.

Priority: Medium.

Status: Missing.

Component Name: AR Floating Toolbar

Button Name: Reset

Purpose: Reset product placement.

Expected Functionality: Restore default transform.

Frontend Action: Icon button exists, no handler.

Backend Requirement: None.

Database Requirement: None.

API Endpoint Required: None.

Validation Rules: None.

Success Response: Model transform reset.

Error Response: None.

User Role Access: Public/authenticated.

Dependencies: AR state missing.

Priority: Medium.

Status: Missing.

### Animation Panel

Component Name: Animation Panel Header

Button Name: Save Changes

Purpose: Persist animation sequence configuration.

Expected Functionality: Save sequence order/status to product.

Frontend Action: Button exists, no handler.

Backend Requirement: Animation configuration API.

Database Requirement: Missing `product_animations`.

API Endpoint Required: `PUT /api/products/:id/animations`.

Validation Rules: Product ID; sequence list; order; enabled state.

Success Response: Saved animation config.

Error Response: Validation or permission error.

User Role Access: Admin, Manager.

Dependencies: Animation schema missing.

Priority: High.

Status: Missing.

Component Name: Animation Sequence Cards

Button Name: Sequence card

Purpose: Select/edit animation sequence.

Expected Functionality: Open editor or toggle active sequence.

Frontend Action: Cards render only.

Backend Requirement: Read/update animation sequence.

Database Requirement: Missing `product_animations`.

API Endpoint Required: `GET /api/products/:id/animations`, `PUT /api/products/:id/animations/:id`.

Validation Rules: Sequence ID required.

Success Response: Sequence selected/updated.

Error Response: Sequence not found.

User Role Access: Admin, Manager.

Dependencies: Editor missing.

Priority: Medium.

Status: Missing.

### Hotspots

Component Name: Hotspot Panel Header

Button Name: Save Changes

Purpose: Persist hotspot configuration.

Expected Functionality: Save hotspot title, position, content, link/action.

Frontend Action: Button exists, no handler.

Backend Requirement: Hotspot CRUD API.

Database Requirement: Missing `product_hotspots`.

API Endpoint Required: `PUT /api/products/:id/hotspots`.

Validation Rules: Product ID, hotspot coordinates, label required.

Success Response: Saved hotspots.

Error Response: Validation/permission error.

User Role Access: Admin, Manager.

Dependencies: Hotspot schema missing.

Priority: High.

Status: Missing.

Component Name: Hotspot Cards

Button Name: Hotspot card

Purpose: Select hotspot for editing.

Expected Functionality: Open hotspot details editor.

Frontend Action: Cards render only.

Backend Requirement: Read hotspot data.

Database Requirement: Missing `product_hotspots`.

API Endpoint Required: `GET /api/products/:id/hotspots`.

Validation Rules: Product ID required.

Success Response: Hotspot selected.

Error Response: Hotspot not found.

User Role Access: Admin, Manager.

Dependencies: Hotspot editor missing.

Priority: Medium.

Status: Missing.

### Leads

Component Name: Leads Header

Button Name: Filters

Purpose: Filter leads by status/source/date/product.

Expected Functionality: Open filter controls and refresh table.

Frontend Action: Button exists, no handler.

Backend Requirement: Query leads with filters.

Database Requirement: `leads`.

API Endpoint Required: `GET /api/leads?status=&source=&productId=&from=&to=`.

Validation Rules: Valid lead status enum and UUIDs.

Success Response: Filtered leads.

Error Response: Empty or validation state.

User Role Access: Admin, Manager, Sales User.

Dependencies: Filter UI missing.

Priority: High.

Status: Missing.

Component Name: Leads Table

Button Name: Lead row

Purpose: Select lead and show details drawer/panel.

Expected Functionality: Update details panel for selected lead.

Frontend Action: Implemented via local state using dummy data.

Backend Requirement: Lead list/detail APIs.

Database Requirement: `leads`.

API Endpoint Required: `GET /api/leads`, optional `GET /api/leads/:id`.

Validation Rules: Auth required.

Success Response: Lead details displayed.

Error Response: Empty state.

User Role Access: Admin, Manager, Sales User.

Dependencies: API data not connected.

Priority: High.

Status: Partial.

Component Name: Lead Details

Button Name: Contact Lead

Purpose: Initiate email/contact workflow.

Expected Functionality: Open email client, create task, or update lead status.

Frontend Action: Button exists, no handler.

Backend Requirement: Lead activity/task/email integration.

Database Requirement: Missing `lead_activities` or `tasks`.

API Endpoint Required: `POST /api/leads/:id/activities`, optional email endpoint.

Validation Rules: Lead ID; message/template.

Success Response: Activity logged or email sent.

Error Response: Email failure; permission error.

User Role Access: Admin, Manager, Sales User.

Dependencies: CRM/email service missing.

Priority: High.

Status: Missing.

### Analytics

Component Name: Analytics Header

Button Name: Export

Purpose: Export analytics dashboard.

Expected Functionality: Download CSV/PDF.

Frontend Action: Button exists, no handler.

Backend Requirement: Analytics export.

Database Requirement: `analytics_events`, `leads`, `products`, `catalogs`.

API Endpoint Required: `GET /api/analytics/export`.

Validation Rules: Format/date range validation.

Success Response: File download.

Error Response: Export error.

User Role Access: Admin, Manager.

Dependencies: Export service missing.

Priority: Medium.

Status: Missing.

Component Name: KPI Cards

Button Name: KPI card

Purpose: Show conversion/session/catalog/lead metrics.

Expected Functionality: Display API-driven KPI data and trends.

Frontend Action: Renders dummy data.

Backend Requirement: Metrics aggregation.

Database Requirement: `analytics_events`, `leads`, `catalogs`.

API Endpoint Required: `GET /api/analytics/summary`.

Validation Rules: Auth required; optional date range.

Success Response: KPI values.

Error Response: Empty/error state.

User Role Access: Admin, Manager, Sales User, Viewer.

Dependencies: Data mapping not connected.

Priority: High.

Status: Partial.

Component Name: Charts

Button Name: Tooltip/hover

Purpose: Inspect QR/lead metrics and top products.

Expected Functionality: Render API data.

Frontend Action: Recharts with dummy data.

Backend Requirement: Timeseries and top products endpoints.

Database Requirement: `analytics_events`, `products`, `catalogs`.

API Endpoint Required: `GET /api/analytics/timeseries`, `GET /api/analytics/top-products`.

Validation Rules: Date range and company scope.

Success Response: Chart data.

Error Response: Empty chart state.

User Role Access: Admin, Manager, Sales User, Viewer.

Dependencies: Analytics APIs not complete.

Priority: High.

Status: Partial.

### Settings

Component Name: Settings Header

Button Name: Save

Purpose: Save company settings.

Expected Functionality: Submit company profile, brand color, logo.

Frontend Action: Button exists, no handler; fields use default values.

Backend Requirement: Update company.

Database Requirement: `companies`, `files` for logo.

API Endpoint Required: `PUT /api/company`, `POST /api/uploads`.

Validation Rules: Name required; URL valid; color hex; logo MIME/size.

Success Response: Updated company settings.

Error Response: Validation/permission error.

User Role Access: Admin, Manager.

Dependencies: Form state/upload missing.

Priority: Critical.

Status: Partial backend, missing frontend.

Component Name: Settings Sidebar

Button Name: Company Profile / Brand Kit / Team Access / Integrations / Security

Purpose: Switch settings sections.

Expected Functionality: Change active section and show related forms.

Frontend Action: Buttons render; active styling fixed to first item.

Backend Requirement: Section-specific APIs.

Database Requirement: `companies`, `users`, missing integrations/security tables.

API Endpoint Required: `GET/PUT /api/company`, future `/api/users`, `/api/integrations`.

Validation Rules: Section-specific.

Success Response: Section content shown/saved.

Error Response: Permission or validation errors.

User Role Access: Admin for users/security; Manager for company/brand.

Dependencies: Section state missing.

Priority: High.

Status: Missing.

### Application Shell

Component Name: Sidebar Navigation

Button Name: New Visualization

Purpose: Start new product upload.

Expected Functionality: Navigate to `/products/upload`.

Frontend Action: Implemented via `NavLink`.

Backend Requirement: None until wizard save.

Database Requirement: `products`.

API Endpoint Required: `POST /api/products`.

Validation Rules: Protected route.

Success Response: Upload wizard displayed.

Error Response: Redirect to login if unauthenticated.

User Role Access: Admin, Manager.

Dependencies: ProtectedRoute.

Priority: High.

Status: Partial because role gate not enforced in UI.

Component Name: Sidebar Navigation

Button Name: Dashboard / Products / Upload Wizard / Catalogs / QR Codes / Product Experience / AR Viewer / Animations / Hotspots / Leads / Analytics / Settings

Purpose: Navigate between modules.

Expected Functionality: Route to selected screen.

Frontend Action: Implemented with `NavLink`.

Backend Requirement: Auth for protected sections.

Database Requirement: Module-specific.

API Endpoint Required: Module-specific.

Validation Rules: JWT required; role checks should hide/disable unauthorized links.

Success Response: Route rendered.

Error Response: Redirect to login.

User Role Access: Authenticated, but currently all authenticated roles see all links.

Dependencies: Role-aware navigation missing.

Priority: High.

Status: Partial.

Component Name: Sidebar Footer

Button Name: Sign Out

Purpose: End session.

Expected Functionality: Clear token/user and navigate to login.

Frontend Action: `useAuthStore.logout` and `NavLink` to `/login`.

Backend Requirement: Optional token revocation.

Database Requirement: Optional `sessions` or `revoked_tokens`.

API Endpoint Required: Optional `POST /api/auth/logout`.

Validation Rules: Auth token if server-side logout.

Success Response: User unauthenticated.

Error Response: Should still clear local session on API failure.

User Role Access: Authenticated.

Dependencies: Auth store.

Priority: High.

Status: Implemented client-side; backend endpoint exists but not called.

Component Name: Top Bar

Button Name: Search workspace input

Purpose: Global search.

Expected Functionality: Search catalogs/products/leads.

Frontend Action: Input exists, no handler.

Backend Requirement: Global search endpoint.

Database Requirement: `products`, `catalogs`, `leads`.

API Endpoint Required: `GET /api/search?q=...`.

Validation Rules: Min/max query length.

Success Response: Search results grouped by entity.

Error Response: Empty/error state.

User Role Access: Authenticated.

Dependencies: Search API missing.

Priority: Medium.

Status: Missing.

Component Name: Top Bar

Button Name: Notifications

Purpose: Show notifications.

Expected Functionality: Open notifications menu/list.

Frontend Action: Icon button exists, no handler.

Backend Requirement: Notifications API.

Database Requirement: Missing `notifications`.

API Endpoint Required: `GET /api/notifications`, `PATCH /api/notifications/:id/read`.

Validation Rules: Auth required.

Success Response: Notification list.

Error Response: Empty/error state.

User Role Access: Authenticated.

Dependencies: Notification system missing.

Priority: Low.

Status: Missing.

Component Name: Top Bar

Button Name: Help

Purpose: Open support/help content.

Expected Functionality: Navigate to support docs or open help drawer.

Frontend Action: Icon button exists, no handler.

Backend Requirement: Optional support content API.

Database Requirement: None unless dynamic help content.

API Endpoint Required: Optional `GET /api/help`.

Validation Rules: None.

Success Response: Help content shown.

Error Response: None.

User Role Access: Authenticated.

Dependencies: Help route/drawer missing.

Priority: Low.

Status: Missing.

## Complete Button Inventory

| Screen | Button / Interactive Element | Function | Backend | Database | Status |
|---|---|---|---|---|---|
| Public Nav | Brand Logo | Navigate home | None | None | Implemented |
| Public Nav | Products | Anchor to features | None | None | Implemented |
| Public Nav | How It Works | Anchor to workflow | None | None | Implemented |
| Public Nav | Solutions | Anchor to industries | None | None | Implemented |
| Public Nav | Search catalog | Search public catalogs | `GET /api/public/search` | `products`, `catalogs` | Missing |
| Public Nav | Login | Navigate login | None | None | Implemented |
| Public Nav | Sign up | Navigate signup | None | None | Implemented |
| Landing | Request Demo | Start signup/demo lead | `POST /api/leads` optional | `leads` | Partial |
| Landing | View Examples | Open product experience | Public product + analytics APIs | `products`, `analytics_events` | Partial |
| Landing | Start Workspace | Open signup | `POST /api/auth/signup` | `companies`, `users` | Partial |
| Login | Sign In | Authenticate | `POST /api/auth/login` | `users` | Implemented |
| Login | Create account | Navigate signup | None | None | Implemented |
| Login | Forgot Password | Navigate reset flow | `POST /api/auth/forgot-password` | `users` | Partial |
| Signup | Create Account | Create company/user | `POST /api/auth/signup` | `companies`, `users` | Implemented |
| Signup | Onboarding checkbox | Enable sample setup | Signup/onboarding API | `companies`, seed data | Missing |
| Forgot Password | Send Reset Link | Request token | `POST /api/auth/forgot-password` | `users` | Partial |
| Reset Password | Reset Password | Update password | `POST /api/auth/reset-password` | `users` | Partial |
| App Shell | New Visualization | Open upload wizard | None immediately | `products` later | Partial |
| App Shell | Sidebar links | Navigate screens | Module-specific | Module-specific | Partial |
| App Shell | Sign Out | Clear session | Optional `POST /api/auth/logout` | Optional sessions | Partial |
| App Shell | Global search | Search workspace | `GET /api/search` | `products`, `catalogs`, `leads` | Missing |
| App Shell | Notifications | Open notifications | `GET /api/notifications` | `notifications` | Missing |
| App Shell | Help | Open help | Optional help endpoint | None | Missing |
| Dashboard | Last 30 Days | Change date range | `GET /api/analytics/summary` | `analytics_events` | Missing |
| Dashboard | Export | Export dashboard | `GET /api/analytics/export` | Analytics tables | Missing |
| Products | Add Product | Open wizard/modal | `POST /api/products` | `products` | Missing |
| Products | Search | Filter products | `GET /api/products?search=` | `products` | Partial |
| Products | Status filters | Filter by status | `GET /api/products?status=` | `products` | Missing |
| Products | Edit | Update product | `PUT /api/products/:id` | `products` | Missing |
| Products | Delete | Delete product | `DELETE /api/products/:id` | `products` | Missing |
| Upload Wizard | Step buttons | Change step | None | None | Implemented |
| Upload Wizard | Media zones | Upload files | `POST /api/uploads` | `files` | Partial |
| Upload Wizard | Back | Previous step | None | None | Implemented |
| Upload Wizard | Continue | Validate/save step | `POST/PUT /api/products` | `products`, `files` | Partial |
| Catalog Builder | Publish | Publish catalog | `POST/PUT /api/catalogs` | `catalogs`, `catalog_products` | Missing |
| Catalog Builder | Search products | Filter product library | `GET /api/products` | `products` | Missing |
| Catalog Builder | Product row | Toggle assignment | `PUT /api/catalogs/:id` | `catalog_products` | Partial |
| Catalog Preview | Generate QR | Create catalog QR | `POST /api/qr/catalog/:id` | `qr_codes` | Missing |
| Catalog Preview | Product card | Open product | Public product API | `products` | Missing |
| QR Generator | Generate Product QR | Create product QR | `POST /api/qr/product/:id` | `qr_codes` | Backend partial |
| QR Generator | Download QR | Download QR image | `GET /api/qr/:id/download` | `qr_codes` | Missing |
| Product Experience | View in AR | Open AR viewer | Analytics event | `analytics_events` | Partial |
| Product Experience | Datasheet | Download document | Product document endpoint | `files`, `products` | Missing |
| Product Experience | Request Quote | Create lead | `POST /api/leads` | `leads` | Missing |
| AR Viewer | Move | Transform mode | Optional analytics | Optional sessions | Missing |
| AR Viewer | Rotate | Transform mode | Optional analytics | Optional sessions | Missing |
| AR Viewer | Scale | Transform mode | Optional analytics | Optional sessions | Missing |
| AR Viewer | Lock | Lock model | None | Optional sessions | Missing |
| AR Viewer | Unlock | Unlock model | None | Optional sessions | Missing |
| AR Viewer | Reset | Reset transform | None | None | Missing |
| Animation Panel | Save Changes | Save animation config | Missing endpoint | Missing table | Missing |
| Hotspots | Save Changes | Save hotspots | Missing endpoint | Missing table | Missing |
| Leads | Filters | Filter leads | `GET /api/leads` | `leads` | Missing |
| Leads | Lead row | Select lead | `GET /api/leads` | `leads` | Partial |
| Leads | Contact Lead | Contact/log activity | Missing endpoint | Missing table | Missing |
| Analytics | Export | Export analytics | `GET /api/analytics/export` | Analytics tables | Missing |
| Settings | Save | Save company settings | `PUT /api/company` | `companies` | Partial |
| Settings | Section tabs | Switch settings forms | Module-specific | Module-specific | Missing |

## Complete API Inventory

### Implemented Backend Endpoints

| Method | Endpoint | Purpose | Auth | Status |
|---|---|---|---|---|
| GET | `/health` | API health check | Public | Implemented |
| POST | `/api/auth/signup` | Create company/admin user | Public | Implemented |
| POST | `/api/auth/login` | Authenticate user | Public | Implemented |
| POST | `/api/auth/logout` | Logout placeholder | Public | Implemented |
| POST | `/api/auth/forgot-password` | Generate reset token | Public | Partial |
| POST | `/api/auth/reset-password` | Reset password | Public | Partial |
| GET | `/api/me` | Current user | JWT | Implemented |
| GET | `/api/company` | Read company | JWT | Implemented |
| PUT | `/api/company` | Update company | Manager+ | Implemented backend |
| GET | `/api/products` | List products | JWT | Implemented |
| POST | `/api/products` | Create product | Manager+ | Implemented backend |
| GET | `/api/products/:id` | Read product | JWT | Implemented backend |
| PUT | `/api/products/:id` | Update product | Manager+ | Implemented backend |
| DELETE | `/api/products/:id` | Delete product | Manager+ | Implemented backend |
| GET | `/api/catalogs` | List catalogs | JWT | Implemented backend |
| POST | `/api/catalogs` | Create catalog | Manager+ | Implemented backend |
| PUT | `/api/catalogs/:id` | Update catalog | Manager+ | Implemented backend |
| DELETE | `/api/catalogs/:id` | Delete catalog | Manager+ | Implemented backend |
| POST | `/api/uploads` | Upload file to MinIO | Sales User+ | Implemented backend |
| POST | `/api/qr/:type/:id` | Generate product/catalog QR | Sales User+ | Implemented backend |
| GET | `/api/leads` | List leads | JWT | Implemented backend |
| POST | `/api/leads` | Create lead | JWT currently | Implemented backend |
| PUT | `/api/leads/:id` | Update lead | Sales User+ | Implemented backend |
| POST | `/api/analytics/events` | Track event | JWT currently | Implemented backend |
| GET | `/api/analytics/summary` | Aggregate events/leads | JWT | Implemented backend |

### Required Missing Endpoints

| Method | Endpoint | Purpose | Priority |
|---|---|---|---|
| GET | `/api/public/search` | Public catalog/product search | Medium |
| GET | `/api/search` | Authenticated global search | Medium |
| GET | `/api/public/products/:id` | Public product experience | High |
| GET | `/api/public/catalogs/:slug` | Public catalog preview | High |
| GET | `/api/products?search=&status=` | Server-side filtering | High |
| GET | `/api/products/:id/document` | Product datasheet download | High |
| PUT | `/api/products/:id/animations` | Save animation config | High |
| GET | `/api/products/:id/animations` | Read animation config | Medium |
| PUT | `/api/products/:id/hotspots` | Save hotspots | High |
| GET | `/api/products/:id/hotspots` | Read hotspots | Medium |
| GET | `/api/qr/:id/download` | Download QR | High |
| GET | `/api/analytics/timeseries` | Chart time series | High |
| GET | `/api/analytics/top-products` | Top products chart | High |
| GET | `/api/analytics/export` | CSV/PDF export | Medium |
| GET | `/api/notifications` | Notifications list | Low |
| PATCH | `/api/notifications/:id/read` | Mark notification read | Low |
| POST | `/api/leads/:id/activities` | Lead follow-up activity | High |
| GET/POST/PUT/DELETE | `/api/users` | Team access management | High |
| GET/PUT | `/api/integrations` | Integration settings | Medium |

## Complete Database Dependency List

### Existing Tables

| Table | Purpose | Used By | Status |
|---|---|---|---|
| `companies` | Workspace/company profile | Signup, settings, tenant scope | Implemented |
| `users` | Auth users and roles | Login/signup/RBAC | Implemented |
| `products` | Product master records | Products, upload, catalog, experience | Implemented |
| `files` | Uploaded asset metadata | Uploads, logo/docs/models | Implemented |
| `catalogs` | Catalog master records | Catalog builder/preview | Implemented |
| `catalog_products` | Catalog-product assignment/order | Catalog builder | Implemented |
| `qr_codes` | QR references/data URLs | QR generation | Implemented |
| `leads` | Buyer leads | Lead dashboard/quote forms | Implemented |
| `analytics_events` | Product/catalog/QR/AR/lead events | Dashboards/analytics | Implemented |

### Missing Tables

| Table | Purpose | Priority |
|---|---|---|
| `product_animations` | Store animation sequences, order, labels, enabled state | High |
| `product_hotspots` | Store hotspot coordinates/content/actions | High |
| `lead_activities` | Track calls, emails, notes, follow-ups | High |
| `notifications` | Workspace/user notification feed | Low |
| `user_sessions` or `revoked_tokens` | Server-side logout/token revocation | Medium |
| `company_preferences` | Onboarding, feature flags, defaults | Medium |
| `integrations` | CRM/email/webhook integration settings | Medium |
| `viewer_sessions` | Optional AR placement/session state | Low |
| `audit_logs` | Security and compliance audit trail | High |

## Missing Backend Functions

- Email delivery for password reset.
- Server-side token revocation/session management.
- Public product and catalog read APIs.
- Product/campaign search APIs.
- Product upload wizard draft lifecycle.
- Product animations CRUD.
- Product hotspots CRUD.
- QR download endpoint.
- Analytics time series and top-products aggregation.
- CSV/PDF export.
- Lead activity/contact workflow.
- Team/user management.
- Notification service.
- Integration management.
- Audit logging.

## Missing API Endpoints

Critical:

- `GET /api/public/products/:id`
- `GET /api/public/catalogs/:slug`
- `GET /api/products?search=&status=`
- `GET /api/products/:id/document`
- `GET /api/qr/:id/download`
- `POST /api/leads` as public endpoint for product experience lead capture

High:

- `PUT /api/products/:id/animations`
- `PUT /api/products/:id/hotspots`
- `GET /api/analytics/timeseries`
- `GET /api/analytics/top-products`
- `POST /api/leads/:id/activities`
- `/api/users` CRUD

Medium:

- `GET /api/search`
- `GET /api/public/search`
- `GET /api/analytics/export`
- `/api/integrations`

Low:

- `/api/notifications`
- `/api/help`

## Broken Buttons

These buttons render but do not currently perform their expected business action:

- Dashboard: Last 30 Days.
- Dashboard: Export.
- Products: Add Product.
- Products: status filter buttons.
- Products: Edit.
- Products: Delete.
- Product cards: open detail/experience.
- Product Upload: media upload drop zones.
- Product Upload: Continue does not validate or save.
- Catalog Builder: Publish.
- Catalog Builder: search input.
- Catalog Preview: Generate QR.
- Product Experience: Datasheet.
- Product Experience: Request Quote is absent.
- AR Viewer: Move, Rotate, Scale, Lock, Unlock, Reset.
- Animation Panel: Save Changes.
- Animation sequence cards.
- Hotspot Panel: Save Changes.
- Hotspot cards.
- Leads: Filters.
- Leads: Contact Lead.
- Analytics: Export.
- Settings: Save.
- Settings section tabs.
- Top bar: global search, notifications, help.

## Placeholder Components

- ThreeProduct uses a simple generated 3D mesh, not uploaded GLB model assets.
- AR Viewer is UI-only and does not implement WebXR/AR placement.
- QR icon in Catalog Builder is a static visual mock.
- Product Upload media zones are visual placeholders.
- Animation Panel cards are static placeholders.
- Hotspot Panel cards are static placeholders.
- Settings tabs are static and do not switch content.
- Notifications/help controls are placeholders.
- Public search and global search inputs are placeholders.

## Dummy Data Components

- `src/services/mockData.ts` drives dashboard KPIs, products, leads, charts, activity, and rankings.
- Dashboard KPI cards and chart data are dummy.
- Analytics dashboard KPIs/charts/top products are dummy.
- Leads dashboard table/detail panel are dummy.
- Catalog Builder product library uses mock products.
- Catalog Preview uses mock products.
- Product Experience uses first mock product.
- Product Management falls back to mock products when API is unavailable.

## Features Not Yet Connected

- Signup/login are connected, with offline fallback.
- Product Management list attempts API connection but create/edit/delete are not connected.
- Company Settings backend exists but frontend Save is not connected.
- Catalog backend exists but builder/preview buttons are not connected.
- Upload backend exists but upload zones are not connected.
- QR backend exists but Generate QR buttons are not connected.
- Leads backend exists but Leads dashboard uses mock data.
- Analytics summary backend exists but dashboards use mock data.
- Role-based backend middleware exists, but frontend navigation does not hide unauthorized actions.
- MinIO service exists, but Docker/MinIO must be running for real storage.

## Backend Development Checklist

### Critical

- Connect public product/catalog APIs for buyer-facing experiences.
- Make public lead capture endpoint work without requiring JWT.
- Add server-side filtering to products and leads.
- Implement product create/edit/delete flows end-to-end.
- Connect catalog publish/assign products to UI.
- Connect QR generation and add QR download.
- Add production email service for password reset.
- Add role-based route/action enforcement tests.

### High

- Add product animations and hotspots tables/APIs.
- Add lead activity/contact workflow.
- Add analytics timeseries/top-products endpoints.
- Add team user management APIs.
- Add audit logs for auth, product, catalog, QR, and settings changes.
- Add file association flows for product images/models/docs/videos.

### Medium

- Add CSV/PDF analytics export.
- Add global search.
- Add integration settings APIs.
- Add server-side logout/token revocation.
- Add company preferences/onboarding seed workflow.

### Low

- Add notifications.
- Add help/support content APIs.
- Add optional viewer session persistence.

## Frontend Development Checklist

### Critical

- Connect Add Product to Product Upload Wizard.
- Build form state for Product Upload Wizard.
- Connect wizard submit/save draft to `POST/PUT /api/products`.
- Connect media upload zones to `POST /api/uploads` with progress.
- Connect product Edit/Delete handlers with confirmation and toasts.
- Connect Catalog Publish to catalog API.
- Connect Generate QR button and display/download QR.
- Add Request Quote lead form to Product Experience.
- Connect Settings Save to `PUT /api/company`.

### High

- Replace mock dashboard/analytics/leads data with API data.
- Add loading, empty, success, and error states across every API-backed screen.
- Add role-aware navigation and disabled/hidden actions.
- Connect filters/search to local/API state.
- Add product detail route.
- Connect Datasheet button to real document URL.
- Implement AR viewer control state.
- Add animation/hotspot editors.

### Medium

- Add date range picker.
- Add export download handlers.
- Add notifications/help drawers.
- Add onboarding preference behavior.
- Add optimistic updates where appropriate.

### Low

- Add skeleton states and polish micro-interactions.
- Add code splitting for large 3D/chart routes.

## Database Development Checklist

### Critical

- Confirm migrations run in deployment pipeline, not only app startup.
- Add seed data script for development/demo mode.
- Add indexes for `created_at`, `status`, and search fields.
- Add public slug/visibility fields for products/catalogs.
- Add lead capture constraints and anti-spam metadata.

### High

- Create `product_animations`.
- Create `product_hotspots`.
- Create `lead_activities`.
- Create `audit_logs`.
- Add user/team management tables or extend `users`.

### Medium

- Create `company_preferences`.
- Create `integrations`.
- Create `user_sessions` or `revoked_tokens`.
- Add materialized analytics views if event volume grows.

### Low

- Create `notifications`.
- Create optional `viewer_sessions`.

## Priority Order

### Critical

1. Make full local backend reliable: Docker Desktop/PostgreSQL/MinIO running, migrations verified.
2. Product create/update/delete and upload wizard persistence.
3. Public product/catalog routes.
4. Lead capture from product experience.
5. Catalog publish and QR generation/download.
6. Company settings save and logo upload.

### High

1. Replace dummy dashboard, analytics, and leads data with API data.
2. Add product animations/hotspots backend and editors.
3. Add lead activity/contact flow.
4. Add role-based frontend controls.
5. Add loading/empty/error/success states everywhere.

### Medium

1. Exports.
2. Global search.
3. Onboarding sample data.
4. Integrations.
5. Session revocation.

### Low

1. Notifications.
2. Help drawer.
3. Optional viewer session persistence.
4. Performance/code splitting.

## QA Acceptance Criteria

- Public visitors can open landing, signup, login, forgot password, reset password.
- Authenticated users cannot access app screens without JWT or development fallback session.
- Admin can create company/user via signup.
- Manager/Admin can create, edit, publish, archive, and delete products.
- Uploads validate type and size and store MinIO URLs in PostgreSQL.
- Manager/Admin can create catalog, assign products, publish, preview, and generate QR.
- Public catalog/product links record view and QR analytics.
- Public product experience can capture lead.
- Leads dashboard shows stored leads and status changes.
- Analytics dashboard reflects stored analytics events.
- Settings save company profile, logo, and brand color.
- All buttons either perform their function or display a disabled/coming-soon state.
- All forms display inline validation and network errors.
- All API routes enforce JWT and role rules where required.

