import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import { projectService } from '../core/data/ProjectService';
import type { Project } from '../core/data/types';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
            <span className="text-lg">🧊</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Cuboid</h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-600">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your Research</h2>
              <p className="mt-1 text-sm text-slate-500">Encrypted Projects • Zero Knowledge</p>
            </div>
            <button
              onClick={() => navigate('/editor/new')}
              className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-orange-500/10 transition-all hover:bg-slate-800 hover:shadow-orange-500/20 active:scale-95"
            >
              <span className="text-orange-400 font-bold text-lg">+</span>
              <span>New Project</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200"></div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
              <div className="mb-4 text-4xl">📂</div>
              <h3 className="text-lg font-medium text-slate-900">No projects yet</h3>
              <p className="mt-2 text-sm text-slate-500">Create your first encrypted project to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/editor/${project.id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-2xl text-orange-600">
                      📁
                    </div>
                    <div className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 flex items-center gap-1">
                      🔒 Encrypted
                    </div>
                  </div>

                  <h3 className="mb-1 text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {project.name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Last edited just now</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;