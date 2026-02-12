import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComposerPane from './ComposerPane';

const defaultProps = {
    prompt: '',
    aiEnabled: true,
    aiBusy: false,
    aiProviderLabel: 'nvidia',
    aiModelLabel: 'kimi-k2.5',
    messages: [],
    attachedImageName: null,
    onPromptChange: vi.fn(),
    onPromptSubmit: vi.fn(),
    onToggleAi: vi.fn(),
    onClearMessages: vi.fn(),
    onAttachImage: vi.fn(),
    onRemoveImage: vi.fn(),
};

describe('ComposerPane AI toggle', () => {
    it('shows AI ON when enabled', () => {
        render(<ComposerPane {...defaultProps} aiEnabled={true} />);
        expect(screen.getByText('AI ON')).toBeInTheDocument();
    });

    it('shows AI OFF when disabled', () => {
        render(<ComposerPane {...defaultProps} aiEnabled={false} />);
        expect(screen.getByText('AI OFF')).toBeInTheDocument();
    });

    it('disables input when AI is off', () => {
        render(<ComposerPane {...defaultProps} aiEnabled={false} />);
        const input = screen.getByPlaceholderText('AI disabled');
        expect(input).toBeDisabled();
    });

    it('enables input when AI is on', () => {
        render(<ComposerPane {...defaultProps} aiEnabled={true} />);
        const input = screen.getByPlaceholderText('Ask anything…');
        expect(input).not.toBeDisabled();
    });

    it('calls onToggleAi on button click', () => {
        const onToggleAi = vi.fn();
        render(<ComposerPane {...defaultProps} onToggleAi={onToggleAi} />);
        fireEvent.click(screen.getByText('AI ON'));
        expect(onToggleAi).toHaveBeenCalledTimes(1);
    });

    it('disables input when aiBusy', () => {
        render(<ComposerPane {...defaultProps} aiBusy={true} />);
        const input = screen.getByPlaceholderText('Ask anything…');
        expect(input).toBeDisabled();
    });
});
