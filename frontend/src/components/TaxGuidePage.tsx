import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Receipt, FileText, Globe, Shield, AlertCircle, CheckCircle, Search, BookOpen, Scale, Clock, RefreshCw, Info } from 'lucide-react';
import type { UserInput } from '../types';
import { getTaxGuide, saveCachedTaxGuide, checkRateLimit } from '../utils/api';
import EmptyState from './EmptyState';
import PageLoader from './PageLoader';

const TAX_LOADING_STEPS = [
  { icon: Search, text: 'Looking up tax treaties for your country...' },
  { icon: BookOpen, text: 'Checking filing requirements...' },
  { icon: Scale, text: 'Determining FICA exemption status...' },
  { icon: Receipt, text: 'Generating personalized guidance...' },
];

interface TaxGuidePageProps {
  userContext: UserInput | null;
  cachedTaxGuide?: Record<string, unknown> | null;
  onTaxGuideGenerated?: (data: TaxGuideResult) => void;
}

interface TreatyBenefits {
  country: string;
  benefit: string;
  form: string;
}

interface TaxGuideResult {
  filing_deadline: string;
  residency_status: string;
  required_forms: string[];
  treaty_benefits: TreatyBenefits | null;
  fica_exempt: boolean;
  guidance: string;
  disclaimer: string;
}

export default function TaxGuidePage({ userContext, cachedTaxGuide, onTaxGuideGenerated }: TaxGuidePageProps) {
  const [result, setResult] = useState<TaxGuideResult | null>(
    cachedTaxGuide ? (cachedTaxGuide as unknown as TaxGuideResult) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuide = useCallback(async () => {
    if (!userContext) return;
    // Pre-check rate limit before expensive AI call
    const rl = await checkRateLimit();
    if (!rl.allowed) {
      setError(`Rate limit reached \u2014 ${rl.limit} AI requests/day. Please wait and try again.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getTaxGuide(userContext);
      setResult(data);
      // Cache the result to DB and notify parent
      saveCachedTaxGuide(data).catch(() => {});
      onTaxGuideGenerated?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tax guide. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userContext, onTaxGuideGenerated]);

  useEffect(() => {
    // Only fetch from AI if we don't have cached data
    if (!result) {
      fetchGuide();
    }
  }, [fetchGuide, result]);

  if (!userContext) {
    return (
      <EmptyState
        icon={<Receipt size={22} className="text-slate-500" />}
        title="Complete onboarding first"
        description="We need your profile information to generate personalized tax guidance."
      />
    );
  }

  if (loading) {
    return (
      <PageLoader
        title="Preparing Your Tax Guide"
        subtitle="Analyzing tax rules for your immigration profile"
        steps={TAX_LOADING_STEPS}
        icon={Receipt}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh] p-6">
        <div className="w-full max-w-lg">
          <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60" />
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
                <div
                  className="absolute inset-1.5 rounded-full border border-amber-400/10 animate-pulse"
                  style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <Clock size={22} className="text-amber-400" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white font-heading mb-2">Hang Tight!</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">
                {error}
              </p>
              <button
                onClick={fetchGuide}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950 hover:from-teal-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-xl font-bold text-white font-heading mb-1">Tax Filing Guide</h1>
        <p className="text-sm text-slate-400">Personalized for your immigration profile</p>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-sky-500/5 border border-sky-500/15 px-3 py-2">
          <Info size={14} className="text-sky-400 mt-0.5 shrink-0" />
          <p className="text-xs text-sky-300/80 leading-relaxed">
            This guide is generated once per profile to conserve AI usage. Update your profile to get a fresh guide.
          </p>
        </div>
      </div>

      {/* Filing Status Card */}
      <div className="animate-fade-in-up rounded-xl border border-navy-700 bg-navy-800/50 p-5" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-teal-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Filing Status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Filing Deadline</p>
            <p className="text-sm font-medium text-white mt-0.5">{result.filing_deadline}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Residency Status</p>
            <p className="text-sm font-medium text-white mt-0.5">{result.residency_status}</p>
          </div>
        </div>
      </div>

      {/* Required Forms Card */}
      <div className="animate-fade-in-up rounded-xl border border-navy-700 bg-navy-800/50 p-5" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-teal-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Required Forms</h2>
        </div>
        <ul className="space-y-2">
          {result.required_forms.map((form, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
              {form}
            </li>
          ))}
        </ul>
      </div>

      {/* Treaty Benefits Card */}
      {result.treaty_benefits && (
        <div className="animate-fade-in-up rounded-xl border border-amber-500/30 bg-amber-500/5 p-5" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Tax Treaty Benefits</h2>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-400">Country</p>
              <p className="text-sm font-medium text-white mt-0.5">{result.treaty_benefits.country}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Benefit</p>
              <p className="text-sm font-medium text-amber-300 mt-0.5">{result.treaty_benefits.benefit}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Required Form</p>
              <p className="text-sm font-medium text-white mt-0.5">{result.treaty_benefits.form}</p>
            </div>
          </div>
        </div>
      )}

      {/* FICA Exemption */}
      <div className="animate-fade-in-up rounded-xl border border-navy-700 bg-navy-800/50 p-5" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-teal-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">FICA Tax Exemption</h2>
        </div>
        <p className="text-sm text-slate-300">
          {result.fica_exempt
            ? 'You are currently EXEMPT from Social Security and Medicare taxes (FICA). If your employer withholds these taxes, you can request a refund.'
            : 'You are no longer exempt from FICA taxes. Social Security (6.2%) and Medicare (1.45%) will be withheld from your wages.'}
        </p>
        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          result.fica_exempt ? 'bg-teal-400/10 text-teal-400' : 'bg-slate-600/20 text-slate-400'
        }`}>
          {result.fica_exempt ? 'Exempt' : 'Not Exempt'}
        </div>
      </div>

      {/* Personalized Guidance */}
      <div className="animate-fade-in-up rounded-xl border border-navy-700 bg-navy-800/50 p-5" style={{ animationDelay: '500ms' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Personalized Guidance</h2>
        <div className="text-sm text-slate-300 leading-relaxed prose-chat">
          <ReactMarkdown>{result.guidance}</ReactMarkdown>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="animate-fade-in-up rounded-xl border border-slate-700/50 bg-navy-900 p-4" style={{ animationDelay: '600ms' }}>
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">{result.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
