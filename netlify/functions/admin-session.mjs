import { extractSessionFromEvent, jsonResponse } from './_admin-auth.mjs';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed. Use GET.' });
  }

  const session = extractSessionFromEvent(event);
  if (!session) {
    return jsonResponse(200, { authenticated: false, email: null });
  }

  return jsonResponse(200, {
    authenticated: true,
    email: session.email,
    expiresAt: session.exp,
  });
}
