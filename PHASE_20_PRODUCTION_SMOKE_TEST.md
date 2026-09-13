# PHASE 20 — PRODUCTION SMOKE TEST

## Executable 22-Step Commercial Production Journey Verification

---

### Step 1: User Login
* **URL**: `/login`
* **Action**: User enters credentials or clicks "Login as Demo Admin".
* **Expected Outcome**: Token is authenticated in `authStore`, redirecting to `/dashboard`.
* **Status**: **PASS**

### Step 2: Company Dashboard Overview
* **URL**: `/dashboard`
* **Action**: User views company metrics, active product count, experience count, lead count, and 4-step onboarding guide.
* **Expected Outcome**: All cards and metrics render cleanly without infinite spinners or empty card crashes.
* **Status**: **PASS**

### Step 3: Create Product
* **URL**: `/products`
* **Action**: User clicks "Create Product" and inputs product details ("Industrial Turbine Generator 5000", category: "Energy Systems").
* **Expected Outcome**: Product record is saved in state/API, displaying public URL link and action triggers.
* **Status**: **PASS**

### Step 4: Asset Upload
* **URL**: `/products/upload`
* **Action**: User selects GLB 3D model (`turbine_generator.glb`), iOS USDZ model (`turbine_generator.usdz`), and thumbnail image.
* **Expected Outcome**: Upload progress bar completes, linking asset URLs to the product record.
* **Status**: **PASS**

### Step 5: Create Experience
* **URL**: `/products`
* **Action**: User clicks "Sparkles / Create Experience" button on the product row.
* **Expected Outcome**: Navigates to `/studio?productId=prod-5000`, passing product ID and asset references directly into OmniStudio context.
* **Status**: **PASS**

### Step 6: Open OmniStudio
* **URL**: `/studio?productId=prod-5000`
* **Action**: OmniStudio initializes canvas workspace, 23-widget panel, properties inspector, layers tree, and native Three.js 3D viewport.
* **Expected Outcome**: Product 3D model loads automatically in the Three.js viewport.
* **Status**: **PASS**

### Step 7: Configure 3D Model Transforms
* **URL**: `/studio`
* **Action**: User adjusts 3D position, rotation, scale, and camera view presets in property inspector.
* **Expected Outcome**: 3D model updates in real-time in the WebGL canvas.
* **Status**: **PASS**

### Step 8: Configure Interactive Surface Hotspot
* **URL**: `/studio`
* **Action**: User attaches a 3D hotspot titled "Turbine Intake Valve" to model geometry.
* **Expected Outcome**: Hotspot node attaches to 3D surface mesh and appears in scene hierarchy.
* **Status**: **PASS**

### Step 9: Configure Timeline Animation
* **URL**: `/studio` (Timeline Panel)
* **Action**: User adds keyframes for rotation and camera zoom at $t=0\text{s}$ and $t=3\text{s}$, then clicks Play.
* **Expected Outcome**: 3D viewport smoothly interpolates keyframes at 60 FPS without memory leaks.
* **Status**: **PASS**

### Step 10: Create LogicCraft Node & iScript Synchronization
* **URL**: `/studio` (LogicCraft & iScript Panel)
* **Action**: User connects visual logic node `WHEN Hotspot_01 IS CLICKED` → `PLAY ANIMATION "Intake_Spin"`.
* **Expected Outcome**: iScript editor text synchronizes bi-directionally with AST parser without syntax errors. Zero `eval()` or `new Function()` invoked.
* **Status**: **PASS**

### Step 11: Manual & Debounced Autosave
* **URL**: `/studio`
* **Action**: User makes canvas edits and waits 3 seconds.
* **Expected Outcome**: Debounced autosave persists state to backend and `localStorage` with `SAVED` status indicator.
* **Status**: **PASS**

### Step 12: Browser Refresh & Local Snapshot Recovery
* **URL**: `/studio`
* **Action**: User refreshes the browser page.
* **Expected Outcome**: Local snapshot restores experience state, widgets, layers, and 3D configuration cleanly.
* **Status**: **PASS**

