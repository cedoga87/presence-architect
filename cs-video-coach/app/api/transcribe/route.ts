import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createReadStream } from 'fs';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { filename, videoUrl } = await req.json();

    if (!filename && !videoUrl) {
      return NextResponse.json({ error: 'filename or videoUrl required' }, { status: 400 });
    }

    let transcript = '';

    if (filename) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const fileStream = createReadStream(filePath);
      const response = await openai.audio.transcriptions.create({
        file: fileStream as Parameters<typeof openai.audio.transcriptions.create>[0]['file'],
        model: 'whisper-1',
        response_format: 'text',
      });
      transcript = typeof response === 'string' ? response : (response as { text: string }).text;
    } else if (videoUrl) {
      // For URL-based videos (Loom/YouTube), we extract audio via a best-effort approach
      // In production you'd use yt-dlp or Loom API; here we return a placeholder with instructions
      return NextResponse.json({
        transcript: '',
        note: 'URL-based transcription: Please paste the video transcript manually, or use a tool like Loom\'s built-in transcription or YouTube\'s auto-captions and paste the text.',
        requiresManualTranscript: true,
      });
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error('Transcription error:', err);
    const message = err instanceof Error ? err.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
