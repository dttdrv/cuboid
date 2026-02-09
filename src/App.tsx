import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthProvider';
import Login from './ui/Login';
import Dashboard from './ui/Dashboard';
import { EditorPage } from './ui/EditorPage';
import { useAuth } from './core/auth/AuthProvider';
import EmailSignInScreen from './ui/auth/EmailSignInScreen';
import CheckInboxScreen from './ui/auth/CheckInboxScreen';
import SessionExpiredScreen from './ui/auth/SessionExpiredScreen';
import AccessDeniedScreen from './ui/auth/AccessDeniedScreen';
import InviteAcceptanceScreen from './ui/auth/InviteAcceptanceScreen';
import WorkspaceSelectScreen from './ui/workspaces/WorkspaceSelectScreen';
import CreateWorkspaceScreen from './ui/workspaces/CreateWorkspaceScreen';
import LoadingScreen from './ui/components/LoadingScreen';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

const WorkspaceRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedWorkspaceId, workspaces, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />;
  if (workspaces.length > 1 && !selectedWorkspaceId) {
    return <Navigate to="/workspaces/select" replace />;
  }

  return <>{children}</>;
};

const WorkspaceParamRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, workspaces, selectedWorkspaceId, setSelectedWorkspaceId } = useAuth();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  React.useEffect(() => {
    if (!workspaceId) return;
    if (selectedWorkspaceId === workspaceId) return;
    if (!workspaces.some((workspace) => workspace.id === workspaceId)) return;
    setSelectedWorkspaceId(workspaceId);
  }, [workspaceId, selectedWorkspaceId, workspaces, setSelectedWorkspaceId]);

  if (loading) return <LoadingScreen />;
  if (!workspaceId) return <Navigate to="/workspaces/select" replace />;
  if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
    return <Navigate to="/auth/denied" replace />;
  }

  return <>{children}</>;
};

const RedirectToWorkspaceProjects: React.FC = () => {
  const { loading, user, selectedWorkspaceId, workspaces } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (selectedWorkspaceId) return <Navigate to={`/app/${selectedWorkspaceId}/projects`} replace />;
  if (workspaces.length === 1) return <Navigate to={`/app/${workspaces[0].id}/projects`} replace />;
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />;
  return <Navigate to="/workspaces/select" replace />;
};

const RedirectLegacyEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { loading, selectedWorkspaceId, workspaces } = useAuth();
  if (loading) return <LoadingScreen />;
  const workspaceId = selectedWorkspaceId || workspaces[0]?.id;
  if (!workspaceId) return <Navigate to="/workspaces/select" replace />;
  if (!projectId) return <Navigate to={`/app/${workspaceId}/projects`} replace />;
  return <Navigate to={`/app/${workspaceId}/projects/${projectId}/editor`} replace />;
};

const RedirectLegacyInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  if (!token) return <Navigate to="/auth/denied" replace />;
  return <Navigate to={`/auth/invites/${token}`} replace />;
};

const HomeRoute: React.FC = () => {
  const { user, selectedWorkspaceId, workspaces, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />;
  if (workspaces.length > 1 && !selectedWorkspaceId) return <Navigate to="/workspaces/select" replace />;
  return <Navigate to={`/app/${selectedWorkspaceId || workspaces[0].id}/projects`} replace />;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/login/email" element={<EmailSignInScreen />} />
          <Route path="/auth/login/email/sent" element={<CheckInboxScreen />} />
          <Route path="/auth/expired" element={<SessionExpiredScreen />} />
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
