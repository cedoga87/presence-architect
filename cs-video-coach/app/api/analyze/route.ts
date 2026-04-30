import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert coach specializing in Customer Success (CS) professionals creating social media video content. You analyze video transcripts and provide structured, actionable feedback.

CS professionals create videos to:
- Build personal brand and thought leadership in the CS space
- Share insights on retention, churn prevention, QBR strategy, onboarding, health scores
- Inspire peers and attract career opportunities
- Educate customers and prospects on value realization
- Grow communities around CS topics (LinkedIn, TikTok, YouTube Shorts)

Your feedback should be specific to the CS context — reference CS concepts, vocabulary, and challenges where relevant.`;

const ANALYSIS_PROMPT = (transcript: string, title: string) => `Analyze this Customer Success professional's video transcript and return a JSON object with scores and feedback.

Video Title: ${title}
Transcript:
"""
${transcript}
"""

Return ONLY valid JSON in this exact structure:
{
  "overall_score": <number 0-10>,
  "overall_summary": "<2-3 sentence executive summary of the video's effectiveness>",
  "strengths": "<bullet list of 2-3 key strengths, one per line starting with •>",
  "improvements": "<bullet list of 2-3 priority improvements, one per line starting with •>",
  "dimensions": {
    "pacing": {
      "score": <0-10>,
      "feedback": "<2-3 sentences specific to pacing, speed, pauses, and rhythm in the context of CS video content>"
    },
    "tone": {
      "score": <0-10>,
      "feedback": "<2-3 sentences on tone: warmth, confidence, authenticity, and whether it resonates with CS professionals>"
    },
    "inspiration": {
      "score": <0-10>,
      "feedback": "<2-3 sentences on how well the content motivates, energizes, or creates a 'yes, that's me' moment for CS pros>"
    },
    "clarity": {
      "score": <0-10>,
      "feedback": "<2-3 sentences on message clarity: is the core point crystal clear, is it free of jargon overload, does it answer 'so what?'>"
    },
    "credibility": {
      "score": <0-10>,
      "feedback": "<2-3 sentences on professional credibility: does it demonstrate CS expertise, use of data/frameworks, authority signals>"
    },
    "hook": {
      "score": <0-10>,
      "feedback": "<2-3 sentences on the opening hook: does it stop the scroll, create curiosity, address a CS pain point immediately>"
    },
    "cta": {
      "score": <0-10>,
      "feedback": "<2-3 sentences on the call to action: is it clear, compelling, appropriate for CS audience, does it drive engagement or action>"
    }
  }
}

Score guidelines:
- 8-10: Excellent, publish-ready
- 6-7: Good with minor improvements
- 4-5: Decent but needs meaningful work
- 2-3: Significant gaps
- 0-1: Fundamental rework needed

Be honest, specific, and constructive. Reference actual phrases from the transcript when possible.`;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, transcript, title } = await req.json();

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json({ error: 'Transcript too short or missing' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: ANALYSIS_PROMPT(transcript, title || 'Untitled Video') },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const analysis = JSON.parse(jsonStr);

    const db = getDb();

    if (sessionId) {
      const d = analysis.dimensions;
      db.prepare(`
        UPDATE sessions SET
          overall_score = ?,
          pacing_score = ?,
          tone_score = ?,
          inspiration_score = ?,
          clarity_score = ?,
          credibility_score = ?,
          hook_score = ?,
          cta_score = ?,
          pacing_feedback = ?,
          tone_feedback = ?,
          inspiration_feedback = ?,
          clarity_feedback = ?,
          credibility_feedback = ?,
          hook_feedback = ?,
          cta_feedback = ?,
          strengths = ?,
          improvements = ?,
          overall_summary = ?
        WHERE id = ?
      `).run(
        analysis.overall_score,
        d.pacing.score, d.tone.score, d.inspiration.score,
        d.clarity.score, d.credibility.score, d.hook.score, d.cta.score,
        d.pacing.feedback, d.tone.feedback, d.inspiration.feedback,
        d.clarity.feedback, d.credibility.feedback, d.hook.feedback, d.cta.feedback,
        analysis.strengths, analysis.improvements, analysis.overall_summary,
        sessionId,
      );
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('Analysis error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