### Step 13: Pre-Publish Validation & Snapshot Publishing
* **URL**: `/studio` (Publish Button)
* **Action**: User clicks "Publish", opening `PublishWorkflowModal.tsx`. System validates AST syntax, 3D asset URLs, and metadata. User clicks "Confirm Publish".
* **Expected Outcome**: Immutable published snapshot is generated with a unique public ID (`exp-pub-9012`).
* **Status**: **PASS**

### Step 14: Copy Public Experience Link
* **URL**: `/studio`
* **Action**: User clicks "Copy Public Link".
* **Expected Outcome**: Link `https://spatial.i3dion.com/experience/exp-pub-9012` is copied to clipboard.
* **Status**: **PASS**

### Step 15: Unauthenticated Public Visitor Access
* **URL**: `/experience/exp-pub-9012`
* **Action**: Visitor opens public experience URL in an incognito browser window without logging in.
* **Expected Outcome**: Public product experience loads cleanly in responsive layout. Zero JWT tokens, API keys, or admin settings are exposed in browser schema.
* **Status**: **PASS**

### Step 16: Customer 3D Interaction & View Modes
* **URL**: `/experience/exp-pub-9012`
* **Action**: Customer uses touch/mouse to orbit, pan, zoom 3D model, click hotspots, and toggle solid/wireframe/X-ray render modes.
* **Expected Outcome**: 3D model responds instantly; engagement events log to first-party `Tracker.ts`.
* **Status**: **PASS**

### Step 17: Launch Mobile AR Viewer
* **URL**: `/experience/exp-pub-9012`
* **Action**: Customer taps "View in AR" button on mobile device.
* **Expected Outcome**: Launches Google SceneViewer (Android WebXR) or Apple QuickLook (iOS USDZ).
* **Status**: **PASS**

### Step 18: Submit Lead Capture Form
* **URL**: `/experience/exp-pub-9012`
* **Action**: Customer clicks "Request Enterprise Quote" and submits form (Name: "David Miller", Email: "david@globalenergy.com", Company: "Global Energy Corp", Message: "Inquiring about 20 turbine units").
* **Expected Outcome**: Form displays "Submitting..." → "Success! Quote request received." Lead engine logs entry with `sourceType = EXPERIENCE`.
* **Status**: **PASS**

### Step 19: Lead Management Reception
* **URL**: `/leads`
* **Action**: Company user logs back into dashboard and opens Lead Management (`/leads`).
* **Expected Outcome**: David Miller's lead appears in the table with `sourceType = EXPERIENCE`, product association, and "HIGH INTENT" status card.
* **Status**: **PASS**

### Step 20: Sales Intelligence Analytics Telemetry
* **URL**: `/analytics`
* **Action**: Company user navigates to Sales Intelligence Dashboard (`/analytics`).
* **Expected Outcome**: Metrics update reflecting visitor sessions, 3D interactions, hotspot clicks, AR launches, and conversion rate calculation. CSV export button downloads telemetry log.
* **Status**: **PASS**

### Step 21: Security Dashboard Audit
* **URL**: `/security`
* **Action**: Admin navigates to `/security`.
* **Expected Outcome**: Security dashboard renders active sessions, audit logs, and zero trust health indicators without infinite spinners.
* **Status**: **PASS**

### Step 22: User Logout
* **URL**: `/dashboard` → `/login`
* **Action**: User clicks "Logout" in header menu.
* **Expected Outcome**: Auth tokens are cleared from storage, redirecting securely to `/login`.
* **Status**: **PASS**

---

### Conclusion
**ALL 22 PRODUCTION SMOKE TEST STEPS VERIFIED PASS. THE END-TO-END COMMERCIAL CUSTOMER JOURNEY IS OPERATIONAL AND READY FOR DEPLOYMENT.**
