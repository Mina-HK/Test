import express from 'express';
import { pool } from '../db/pool.js';
import { decryptText, encryptText, generateCardCode, hashCardCode } from '../services/crypto.js';
import { requireAdminApiKey } from '../middleware/auth.js';

export const cardsRouter = express.Router();

cardsRouter.use(requireAdminApiKey);

cardsRouter.post('/generate', async (req, res) => {
  const count = Math.min(Math.max(Number(req.body.count || 1), 1), 1000);
  const expiresAt = req.body.expiresAt || null;
  const created = [];

  for (let i = 0; i < count; i += 1) {
    let code;
    let inserted = false;
    while (!inserted) {
      code = generateCardCode();
      try {
        await pool.execute(
          'INSERT INTO cards (code_hash, code_encrypted, status, expires_at) VALUES (?, ?, ?, ?)',
          [hashCardCode(code), encryptText(code), 'unused', expiresAt]
        );
        inserted = true;
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
      }
    }
    created.push(code);
  }

  res.status(201).json({ count: created.length, codes: created });
});

cardsRouter.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT id, code_encrypted, status, expires_at, used_at, created_at FROM cards ORDER BY id DESC LIMIT 500');
  res.json(rows.map((row) => ({ ...row, code: decryptText(row.code_encrypted), code_encrypted: undefined })));
});

cardsRouter.get('/export', async (req, res) => {
  const [rows] = await pool.query('SELECT code_encrypted, status, expires_at, created_at FROM cards ORDER BY id DESC');
  const lines = ['code,status,expires_at,created_at'];
  for (const row of rows) {
    lines.push([decryptText(row.code_encrypted), row.status, row.expires_at || '', row.created_at].join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cards.csv"');
  res.send(lines.join('\n'));
});

cardsRouter.patch('/:id/status', async (req, res) => {
  const allowed = new Set(['unused', 'used', 'expired']);
  if (!allowed.has(req.body.status)) return res.status(400).json({ error: 'Invalid card status.' });
  await pool.execute('UPDATE cards SET status = ?, used_at = IF(? = "used", COALESCE(used_at, NOW()), used_at) WHERE id = ?', [
    req.body.status,
    req.body.status,
    req.params.id
  ]);
  res.json({ ok: true });
});
