import React, { useEffect, useState } from 'react';

interface ProjectCreationModalProps {
    isOpen: boolean;
    onCreateProject: (payload: { name: string }) => Promise<void>;
    onCancel: () => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
    isOpen,
    onCreateProject,
    onCancel,
}) => {
    const [projectName, setProjectName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setProjectName('');
            setSubmitting(false);
            setError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !submitting) {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, submitting, onCancel]);

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = projectName.trim();
        if (!name) return;

        setSubmitting(true);
        setError(null);
        try {
            await onCreateProject({ name });
        } catch (err: any) {
            setError(err?.message || 'Failed to create project.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget && !submitting) onCancel();
            }}
        >
            <div className="modal-card">
                <h2 className="text-lg font-semibold text-text-primary">New Project</h2>
                <p className="mt-1 text-sm text-text-muted">Give your project a name to get started.</p>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="project-name"
                            className="mb-1.5 block text-sm font-medium text-text-secondary"
                        >
                            Project Name
                        </label>
                        <input
                            id="project-name"
                            type="text"
                            value={projectName}
                            onChange={(event) => setProjectName(event.target.value)}
                            placeholder="Untitled project"
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                            style={{ borderRadius: 'var(--radius-sm)' }}>
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-ghost h-9 text-sm"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary h-9 px-5 text-sm disabled:opacity-50"
                            disabled={!projectName.trim() || submitting}
                        >
                            {submitting ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectCreationModal;
