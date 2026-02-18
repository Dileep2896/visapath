import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/routes/RequireAuth';
import RequireOnboarded from './components/routes/RequireOnboarded';
import RequireAdmin from './components/routes/RequireAdmin';
import AppLayout from './components/routes/AppLayout';
import LoginPage from './pages/LoginPage';
import ToastContainer from './components/Toast';

// Lazy-loaded pages
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const AlertsPageRoute = lazy(() => import('./pages/AlertsPage'));
const ActionsPageRoute = lazy(() => import('./pages/ActionsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const TaxGuidePageRoute = lazy(() => import('./pages/TaxGuidePage'));
const ProfilePageRoute = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-teal-400/20 border-t-teal-400 animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route element={<RequireOnboarded />}>
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/alerts" element={<AlertsPageRoute />} />
                <Route path="/actions" element={<ActionsPageRoute />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/tax-guide" element={<TaxGuidePageRoute />} />
                <Route path="/profile" element={<ProfilePageRoute />} />
              </Route>
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/timeline" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
