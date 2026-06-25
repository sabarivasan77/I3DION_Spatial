# I3DION Spatial V1.0 MVP Release Checklist

## 1. Project Cleanup
- [x] Unused V2 features (Animations, Hotspots) removed from UI and routes.
- [x] React routing cleaned up.
- [x] Mock data removed; application relies purely on PostgreSQL.

## 2. Backend & Infrastructure
- [x] PostgreSQL database running and correctly seeded via `schema.sql`.
- [x] Fallback in-memory API disabled; strict DB connections enforced.
- [x] MinIO object storage configured and bucket policies tested.

## 3. Security & Validation
- [x] Passwords properly hashed with bcrypt.
- [x] JWT sessions implemented with appropriate expiry and validation.
- [x] Helmet, CORS, and Express Rate Limit applied.
- [x] Zod schemas validating API inputs.

## 4. Features Complete
- [x] Authentication (Signup, Login, Logout, Forgot/Reset Password).
- [x] Company & User Management.
- [x] Product CRUD and file uploads.
- [x] 3D Viewer with loading/fallback states.
- [x] Catalog Builder (Create, Update).
- [x] QR Engine (Generating code for products/catalogs).
- [x] Lead Capture & Analytics Dashboard wired up.

## 5. Pre-Flight
- [ ] Build React app: `npm run build` runs successfully.
- [ ] Test frontend flow locally against Docker containers.
- [ ] Verify environment variables are documented and set in staging.
