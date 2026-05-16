import { pool } from '../db/pool.js';
import { config } from '../config.js';

export async function fulfillOrder(orderId) {
  await pool.execute('UPDATE orders SET recharge_status = ?, notes = ? WHERE id = ?', [
    config.fulfillmentMode === 'manual' ? 'manual_review' : 'queued',
    'Safe implementation: no third-party account session tokens or unofficial subscription automation are accepted. Fulfill this order through an approved billing/provider workflow.',
    orderId
  ]);
  return { status: config.fulfillmentMode === 'manual' ? 'manual_review' : 'queued' };
}
