import React, { useState } from 'react';

export type ProjectTemplate = 'Blank' | 'Article' | 'Beamer' | 'IEEE/ACM';

interface ProjectCreationModalProps {
    isOpen: boolean;
    onCreateProject: (payload: {
        name: string;
        template: ProjectTemplate;
        realtimeCompilation: boolean;
    }) => void;
    onCancel: () => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
    isOpen,
    onCreateProject,
    onCancel,
}) => {
    const [projectName, setProjectName] = useState('');
    const [template, setTemplate] = useState<ProjectTemplate>('Blank');
    const [realtimeCompilation, setRealtimeCompilation] = useState(true);

    if (!isOpen) return null;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = projectName.trim();
        if (!name) return;

        onCreateProject({
            name,
            template,
            realtimeCompilation,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-charcoal-900 p-6 shadow-2xl shadow-black/40">
                <h2 className="text-lg font-semibold text-text-primary">New Project</h2>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="project-name"
                            className="mb-2 block text-sm font-medium text-text-secondary"
                        >
                            Project Name
                        </label>
                        <input
                            id="project-name"
                            type="text"
                            value={projectName}
                            onChange={(event) => setProjectName(event.target.value)}
                            placeholder="Untitled project"
                            className="input-pill"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="project-template"
                            className="mb-2 block text-sm font-medium text-text-secondary"
                        >
                            Template
                        </label>
                        <select
                            id="project-template"
                            value={template}
                            onChange={(event) => setTemplate(event.target.value as ProjectTemplate)}
                            className="h-11 w-full rounded-full border border-white/[0.06] bg-charcoal-850 px-4 text-sm text-text-primary outline-none focus:border-accent"
                        >
                            <option value="Blank">Blank</option>
                            <option value="Article">Article</option>
                            <option value="Beamer">Beamer</option>
                            <option value="IEEE/ACM">IEEE/ACM</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-charcoal-850 px-4 py-3">
                        <span className="text-sm text-text-secondary">Enable realtime compilation</span>
                        <button
                            type="button"
                            aria-pressed={realtimeCompilation}
                            onClick={() => setRealtimeCompilation((enabled) => !enabled)}
                            className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                realtimeCompilation ? 'bg-accent' : 'bg-charcoal-700'
                            }`}
                        >
                            <span
                                className={`h-5 w-5 rounded-full bg-white transition-transform ${
                                    realtimeCompilation ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-pill-tertiary h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-pill-primary h-9 px-4 disabled:opacity-50"
                            disabled={!projectName.trim()}
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectCreationModal;
