import { AlertTriangle, AlertCircle, Info, Shield } from 'lucide-react';
import type { RiskAlert } from '../types';
import RiskAlerts from './RiskAlerts';
import EmptyState from './EmptyState';

interface AlertsPageProps {
  alerts: RiskAlert[];
}

const severityOrder = ['critical', 'high', 'warning', 'info'] as const;
const severityLabels: Record<string, string> = {
  critical: 'Critical',
  high: 'High Priority',
  warning: 'Warning',
  info: 'Informational',
};
const severityColors: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};
const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

export default function AlertsPage({ alerts }: AlertsPageProps) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<Shield size={32} className="text-teal-400 mx-auto" />}
        title="No alerts"
        description="No risk alerts for your current immigration profile. Keep your documents and deadlines up to date."
      />
    );
  }

  // Count by severity
  const counts: Record<string, number> = {};
  for (const alert of alerts) {
    counts[alert.severity] = (counts[alert.severity] || 0) + 1;
  }

  // Group alerts by severity
  const grouped: Record<string, RiskAlert[]> = {};
  for (const alert of alerts) {
    if (!grouped[alert.severity]) grouped[alert.severity] = [];
    grouped[alert.severity].push(alert);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Summary header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl font-bold text-white font-heading mb-3">Risk Alerts</h1>
        <div className="flex flex-wrap gap-3">
          {severityOrder.map(severity => {
            const count = counts[severity];
            if (!count) return null;
            const Icon = severityIcons[severity];
            return (
              <div
                key={severity}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700"
              >
                <Icon size={14} className={severityColors[severity]} />
                <span className={`text-sm font-medium ${severityColors[severity]}`}>{count}</span>
                <span className="text-xs text-slate-400">{severityLabels[severity]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grouped alerts */}
      {severityOrder.map(severity => {
        const group = grouped[severity];
        if (!group) return null;
        return (
          <div key={severity} className="animate-fade-in-up">
            <h2 className={`text-sm font-medium uppercase tracking-wider mb-3 ${severityColors[severity]}`}>
              {severityLabels[severity]}
            </h2>
            <RiskAlerts alerts={group} />
          </div>
        );
      })}
    </div>
  );
}
