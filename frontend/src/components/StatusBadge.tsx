interface StatusBadgeProps {
  visa: string;
  workAuth: string;
  daysUntilDeadline?: number;
  nextDeadline?: string;
}

export default function StatusBadge({ visa, workAuth, daysUntilDeadline, nextDeadline }: StatusBadgeProps) {
  const isUrgent = daysUntilDeadline !== undefined && daysUntilDeadline <= 7;
  const isWarning = daysUntilDeadline !== undefined && daysUntilDeadline <= 30;

  const urgencyColor = isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-teal-400';
  const glowClass = isUrgent ? 'glow-red' : isWarning ? 'glow-amber' : 'glow-teal';
  const ringStroke = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#00D4AA';

  // Countdown ring: fraction of 365 days remaining
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const daysForRing = daysUntilDeadline !== undefined ? Math.max(0, Math.min(daysUntilDeadline, 365)) : 0;
  const progress = daysForRing / 365;
  const strokeDashoffset = circumference * (1 - progress);

  // Visa type pill color
  const visaPillColor = visa.includes('H-1B')
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : visa.includes('OPT') || visa.includes('F-1')
    ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
    : visa.includes('H-4') || visa.includes('L-')
    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    : 'bg-slate-500/15 text-slate-400 border-slate-500/30';

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-navy-700 ${glowClass}`}>
      {/* Gradient background with grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      {/* Accent glow in corner */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 blur-3xl"
        style={{ background: ringStroke }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Current Status</p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-white font-bold font-heading text-xl leading-tight">{visa}</p>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${visaPillColor}`}>
                {visa.split(' ')[0]}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-snug">{workAuth}</p>
          </div>

          {daysUntilDeadline !== undefined && nextDeadline && (
            <div className="flex flex-col items-center shrink-0">
              {/* SVG Countdown Ring */}
              <div className="relative w-[96px] h-[96px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  {/* Background ring */}
                  <circle
                    cx="48" cy="48" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="4"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="48" cy="48" r={radius}
                    fill="none"
                    stroke={ringStroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="countdown-ring"
                    style={{ filter: `drop-shadow(0 0 6px ${ringStroke}40)` }}
                  />
                </svg>
                {/* Center number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold font-heading tabular-nums leading-none ${urgencyColor}`}>
                    {daysUntilDeadline < 0 ? Math.abs(daysUntilDeadline) : daysUntilDeadline}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {daysUntilDeadline < 0 ? 'days past' : 'days left'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-1.5 max-w-[140px] leading-tight">
                {nextDeadline}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
