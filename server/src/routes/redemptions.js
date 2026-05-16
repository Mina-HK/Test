import express from 'express';
import { pool } from '../db/pool.js';
import { requireApiKey } from '../middleware/auth.js';
import { perMinuteLimit } from '../middleware/rateLimit.js';
import { hashCardCode, maskSensitiveValue, normalizeCardCode } from '../services/crypto.js';
import { fulfillOrder } from '../services/fulfillment.js';

export const redemptionsRouter = express.Router();

redemptionsRouter.post('/', perMinuteLimit(5), requireApiKey, async (req, res) => {
  if (req.body.openaiSession || req.body.sessionToken || req.body['__Secure-next-auth.session-token']) {
    return res.status(400).json({
      error: 'Do not submit third-party session cookies or account tokens. Submit a non-sensitive customer reference instead.'
    });
  }

  const cardCode = normalizeCardCode(req.body.cardCode);
  const customerRef = String(req.body.customerRef || '').trim();
  if (cardCode.length !== 16 || !customerRef) {
    return res.status(400).json({ error: 'cardCode must be 16 characters and customerRef is required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [cards] = await connection.execute('SELECT * FROM cards WHERE code_hash = ? FOR UPDATE', [hashCardCode(cardCode)]);
    const card = cards[0];
    if (!card) throw Object.assign(new Error('Card not found.'), { status: 404 });
    if (card.status !== 'unused') throw Object.assign(new Error(`Card is ${card.status}.`), { status: 409 });
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      await connection.execute('UPDATE cards SET status = ? WHERE id = ?', ['expired', card.id]);
      throw Object.assign(new Error('Card is expired.'), { status: 409 });
    }

    const warrantyUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const [result] = await connection.execute(
      'INSERT INTO orders (card_id, customer_ref_masked, recharge_status, valid_until, warranty_until, request_ip) VALUES (?, ?, ?, ?, ?, ?)',
      [card.id, maskSensitiveValue(customerRef), 'created', validUntil, warrantyUntil, req.ip]
    );
    await connection.execute('UPDATE cards SET status = ?, used_at = NOW() WHERE id = ?', ['used', card.id]);
    await connection.commit();

    const fulfillment = await fulfillOrder(result.insertId);
    res.status(201).json({ orderId: result.insertId, rechargeStatus: fulfillment.status, validUntil, warrantyUntil });
  } catch (error) {
    await connection.rollback();
    res.status(error.status || 500).json({ error: error.message || 'Redemption failed.' });
  } finally {
    connection.release();
  }
});
