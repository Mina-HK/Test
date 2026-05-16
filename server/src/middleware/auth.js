import { config } from '../config.js';

export function requireApiKey(req, res, next) {
  const apiKey = req.get('x-api-key');
  if (!apiKey || !config.apiKeys.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key.' });
  }
  req.apiKey = apiKey;
  return next();
}

export function requireAdminApiKey(req, res, next) {
  const apiKey = req.get('x-api-key');
  if (!apiKey || !config.adminApiKeys.has(apiKey)) {
    return res.status(403).json({ error: 'Admin API key required.' });
  }
  req.apiKey = apiKey;
  return next();
}
