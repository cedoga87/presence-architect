'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

interface Session {
  id: number;
  title: string;
  video_url: string | null;
  video_filename: string | null;
  created_at: string;
  overall_score: number | null;
  pacing_score: number | null;
  tone_score: number | null;
  inspiration_score: number | null;
  clarity_score: number | null;
  credibility_score: number | null;
  hook_score: number | null;
  cta_score: number | null;
  overall_summary: string | null;
}

const DIMENSION_COLORS: Record<string, string> = {
  pacing: '#6366f1',
  tone: '#8b5cf6',
  inspiration: '#ec4899',
  clarity: '#f59e0b',
  credibility: '#10b981',
  hook: '#3b82f6',
  cta: '#ef4444',
};

const DIMENSION_LABELS: Record<string, string> = {
  pacing: 'Pacing',
  tone: 'Tone',
  inspiration: 'Inspiration',
  clarity: 'Clarity',
  credibility: 'Credibility',
  hook: 'Hook',
  cta: 'CTA',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-300 text-sm">—</span>;
  const color =
    score >= 8 ? 'bg-green-100 text-green-700' :
    score >= 6 ? 'bg-lime-100 text-lime-700' :
    score >= 4 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((d) => { setSessions(d.sessions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this session?')) return;
    setDeleting(id);
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    setSessions((s) => s.filter((x) => x.id !== id));
    if (selectedSession?.id === id) setSelectedSession(null);
    setDeleting(null);
  };

  // Prepare trend chart data (oldest first)
  const trendData = [...sessions]
    .filter((s) => s.overall_score !== null)
    .reverse()
    .map((s) => ({
      name: formatDate(s.created_at),
      title: s.title,
      Overall: s.overall_score,
      Pacing: s.pacing_score,
      Tone: s.tone_score,
      Inspiration: s.inspiration_score,
      Clarity: s.clarity_score,
      Credibility: s.credibility_score,
      Hook: s.hook_score,
      CTA: s.cta_score,
    }));

  // Prepare radar data for selected session
  const radarData = selectedSession
    ? [
        { dimension: 'Pacing', score: selectedSession.pacing_score ?? 0 },
        { dimension: 'Tone', score: selectedSession.tone_score ?? 0 },
        { dimension: 'Inspiration', score: selectedSession.inspiration_score ?? 0 },
        { dimension: 'Clarity', score: selectedSession.clarity_score ?? 0 },
        { dimension: 'Credibility', score: selectedSession.credibility_score ?? 0 },
        { dimension: 'Hook', score: selectedSession.hook_score ?? 0 },
        { dimension: 'CTA', score: selectedSession.cta_score ?? 0 },
      ]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">CS</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 leading-none">CS Video Coach</h1>
                <p className="text-xs text-gray-400">Session History</p>
              </div>
            </Link>
          </div>
          <Link href="/" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            + New Analysis
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <span className="text-6xl">🎬</span>
            <h2 className="text-xl font-bold text-gray-700">No sessions yet</h2>
            <p className="text-gray-400">Analyze your first CS video to start tracking progress</p>
            <Link href="/" className="inline-block mt-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Analyze a Video
            </Link>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions', value: sessions.length, icon: '🎬' },
                {
                  label: 'Avg Overall Score',
                  value: (() => {
                    const scored = sessions.filter((s) => s.overall_score !== null);
                    if (!scored.length) return '—';
                    return (scored.reduce((a, s) => a + (s.overall_score ?? 0), 0) / scored.length).toFixed(1);
                  })(),
                  icon: '⭐',
                },
                {
                  label: 'Best Score',
                  value: (() => {
                    const scored = sessions.filter((s) => s.overall_score !== null);
                    if (!scored.length) return '—';
                    return Math.max(...scored.map((s) => s.overall_score ?? 0)).toFixed(1);
                  })(),
                  icon: '🏆',
                },
                {
                  label: 'Latest Score',
                  value: sessions[0]?.overall_score?.toFixed(1) ?? '—',
                  icon: '📅',
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-xs text-gray-500">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            {trendData.length >= 2 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Score Trends Over Time</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) => [typeof val === 'number' ? val.toFixed(1) : val, name]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Overall" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                    {Object.entries(DIMENSION_COLORS).map(([key, color]) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={DIMENSION_LABELS[key]}
                        stroke={color}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                        opacity={0.6}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sessions list + detail */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* List */}
              <div className="lg:col-span-2 space-y-2">
                <h2 className="text-lg font-bold text-gray-900">Sessions</h2>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                      selectedSession?.id === session.id
                        ? 'border-indigo-400 ring-2 ring-indigo-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{session.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(session.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ScoreBadge score={session.overall_score} />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                          disabled={deleting === session.id}
                          className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                          title="Delete"
                        >
                          {deleting === session.id ? '...' : '✕'}
                        </button>
                      </div>
                    </div>

                    {session.overall_score !== null && (
                      <div className="mt-2">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(session.overall_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Detail */}
              <div className="lg:col-span-3">
                {selectedSession ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5 sticky top-24">
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedSession.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedSession.created_at).toLocaleString()}</p>
                    </div>

                    {selectedSession.overall_score !== null && (
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs text-gray-500">Overall Score</span>
                          <p className="text-4xl font-black text-indigo-600">{selectedSession.overall_score.toFixed(1)}</p>
                        </div>
                        {radarData && (
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height={180}>
                              <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                                <Radar
                                  name="Score"
                                  dataKey="score"
                                  stroke="#6366f1"
                                  fill="#6366f1"
                                  fillOpacity={0.2}
                                  strokeWidth={2}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dimension scores */}
                    <div className="space-y-2">
                      {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
                        const score = selectedSession[`${key}_score` as keyof Session] as number | null;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: score !== null ? `${(score / 10) * 100}%` : '0%',
                                  backgroundColor: DIMENSION_COLORS[key],
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-8 text-right">
                              {score !== null ? score.toFixed(1) : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {selectedSession.overall_summary && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Summary</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedSession.overall_summary}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
                    <span className="text-3xl mb-2">👈</span>
                    Click a session to see details
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
