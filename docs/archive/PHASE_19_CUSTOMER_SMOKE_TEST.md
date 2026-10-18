# PHASE 19 — FIRST CUSTOMER END-TO-END SMOKE TEST

## Reproducible 20-Step Commercial Journey Verification

---

### Step 1: User Login
* **URL**: `/login`
* **Action**: User enters registered credentials or clicks "Login as Demo Admin".
* **Expected Outcome**: Token is authenticated in `authStore`, redirecting to `/dashboard`.
* **Status**: **PASS**

### Step 2: Company Dashboard Overview
* **URL**: `/dashboard`
* **Action**: User views company metrics, active product count, experience count, lead count, and 4-step customer onboarding guide (`1. Add Product` → `2. Upload Assets` → `3. Open OmniStudio` → `4. View Leads`).
* **Expected Outcome**: All metrics render cleanly without infinite spinners or empty card crashes.
* **Status**: **PASS**

### Step 3: Create Product
* **URL**: `/products`
* **Action**: User clicks "Create Product" button and inputs product name ("Industrial Valve System 4000"), category ("Fluid Systems"), and technical specifications.
* **Expected Outcome**: New product is saved in state/API, displaying public URL link and action triggers.
* **Status**: **PASS**

### Step 4: Asset Upload
* **URL**: `/products/upload`
* **Action**: User selects GLB 3D model (`valve_system.glb`), iOS USDZ model (`valve_system.usdz`), and thumbnail image.
* **Expected Outcome**: Upload progress bar completes, linking asset URLs to the product record.
* **Status**: **PASS**

### Step 5: Create Experience
* **URL**: `/products`
* **Action**: User clicks the "Sparkles / Create Experience" button on the product row.
* **Expected Outcome**: Navigates to `/studio?productId=prod-4000`, passing product ID and asset references directly into OmniStudio context.
* **Status**: **PASS**

### Step 6: Open OmniStudio
* **URL**: `/studio?productId=prod-4000`
* **Action**: OmniStudio initializes canvas workspace, 23-widget panel, properties inspector, layers tree, and native Three.js 3D viewport.
* **Expected Outcome**: Product 3D model loads automatically in the Three.js viewport.
* **Status**: **PASS**

### Step 7: 3D Authoring & Hotspot Configuration
* **URL**: `/studio`
* **Action**: User rotates 3D model, adjusts transform (position/rotation/scale), and adds an interactive surface hotspot titled "Pressure Release Valve".
* **Expected Outcome**: Hotspot node attaches to 3D model geometry and appears in scene hierarchy.
* **Status**: **PASS**

### Step 8: LogicCraft Visual Logic & iScript Synchronization
* **URL**: `/studio` (LogicCraft Tab & iScript Panel)
* **Action**: User creates visual logic connection: `WHEN Hotspot_01 IS CLICKED` → `PLAY ANIMATION "Explode"` → `SHOW Text_InfoBox`.
* **Expected Outcome**: iScript editor text synchronizes bi-directionally with AST parser without syntax errors. Zero `eval()` or `new Function()` invoked.
* **Status**: **PASS**

### Step 9: Timeline & Keyframe Animation
* **URL**: `/studio` (Timeline Panel)
* **Action**: User adds keyframes at $t=0\text{s}$ and $t=2.5\text{s}$ for camera zoom and object rotation, then clicks Play.
* **Expected Outcome**: 3D viewport smoothly interpolates keyframes at 60 FPS without memory leaks.
* **Status**: **PASS**

### Step 10: Autosave & Local Snapshot Recovery
* **URL**: `/studio`
* **Action**: User makes canvas edits and waits 3 seconds; then refreshes the browser page.
* **Expected Outcome**: Debounced autosave persists state; local snapshot restores unsaved changes cleanly.
* **Status**: **PASS**

### Step 11: Pre-Publish Validation & Snapshot Publishing
* **URL**: `/studio` (Publish Button)
* **Action**: User clicks "Publish", opening `PublishWorkflowModal.tsx`. System validates AST syntax, 3D asset URLs, and metadata. User clicks "Confirm Publish".
* **Expected Outcome**: Immutable published snapshot is generated with a unique public ID (`exp-pub-8921`).
* **Status**: **PASS**

### Step 12: Copy Public Link
* **URL**: `/studio`
* **Action**: User clicks "Copy Public Link".
* **Expected Outcome**: Link `https://spatial.i3dion.com/experience/exp-pub-8921` is copied to clipboard.
* **Status**: **PASS**

### Step 13: Unauthenticated Public Visitor Access
* **URL**: `/experience/exp-pub-8921`
* **Action**: Visitor opens public experience URL in an incognito window without logging in.
* **Expected Outcome**: Public product experience loads cleanly in responsive layout. Zero JWT tokens, API keys, or admin settings are exposed in browser schema.
* **Status**: **PASS**

### Step 14: Customer 3D Interaction
* **URL**: `/experience/exp-pub-8921`
* **Action**: Customer uses touch/mouse to orbit, pan, zoom 3D model, click hotspots, and toggle solid/wireframe/X-ray render modes.
* **Expected Outcome**: 3D model responds instantly; engagement events log to first-party `Tracker.ts`.
* **Status**: **PASS**

### Step 15: Launch Augmented Reality (AR)
* **URL**: `/experience/exp-pub-8921`
* **Action**: Customer taps "View in AR" button on mobile device.
* **Expected Outcome**: Launches Google SceneViewer (Android WebXR) or Apple QuickLook (iOS USDZ).
* **Status**: **PASS**

### Step 16: Lead Form Submission
* **URL**: `/experience/exp-pub-8921`
* **Action**: Customer clicks "Request Enterprise Quote" and submits form (Name: "Sarah Jenkins", Email: "sarah@apexindustrial.com", Company: "Apex Industrial", Message: "Requesting quote for 50 units").
* **Expected Outcome**: Form displays "Submitting..." → "Success! Quote request received." Lead engine logs entry with `sourceType = EXPERIENCE`.
* **Status**: **PASS**

### Step 17: Lead Management Reception
* **URL**: `/leads`
* **Action**: Company user logs back into dashboard and navigates to Lead Management (`/leads`).
* **Expected Outcome**: Sarah Jenkins' lead appears in the table with `sourceType = EXPERIENCE`, product association, and "HIGH INTENT" status card.
* **Status**: **PASS**

### Step 18: Sales Intelligence Analytics Tracking
* **URL**: `/analytics`
* **Action**: Company user navigates to Sales Intelligence Dashboard (`/analytics`).
* **Expected Outcome**: Metrics update reflecting visitor sessions, 3D interactions, hotspot clicks, AR launches, and conversion rate calculation. CSV export button downloads telemetry log.
* **Status**: **PASS**

### Step 19: Security Dashboard Audit
* **URL**: `/security`
* **Action**: Admin navigates to `/security`.
* **Expected Outcome**: Security dashboard renders active sessions, audit logs, and zero trust health indicators without infinite spinners.
* **Status**: **PASS**

### Step 20: User Logout
* **URL**: `/dashboard` → `/login`
* **Action**: User clicks "Logout" in header menu.
* **Expected Outcome**: Auth tokens are cleared from storage, redirecting securely to `/login`.
* **Status**: **PASS**

---

### Conclusion
**ALL 20 STEPS VERIFIED PASS. THE END-TO-END COMMERCIAL CUSTOMER JOURNEY IS FULLY FUNCTIONAL AND READY FOR FIRST CUSTOMER LAUNCH.**
