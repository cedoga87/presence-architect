'use client';

interface DimensionCardProps {
  icon: string;
  label: string;
  description: string;
  score: number;
  feedback: string;
}

function scoreLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Needs Work';
  if (score >= 2) return 'Poor';
  return 'Critical';
}

function scoreBg(score: number): string {
  if (score >= 8) return 'bg-green-50 border-green-200';
  if (score >= 6) return 'bg-lime-50 border-lime-200';
  if (score >= 4) return 'bg-amber-50 border-amber-200';
  if (score >= 2) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

function scoreBarColor(score: number): string {
  if (score >= 8) return 'bg-green-500';
  if (score >= 6) return 'bg-lime-500';
  if (score >= 4) return 'bg-amber-500';
  if (score >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

function scoreLabelColor(score: number): string {
  if (score >= 8) return 'text-green-700 bg-green-100';
  if (score >= 6) return 'text-lime-700 bg-lime-100';
  if (score >= 4) return 'text-amber-700 bg-amber-100';
  if (score >= 2) return 'text-orange-700 bg-orange-100';
  return 'text-red-700 bg-red-100';
}

export default function DimensionCard({ icon, label, description, score, feedback }: DimensionCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${scoreBg(score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
          <span className="text-2xl font-bold text-gray-800">{score.toFixed(1)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreLabelColor(score)}`}>
            {scoreLabel(score)}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
    </div>
  );
}
