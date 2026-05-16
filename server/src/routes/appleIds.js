import express from 'express';
import { pool } from '../db/pool.js';
import { requireAdminApiKey } from '../middleware/auth.js';

export const appleIdsRouter = express.Router();
appleIdsRouter.use(requireAdminApiKey);

appleIdsRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, label, region, status, balance_cents, currency, last_checked_at, notes FROM apple_accounts ORDER BY id DESC');
  res.json(rows);
});

appleIdsRouter.post('/', async (req, res) => {
  const { label, region = 'TR', status = 'available', balanceCents = 0, currency = 'TRY', notes = '' } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required.' });
  const [result] = await pool.execute(
    'INSERT INTO apple_accounts (label, region, status, balance_cents, currency, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [label, region, status, balanceCents, currency, notes]
  );
  res.status(201).json({ id: result.insertId });
});
