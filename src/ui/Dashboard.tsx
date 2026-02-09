import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { Project } from '../core/data/types';
import ProjectCreationModal, {
  ProjectTemplate,
} from './modals/ProjectCreationModal';
import ImportProjectModal from './modals/ImportProjectModal';
import { useAuth } from '../core/auth/AuthProvider';
import { listStoredProjectHandles, openDirectory, runtimeCapabilities } from '../core/storage/fs';
import { Grid2X2, ListFilter, Plus, Search } from 'lucide-react';

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
    load();
  }, [listProjects, workspaceId]);

  const hasProjects = projects.length > 0;

  const handleCreateProject = async (payload: {
    name: string;
    template: ProjectTemplate;
    realtimeCompilation: boolean;
  }) => {
    const newProject = await createProject(payload.name);
    if (newProject) {
      setProjects((current) => [newProject, ...current]);
      setIsCreationModalOpen(false);
      const targetWorkspace = workspaceId || selectedWorkspaceId || newProject.workspace_id;
      if (targetWorkspace) {
        navigate(`/app/${targetWorkspace}/projects/${newProject.id}/editor`);
      }
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
  return (
    <div className="min-h-screen bg-charcoal-950 p-2 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1540px] overflow-hidden rounded-3xl border border-white/[0.06] bg-charcoal-900">
        <aside className="w-72 border-r border-white/[0.06] bg-[#111216] p-4">
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm text-text-secondary">Workspace</p>
            <button type="button" className="rounded-lg p-2 text-text-muted hover:bg-charcoal-850" title="Filter">
              <ListFilter size={16} />
            </button>
          </div>
          <p className="mb-4 text-3xl font-medium text-white/95">Projects</p>
          <div className="space-y-1">
            <button
              type="button"
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                activeFilter === 'all' ? 'selection-pill' : 'hover:bg-charcoal-850'
              }`}
              onClick={() => setActiveFilter('all')}
            >
              All Projects
            </button>
            <button
              type="button"
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                activeFilter === 'yours' ? 'selection-pill' : 'hover:bg-charcoal-850'
              }`}
              onClick={() => setActiveFilter('yours')}
            >
              Your Projects
            </button>
            <button
              type="button"
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                activeFilter === 'shared' ? 'selection-pill' : 'hover:bg-charcoal-850'
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
                  className="input-pill w-72 pl-9"
                />
              </div>
              <button type="button" className="rounded-full border border-white/[0.08] bg-charcoal-850 p-2 text-text-secondary hover:bg-charcoal-800" title="List view">
                <ListFilter size={16} />
              </button>
              <button type="button" className="rounded-full border border-white/[0.08] bg-charcoal-850 p-2 text-text-secondary hover:bg-charcoal-800" title="Grid view">
                <Grid2X2 size={16} />
              </button>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'recent' | 'name')}
                className="h-11 rounded-full border border-white/[0.06] bg-charcoal-850 px-4 text-sm text-text-secondary outline-none focus:border-accent"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
              </select>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="btn-pill-secondary"
              >
                Import
              </button>
              <button
                type="button"
                onClick={async () => {
                  const handle = await openDirectory();
                  if (handle) setPathHint(handle.pathHint);
                }}
                disabled={!runtimeCapabilities.fileSystemAccessSupported}
                className="btn-pill-secondary disabled:opacity-40"
                title={runtimeCapabilities.fileSystemAccessSupported ? 'Open folder from local disk' : 'File System Access API unavailable in this browser'}
              >
                Open Folder
              </button>
              <button type="button" onClick={() => setIsCreationModalOpen(true)} className="btn-pill-primary">
                <Plus size={14} />
                New
              </button>
            </div>
          </header>
          <div className="mb-3 text-xs text-text-muted">
            {pathHint ? `Path: ${pathHint}` : 'Path: local workspace sandbox'}
          </div>

          {error && <p className="inline-notice-error mb-3">{error}</p>}

          {loading && !hasProjects && <div className="text-text-secondary">Loading projects...</div>}

          {!loading && renderedProjects.length === 0 && (
            <section className="flex min-h-[65vh] items-center justify-center rounded-2xl border border-white/[0.06] bg-charcoal-900">
              <div className="max-w-xl text-center">
                <h2 className="text-2xl font-semibold">No projects yet</h2>
                <p className="mt-3 text-sm text-text-secondary">
                  Create a new project or import from zip/GitHub.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreationModalOpen(true)}
                    className="btn-pill-primary"
                  >
                    + New Project
                  </button>
                  <button type="button" onClick={() => setIsImportModalOpen(true)} className="btn-pill-secondary">
                    Import
                  </button>
                </div>
              </div>
            </section>
          )}

          {renderedProjects.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-charcoal-900/60">
              <div className="grid grid-cols-[2fr_1fr_1fr_120px] border-b border-white/[0.06] bg-charcoal-850 px-5 py-2 text-xs uppercase tracking-wide text-text-muted">
                <span>Project</span>
                <span>Last Edited</span>
                <span>Last Compile</span>
                <span>Collaborators</span>
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
                  className="grid w-full grid-cols-[2fr_1fr_1fr_120px] items-center border-b border-white/[0.06] bg-charcoal-900/60 px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-charcoal-850"
                >
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="text-xs text-text-secondary">
                    {new Date(project.updated_at || project.created_at).toLocaleString()}
                  </span>
                  <span className="text-xs text-text-muted">
                    Not compiled
                  </span>
                  <span className="text-xs text-text-muted">
                    Local
                  </span>
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
