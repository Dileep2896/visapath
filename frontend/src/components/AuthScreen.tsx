import { useState } from 'react';
import { Loader2, Mail, Lock, ArrowRight, Shield, Clock, Sparkles, BarChart3, ScanEye, EyeOff } from 'lucide-react';
import type { AuthUser } from '../types';
import { register, login } from '../utils/api';
import { toast } from './Toast';
import Logo from './Logo';

interface AuthScreenProps {
  onAuth: (user: AuthUser) => void;
}

const FEATURES = [
  {
    icon: Clock,
    title: 'Personalized Timeline',
    desc: 'AI-generated immigration roadmap based on your exact situation',
  },
  {
    icon: Shield,
    title: 'Risk Alerts',
    desc: 'Get warned before deadlines slip — OPT, H-1B, unemployment limits',
  },
  {
    icon: BarChart3,
    title: 'Smart Tracking',
    desc: 'Track documents, action items, and milestones in one place',
  },
  {
    icon: Sparkles,
    title: 'AI Immigration Advisor',
    desc: 'Ask questions and get answers backed by USCIS documentation',
  },
];

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = mode === 'register'
        ? await register(email, password)
        : await login(email, password);
      toast(mode === 'register' ? 'Account created!' : 'Welcome back!', 'success');
      onAuth(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding & features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 relative overflow-hidden bg-navy-900 border-r border-navy-700">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-teal-400/[0.03] rounded-full blur-3xl auth-float" />
          <div className="absolute bottom-[-150px] right-[-80px] w-[400px] h-[400px] bg-teal-400/[0.05] rounded-full blur-3xl auth-float-delayed" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-40" />
          {/* Decorative rings */}
          <svg className="absolute top-20 right-10 opacity-[0.06] auth-spin-slow" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" stroke="#00D4AA" strokeWidth="2" strokeDasharray="8 6" />
            <circle cx="60" cy="60" r="35" stroke="#00D4AA" strokeWidth="1.5" strokeDasharray="5 8" />
          </svg>
          <svg className="absolute bottom-32 left-8 opacity-[0.06] auth-spin-slow-reverse" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="30" stroke="#00D4AA" strokeWidth="2" strokeDasharray="6 8" />
          </svg>
          {/* Dotted path */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]" width="300" height="400" viewBox="0 0 300 400" fill="none">
            <path d="M150 0 C150 100, 50 120, 50 200 S150 300, 150 400" stroke="#00D4AA" strokeWidth="2" strokeDasharray="4 6" />
            <path d="M150 0 C150 100, 250 120, 250 200 S150 300, 150 400" stroke="#00D4AA" strokeWidth="2" strokeDasharray="4 6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <div>
            <Logo size="default" />
          </div>

          {/* Features */}
          <div className="space-y-6 my-auto py-10">
            <h2 className="text-2xl font-bold font-heading text-white leading-tight">
              Navigate your immigration<br />
              journey with <span className="text-teal-400">confidence</span>
            </h2>
            <div className="space-y-4 mt-8">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-white/[0.02] auth-feature-in"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center shrink-0">
                    <f.icon size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stat */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-teal-400 font-heading">F-1</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">OPT &bull; STEM &bull; H-1B</p>
            </div>
            <div className="w-px h-10 bg-navy-700" />
            <div>
              <p className="text-2xl font-bold text-white font-heading">20+</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Countries supported</p>
            </div>
            <div className="w-px h-10 bg-navy-700" />
            <div>
              <p className="text-2xl font-bold text-white font-heading">AI</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Powered advisor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-400/[0.04] rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Logo size="default" />
          </div>

          {/* Mode toggle tabs */}
          <div className="flex bg-navy-900 rounded-xl p-1 border border-navy-700 mb-8">
            <button
              onClick={() => switchMode()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-teal-400 text-navy-950 shadow-lg shadow-teal-400/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-teal-400 text-navy-950 shadow-lg shadow-teal-400/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-heading text-white">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {mode === 'login'
                ? 'Sign in to continue to your timeline'
                : 'Create your account to start planning'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter your password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <ScanEye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/15 rounded-xl px-4 py-2.5">
                <Shield size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-400 text-navy-950 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-400/20 hover:shadow-teal-400/30 hover:translate-y-[-1px] active:translate-y-0 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-600 mt-8">
            VisaPath provides general immigration information only.<br />
            Always consult your DSO or an immigration attorney for legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
