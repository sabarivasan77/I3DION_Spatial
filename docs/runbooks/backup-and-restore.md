# Operational Runbook: Database Backup & Disaster Recovery

**Service:** I3DION Spatial Platform — PostgreSQL Multi-Tenant Database  
**Author:** Principal Program Manager & Chief Architect  
**Classification:** Standard Operating Procedure (SOP)  
**Last Verified:** October 18, 2026 (Automated Restore Drill Passed)  

---

## 1. Overview & Objectives

This runbook defines the procedures for scheduled backups, on-demand pre-deployment snapshots, and verified point-in-time disaster recovery across all 5 canonical products:
- **Spatial Vault** (`vault_assets`, `vault_asset_versions`, `vault_collections`)
- **Omni Studio** (`catalogs`, `catalog_products`, `studio_projects`)
- **Spatial Engine** (`spatial_experiences`)
- **Spatial Hub** (`saved_items`, `liked_items`, `hub_subscriptions`)
- **Spatial Lens** (`analytics_events`, `leads`)
- **Core & Billing** (`organizations`, `users`, `plans`, `subscriptions`, `invoices`, `payments`, `usage_counters`)

---

## 2. Automated Scheduled Backups

Backups are executed via cross-platform Node.js automation located at:
`backend/scripts/backup-database.js`

### 2.1 Cron Schedule
- **Daily Full Snapshot:** Every night at 02:00 UTC (`0 2 * * *`).
- **Retention:**
  - Daily snapshots retained for 30 days in hot storage (`database/backups/`).
  - Weekly archives compressed and moved to cold object storage (`s3://i3dion-backups/cold/`) retained for 1 year.

### 2.2 Triggering an On-Demand Backup
Run the backup script directly from the backend directory:
```bash
cd backend
node scripts/backup-database.js
```

**Expected Output:**
```
[Backup] Initiating I3DION database backup...
[Backup] Target file: database/backups/backup_YYYY-MM-DDTHH-mm-ss-sssZ.sql
[Backup] Backup completed successfully.
[Backup] Rows backed up: 350+ across 66 tables.
[Backup] SQL Dump Size: 247 KB
```

---

## 3. Disaster Recovery & Restoration Procedures

### 3.1 Verification Drill (Non-Destructive Dry Run)
Before restoring onto production or after making schema changes, run a verification drill. The drill replays the entire SQL dump inside an isolated PostgreSQL transaction, asserts record counts and constraints, and rolls back cleanly without mutating live data:

```bash
cd backend
node scripts/restore-database.js --drill
```

**Expected Output:**
```
[Restore] Target backup file: database/backups/backup_YYYY-MM-DDTHH-mm-ss-sssZ.sql
[Restore] Execution mode: DRILL (Verified test restore inside transaction)
[Restore Drill] Verified restored organization count: 19
[Restore Drill] Verification passed successfully. Transaction rolled back cleanly without mutating production data.
```

### 3.2 Full Production Restore (Incident Recovery)
In the event of catastrophic data corruption or infrastructure failure:

1. Stop web application services to prevent conflicting writes:
   ```bash
   # In staging/production orchestrator
   docker compose stop api
   ```
2. Identify the target backup snapshot in `database/backups/` or fetch from cold storage.
3. Run the live restore:
   ```bash
   cd backend
   node scripts/restore-database.js database/backups/backup_TARGET.sql
   ```
4. Run database verification and tenant health checks:
   ```bash
   node test-tenant-auth.js
   node --experimental-strip-types test-commercial-readiness.js
   ```
5. Resume application services:
   ```bash
   docker compose start api
   ```

---

## 4. Verification Checksums & Metadata

Every backup generates a sidecar metadata file:
`database/backups/backup_<timestamp>.meta.json`

Example:
```json
{
  "timestamp": "2026-10-18T00:15:39.543Z",
  "filename": "backup_2026-10-17T18-45-39-543Z.sql",
  "totalTables": 66,
  "totalRows": 351,
  "tableStats": {
    "organizations": 19,
    "users": 23,
    "plans": 4,
    "subscriptions": 19,
    "vault_assets": 32,
    "spatial_experiences": 5,
    "catalogs": 8,
    "analytics_events": 24,
    "leads": 6
  }
}
```

---

## 5. Failure Escalation Matrix

| Severity | Condition | Action | SLA |
|---|---|---|---|
| **P1** | Restore drill fails syntax/constraint check | Halt deployment; inspect schema diffs and column typing | 1 hour |
| **P2** | Scheduled backup fails to write to disk | Check disk quotas; verify database pool connections | 4 hours |
| **P3** | Cold storage sync delay | Retry S3 transfer; alert DevOps channel | 24 hours |
