import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(Number(id));
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    console.error('Session GET error:', err);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    const { transcript } = body;

    if (transcript !== undefined) {
      db.prepare('UPDATE sessions SET transcript = ? WHERE id = ?').run(transcript, Number(id));
    }

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(Number(id));
    return NextResponse.json({ session });
  } catch (err) {
    console.error('Session PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Session DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
