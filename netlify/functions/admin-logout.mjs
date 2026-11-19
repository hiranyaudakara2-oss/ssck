import { buildCookieHeader, jsonResponse } from './_admin-auth.mjs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  return jsonResponse(
    200,
    { authenticated: false },
    {
      'Set-Cookie': buildCookieHeader(event, '', 0),
    }
  );
}
