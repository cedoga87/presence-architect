import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const sessions = db.prepare(`
      SELECT id, title, video_url, video_filename, created_at,
             overall_score, pacing_score, tone_score, inspiration_score,
             clarity_score, credibility_score, hook_score, cta_score,
             overall_summary
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('Sessions GET error:', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { title, videoUrl, videoFilename, transcript } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO sessions (title, video_url, video_filename, transcript)
      VALUES (?, ?, ?, ?)
    `).run(title, videoUrl || null, videoFilename || null, transcript || null);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error('Sessions POST error:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
