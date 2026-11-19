import 'dotenv/config';
import express from 'express';
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Server-side salted scrypt credential verifier (never expose plaintext passwords in source or frontend)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sscktechsociety@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD_SALT =
  process.env.ADMIN_PASSWORD_SALT?.trim() || '15c825ed736867cea25468370da3c9af';
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH?.trim() ||
  'ce37a93cf3466fe0ad3e97cee13facecbd5ad3abb166c4f6b1b1cd57b54f751311036495bd6cb67dc60d7419122c3718cfd19ec978d773eded7e0183d815a1c8';
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET?.trim() ||
  createHmac('sha256', ADMIN_PASSWORD_SALT)
    .update(`${ADMIN_EMAIL}:${ADMIN_PASSWORD_HASH}:techsphere-session`)
    .digest('hex');

const ADMIN_SESSION_COOKIE = 'techsphere_admin_session';
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

const failedAttemptsByIp = new Map<string, { count: number; resetAt: number }>();

function safeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyAdminPassword(password: string): boolean {
  try {
    const derived = scryptSync(password, ADMIN_PASSWORD_SALT, 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(ADMIN_PASSWORD_HASH, 'hex');
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

interface AdminSessionPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

function signSessionToken(payload: AdminSessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token: string): AdminSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return null;

    const expectedSig = createHmac('sha256', ADMIN_SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (!safeStringEqual(signature, expectedSig)) return null;

    const decoded = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as AdminSessionPayload;

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

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
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

function extractSessionFromRequest(req: express.Request): AdminSessionPayload | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifySessionToken(bearerToken);
    if (verified) return verified;
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE];
  if (cookieToken) {
    return verifySessionToken(cookieToken);
  }

  return null;
}

function buildCookieHeader(req: express.Request, value: string, maxAgeSeconds: number): string {
  const isHttps =
    req.secure ||
    String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim() === 'https';

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

function getClientIp(req: express.Request): string {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

async function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '15mb' }));

  // Admin credential verification endpoint
  app.post('/api/admin/login', (req, res) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const existingLimit = failedAttemptsByIp.get(ip);

    if (existingLimit && existingLimit.resetAt > now && existingLimit.count >= MAX_FAILED_ATTEMPTS) {
      res.status(429).json({
        error: 'Too many failed login attempts. Please wait a few minutes before trying again.',
      });
      return;
    }

    const { email, password } = (req.body || {}) as {
      email?: unknown;
      password?: unknown;
    };

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';

    const emailMatches = safeStringEqual(normalizedEmail, ADMIN_EMAIL);
    const passwordMatches = rawPassword.length > 0 && verifyAdminPassword(rawPassword);

    if (!emailMatches || !passwordMatches) {
      const nextCount = existingLimit && existingLimit.resetAt > now ? existingLimit.count + 1 : 1;
      failedAttemptsByIp.set(ip, {
        count: nextCount,
        resetAt: existingLimit && existingLimit.resetAt > now ? existingLimit.resetAt : now + LOGIN_WINDOW_MS,
      });

      res.status(401).json({
        error: 'Invalid administrator username/email or password.',
      });
      return;
    }

    failedAttemptsByIp.delete(ip);

    const payload: AdminSessionPayload = {
      email: ADMIN_EMAIL,
      role: 'admin',
      iat: now,
      exp: now + ADMIN_SESSION_TTL_MS,
    };
    const token = signSessionToken(payload);

    res.setHeader(
      'Set-Cookie',
      buildCookieHeader(req, token, Math.floor(ADMIN_SESSION_TTL_MS / 1000))
    );
    res.json({
      authenticated: true,
      email: payload.email,
      expiresAt: payload.exp,
      token,
    });
  });

  app.get('/api/admin/session', (req, res) => {
    const session = extractSessionFromRequest(req);
    if (!session) {
      res.json({ authenticated: false, email: null });
      return;
    }
    res.json({
      authenticated: true,
      email: session.email,
      expiresAt: session.exp,
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    res.setHeader('Set-Cookie', buildCookieHeader(req, '', 0));
    res.json({ authenticated: false });
  });

  app.post('/api/upload-image', async (req, res) => {
    try {
      const apiKey = process.env.IMGBB_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_IMGBB_API_KEY') {
        res.status(503).json({
          error:
            'ImgBB API key is not configured on the server. Add IMGBB_API_KEY in AI Studio Secrets or paste a direct image URL.',
        });
        return;
      }

      const { imageBase64, name } = (req.body || {}) as {
        imageBase64?: string;
        name?: string;
      };

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Missing image payload.' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
      if (!cleanBase64 || cleanBase64.length > 14_000_000) {
        res.status(400).json({ error: 'Image must be a valid base64 image under 10 MB.' });
        return;
      }

      const form = new FormData();
      form.append('key', apiKey);
      form.append('image', cleanBase64);
      if (name && typeof name === 'string') {
        form.append('name', name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80));
      }

      const upstream = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        body: form,
      });

      const payload = (await upstream.json().catch(() => null)) as {
        success?: boolean;
        data?: {
          url?: string;
          display_url?: string;
          delete_url?: string;
          image?: { url?: string };
          thumb?: { url?: string };
        };
        error?: { message?: string; code?: number };
      } | null;

      const rawResolvedUrl =
        payload?.data?.display_url || payload?.data?.image?.url || payload?.data?.url || '';
      const resolvedUrl = rawResolvedUrl.replace(/^http:\/\/(i\.)?ibb\.co\//i, 'https://$1ibb.co/');

      if (!upstream.ok || !payload?.success || !resolvedUrl) {
        const rawMsg =
          payload?.error?.message || `ImgBB upload failed with HTTP ${upstream.status}.`;
        const message =
          payload?.error?.code === 103
            ? `ImgBB rejected this API key or server request (code 103: "${rawMsg}"). Please verify your ImgBB account/API key status at api.imgbb.com or generate a new key.`
            : rawMsg;
        res.status(upstream.status >= 400 ? upstream.status : 502).json({ error: message });
        return;
      }

      res.json({
        url: resolvedUrl,
        thumbUrl: payload.data?.thumb?.url || '',
        deleteUrl: payload.data?.delete_url || '',
      });
    } catch (err) {
      console.error('ImgBB proxy error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Unexpected server error while uploading image.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TechSphere server listening on http://0.0.0.0:${PORT}`);
  });
}

void createApp();
