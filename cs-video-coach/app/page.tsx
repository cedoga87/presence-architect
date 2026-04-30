'use client';

import { useState } from 'react';
import VideoInput from '@/components/VideoInput';
import AnalysisResults from '@/components/AnalysisResults';
import Link from 'next/link';

type Step = 'input' | 'transcript' | 'analyzing' | 'results';

interface VideoData {
  filename?: string;
  videoUrl?: string;
  originalName?: string;
}

interface AnalysisData {
  overall_score: number;
  overall_summary: string;
  strengths: string;
  improvements: string;
  dimensions: {
    [key: string]: { score: number; feedback: string };
  };
}

export default function Home() {
  const [step, setStep] = useState<Step>('input');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptError, setTranscriptError] = useState('');
  const [requiresManualTranscript, setRequiresManualTranscript] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  const handleVideoReady = (data: VideoData) => {
    setVideoData(data);
    if (data.videoUrl) {
      setRequiresManualTranscript(true);
    }
  };

  const handleTranscribeOrNext = async () => {
    if (!videoData) return;
    setTranscriptError('');

    if (videoData.videoUrl) {
      setStep('transcript');
      return;
    }

    setTranscribing(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: videoData.filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');

      if (data.requiresManualTranscript) {
        setRequiresManualTranscript(true);
      } else {
        setTranscript(data.transcript || '');
      }
    } catch (err) {
      setTranscriptError(err instanceof Error ? err.message : 'Transcription failed');
      setRequiresManualTranscript(true);
    } finally {
      setTranscribing(false);
    }
    setStep('transcript');
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setTranscriptError('Please add a transcript before analyzing');
      return;
    }
    if (!title.trim()) {
      setTranscriptError('Please add a video title');
      return;
    }

    setAnalyzeError('');
    setStep('analyzing');

    try {
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          videoUrl: videoData?.videoUrl || null,
          videoFilename: videoData?.filename || null,
          transcript: transcript.trim(),
        }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || 'Failed to create session');
      const sid = sessionData.session.id;
      setSessionId(sid);

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, transcript: transcript.trim(), title: title.trim() }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Analysis failed');

      setAnalysis(analyzeData.analysis);
      setStep('results');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('transcript');
    }
  };

  const handleReset = () => {
    setStep('input');
    setVideoData(null);
    setTitle('');
    setTranscript('');
    setTranscribing(false);
    setTranscriptError('');
    setRequiresManualTranscript(false);
    setSessionId(null);
    setAnalysis(null);
    setAnalyzeError('');
  };

  const stepIndex = { input: 0, transcript: 1, analyzing: 2, results: 3 };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">CS</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">CS Video Coach</h1>
              <p className="text-xs text-gray-400">Customer Success Content Analyzer</p>
            </div>
          </div>
          <Link href="/history" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            📊 History
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {step !== 'results' && (
          <div className="flex items-center gap-2 text-sm">
            {(['input', 'transcript', 'analyzing'] as const).map((s, i) => {
              const labels = { input: 'Add Video', transcript: 'Transcript', analyzing: 'Analyzing' };
              const currentIdx = stepIndex[step] ?? 0;
              const isActive = s === step;
              const isDone = i < currentIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-indigo-600 text-white' : isActive ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-400' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={isActive ? 'text-indigo-700 font-medium' : isDone ? 'text-gray-500' : 'text-gray-400'}>
                    {labels[s]}
                  </span>
                  {i < 2 && <span className="text-gray-300">—</span>}
                </div>
              );
            })}
          </div>
        )}

        {step === 'input' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Analyze Your CS Video</h2>
              <p className="text-sm text-gray-500 mt-1">Upload a video or paste a Loom/YouTube link to get AI-powered feedback</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to reduce churn in 30 days"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Video Source</label>
              <VideoInput onVideoReady={handleVideoReady} />
            </div>

            <button
              onClick={handleTranscribeOrNext}
              disabled={!videoData || !title.trim() || transcribing}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              {transcribing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Transcribing with Whisper...
                </>
              ) : 'Continue →'}
            </button>
            {transcriptError && (
              <p className="text-red-600 text-sm">{transcriptError}</p>
            )}
          </div>
        )}

        {step === 'transcript' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Transcript</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {requiresManualTranscript
                    ? 'Paste your video transcript below (from Loom, YouTube captions, or manual)'
                    : 'Auto-transcribed via Whisper — review and edit if needed'}
                </p>
              </div>
              <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
            </div>

            {requiresManualTranscript && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                💡 Tip: Copy the auto-generated transcript from Loom (under &ldquo;Transcript&rdquo;) or YouTube (CC &gt; subtitles), then paste it here.
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Transcript</label>
                <span className="text-xs text-gray-400">{transcript.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={12}
                placeholder="Paste or type your video transcript here..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
              />
            </div>

            {transcriptError && (
              <p className="text-red-600 text-sm">{transcriptError}</p>
            )}
            {analyzeError && (
              <p className="text-red-600 text-sm">{analyzeError}</p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!transcript.trim()}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              🤖 Analyze with Claude AI
            </button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Analyzing Your Video</h2>
              <p className="text-gray-500 text-sm mt-2">Claude is reviewing your content across 7 CS dimensions...</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              {['⏱️ Pacing', '🎙️ Tone', '✨ Inspiration', '💡 Clarity', '🏆 Credibility', '🪝 Hook', '🎯 CTA'].map((d) => (
                <div key={d} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'results' && analysis && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">Analysis complete · session #{sessionId}</p>
              </div>
              <div className="flex gap-3">
                <Link href="/history" className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  📊 History
                </Link>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  + New Analysis
                </button>
              </div>
            </div>
            <AnalysisResults analysis={analysis} />
          </div>
        )}
      </main>
    </div>
  );
}
