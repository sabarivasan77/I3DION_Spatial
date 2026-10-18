# I3DION Spatial — Developer & Operations Tools (`tools/`)

This directory houses development, diagnostic, deployment, and testing utilities.
Per the repository architecture guidelines, one-off operational scripts reside here rather than in the root or module packages.

---

## Tool Directory Index

### 1. Launch & Environment Utilities
- **`tools/dev.js`**: Starts concurrent local development servers for frontend (Vite) and backend (Express).
- **`tools/dev.py`**: Python supervisor for local development.
- **`tools/start.py`**: Boots the full platform environment with preflight health checks.
- **`tools/start-project.bat`**: Windows batch launcher for development workflow.
- **`tools/health_check.py`**: Verifies connectivity, port availability, and database liveness.
- **`tools/install.py`**: Automated dependency installer for all workspace packages.

### 2. Cloud & Storage Setup Utilities
- **`tools/check-region.js`**: Validates Supabase / S3 storage region endpoints.
- **`tools/create-bucket.js`**: Provisions private storage buckets with access controls.
- **`tools/setup-storage-rls.js`**: Applies initial storage row-level security policies.
- **`tools/test-all-regions.js`**: Latency and compatibility matrix runner across cloud storage regions.

### 3. Vercel & Deployment Tools
- **`tools/add-env.js`**: Synchronizes local `.env` keys with Vercel deployment variables.
- **`tools/fix-vercel-env.js`**: Normalizes production environment variables on Vercel.
- **`tools/deploy.ps1`**: PowerShell deployment sequence helper.

### 4. 3D Model Ingestion & Verification Tools
- **`tools/generate-30-models.js`**: Generates synthetic 3D catalog models for tests.
- **`tools/download-and-seed-30-real-models.js`**: Downloads and validates permissive GLB fixtures.
- **`tools/update-dataset-and-seed.js`**: Populates test databases with synthetic catalog records.
- **`tools/verify-hashes.js`**: SHA-256 integrity verifier for uploaded 3D assets.
- **`tools/verify-vault-production.js`**: Integration verification for Vault asset upload and retrieval.
- **`tools/verify-vault-security-isolation.js`**: Multi-tenant asset isolation verification runner.
