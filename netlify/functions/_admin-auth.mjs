import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sscktechsociety@gmail.com')
  .trim()
  .toLowerCase();

export const ADMIN_PASSWORD_SALT =
  process.env.ADMIN_PASSWORD_SALT?.trim() || '15c825ed736867cea25468370da3c9af';

export const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH?.trim() ||
  'ce37a93cf3466fe0ad3e97cee13facecbd5ad3abb166c4f6b1b1cd57b54f751311036495bd6cb67dc60d7419122c3718cfd19ec978d773eded7e0183d815a1c8';

const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET?.trim() ||
  createHmac('sha256', ADMIN_PASSWORD_SALT)
    .update(`${ADMIN_EMAIL}:${ADMIN_PASSWORD_HASH}:techsphere-session`)
    .digest('hex');

export const ADMIN_SESSION_COOKIE = 'techsphere_admin_session';
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function safeStringEqual(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(password) {
  try {
    const derived = scryptSync(password, ADMIN_PASSWORD_SALT, 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(ADMIN_PASSWORD_HASH, 'hex');
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function signSessionToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return null;

    const expectedSig = createHmac('sha256', ADMIN_SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (!safeStringEqual(signature, expectedSig)) return null;

    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (
      !decoded ||
      decoded.role !== 'admin' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.exp !== 'number' ||
      decoded.exp <= Date.now()
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

export function extractSessionFromEvent(event) {
  const headers = event.headers || {};
  const authHeader = headers.authorization || headers.Authorization || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const verified = verifySessionToken(authHeader.slice(7).trim());
    if (verified) return verified;
  }

  const cookieHeader = headers.cookie || headers.Cookie || '';
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE];
  if (cookieToken) {
    return verifySessionToken(cookieToken);
  }
  return null;
}

export function buildCookieHeader(event, value, maxAgeSeconds) {
  const headers = event.headers || {};
  const proto = String(headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || '').toLowerCase();
  const isHttps = proto === 'https' || process.env.CONTEXT === 'production';
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSeconds}`,
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function parseJsonBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  return JSON.parse(raw);
}

export function jsonResponse(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  };
}
