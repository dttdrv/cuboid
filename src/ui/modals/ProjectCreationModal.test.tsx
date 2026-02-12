import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectCreationModal from './ProjectCreationModal';

describe('ProjectCreationModal', () => {
    const onCreateProject = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    const renderModal = (props = {}) =>
        render(
            <ProjectCreationModal
                isOpen={true}
                onCreateProject={onCreateProject}
                onCancel={onCancel}
                {...props}
            />,
        );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when open', () => {
        renderModal();
        expect(screen.getByText('New Project')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Untitled project')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        const { container } = render(
            <ProjectCreationModal isOpen={false} onCreateProject={onCreateProject} onCancel={onCancel} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('disables submit when name is empty', () => {
        renderModal();
        const submitButton = screen.getByText('Create');
        expect(submitButton).toBeDisabled();
    });

    it('enables submit when name is provided', () => {
        renderModal();
        const input = screen.getByPlaceholderText('Untitled project');
        fireEvent.change(input, { target: { value: 'My Project' } });
        const submitButton = screen.getByText('Create');
        expect(submitButton).not.toBeDisabled();
    });

    it('calls onCreateProject on submit', async () => {
        renderModal();
        const input = screen.getByPlaceholderText('Untitled project');
        fireEvent.change(input, { target: { value: 'Test Project' } });

        const form = input.closest('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(onCreateProject).toHaveBeenCalledWith({ name: 'Test Project' });
        });
    });

    it('calls onCancel on Escape key', () => {
        renderModal();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalled();
    });

    it('calls onCancel on Cancel button', () => {
        renderModal();
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        expect(onCancel).toHaveBeenCalled();
    });

    it('shows error message on failed creation', async () => {
        onCreateProject.mockRejectedValueOnce(new Error('Network error'));
        renderModal();
        const input = screen.getByPlaceholderText('Untitled project');
        fireEvent.change(input, { target: { value: 'Failing Project' } });

        const form = input.closest('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });
});
