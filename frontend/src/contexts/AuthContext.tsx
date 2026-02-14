import { createContext, useContext, useState, useEffect } from 'react';
import type { UserInput, TimelineResponse, AuthUser } from '../types';
import {
  generateTimeline,
  saveTimeline,
  saveCachedTimeline,
  saveProfile,
  getMe,
  getToken,
  clearToken,
  checkRateLimit,
} from '../utils/api';
import { toast } from '../components/Toast';

interface AuthContextValue {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  authChecked: boolean;
  userInput: UserInput | null;
  setUserInput: React.Dispatch<React.SetStateAction<UserInput | null>>;
  timelineData: TimelineResponse | null;
  setTimelineData: React.Dispatch<React.SetStateAction<TimelineResponse | null>>;
  timelineError: string | null;
  setTimelineError: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  generating: boolean;
  saving: boolean;
  saved: boolean;
  setSaved: React.Dispatch<React.SetStateAction<boolean>>;
  simulating: boolean;
  setSimulating: React.Dispatch<React.SetStateAction<boolean>>;
  whatIfModified: boolean;
  setWhatIfModified: React.Dispatch<React.SetStateAction<boolean>>;
  draftStep: number | undefined;
  setDraftStep: React.Dispatch<React.SetStateAction<number | undefined>>;
  isEditingProfile: boolean;
  setIsEditingProfile: React.Dispatch<React.SetStateAction<boolean>>;
  cachedTaxGuide: Record<string, unknown> | null;
  setCachedTaxGuide: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  logout: () => void;
  resetToOnboarding: () => void;
  handleOnboardingSubmit: (data: UserInput) => Promise<void>;
  handleSaveTimeline: () => Promise<void>;
  handleSaveDraft: (data: UserInput, step: number) => void;
  handleWhatIfSimulate: (modified: UserInput) => Promise<void>;
  handleWhatIfReset: () => Promise<void>;
  handleRetryTimeline: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [whatIfModified, setWhatIfModified] = useState(false);
  const [draftStep, setDraftStep] = useState<number | undefined>(undefined);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [cachedTaxGuide, setCachedTaxGuide] = useState<Record<string, unknown> | null>(null);

  // Check for existing token on mount.
  // Two phases: (1) fast token validation → authChecked=true immediately,
  // (2) profile + timeline hydration happens after the shell is visible.
  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (!token) {
        setAuthChecked(true);
        return;
      }

      const me = await getMe();
      if (!me) {
        setAuthChecked(true);
        return;
      }

      // User is authenticated — show the app shell immediately
      setUser({ id: me.id, email: me.email, token });
      if (me.cached_tax_guide) setCachedTaxGuide(me.cached_tax_guide);

      if (me.profile) {
        const { _draft_step, ...profileData } = me.profile as UserInput & { _draft_step?: number };
        setUserInput(profileData as UserInput);

        if (_draft_step) {
          setDraftStep(_draft_step);
          setAuthChecked(true);
          return;
        }

        if (me.cached_timeline) {
          // Instant: cached data from DB, no AI call needed
          setTimelineData(me.cached_timeline);
          setAuthChecked(true);
          return;
        }

        // No cached timeline — show shell, generate with AI
        setAuthChecked(true);
        setLoading(true);
        setGenerating(true);
        const rl = await checkRateLimit();
        if (!rl.allowed) {
          setTimelineError(`Rate limit reached \u2014 ${rl.limit} AI requests/day. Please wait and try again.`);
          setLoading(false);
          setGenerating(false);
        } else {
          try {
            const result = await generateTimeline(profileData as UserInput);
            setTimelineData(result);
            setTimelineError(null);
            saveCachedTimeline(result).catch(() => {});
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to generate timeline. Please try again.';
            setTimelineError(msg);
          } finally {
            setLoading(false);
            setGenerating(false);
          }
        }
        return;
      }

