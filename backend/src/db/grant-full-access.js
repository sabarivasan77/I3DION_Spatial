import { query } from './pool.js';

async function grantFullAccess() {
  const targetEmail = 'sabarivasan963sv@gmail.com';
  console.log(`Granting Full Access & Verified Status to: ${targetEmail}`);

  // 1. Find or verify user
  const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [targetEmail]);
  if (userRes.rows.length === 0) {
    console.log(`User ${targetEmail} not found in database yet. Updating all existing users to Super Admin / Verified as fallback.`);
    await query(`
      UPDATE users 
      SET role = 'Super Admin', email_verified = true, updated_at = now()
    `);
    const orgs = await query('SELECT id FROM organizations');
    for (const org of orgs.rows) {
      await query(`
        INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status, current_period_start, current_period_end)
        VALUES ($1, 'ENTERPRISE', 'yearly', 'active', now(), now() + interval '100 years')
        ON CONFLICT (organization_id) DO UPDATE SET
          plan_id = 'ENTERPRISE',
          status = 'active',
          current_period_end = now() + interval '100 years',
          updated_at = now()
      `, [org.id]);
    }
    console.log('✅ Fallback permissions updated for all existing accounts.');
    return;
  }

  const user = userRes.rows[0];
  console.log(`Found user ID: ${user.id}, Organization ID: ${user.organization_id}`);

  // 2. Elevate user role to Super Admin & set email_verified = true
  await query(`
    UPDATE users
    SET role = 'Super Admin',
        email_verified = true,
        updated_at = now()
    WHERE id = $1
  `, [user.id]);

  console.log('✅ User role elevated to Super Admin and email marked as verified.');

  // 3. Elevate user organization to Enterprise Plan with unlimited access
  if (user.organization_id) {
    await query(`
      INSERT INTO subscriptions (
        organization_id, plan_id, billing_cycle, status, 
        custom_max_products, custom_max_catalogs, custom_max_3d_models, custom_max_team_members,
        current_period_start, current_period_end
      )
      VALUES (
        $1, 'ENTERPRISE', 'yearly', 'active',
        999999, 999999, 999999, 999999,
        now(), now() + interval '100 years'
      )
      ON CONFLICT (organization_id) DO UPDATE SET
        plan_id = 'ENTERPRISE',
        status = 'active',
        custom_max_products = 999999,
        custom_max_catalogs = 999999,
        custom_max_3d_models = 999999,
        custom_max_team_members = 999999,
        current_period_end = now() + interval '100 years',
        updated_at = now()
    `, [user.organization_id]);

    console.log(`✅ Organization ${user.organization_id} upgraded to active Enterprise plan with custom high limits.`);
  }

  // 4. Update organization_members if exists
  await query(`
    UPDATE organization_members
    SET role = 'Super Admin'
    WHERE user_id = $1
  `, [user.id]).catch(() => null);

  console.log('✅ Full Access successfully granted!');
  process.exit(0);
}

grantFullAccess().catch((err) => {
  console.error('Error granting full access:', err);
  process.exit(1);
});
