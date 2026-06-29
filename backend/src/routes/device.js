import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { query } from '../db/pool.js';

export const deviceRouter = Router();

/**
 * Register or update a mobile device for push notifications
 */
deviceRouter.post('/register', requireAuth, asyncHandler(async (req, res) => {
  const { device_id, fcm_token, platform, os_version, app_version } = req.body;
  const userId = req.user.id;

  if (!device_id || !platform) {
    return res.status(400).json({ message: 'device_id and platform are required' });
  }

  // Upsert device info
  const { rows } = await query(
    `INSERT INTO user_devices (user_id, device_id, fcm_token, platform, os_version, app_version, last_active_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id, device_id)
     DO UPDATE SET 
       fcm_token = EXCLUDED.fcm_token,
       os_version = EXCLUDED.os_version,
       app_version = EXCLUDED.app_version,
       last_active_at = now()
     RETURNING *`,
    [userId, device_id, fcm_token, platform, os_version, app_version]
  );

  res.json({ message: 'Device registered', device: rows[0] });
}));

/**
 * Sync offline queue (Batched operations)
 * e.g., Uploading analytics events that occurred while the mobile app was offline
 */
deviceRouter.post('/sync', requireAuth, asyncHandler(async (req, res) => {
  const { device_id, operations } = req.body;
  const userId = req.user.id;

  if (!device_id || !Array.isArray(operations)) {
    return res.status(400).json({ message: 'device_id and operations array are required' });
  }

  const results = [];

  // In a real production system, this would use a transaction and process operations sequentially based on type
  for (const op of operations) {
    const { entity_type, operation, payload } = op;
    try {
      const { rows } = await query(
        `INSERT INTO offline_sync_queue (user_id, device_id, entity_type, operation, payload, status)
         VALUES ($1, $2, $3, $4, $5, 'Processed') RETURNING id`,
        [userId, device_id, entity_type, operation, payload]
      );
      
      // Process specific sync actions (mock implementation)
      if (entity_type === 'analytics' && operation === 'create') {
        // e.g. await query('INSERT INTO analytics_events ...')
      }

      results.push({ id: op.id || rows[0].id, status: 'Success' });
    } catch (err) {
      results.push({ id: op.id, status: 'Failed', error: err.message });
    }
  }

  res.json({ message: 'Sync complete', results });
}));
