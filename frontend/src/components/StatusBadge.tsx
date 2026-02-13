interface StatusBadgeProps {
  visa: string;
  workAuth: string;
  daysUntilDeadline?: number;
  nextDeadline?: string;
}

export default function StatusBadge({ visa, workAuth, daysUntilDeadline, nextDeadline }: StatusBadgeProps) {
  const urgencyColor =
    daysUntilDeadline !== undefined && daysUntilDeadline <= 7
      ? 'text-red-400'
      : daysUntilDeadline !== undefined && daysUntilDeadline <= 30
      ? 'text-amber-400'
      : 'text-teal-400';

  return (
    <div className="bg-navy-900 rounded-xl border border-navy-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
          <p className="text-white font-semibold font-heading">{visa}</p>
          <p className="text-sm text-slate-400">{workAuth}</p>
        </div>
        {daysUntilDeadline !== undefined && nextDeadline && (
          <div className="text-right">
            <p className={`text-2xl font-bold font-heading ${urgencyColor}`}>
              {daysUntilDeadline}
            </p>
            <p className="text-xs text-slate-500">days until</p>
            <p className="text-xs text-slate-400 max-w-[150px] text-right">{nextDeadline}</p>
          </div>
        )}
      </div>
    </div>
  );
}
