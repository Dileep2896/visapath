import { useState, useEffect } from 'react';
import type { AppView, UserInput, TimelineResponse, AuthUser } from './types';
import { generateTimeline, saveTimeline, saveProfile, getMe, getToken, clearToken } from './utils/api';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import OnboardingForm from './components/OnboardingForm';
import TimelineDashboard from './components/TimelineDashboard';
import ActionItems from './components/ActionItems';
import AIChatPanel from './components/AIChatPanel';
import DocumentTracker from './components/DocumentTracker';
import ProfilePage from './components/ProfilePage';
import EmptyState from './components/EmptyState';
import { TimelineSkeleton } from './components/Skeleton';
import ToastContainer, { toast } from './components/Toast';
import { ListChecks, Save, Check } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>('onboarding');
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftStep, setDraftStep] = useState<number | undefined>(undefined);

  // Check for existing token on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (token) {
        const me = await getMe();
        if (me) {
          setUser({ id: me.id, email: me.email, token });
          setShowAuth(false);
          if (me.profile) {
            const { _draft_step, ...profileData } = me.profile as UserInput & { _draft_step?: number };
            if (_draft_step) {
              // Incomplete onboarding — resume at saved step
              setUserInput(profileData as UserInput);
              setDraftStep(_draft_step);
              setView('onboarding');
            } else {
              // Complete profile — generate timeline
              setUserInput(profileData as UserInput);
              setView('timeline');
              setLoading(true);
              try {
                const result = await generateTimeline(profileData as UserInput);
                setTimelineData(result);
              } catch {
                setView('onboarding');
              } finally {
                setLoading(false);
              }
            }
          }
        }
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  function handleAuth(authUser: AuthUser) {
    setUser(authUser);
    setShowAuth(false);
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setUserInput(null);
    setTimelineData(null);
    setView('onboarding');
    setShowAuth(true);
    setSaved(false);
  }

  async function handleOnboardingSubmit(data: UserInput) {
    setLoading(true);
    setUserInput(data);
    setView('timeline');
    setSaved(false);
    setIsEditingProfile(false);
    setDraftStep(undefined);
    try {
      const result = await generateTimeline(data);
      setTimelineData(result);
      // Fire-and-forget: persist complete profile (no _draft_step)
      saveProfile(data).catch(() => {});
    } catch {
      setView('onboarding');
      toast('Failed to generate timeline. Make sure the backend is running.', 'error');
    } finally {
      setLoading(false);
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
    // Fire-and-forget: save partial profile with draft step marker
    saveProfile({ ...data, _draft_step: step } as unknown as UserInput).catch(() => {});
  }

  function handleEditProfile() {
    setIsEditingProfile(true);
    setView('onboarding');
  }

  function handleNavigate(target: AppView) {
    if (target === 'onboarding') {
      setUserInput(null);
      setTimelineData(null);
      setSaved(false);
      setIsEditingProfile(false);
      setDraftStep(undefined);
    }
    setView(target);
  }

  if (!authChecked) return null;

  if (showAuth) {
    return (
      <>
        <ToastContainer />
        <AuthScreen onAuth={handleAuth} />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <Layout
        currentView={view}
        onNavigate={handleNavigate}
        showNav={view !== 'onboarding'}
        userEmail={user?.email}
        onLogout={handleLogout}
      >
        <div key={view} className={view !== 'onboarding' ? 'animate-fade-in h-full' : 'h-full'}>
          {view === 'onboarding' && (
            <OnboardingForm
              onSubmit={handleOnboardingSubmit}
              loading={loading}
              initialData={isEditingProfile || draftStep ? userInput : undefined}
              initialStep={isEditingProfile ? undefined : draftStep}
              onSaveDraft={handleSaveDraft}
            />
          )}
          {view === 'timeline' && !timelineData && (
            <TimelineSkeleton />
          )}
          {view === 'timeline' && timelineData && (
            <div className="h-full flex flex-col">
              {user && (
                <div className="flex justify-end px-6 pt-4">
                  <button
                    onClick={handleSaveTimeline}
                    disabled={saving || saved}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border cursor-pointer disabled:opacity-50 bg-navy-800 border-navy-700 text-slate-300 hover:border-teal-400 hover:text-teal-400"
                  >
                    {saved ? (
                      <>
                        <Check size={16} className="text-teal-400" />
                        Saved
                      </>
                    ) : saving ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save size={16} />
                        Save Timeline
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <TimelineDashboard data={timelineData} />
              </div>
            </div>
          )}
          {view === 'actions' && timelineData && (
            <ActionItems events={timelineData.timeline_events} />
          )}
          {view === 'actions' && !timelineData && (
            <EmptyState
              icon={<ListChecks size={32} className="text-slate-600 mx-auto" />}
              title="No action items yet"
              description="Complete the onboarding form to generate your timeline and action items."
              action={{ label: 'Start Onboarding', onClick: () => handleNavigate('onboarding') }}
            />
          )}
          {view === 'chat' && (
            <AIChatPanel userContext={userInput} />
          )}
          {view === 'documents' && (
            <DocumentTracker />
          )}
          {view === 'profile' && (
            <ProfilePage
              profile={userInput}
              onEdit={handleEditProfile}
              onStartOnboarding={() => handleNavigate('onboarding')}
            />
          )}
        </div>
      </Layout>
    </>
  );
}
