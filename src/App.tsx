import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthProvider';
import Login from './ui/Login';
import Dashboard from './ui/Dashboard';
import { EditorPage } from './ui/EditorPage';
import EmailSignInScreen from './ui/auth/EmailSignInScreen';
import CheckInboxScreen from './ui/auth/CheckInboxScreen';
import SessionExpiredScreen from './ui/auth/SessionExpiredScreen';
import AccessDeniedScreen from './ui/auth/AccessDeniedScreen';
import InviteAcceptanceScreen from './ui/auth/InviteAcceptanceScreen';
import UnlockSessionScreen from './ui/auth/UnlockSessionScreen';
import WorkspaceSelectScreen from './ui/workspaces/WorkspaceSelectScreen';
import CreateWorkspaceScreen from './ui/workspaces/CreateWorkspaceScreen';

import ProtectedRoute from './ui/routes/ProtectedRoute';
import WorkspaceRoute from './ui/routes/WorkspaceRoute';
import WorkspaceParamRoute from './ui/routes/WorkspaceParamRoute';
import RedirectToWorkspaceProjects from './ui/routes/RedirectToWorkspaceProjects';
import RedirectLegacyEditor from './ui/routes/RedirectLegacyEditor';
import RedirectLegacyInvite from './ui/routes/RedirectLegacyInvite';
import HomeRoute from './ui/routes/HomeRoute';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/login/email" element={<EmailSignInScreen />} />
          <Route path="/auth/login/email/sent" element={<CheckInboxScreen />} />
          <Route path="/auth/expired" element={<SessionExpiredScreen />} />
          <Route path="/auth/unlock" element={<UnlockSessionScreen />} />
          <Route path="/auth/denied" element={<AccessDeniedScreen />} />
          <Route path="/auth/invites/:token" element={<InviteAcceptanceScreen />} />
          <Route
            path="/workspaces/select"
            element={
              <ProtectedRoute>
                <WorkspaceSelectScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/new"
            element={
              <ProtectedRoute>
                <CreateWorkspaceScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/:workspaceId/projects"
            element={
              <ProtectedRoute>
                <WorkspaceRoute>
                  <WorkspaceParamRoute>
                    <Dashboard />
                  </WorkspaceParamRoute>
                </WorkspaceRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/:workspaceId/projects/:projectId/editor"
            element={
              <ProtectedRoute>
                <WorkspaceRoute>
                  <WorkspaceParamRoute>
                    <EditorPage />
                  </WorkspaceParamRoute>
                </WorkspaceRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/:workspaceId/projects/:projectId/settings"
            element={
              <ProtectedRoute>
                <WorkspaceRoute>
                  <WorkspaceParamRoute>
                    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 text-text-secondary">
                      Project settings are coming soon.
                    </div>
                  </WorkspaceParamRoute>
                </WorkspaceRoute>
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/login/email" element={<Navigate to="/auth/login/email" replace />} />
          <Route path="/login/email/sent" element={<Navigate to="/auth/login/email/sent" replace />} />
          <Route path="/invites/:token" element={<RedirectLegacyInvite />} />
          <Route path="/workspaces" element={<Navigate to="/workspaces/select" replace />} />
          <Route path="/app/projects" element={<RedirectToWorkspaceProjects />} />
          <Route
            path="/editor/:projectId"
            element={
              <ProtectedRoute>
                <RedirectLegacyEditor />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<RedirectToWorkspaceProjects />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
