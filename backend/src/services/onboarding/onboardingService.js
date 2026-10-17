import { pool } from '../../db/pool.js';

export class OnboardingService {
  /**
   * Evaluate tenant milestone completion across the 5 canonical products
   */
  async getOnboardingStatus(organizationId) {
    // 1. Spatial Vault: Has uploaded at least 1 CAD or 3D asset
    const vaultRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM vault_assets 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    const vaultCompleted = (vaultRes.rows[0]?.count || 0) > 0;

    // 2. Omni Studio: Has composed at least 1 catalog or project
    const studioRes = await pool.query(
      `SELECT (
         (SELECT COUNT(*)::int FROM catalogs WHERE organization_id = $1)
         + (SELECT COUNT(*)::int FROM studio_projects WHERE organization_id = $1 AND status != 'Archived')
       ) as count`,
      [organizationId]
    );
    const studioCompleted = (studioRes.rows[0]?.count || 0) > 0;

    // 3. Spatial Engine: Has configured at least 1 3D experience
    const engineRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM spatial_experiences 
       WHERE organization_id = $1`,
      [organizationId]
    );
    const engineCompleted = (engineRes.rows[0]?.count || 0) > 0;

    // 4. Spatial Hub: Has published an experience or catalog to public showcase
    const hubRes = await pool.query(
      `SELECT (
         (SELECT COUNT(*)::int FROM spatial_experiences WHERE organization_id = $1 AND status = 'published')
         + (SELECT COUNT(*)::int FROM catalogs WHERE organization_id = $1 AND status = 'Published')
       ) as count`,
      [organizationId]
    );
    const hubCompleted = (hubRes.rows[0]?.count || 0) > 0;

    // 5. Spatial Lens: Has observed real visitor telemetry or captured a lead
    const lensRes = await pool.query(
      `SELECT (
         (SELECT COUNT(*)::int FROM analytics_events WHERE organization_id = $1)
         + (SELECT COUNT(*)::int FROM leads WHERE organization_id = $1)
       ) as count`,
      [organizationId]
    );
    const lensCompleted = (lensRes.rows[0]?.count || 0) > 0;

    // Check organization dismissal preferences
    const prefRes = await pool.query(
      `SELECT onboarding_enabled, feature_flags FROM company_preferences WHERE organization_id = $1`,
      [organizationId]
    );
    const pref = prefRes.rows[0];
    const isDismissed = pref ? (pref.onboarding_enabled === false || pref.feature_flags?.onboarding_dismissed === true) : false;

    const steps = [
      {
        id: 'vault_upload',
        title: 'Upload 3D CAD Asset to Spatial Vault',
        description: 'Upload industrial CAD models (GLB, OBJ, STEP, USDZ) with automatic polygon inspection and geometry parsing.',
        product: 'Spatial Vault',
        isCompleted: vaultCompleted,
        href: '/vault'
      },
      {
        id: 'studio_catalog',
        title: 'Compose a Branded Catalog in Omni Studio',
        description: 'Create an interactive digital catalog referencing your Vault assets with pinned versions.',
        product: 'Omni Studio',
        isCompleted: studioCompleted,
        href: '/studio'
      },
      {
        id: 'engine_experience',
        title: 'Configure 3D Digital Twin in Spatial Engine',
        description: 'Set up camera orbits, lighting environments, metric hotspots, and blueprint exploded views.',
        product: 'Spatial Engine',
        isCompleted: engineCompleted,
        href: '/engine'
      },
      {
        id: 'hub_publish',
        title: 'Publish to Spatial Hub & Generate QR',
        description: 'Generate an immutable public showcase snapshot and download a high-resolution QR landing code.',
        product: 'Spatial Hub',
        isCompleted: hubCompleted,
        href: '/hub'
      },
      {
        id: 'lens_telemetry',
        title: 'Observe Real-Time Telemetry in Spatial Lens',
        description: 'Monitor visitor dwell times, 3D interactions, AR session conversions, and qualified customer leads.',
        product: 'Spatial Lens',
        isCompleted: lensCompleted,
        href: '/lens'
      }
    ];

    const completedCount = steps.filter(s => s.isCompleted).length;
    const totalCount = steps.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);

    return {
      completedCount,
      totalCount,
      progressPercentage,
      isDismissed,
      isAllCompleted: completedCount === totalCount,
      steps
    };
  }

  /**
   * Persist onboarding dismissal in company preferences
   */
  async dismissOnboarding(organizationId) {
    const res = await pool.query(
      `INSERT INTO company_preferences (organization_id, onboarding_enabled, feature_flags, updated_at)
       VALUES ($1, false, '{"onboarding_dismissed": true}'::jsonb, now())
       ON CONFLICT (organization_id) DO UPDATE SET
         onboarding_enabled = false,
         feature_flags = jsonb_set(COALESCE(company_preferences.feature_flags, '{}'::jsonb), '{onboarding_dismissed}', 'true'::jsonb),
         updated_at = now()
       RETURNING *`,
      [organizationId]
    );
    return res.rows[0];
  }

  /**
   * Reset onboarding status (for testing or restarting first-run journey)
   */
  async resetOnboarding(organizationId) {
    const res = await pool.query(
      `UPDATE company_preferences
       SET onboarding_enabled = true,
           feature_flags = jsonb_set(COALESCE(feature_flags, '{}'::jsonb), '{onboarding_dismissed}', 'false'::jsonb),
           updated_at = now()
       WHERE organization_id = $1
       RETURNING *`,
      [organizationId]
    );
    return res.rows[0];
  }
}

export const onboardingService = new OnboardingService();
