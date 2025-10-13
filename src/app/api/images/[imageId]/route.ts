import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ imageId: string }> | { imageId: string } }) {
    try {
        const resolvedParams = await params;
        const { imageId } = resolvedParams;
        if (!imageId) return NextResponse.json({ error: 'imageId é necessário' }, { status: 400 });

        const token = process.env.VORPNG_API_TOKEN;
        if (!token) return NextResponse.json({ error: 'VORPNG_API_TOKEN não configurado' }, { status: 500 });

        // Construir URL de fetch para vorpng — usar endpoint de download
        const vorpngUrl = `https://vorpng.caiots.dev/images/${encodeURIComponent(imageId)}/download`;

        const resp = await fetch(vorpngUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            return NextResponse.json({ error: 'Erro ao obter imagem externa', status: resp.status, body: text }, { status: 502 });
        }

        // Streamar resposta
        const contentType = resp.headers.get('content-type') || 'application/octet-stream';
        const body = resp.body;
        return new NextResponse(body, { status: 200, headers: { 'Content-Type': contentType } });
    } catch (e) {
        console.error('Erro proxy vorpng:', e);
        return NextResponse.json({ error: 'Erro interno ao buscar imagem' }, { status: 500 });
    }
}
