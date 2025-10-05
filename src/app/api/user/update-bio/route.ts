import { NextResponse } from 'next/server';
import { clerkClient, auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const bio = typeof body?.bio === 'string' ? body.bio : '';

    await (await clerkClient()).users.updateUser(userId, {
      publicMetadata: { bio }
    });

    return NextResponse.json({ ok: true, bio });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
