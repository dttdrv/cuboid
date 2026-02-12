import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Project } from '../core/data/types';
import ProjectCreationModal from './modals/ProjectCreationModal';
import ImportProjectModal from './modals/ImportProjectModal';
import { useAuth } from '../core/auth/AuthProvider';
import { listStoredProjectHandles, openDirectory } from '../core/storage/fs';
import { FileText, Plus, Search } from 'lucide-react';
import { backendCreateProject, backendListProjects } from '../core/backend/client';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [pathHint, setPathHint] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId && workspaceId !== selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaceId);
    }
  }, [workspaceId, selectedWorkspaceId, setSelectedWorkspaceId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const manifests = await backendListProjects();
        const mapped: Project[] = manifests.map((p) => ({
          id: p.id,
          owner_id: 'local',
          workspace_id: workspaceId || selectedWorkspaceId || undefined,
          name: p.name,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        }));
        setProjects(mapped);
      } catch (err: any) {
        setError(err?.message || 'Failed to load projects from backend.');
      } finally {
        setLoading(false);
      }
      const handles = listStoredProjectHandles();
      if (handles.length > 0) setPathHint(handles[0].pathHint);
    };
    void load();
  }, [workspaceId, selectedWorkspaceId]);

  const handleCreateProject = async (payload: { name: string }) => {
    setLoading(true);
    setError(null);
    try {
      const created = await backendCreateProject(payload.name);
      if (!created.id) {
        throw new Error('Backend did not return a project id.');
      }
      const project: Project = {
        id: created.id,
        owner_id: 'local',
        workspace_id: workspaceId || selectedWorkspaceId || undefined,
        name: created.name,
        created_at: created.createdAt,
        updated_at: created.updatedAt,
      };
      setProjects((current) => [project, ...current]);
      setIsCreationModalOpen(false);
      const targetWorkspace = workspaceId || selectedWorkspaceId || project.workspace_id;
      if (targetWorkspace) {
        navigate(`/app/${targetWorkspace}/projects/${project.id}/editor`);
      }
    } catch (err: any) {
      const raw = String(err?.message || '');
      const message = raw.includes('Failed to fetch')
        ? 'Backend is not running. Start it with npm run dev:backend.'
        : raw || 'Failed to create project.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
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

  const formatAge = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="min-h-screen bg-page-bg p-4 text-text-primary">
      <div className="mx-auto max-w-5xl">
        {/* ── Header ── */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-text-muted mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} • local workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsImportMenuOpen((open) => !open)}
                className="btn-secondary h-9 px-4 text-sm"
              >
                Import
              </button>
              {isImportMenuOpen && (
                <div className="absolute right-0 top-10 z-20 dropdown-menu w-48">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="dropdown-item"
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
                    className="dropdown-item"
                  >
                    Folder
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsCreationModalOpen(true)}
              className="btn-primary h-9 px-4 text-sm"
            >
              <Plus size={14} />
              New Project
            </button>
          </div>
        </header>

        {/* ── Search & Sort bar ── */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects…"
              className="input-field h-9 pl-9 text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'recent' | 'name')}
            className="select-field h-9 w-28 text-sm"
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            style={{ borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}
        {pathHint && <p className="mb-3 font-mono text-[11px] text-text-muted">{pathHint}</p>}

        {/* ── Loading ── */}
        {loading && sortedProjects.length === 0 && (
          <div className="py-16 text-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-text-muted/30 border-t-accent" />
            <p className="mt-3 text-sm text-text-muted">Loading projects…</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && sortedProjects.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-800">
              <FileText size={24} className="text-text-muted" />
            </div>
            <p className="text-text-secondary">No projects yet</p>
            <button
              type="button"
              onClick={() => setIsCreationModalOpen(true)}
              className="btn-primary h-9 px-5 text-sm"
            >
              <Plus size={14} />
              Create your first project
            </button>
          </div>
        )}

        {/* ── Project Grid ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                const targetWorkspace = workspaceId || selectedWorkspaceId || project.workspace_id;
                if (targetWorkspace) {
                  navigate(`/app/${targetWorkspace}/projects/${project.id}/editor`);
                }
              }}
              className="group flex flex-col border border-border-subtle bg-panel-bg p-4 text-left transition-all hover:border-border-active hover:bg-panel-raised hover:shadow-lg hover:shadow-black/20"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center bg-warm-800 text-text-muted group-hover:text-accent transition-colors"
                style={{ borderRadius: 'var(--radius-md)' }}>
                <FileText size={18} />
              </div>
              <span className="truncate text-sm font-medium text-text-primary">{project.name}</span>
              <span className="mt-1 font-mono text-[11px] text-text-muted">
                {formatAge(project.updated_at || project.created_at)} ago
              </span>
            </button>
          ))}
        </div>
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
