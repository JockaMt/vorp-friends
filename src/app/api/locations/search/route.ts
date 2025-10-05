import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q || q.trim().length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    // Use the explicit format requested: city=${q}&format=json&addressdetails=1&limit=5
    const params = new URLSearchParams({
      city: q,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'br',
      'accept-language': 'pt-BR,pt,en'
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    console.log('[locations/search] proxy ->', url);

    const res = await fetch(url, {
      headers: {
        // include a descriptive user-agent as required by Nominatim usage policy
        'User-Agent': 'VorpFriends/1.0 (contato@vorp-friends.com)'
      }
    });

    if (!res.ok) {
      console.error('[locations/search] nominatim status', res.status);
      return NextResponse.json([], { status: 502 });
    }

    const data = await res.json();

    // Filter results to common place types (allow small towns and administrative boundaries)
    const allowedTypes = new Set(['city','town','village','municipality','hamlet','suburb','neighbourhood','locality','administrative']);

    // Tokenize query for simple client-side ranking/fuzzy match
    const queryTokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    const filtered = (data || [])
      .filter((item: any) => {
        // accept if type/class matches allowed
        if (item.type && allowedTypes.has(item.type)) return true;
        if (item.class === 'place' || item.class === 'boundary') return true;
        return false;
      })
      .map((item: any) => ({
        ...item,
        score: computeScore(item, queryTokens)
      }))
      .sort((a: any,b: any) => (b.score - a.score) || ((b.importance||0) - (a.importance||0)) );

  // Return top 5 (matches requested limit)
  return NextResponse.json(filtered.slice(0,5));
  } catch (err) {
    console.error('[locations/search] error', err);
    return NextResponse.json([], { status: 500 });
  }
}

function computeScore(item: any, tokens: string[]) {
  if (!tokens || tokens.length === 0) return 0;
  const name = (item.display_name || '').toLowerCase();
  let score = 0;

  // boost when display_name starts with the query
  const firstToken = tokens.join(' ');
  if (name.startsWith(firstToken)) score += 20;

  // token matches anywhere
  for (const t of tokens) {
    if (name.includes(t)) score += 5;
    // match on individual words
    const words = name.split(/[,\s]+/);
    for (const w of words) {
      if (w.startsWith(t)) score += 1;
    }
  }

  // small boost for importance field
  score += (item.importance || 0) * 5;

  return score;
}