      // No profile — go to onboarding
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  function logout() {
    clearToken();
    setUser(null);
    setUserInput(null);
    setTimelineData(null);
    setSaved(false);
    setDraftStep(undefined);
    setIsEditingProfile(false);
    setTimelineError(null);
    setCachedTaxGuide(null);
  }

  function resetToOnboarding() {
    setUserInput(null);
    setTimelineData(null);
    setSaved(false);
    setIsEditingProfile(false);
    setDraftStep(undefined);
    setTimelineError(null);
    setCachedTaxGuide(null);
  }

  async function handleOnboardingSubmit(data: UserInput) {
    setUserInput(data);
    setSaved(false);
    setWhatIfModified(false);
    setIsEditingProfile(false);
    setDraftStep(undefined);
    setTimelineError(null);

    // Pre-check rate limit before expensive AI call
    const rl = await checkRateLimit();
    if (!rl.allowed) {
      setTimelineError(`Rate limit reached \u2014 ${rl.limit} AI requests/day. Please wait and try again.`);
      saveProfile(data).catch(() => {});
      return;
    }

    setLoading(true);
    setGenerating(true);
    try {
      const result = await generateTimeline(data);
      setTimelineData(result);
      setTimelineError(null);
      saveProfile(data).catch(() => {});
      saveCachedTimeline(result).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate timeline. Please try again.';
      setTimelineError(msg);
      saveProfile(data).catch(() => {});
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  async function handleSaveTimeline() {
    if (!userInput || !timelineData || !user) return;
    setSaving(true);
    try {
      await saveTimeline(userInput, timelineData);
      setSaved(true);
      toast('Timeline saved successfully!', 'success');
    } catch {
      toast('Failed to save timeline.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleSaveDraft(data: UserInput, step: number) {
    saveProfile({ ...data, _draft_step: step } as unknown as UserInput).catch(() => {});
  }

  async function handleWhatIfSimulate(modified: UserInput) {
    setSimulating(true);
    try {
      const result = await generateTimeline(modified);
      setTimelineData(result);
      setWhatIfModified(true);
      setSaved(false);
      toast('Timeline recalculated with your scenario.', 'success');
    } catch {
      toast('Failed to recalculate timeline.', 'error');
    } finally {
      setSimulating(false);
    }
  }

  async function handleWhatIfReset() {
    if (!userInput) return;
    setSimulating(true);
    try {
      const result = await generateTimeline(userInput);
      setTimelineData(result);
      setWhatIfModified(false);
      saveCachedTimeline(result).catch(() => {});
      toast('Timeline restored to your actual profile.', 'success');
    } catch {
      toast('Failed to restore timeline.', 'error');
    } finally {
      setSimulating(false);
    }
  }

  async function handleRetryTimeline() {
    if (!userInput) return;

    // Pre-check rate limit before expensive AI call
    const rl = await checkRateLimit();
    if (!rl.allowed) {
      setTimelineError(`Rate limit reached \u2014 ${rl.limit} AI requests/day. Please wait and try again.`);
      return;
    }

    setLoading(true);
    setGenerating(true);
    setTimelineError(null);
    try {
      const result = await generateTimeline(userInput);
      setTimelineData(result);
      saveCachedTimeline(result).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate timeline. Please try again.';
      setTimelineError(msg);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authChecked,
        userInput,
        setUserInput,
        timelineData,
        setTimelineData,
        timelineError,
        setTimelineError,
        loading,
        setLoading,
        generating,
        saving,
        saved,
        setSaved,
        simulating,
        setSimulating,
        whatIfModified,
        setWhatIfModified,
        draftStep,
        setDraftStep,
        isEditingProfile,
        setIsEditingProfile,
        cachedTaxGuide,
        setCachedTaxGuide,
        logout,
        resetToOnboarding,
        handleOnboardingSubmit,
        handleSaveTimeline,
        handleSaveDraft,
        handleWhatIfSimulate,
        handleWhatIfReset,
        handleRetryTimeline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
