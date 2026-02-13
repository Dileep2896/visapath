import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Circle, ExternalLink, AlertCircle } from 'lucide-react';
import { getRequiredDocuments } from '../utils/api';
import type { DocumentItem } from '../types';
import { DocumentSkeleton } from './Skeleton';

const STEPS = [
  { key: 'opt_application', label: 'OPT Application' },
  { key: 'stem_opt_extension', label: 'STEM OPT Extension' },
  { key: 'h1b_petition', label: 'H-1B Petition' },
  { key: 'green_card_perm', label: 'Green Card (PERM)' },
];

export default function DocumentTracker() {
  const [activeStep, setActiveStep] = useState('opt_application');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getRequiredDocuments(activeStep)
      .then(res => {
        setDocuments(res.documents || []);
        setChecked(new Set());
      })
      .catch(() => {
        setDocuments([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [activeStep]);

  function toggleCheck(name: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const progress = documents.length > 0 ? (checked.size / documents.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white font-heading">Document Tracker</h2>
        <p className="text-sm text-slate-400 mt-1">Track what you need for each immigration step</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STEPS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveStep(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
              activeStep === key
                ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {documents.length > 0 && (
        <div className="bg-navy-900 rounded-xl border border-navy-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">{checked.size} of {documents.length} documents ready</span>
            <span className="text-sm font-medium text-teal-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-navy-900 rounded-xl border border-navy-700">
        {loading ? (
          <DocumentSkeleton />
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Failed to load documents</p>
            <p className="text-sm text-slate-500 mt-1">Make sure the backend server is running.</p>
            <button
              onClick={() => setActiveStep(activeStep)}
              className="mt-3 text-sm text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No documents found</p>
            <p className="text-sm text-slate-500 mt-1">Select a different step above.</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-700">
            {documents.map((doc, idx) => (
              <div
                key={doc.name}
                className="flex items-start gap-4 p-4 hover:bg-navy-800/50 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <button
                  onClick={() => toggleCheck(doc.name)}
                  className="mt-0.5 shrink-0 cursor-pointer"
                >
                  {checked.has(doc.name) ? (
                    <CheckCircle size={20} className="text-teal-400" />
                  ) : (
                    <Circle size={20} className="text-slate-600" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    checked.has(doc.name) ? 'text-slate-500 line-through' : 'text-white'
                  }`}>
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <ExternalLink size={10} />
                    {doc.where_to_get}
                  </p>
                </div>
                <FileText size={16} className="text-slate-600 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
