import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import ArtifactPane from './ArtifactPane';
import ComposerPane from './ComposerPane';
import LeftPane from './LeftRail';
import PdfViewer from '../PdfViewer';
import { EditorShellProps } from './contracts';

const MIN_LEFT_WIDTH = 180;
const MAX_LEFT_WIDTH = 420;
const MIN_RIGHT_WIDTH = 320;
const MAX_RIGHT_WIDTH = 960;
const MIN_EDITOR_WIDTH = 440;
const SPLITTER_WIDTH = 6;

type DragTarget = 'left' | 'right' | null;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const EditorShell: React.FC<EditorShellProps> = ({
  leftPane,
  editorPane,
  composerPane,
  previewPane,
  leftPaneVisible,
  onShowLeftPane,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    target: DragTarget;
    startX: number;
    startLeft: number;
    startRight: number;
  } | null>(null);

  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(620);

  const effectiveLeftWidth = leftPaneVisible ? leftWidth : 0;

  useEffect(() => {
    const clampForViewport = () => {
      if (!rootRef.current) return;
      const containerWidth = rootRef.current.getBoundingClientRect().width;
      const splitterBudget = leftPaneVisible ? SPLITTER_WIDTH * 2 : SPLITTER_WIDTH;
      const maxRight = Math.max(MIN_RIGHT_WIDTH, containerWidth - effectiveLeftWidth - MIN_EDITOR_WIDTH - splitterBudget);
      setRightWidth((current) => clamp(current, MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, maxRight)));
      if (leftPaneVisible) {
        const maxLeft = Math.max(MIN_LEFT_WIDTH, containerWidth - rightWidth - MIN_EDITOR_WIDTH - splitterBudget);
        setLeftWidth((current) => clamp(current, MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, maxLeft)));
      }
    };

    clampForViewport();
    window.addEventListener('resize', clampForViewport);
    return () => window.removeEventListener('resize', clampForViewport);
  }, [effectiveLeftWidth, leftPaneVisible, rightWidth]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragRef.current || !rootRef.current) return;
      const containerWidth = rootRef.current.getBoundingClientRect().width;
      const splitterBudget = leftPaneVisible ? SPLITTER_WIDTH * 2 : SPLITTER_WIDTH;

      if (dragRef.current.target === 'left' && leftPaneVisible) {
        const delta = event.clientX - dragRef.current.startX;
        const maxLeft = containerWidth - rightWidth - MIN_EDITOR_WIDTH - splitterBudget;
        const next = clamp(dragRef.current.startLeft + delta, MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, maxLeft));
        setLeftWidth(next);
      }

      if (dragRef.current.target === 'right') {
        const delta = dragRef.current.startX - event.clientX;
        const maxRight = containerWidth - effectiveLeftWidth - MIN_EDITOR_WIDTH - splitterBudget;
        const next = clamp(dragRef.current.startRight + delta, MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, maxRight));
        setRightWidth(next);
      }
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [effectiveLeftWidth, leftPaneVisible, rightWidth]);

  const beginDrag = (target: DragTarget, event: React.MouseEvent<HTMLDivElement>) => {
    if (!target) return;
    dragRef.current = {
      target,
      startX: event.clientX,
      startLeft: leftWidth,
      startRight: rightWidth,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const gridTemplateColumns = useMemo(() => {
    const left = leftPaneVisible ? `${Math.round(leftWidth)}px` : '0px';
    const right = `${Math.round(rightWidth)}px`;
    return `${left} ${leftPaneVisible ? `${SPLITTER_WIDTH}px ` : ''}minmax(0,1fr) ${SPLITTER_WIDTH}px ${right}`;
  }, [leftPaneVisible, leftWidth, rightWidth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-page-bg">
      {!leftPaneVisible && (
        <button
          type="button"
          onClick={onShowLeftPane}
          className="pane-restore-handle group flex shrink-0 items-center justify-center"
          title="Show left pane"
          aria-label="Show left pane"
        >
          <ChevronRight size={10} className="pane-restore-icon text-text-muted" />
        </button>
      )}

      <div ref={rootRef} className="grid min-h-0 flex-1" style={{ gridTemplateColumns }}>
        <div className={`min-h-0 overflow-hidden ${leftPaneVisible ? 'border-r border-border-subtle' : 'pointer-events-none opacity-0'}`}>
          {leftPaneVisible && <LeftPane {...leftPane} />}
        </div>

        {leftPaneVisible && (
          <div
            className="group relative h-full cursor-col-resize bg-transparent"
            onMouseDown={(event) => beginDrag('left', event)}
            title="Drag to resize left pane"
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-subtle transition-colors group-hover:bg-accent" />
          </div>
        )}

        <section className="relative min-h-0 overflow-hidden border-r border-border-subtle bg-surface-editor">
          <ArtifactPane {...editorPane} />
          <ComposerPane {...composerPane} />
        </section>

        <div
          className="group relative h-full cursor-col-resize bg-transparent"
          onMouseDown={(event) => beginDrag('right', event)}
          title="Drag to resize preview pane"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-subtle transition-colors group-hover:bg-accent" />
        </div>

        <section className="min-h-0 overflow-hidden border-l border-border-subtle bg-surface-preview">
          <PdfViewer {...previewPane} />
        </section>
      </div>
    </div>
  );
};

export default EditorShell;
