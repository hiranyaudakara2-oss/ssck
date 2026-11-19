import {
  ADMIN_EMAIL,
  ADMIN_SESSION_TTL_MS,
  buildCookieHeader,
  jsonResponse,
  parseJsonBody,
  safeStringEqual,
  signSessionToken,
  verifyAdminPassword,
} from './_admin-auth.mjs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  let body;
  try {
    body = parseJsonBody(event);
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON request body.' });
  }

  const normalizedEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawPassword = typeof body?.password === 'string' ? body.password : '';

  const emailMatches = safeStringEqual(normalizedEmail, ADMIN_EMAIL);
  const passwordMatches = rawPassword.length > 0 && verifyAdminPassword(rawPassword);

  if (!emailMatches || !passwordMatches) {
    return jsonResponse(401, {
      error: 'Invalid administrator username/email or password.',
    });
  }

  const now = Date.now();
  const payload = {
    email: ADMIN_EMAIL,
    role: 'admin',
    iat: now,
    exp: now + ADMIN_SESSION_TTL_MS,
  };
  const token = signSessionToken(payload);

  return jsonResponse(
    200,
    {
      authenticated: true,
      email: payload.email,
      expiresAt: payload.exp,
      token,
    },
    {
      'Set-Cookie': buildCookieHeader(event, token, Math.floor(ADMIN_SESSION_TTL_MS / 1000)),
    }
  );
}
