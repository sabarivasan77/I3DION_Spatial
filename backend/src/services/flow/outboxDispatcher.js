import { withTenant, query } from '../../db/pool.js';
import crypto from 'node:crypto';
import { URL } from 'node:url';

/**
 * SSRF Security Guard: Rejects loopback, private RFC1918, link-local, and cloud metadata addresses.
 */
export function isSafeDestinationUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;

  try {
    const parsed = new URL(urlStr);

    // Only allow http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    const cleanHost = host.replace(/^\[|\]$/g, '');

    // Block loopback and local hostnames
    if (
      cleanHost === 'localhost' ||
      cleanHost === '127.0.0.1' ||
      cleanHost === '::1' ||
      cleanHost === '0.0.0.0' ||
      cleanHost === '::' ||
      cleanHost.endsWith('.local') ||
      cleanHost.endsWith('.internal')
    ) {
      return false;
    }

    // Block IPv4 Private & Link-Local Ranges
    // 10.0.0.0/8
    if (/^10\./.test(host)) return false;
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return false;
    // 192.168.0.0/16
    if (/^192\.168\./.test(host)) return false;
    // 169.254.0.0/16 (AWS / GCP metadata service)
    if (/^169\.254\./.test(host)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Computes HMAC-SHA256 signature for outgoing webhook payload
 */
export function signWebhookPayload(payload, secret = 'i3dion_outbox_webhook_secret') {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Processes a batch of pending events from flow_event_outbox
 */
export async function processPendingOutboxEvents({
  organizationId = null,
  limit = 20,
} = {}) {
  const whereClauses = ["status = 'pending'", 'attempts < 3'];
  const params = [];

  if (organizationId) {
    params.push(organizationId);
    whereClauses.push(`organization_id = $${params.length}`);
  }

  params.push(limit);
  const limitIdx = params.length;

  const selectQuery = `
    SELECT id, organization_id, event_type, payload, destination_url, attempts
    FROM flow_event_outbox
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY created_at ASC
    LIMIT $${limitIdx}
  `;

  const pendingEventsRes = await query(selectQuery, params);
  const events = pendingEventsRes.rows;

  let deliveredCount = 0;
  let failedCount = 0;

  for (const item of events) {
    const destUrl = item.destination_url;

    // If no external destination, mark delivered immediately
    if (!destUrl) {
      await query(
        `UPDATE flow_event_outbox
         SET status = 'delivered', processed_at = now()
         WHERE id = $1`,
        [item.id]
      );
      deliveredCount++;
      continue;
    }

    // SSRF Security Check
    if (!isSafeDestinationUrl(destUrl)) {
      await query(
        `UPDATE flow_event_outbox
         SET status = 'rejected',
             last_error = 'SSRF Guard: Private or loopback destination address forbidden',
             processed_at = now()
         WHERE id = $1`,
        [item.id]
      );
      failedCount++;
      continue;
    }

    // Dispatch external HTTP request with timeout
    try {
      const payloadString = JSON.stringify(item.payload);
      const signature = signWebhookPayload(payloadString);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(destUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'I3DION-Flow-Outbox/1.0',
          'X-I3DION-Event': item.event_type,
          'X-I3DION-Signature': signature,
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        await query(
          `UPDATE flow_event_outbox
           SET status = 'delivered',
               response_status = $1,
               processed_at = now()
           WHERE id = $2`,
          [res.status, item.id]
        );
        deliveredCount++;
      } else {
        const nextAttempts = item.attempts + 1;
        const newStatus = nextAttempts >= 3 ? 'dead_letter' : 'pending';
        await query(
          `UPDATE flow_event_outbox
           SET attempts = $1,
               status = $2,
               response_status = $3,
               last_error = $4
           WHERE id = $5`,
          [nextAttempts, newStatus, res.status, `HTTP error: ${res.statusText}`, item.id]
        );
        failedCount++;
      }
    } catch (dispatchErr) {
      const nextAttempts = item.attempts + 1;
      const newStatus = nextAttempts >= 3 ? 'dead_letter' : 'pending';
      await query(
        `UPDATE flow_event_outbox
         SET attempts = $1,
             status = $2,
             last_error = $3
         WHERE id = $4`,
        [nextAttempts, newStatus, dispatchErr.message, item.id]
      );
      failedCount++;
    }
  }

  return {
    processedCount: events.length,
    deliveredCount,
    failedCount,
  };
}
