import { NextResponse } from 'next/server';

// Proxy endpoint to upload images to external vorpng service
// Expects multipart/form-data with one or more files under field name `images`
// Requires VORPNG_API_TOKEN in environment variables

export async function POST(request: Request) {
  const token = process.env.VORPNG_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'VORPNG_API_TOKEN não configurado' }, { status: 500 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type deve ser multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();

    // Try forwarding as-is, but if vorpng rejects the field name, retry with common alternatives
  const tryFieldNames = ['file', 'files', 'image', 'images', 'file[]'];
    // collect non-file fields to forward as-is
    const otherFields: Array<[string, any]> = [];
    const fileEntries: Array<File> = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        fileEntries.push(value);
      } else {
        otherFields.push([key, value]);
      }
    }

    let resp = null as Response | null;
    for (const fieldName of tryFieldNames) {
      const forward = new FormData();
      for (const [k, v] of otherFields) forward.append(k, v as any);
      fileEntries.forEach(f => forward.append(fieldName, f));

      try {
        resp = await fetch('https://vorpng.caiots.dev/images/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: forward as any
        });
      } catch (e) {
        console.error('Erro ao conectar ao vorpng:', e);
        resp = null;
      }

      if (!resp) continue;

      if (resp.ok) break; // success

      const bodyText = await resp.text().catch(() => '');
      if (resp.status === 400 && /Unexpected field/i.test(bodyText)) {
        console.warn(`vorpng rejeitou campo '${fieldName}', tentando próximo`);
        continue;
      }

      // other error: return it
      return NextResponse.json({ error: 'Erro ao enviar para serviço de imagens', details: bodyText }, { status: resp.status });
    }

    if (!resp) return NextResponse.json({ error: 'Falha ao conectar ao vorpng' }, { status: 500 });

    const json = await resp.json();
    return NextResponse.json(json);
  } catch (err) {
    console.error('Erro no proxy de upload:', err);
    return NextResponse.json({ error: 'Erro interno ao enviar imagem' }, { status: 500 });
  }
}
