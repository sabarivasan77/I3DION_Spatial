/**
 * Omni Engine Presenter Mode Service (Phase P9 Innovation Item 11)
 * Rep-driven synchronized 3D presentation across customer tablets & displays.
 */

import { pool } from '../../db/pool.js';

export const presenterService = {
  /**
   * Start a new presenter session
   */
  async createSession(organizationId, hostUserId, { experienceId = null } = {}) {
    // Generate clean 6-character alphanumeric session code (e.g. PR-9482)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const sessionCode = `PR-${randomDigits}`;

    const res = await pool.query(
      `INSERT INTO presenter_sessions (
         organization_id, host_user_id, experience_id, session_code,
         active_slide, camera_orbit, active_variant, active_hotspot, exploded_factor, is_active
       ) VALUES ($1, $2, $3, $4, 0, '[0, 0, 5]'::jsonb, null, null, 0, true)
       RETURNING *`,
      [organizationId, hostUserId, experienceId, sessionCode]
    );

    return res.rows[0];
  },

  /**
   * Fetch active session by code (Public / Client join)
   */
  async getSessionByCode(sessionCode) {
    const res = await pool.query(
      `SELECT ps.*, 
              e.name as experience_name,
              e.slug as experience_slug,
              va.public_url as model_url
       FROM presenter_sessions ps
       LEFT JOIN spatial_experiences e ON ps.experience_id = e.id
       LEFT JOIN vault_assets va ON e.vault_asset_id = va.id
       WHERE ps.session_code = $1 AND ps.is_active = true`,
      [sessionCode]
    );

    if (res.rows.length === 0) return null;
    return res.rows[0];
  },

  /**
   * Host updates presentation state (slide, 3D orbit, variant, hotspot, exploded view)
   */
  async updateState(organizationId, hostUserId, sessionCode, updates = {}) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.activeSlide !== undefined) {
      fields.push(`active_slide = $${idx++}`);
      values.push(updates.activeSlide);
    }

    if (updates.cameraOrbit !== undefined) {
      fields.push(`camera_orbit = $${idx++}`);
      values.push(JSON.stringify(updates.cameraOrbit));
    }

    if (updates.activeVariant !== undefined) {
      fields.push(`active_variant = $${idx++}`);
      values.push(updates.activeVariant);
    }

    if (updates.activeHotspot !== undefined) {
      fields.push(`active_hotspot = $${idx++}`);
      values.push(updates.activeHotspot);
    }

    if (updates.explodedFactor !== undefined) {
      fields.push(`exploded_factor = $${idx++}`);
      values.push(updates.explodedFactor);
    }

    if (fields.length === 0) {
      return await this.getSessionByCode(sessionCode);
    }

    fields.push(`updated_at = NOW()`);
    values.push(sessionCode, organizationId, hostUserId);

    const sql = `
      UPDATE presenter_sessions
      SET ${fields.join(', ')}
      WHERE session_code = $${idx++} AND organization_id = $${idx++} AND host_user_id = $${idx++} AND is_active = true
      RETURNING *
    `;

    const res = await pool.query(sql, values);
    if (res.rows.length === 0) {
      throw new Error('Presenter session not found or unauthorized');
    }

    return res.rows[0];
  },

  /**
   * End presenter session
   */
  async endSession(organizationId, hostUserId, sessionCode) {
    const res = await pool.query(
      `UPDATE presenter_sessions
       SET is_active = false, updated_at = NOW()
       WHERE session_code = $1 AND organization_id = $2 AND host_user_id = $3
       RETURNING id, session_code, is_active`,
      [sessionCode, organizationId, hostUserId]
    );

    if (res.rows.length === 0) {
      throw new Error('Presenter session not found or unauthorized');
    }

    return res.rows[0];
  }
};
