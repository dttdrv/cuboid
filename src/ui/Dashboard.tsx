import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { Project } from '../core/data/types';
import ProjectCreationModal, { ProjectTemplate } from './modals/ProjectCreationModal';
import ImportProjectModal from './modals/ImportProjectModal';
import { useAuth } from '../core/auth/AuthProvider';
import { listStoredProjectHandles, openDirectory } from '../core/storage/fs';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useAuth();
  const { listProjects, createProject, loading, error } = useDataLayer();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
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
  const displayProjects = renderedProjects.length > 0
    ? renderedProjects
    : [{
        id: '__placeholder__',
        name: 'New Project',
        created_at: new Date().toISOString(),
        updated_at: new Date(Date.now() - (11 * 24 * 60 * 60 * 1000)).toISOString(),
        owner_id: 'placeholder',
      } as Project];

  return (
    <div className="min-h-screen bg-page-bg p-3 text-text-primary">
      <div className="mx-auto grid h-[calc(100vh-1.5rem)] max-w-[1500px] grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="panel flex min-h-0 flex-col">
          <div className="border-b border-border-subtle p-3">
            <p className="text-sm font-semibold text-text-primary">Projects</p>
          </div>
          <nav className="space-y-1 p-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`w-full px-2 py-1 text-left text-sm ${activeFilter === 'all' ? 'bg-surface-muted text-text-primary' : 'text-text-secondary'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('yours')}
              className={`w-full px-2 py-1 text-left text-sm ${activeFilter === 'yours' ? 'bg-surface-muted text-text-primary' : 'text-text-secondary'}`}
            >
              Yours
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('shared')}
              className={`w-full px-2 py-1 text-left text-sm ${activeFilter === 'shared' ? 'bg-surface-muted text-text-primary' : 'text-text-secondary'}`}
            >
              Shared
            </button>
          </nav>
        </aside>

        <main className="panel min-h-0 overflow-hidden">
          <header className="flex flex-wrap items-center gap-2 border-b border-border-subtle p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              className="input-field h-9 min-w-[220px] max-w-[420px] flex-1 px-2 text-sm"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'recent' | 'name')}
              className="select-field h-9 w-[130px] px-2 text-sm"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
            </select>
            <div className="relative">
              <button type="button" onClick={() => setIsImportMenuOpen((open) => !open)} className="btn-secondary h-9 px-3 text-sm">
                Import
              </button>
              {isImportMenuOpen && (
                <div className="absolute right-0 top-10 z-20 w-[230px] border border-border-subtle bg-panel-raised p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="block w-full px-2 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  >
                    Archive (.zip, .tar.gz)
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsImportMenuOpen(false);
                      const handle = await openDirectory();
                      if (handle) setPathHint(handle.pathHint);
                    }}
                    className="block w-full px-2 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  >
                    Folder
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => setIsCreationModalOpen(true)} className="btn-primary h-9 px-3 text-sm">
              <Plus size={14} />
              New
            </button>
          </header>

          <div className="h-[calc(100%-52px)] overflow-y-auto p-3">
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
            {pathHint && <p className="mb-2 text-xs text-text-muted">{pathHint}</p>}
            {loading && renderedProjects.length === 0 && <div className="text-sm text-text-secondary">Loading projects...</div>}

            <div className="space-y-1">
              {displayProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    if (project.id === '__placeholder__') {
                      setIsCreationModalOpen(true);
                      return;
                    }
                    const targetWorkspace = workspaceId || selectedWorkspaceId || project.workspace_id;
                    if (targetWorkspace) {
                      navigate(`/app/${targetWorkspace}/projects/${project.id}/editor`);
                    }
                  }}
                  className="flex w-full items-center justify-between border border-border-subtle bg-panel-raised px-3 py-2 text-left hover:bg-surface-muted"
                >
                  <span className="truncate text-sm text-text-primary">{project.name}</span>
                  <span className="text-xs text-text-muted">
                    {Math.max(1, Math.floor((Date.now() - new Date(project.updated_at || project.created_at).getTime()) / (1000 * 60 * 60 * 24)))}d
                  </span>
                </button>
              ))}
            </div>
          </div>
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
