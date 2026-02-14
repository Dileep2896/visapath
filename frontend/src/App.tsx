import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/routes/RequireAuth';
import RequireOnboarded from './components/routes/RequireOnboarded';
import AppLayout from './components/routes/AppLayout';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import TimelinePage from './pages/TimelinePage';
import AlertsPageRoute from './pages/AlertsPage';
import ActionsPageRoute from './pages/ActionsPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import TaxGuidePageRoute from './pages/TaxGuidePage';
import ProfilePageRoute from './pages/ProfilePage';
import ToastContainer from './components/Toast';

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
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
        <Route path="*" element={<Navigate to="/timeline" replace />} />
      </Routes>
    </>
  );
}
