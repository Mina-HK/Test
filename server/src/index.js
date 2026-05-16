import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { pingDatabase } from './db/pool.js';
import { appleIdsRouter } from './routes/appleIds.js';
import { cardsRouter } from './routes/cards.js';
import { ordersRouter } from './routes/orders.js';
import { redemptionsRouter } from './routes/redemptions.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/cards', cardsRouter);
app.use('/api/redeem', redemptionsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/apple-ids', appleIdsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

await pingDatabase();
app.listen(config.port, () => {
  console.log(`Voucher server listening on http://localhost:${config.port}`);
});
