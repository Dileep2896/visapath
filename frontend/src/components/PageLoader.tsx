import { useState, useEffect } from 'react';
import { CheckCircle2, type LucideIcon } from 'lucide-react';

interface LoadingStep {
  icon: LucideIcon;
  text: string;
}

interface PageLoaderProps {
  title: string;
  subtitle: string;
  steps: LoadingStep[];
  /** The main icon displayed in the animated ring. Defaults to the first step's icon. */
  icon?: LucideIcon;
  /** Milliseconds between step transitions. Default 2200. */
  interval?: number;
}

export default function PageLoader({ title, subtitle, steps, icon, interval = 2200 }: PageLoaderProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, interval);
    return () => clearInterval(timer);
  }, [steps.length, interval]);

  const HeroIcon = icon ?? steps[0]?.icon;

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <div className="w-full max-w-sm text-center">
        {/* Animated rings — contained within the box, no overflow */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full border-2 border-teal-400/20 animate-pulse"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="absolute inset-1.5 rounded-full border border-teal-400/10 animate-pulse"
            style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center timeline-loader-spin">
              {HeroIcon && <HeroIcon size={22} className="text-teal-400" />}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white font-heading mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-10">{subtitle}</p>

        {/* Steps */}
        <div className="space-y-3 text-left">
          {steps.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            const Icon = step.icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  active
                    ? 'bg-teal-400/10 border border-teal-400/30'
                    : done
                      ? 'bg-navy-800/50 border border-navy-700/50'
                      : 'border border-transparent opacity-40'
                }`}
              >
                <div
                  className={`shrink-0 transition-all duration-500 ${
                    active ? 'text-teal-400' : done ? 'text-teal-400/60' : 'text-slate-600'
                  }`}
                >
                  {done ? <CheckCircle2 size={18} /> : <Icon size={18} className={active ? 'animate-pulse' : ''} />}
                </div>
                <span
                  className={`text-sm transition-all duration-500 ${
                    active ? 'text-teal-400 font-medium' : done ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {step.text}
                </span>
                {active && (
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-1 bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-300 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
