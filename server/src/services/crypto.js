import crypto from 'crypto';
import { config } from '../config.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCardCode(length = 16) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

export function hashCardCode(code) {
  return crypto.createHmac('sha256', config.encryptionKey).update(normalizeCardCode(code)).digest('hex');
}

export function encryptText(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decryptText(payload) {
  const [ivBase64, tagBase64, ciphertextBase64] = payload.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', config.encryptionKey, Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextBase64, 'base64')), decipher.final()]).toString('utf8');
}

export function normalizeCardCode(code) {
  return String(code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function maskSensitiveValue(value) {
  const text = String(value || '');
  if (text.length <= 10) return `${text.slice(0, 2)}****${text.slice(-2)}`;
  return `${text.slice(0, 6)}****${text.slice(-4)}`;
}
