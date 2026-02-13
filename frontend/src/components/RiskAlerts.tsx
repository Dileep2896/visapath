import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { RiskAlert } from '../types';

interface RiskAlertsProps {
  alerts: RiskAlert[];
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; bg: string; border: string; text: string }> = {
  critical: { icon: AlertTriangle, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  high: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  warning: { icon: AlertCircle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
};

export default function RiskAlerts({ alerts }: RiskAlertsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Risk Alerts</h3>
      {alerts.map((alert, idx) => {
        const config = severityConfig[alert.severity] || severityConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={idx}
            className={`rounded-xl border p-4 ${config.bg} ${config.border}`}
          >
            <div className="flex items-start gap-3">
              <Icon size={16} className={`${config.text} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm text-slate-200">{alert.message}</p>
                {alert.recommendation && (
                  <p className="text-xs text-slate-400 mt-2">{alert.recommendation}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
