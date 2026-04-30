'use client';

import DimensionCard from './DimensionCard';
import { DIMENSIONS } from '@/lib/dimensions';

interface AnalysisData {
  overall_score: number;
  overall_summary: string;
  strengths: string;
  improvements: string;
  dimensions: {
    [key: string]: {
      score: number;
      feedback: string;
    };
  };
}

interface AnalysisResultsProps {
  analysis: AnalysisData;
}

function OverallBadge({ score }: { score: number }) {
  if (score >= 8) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">🏆 Publish Ready</span>;
  if (score >= 6) return <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm font-semibold">👍 Good Shape</span>;
  if (score >= 4) return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">🔧 Needs Polish</span>;
  return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">🔄 Major Rework</span>;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Overall Score</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-5xl font-black text-gray-900">{analysis.overall_score.toFixed(1)}</span>
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm">/10</span>
                <OverallBadge score={analysis.overall_score} />
              </div>
            </div>
          </div>
          {/* Radar-style score preview */}
          <div className="hidden sm:flex gap-1 flex-wrap max-w-[200px] justify-end">
            {DIMENSIONS.map((dim) => {
              const d = analysis.dimensions[dim.key];
              if (!d) return null;
              return (
                <div key={dim.key} className="flex flex-col items-center" title={dim.label}>
                  <span className="text-xs">{dim.icon}</span>
                  <span className="text-xs font-bold text-gray-700">{d.score.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed border-t pt-4">{analysis.overall_summary}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <span>✅</span> Strengths
          </h3>
          <div className="text-sm text-green-700 space-y-1 whitespace-pre-line">{analysis.strengths}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <span>🎯</span> Priority Improvements
          </h3>
          <div className="text-sm text-amber-700 space-y-1 whitespace-pre-line">{analysis.improvements}</div>
        </div>
      </div>

      {/* Dimension breakdown */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Dimension Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIMENSIONS.map((dim) => {
            const d = analysis.dimensions[dim.key];
            if (!d) return null;
            return (
              <DimensionCard
                key={dim.key}
                icon={dim.icon}
                label={dim.label}
                description={dim.description}
                score={d.score}
                feedback={d.feedback}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
