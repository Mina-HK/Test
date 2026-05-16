import dotenv from 'dotenv';

dotenv.config();

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'API_KEYS', 'ENCRYPTION_KEY_BASE64'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY_BASE64, 'base64');
if (encryptionKey.length !== 32) {
  throw new Error('ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes.');
}

export const config = {
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  },
  apiKeys: new Set(process.env.API_KEYS.split(',').map((value) => value.trim()).filter(Boolean)),
  adminApiKeys: new Set((process.env.ADMIN_API_KEYS || '').split(',').map((value) => value.trim()).filter(Boolean)),
  encryptionKey,
  fulfillmentMode: process.env.FULFILLMENT_MODE || 'manual'
};
