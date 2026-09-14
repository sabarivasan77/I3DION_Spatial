import { pool } from '../../db/pool.js';

export const versionService = {
  publishVersion: async (projectId, organizationId, userId, changeSummary) => {
    const projRes = await pool.query(
      `SELECT * FROM studio_projects WHERE id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );

    if (projRes.rows.length === 0) throw new Error('Project not found');

    const proj = projRes.rows[0];
    const newPubVersion = (proj.last_published_version || 0) + 1;

    // Freeze snapshot
    await pool.query(
      `INSERT INTO studio_project_versions (project_id, organization_id, version_number, author_id, change_summary, project_document)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId, organizationId, newPubVersion, userId, changeSummary || `Version ${newPubVersion} Publication`, JSON.stringify(proj.project_document)]
    );

    // Update project state
    const result = await pool.query(
      `UPDATE studio_projects SET status = 'Published', last_published_version = $1, published_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [newPubVersion, projectId, organizationId]
    );

    return result.rows[0];
  },

  getVersions: async (projectId, organizationId) => {
    const result = await pool.query(
      `SELECT v.*, u.name as author_name, u.email as author_email
       FROM studio_project_versions v
       LEFT JOIN users u ON v.author_id = u.id
       WHERE v.project_id = $1 AND v.organization_id = $2
       ORDER BY v.version_number DESC`,
      [projectId, organizationId]
    );

    return result.rows;
  },

  restoreVersion: async (projectId, organizationId, versionNumber) => {
    const verRes = await pool.query(
      `SELECT * FROM studio_project_versions WHERE project_id = $1 AND organization_id = $2 AND version_number = $3`,
      [projectId, organizationId, versionNumber]
    );

    if (verRes.rows.length === 0) throw new Error('Version snapshot not found');

    const snapshot = verRes.rows[0];

    const result = await pool.query(
      `UPDATE studio_projects SET project_document = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [JSON.stringify(snapshot.project_document), projectId, organizationId]
    );

    return result.rows[0];
  }
};
