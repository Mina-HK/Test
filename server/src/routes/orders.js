import express from 'express';
import { pool } from '../db/pool.js';
import { requireAdminApiKey } from '../middleware/auth.js';

export const ordersRouter = express.Router();
ordersRouter.use(requireAdminApiKey);

ordersRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT o.id, o.card_id, o.customer_ref_masked, o.recharge_status, o.valid_until,
           o.warranty_until, o.request_ip, o.notes, o.created_at, c.status AS card_status
    FROM orders o JOIN cards c ON c.id = o.card_id
    ORDER BY o.id DESC LIMIT 500
  `);
  res.json(rows);
});

ordersRouter.patch('/:id/status', async (req, res) => {
  const allowed = new Set(['created', 'manual_review', 'queued', 'processing', 'succeeded', 'failed']);
  if (!allowed.has(req.body.rechargeStatus)) return res.status(400).json({ error: 'Invalid recharge status.' });
  await pool.execute('UPDATE orders SET recharge_status = ?, notes = COALESCE(?, notes) WHERE id = ?', [
    req.body.rechargeStatus,
    req.body.notes || null,
    req.params.id
  ]);
  res.json({ ok: true });
});
