import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { Project } from '../core/data/types';
import AISettings from './AISettings';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { listProjects, createProject, loading, error } = useDataLayer();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await listProjects();
      setProjects(data);
    };
    load();
  }, [listProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject = await createProject(newProjectName);
    if (newProject) {
      setProjects([newProject, ...projects]);
      setNewProjectName('');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen relative">
      <h1 className="text-3xl font-bold mb-8">My Projects</h1>

      <form onSubmit={handleCreateProject} className="mb-8 flex gap-4">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New Project Name"
          className="flex-1 p-2 border rounded bg-gray-800 text-white border-gray-600"
          disabled={loading}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          Create Project
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading && projects.length === 0 && <div>Loading projects...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/editor/${project.id}`)}
            className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
            <p className="text-sm text-gray-400">Created: {new Date(project.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {!loading && projects.length === 0 && (
        <div className="text-center text-gray-500 mt-12">No projects found. Create one to get started!</div>
      )}

      {/* AI Settings Overlay */}
      <AISettings />
    </div>
  );
};

export default Dashboard;