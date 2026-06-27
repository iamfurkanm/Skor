const KV_KEY = 'matches';

async function getSeed(request) {
  const url = new URL('/data/matches.json', request.url);
  const res = await fetch(url);
  if (!res.ok) return { version: 1, matches: [] };
  return res.json();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.MATCHES_KV;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method === 'GET') {
    let data = kv ? await kv.get(KV_KEY, 'json') : null;
    if (!data) data = await getSeed(request);
    return jsonResponse(data);
  }

  if (request.method === 'PUT') {
    if (!kv) {
      return jsonResponse({ error: 'MATCHES_KV bağlantısı yapılandırılmamış' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Geçersiz JSON' }, 400);
    }

    const matches = body.matches ?? body;
    if (!Array.isArray(matches)) {
      return jsonResponse({ error: 'matches bir dizi olmalı' }, 400);
    }

    const payload = { version: body.version || 1, matches };
    await kv.put(KV_KEY, JSON.stringify(payload));
    return jsonResponse(payload);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}
