import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { Project } from '../core/data/types';
import ProjectCreationModal, { ProjectTemplate } from './modals/ProjectCreationModal';
import ImportProjectModal from './modals/ImportProjectModal';
import { useAuth } from '../core/auth/AuthProvider';
import { listStoredProjectHandles, openDirectory, runtimeCapabilities } from '../core/storage/fs';
import { Bot, FolderOpen, Plus, Search } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useAuth();
  const { listProjects, createProject, loading, error } = useDataLayer();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'yours' | 'shared'>('yours');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [pathHint, setPathHint] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId && workspaceId !== selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaceId);
    }
  }, [workspaceId, selectedWorkspaceId, setSelectedWorkspaceId]);

  useEffect(() => {
    const load = async () => {
      const data = await listProjects(workspaceId);
      setProjects(data);
      const handles = listStoredProjectHandles();
      if (handles.length > 0) setPathHint(handles[0].pathHint);
    };
    void load();
  }, [listProjects, workspaceId]);

  const handleCreateProject = async (payload: {
    name: string;
    template: ProjectTemplate;
    realtimeCompilation: boolean;
  }) => {
    const project = await createProject(payload.name);
    if (!project) return;
    setProjects((current) => [project, ...current]);
    setIsCreationModalOpen(false);
    const targetWorkspace = workspaceId || selectedWorkspaceId || project.workspace_id;
    if (targetWorkspace) {
      navigate(`/app/${targetWorkspace}/projects/${project.id}/editor`);
    }
  };

  const sortedProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (!query.trim()) return true;
      return project.name.toLowerCase().includes(query.trim().toLowerCase());
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  }, [projects, query, sortBy]);

  const renderedProjects = activeFilter === 'shared' ? [] : sortedProjects;
  const latestProject = sortedProjects[0];

  return (
    <div className="min-h-screen bg-charcoal-950 p-2 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1540px] overflow-hidden border border-white/[0.08] bg-charcoal-900">
        <aside className="w-72 border-r border-white/[0.08] bg-charcoal-950 p-4">
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm text-text-secondary">Workspace</p>
            <button type="button" className="btn-icon h-9 w-9" title="Local workspace">
              <FolderOpen size={16} />
            </button>
          </div>
          <p className="mb-4 text-3xl font-medium text-white/95">Projects</p>
          <div className="space-y-1">
            <button
              type="button"
              className={`w-full border border-transparent px-3 py-2 text-left text-sm transition-colors ${
                activeFilter === 'all'
                  ? 'selection-row text-text-primary'
                  : 'text-text-secondary hover:border-white/[0.08] hover:bg-charcoal-850'
              }`}
              onClick={() => setActiveFilter('all')}
            >
              All Projects
            </button>
            <button
              type="button"
              className={`w-full border border-transparent px-3 py-2 text-left text-sm transition-colors ${
                activeFilter === 'yours'
                  ? 'selection-row text-text-primary'
                  : 'text-text-secondary hover:border-white/[0.08] hover:bg-charcoal-850'
              }`}
              onClick={() => setActiveFilter('yours')}
            >
              Your Projects
            </button>
            <button
              type="button"
              className={`w-full border border-transparent px-3 py-2 text-left text-sm transition-colors ${
                activeFilter === 'shared'
                  ? 'selection-row text-text-primary'
                  : 'text-text-secondary hover:border-white/[0.08] hover:bg-charcoal-850'
              }`}
              onClick={() => setActiveFilter('shared')}
            >
              Shared with you
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Your Projects</h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="input-field w-72 pl-9"
                />
              </div>
              <select
                value={`${activeFilter}:${sortBy}`}
                onChange={(event) => {
                  const [nextFilter, nextSort] = event.target.value.split(':');
                  setActiveFilter(nextFilter as 'all' | 'yours' | 'shared');
                  setSortBy(nextSort as 'recent' | 'name');
                }}
                className="select-field w-40 text-text-secondary"
              >
                <option value="yours:recent">Your · Recent</option>
                <option value="all:recent">All · Recent</option>
                <option value="yours:name">Your · Name</option>
                <option value="shared:recent">Shared · Recent</option>
              </select>

              {latestProject && (
                <button
                  type="button"
                  onClick={() => {
                    const targetWorkspace = workspaceId || selectedWorkspaceId || latestProject.workspace_id;
                    if (targetWorkspace) {
                      navigate(`/app/${targetWorkspace}/projects/${latestProject.id}/editor`);
                    }
                  }}
                  className="btn-secondary"
                >
                  <Bot size={14} />
                  Continue with AI
                </button>
              )}

              <button type="button" onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                Import
              </button>
              <button
                type="button"
                onClick={async () => {
                  const handle = await openDirectory();
                  if (handle) setPathHint(handle.pathHint);
                }}
                disabled={!runtimeCapabilities.fileSystemAccessSupported}
                className="btn-secondary disabled:opacity-40"
                title={runtimeCapabilities.fileSystemAccessSupported ? 'Open folder from local disk' : 'File System Access API unavailable in this browser'}
              >
                Open Folder
              </button>
              <button type="button" onClick={() => setIsCreationModalOpen(true)} className="btn-primary">
                <Plus size={14} />
                New agentic session
              </button>
            </div>
          </header>

          <div className="mb-3 text-xs text-text-muted">
            {pathHint ? `Path: ${pathHint}` : 'Path: local workspace sandbox'}
          </div>

          {error && <p className="inline-notice-error mb-3">{error}</p>}
          {loading && renderedProjects.length === 0 && <div className="text-text-secondary">Loading projects...</div>}

          {!loading && renderedProjects.length === 0 && (
            <section className="flex min-h-[65vh] items-center justify-center border border-white/[0.08] bg-charcoal-900">
              <div className="max-w-xl text-center">
                <h2 className="text-2xl font-semibold">No projects yet</h2>
                <p className="mt-3 text-sm text-text-secondary">
                  Start a new agentic writing session or import from local/GitHub.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button type="button" onClick={() => setIsCreationModalOpen(true)} className="btn-primary">
                    <Bot size={14} />
                    New Agentic Session
                  </button>
                  <button type="button" onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                    Import
                  </button>
                </div>
              </div>
            </section>
          )}

          {renderedProjects.length > 0 && (
            <section className="overflow-hidden border border-white/[0.08] bg-charcoal-900/60">
              <div className="grid grid-cols-[2fr_1fr_1fr_120px] border-b border-white/[0.08] bg-charcoal-850 px-5 py-2 text-xs uppercase tracking-wide text-text-muted">
                <span>Project</span>
                <span>Last Edited</span>
                <span>Workflow</span>
                <span>Status</span>
              </div>
              {renderedProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    const targetWorkspace = workspaceId || selectedWorkspaceId || project.workspace_id;
                    if (targetWorkspace) {
                      navigate(`/app/${targetWorkspace}/projects/${project.id}/editor`);
                    }
                  }}
                  className="grid w-full grid-cols-[2fr_1fr_1fr_120px] items-center border-b border-white/[0.08] bg-charcoal-900/60 px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-charcoal-850"
                >
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="text-xs text-text-secondary">{new Date(project.updated_at || project.created_at).toLocaleString()}</span>
                  <span className="text-xs text-text-secondary">Agent-led</span>
                  <span className="text-xs text-text-muted">Local</span>
                </button>
              ))}
            </section>
          )}
        </main>
      </div>

      <ProjectCreationModal
        isOpen={isCreationModalOpen}
        onCreateProject={handleCreateProject}
        onCancel={() => setIsCreationModalOpen(false)}
      />
      <ImportProjectModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
