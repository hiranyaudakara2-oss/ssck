import { jsonResponse, parseJsonBody } from './_admin-auth.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const apiKey = process.env.IMGBB_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_IMGBB_API_KEY') {
      return jsonResponse(503, {
        error:
          'ImgBB API key is not configured on the server. Add IMGBB_API_KEY in Netlify Environment Variables (Site Settings -> Environment variables) or paste a direct image URL.',
      });
    }

    let body;
    try {
      body = parseJsonBody(event);
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON request body.' });
    }

    const { imageBase64, name } = body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return jsonResponse(400, { error: 'Missing image payload.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
    if (!cleanBase64 || cleanBase64.length > 5_500_000) {
      return jsonResponse(400, {
        error: 'Image must be a valid base64 image under 4 MB after optimization.',
      });
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

    const payload = await upstream.json().catch(() => null);
    const rawResolvedUrl =
      payload?.data?.display_url || payload?.data?.image?.url || payload?.data?.url || '';
    const resolvedUrl = rawResolvedUrl.replace(/^http:\/\/(i\.)?ibb\.co\//i, 'https://$1ibb.co/');

    if (!upstream.ok || !payload?.success || !resolvedUrl) {
      const rawMsg =
        payload?.error?.message || `ImgBB upload failed with HTTP ${upstream.status}.`;
      const message =
        payload?.error?.code === 103
          ? `ImgBB rejected this API key or server request (code 103: "${rawMsg}"). Please verify IMGBB_API_KEY in Netlify Environment Variables.`
          : rawMsg;
      return jsonResponse(upstream.status >= 400 ? upstream.status : 502, { error: message });
    }

    return jsonResponse(200, {
      url: resolvedUrl,
      thumbUrl: (payload.data.thumb?.url || '').replace(/^http:\/\/(i\.)?ibb\.co\//i, 'https://$1ibb.co/'),
      deleteUrl: payload.data.delete_url || '',
    });
  } catch (err) {
    console.error('Netlify ImgBB proxy error:', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Unexpected server error while uploading image.',
    });
  }
}
