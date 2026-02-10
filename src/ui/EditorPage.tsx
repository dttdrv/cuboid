import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProposedAction } from '../core/ai/agenticTypes';
import { CompileRunState, CompileTrigger } from '../core/compile/types';
import { DiagnosticItem } from '../core/data/types';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { TeXCompiler } from '../core/tex-compiler';
import { parseSections } from '../utils/parseSections';
import { AICommandPalette } from './ai/AICommandPalette';
import EditorShell from './editor-shell/EditorShell';

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage[margin=1in]{geometry}
\\begin{document}
\\section*{Introduction}
Write your paper here.
\\end{document}`;

const parseCompileDiagnostics = (log: string, fileName: string): DiagnosticItem[] => {
  const lines = log.split('\n');
  const diagnostics: DiagnosticItem[] = [];
  let fallbackLine = 1;

  lines.forEach((line, index) => {
    const lineMatch = line.match(/^l\.(\d+)/);
    if (lineMatch) fallbackLine = Number(lineMatch[1]);
    if (line.startsWith('! ')) {
      diagnostics.push({
        id: `compile-e-${index}`,
        severity: 'error',
        fileId: fileName,
        line: fallbackLine,
        column: 1,
        message: line.replace(/^!\s*/, ''),
      });
    } else if (line.includes('Warning')) {
      diagnostics.push({
        id: `compile-w-${index}`,
        severity: 'warning',
        fileId: fileName,
        line: fallbackLine,
        column: 1,
        message: line,
      });
    }
  });

  return diagnostics;
};

const inferIntent = (prompt: string): ProposedAction['intent'] => {
  const lower = prompt.toLowerCase();
  if (lower.includes('compile') || lower.includes('error') || lower.includes('fix')) return 'compile_fix';
  if (lower.includes('analyze') || lower.includes('summary')) return 'analyze';
  if (lower.includes('edit') || lower.includes('rewrite') || lower.includes('change')) return 'edit';
  return 'ask';
};

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { listProjects, getDocument, saveDocument } = useDataLayer();
  const compiler = useMemo(() => new TeXCompiler(), []);

  const hydratedRef = useRef(false);
  const contentRef = useRef(DEFAULT_LATEX);
  const compileTimerRef = useRef<number | null>(null);
  const compileInFlightRef = useRef(false);
  const pendingTriggerRef = useRef<CompileTrigger | null>(null);

  const [projectName, setProjectName] = useState('Untitled Project');
  const [documentTitle, setDocumentTitle] = useState('main.tex');
  const [content, setContent] = useState(DEFAULT_LATEX);
  const [saveNotice, setSaveNotice] = useState('Loading...');
  const [compileState, setCompileState] = useState<CompileRunState>('idle');
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selection, setSelection] = useState({ startLine: 1, endLine: 1 });
  const [revealLine, setRevealLine] = useState<number | null>(null);
  const [actions, setActions] = useState<ProposedAction[]>([]);

  const sections = useMemo(() => parseSections(content), [content]);

  const jumpToLine = useCallback((line: number) => {
    setRevealLine(line);
    window.setTimeout(() => setRevealLine(null), 30);
  }, []);

  const startCompile = useCallback(async (trigger: CompileTrigger) => {
    if (!projectId) return;
    compileInFlightRef.current = true;
    pendingTriggerRef.current = null;
    setCompileState('compiling');

    const result = await compiler.compile(contentRef.current);
    const parsedDiagnostics = parseCompileDiagnostics(result.log || '', documentTitle);
    setDiagnostics(parsedDiagnostics);

    if (result.success && result.pdf) {
      setPdfBlob(result.pdf);
      setCompileState('success');
    } else {
      setCompileState('error');
      if (parsedDiagnostics[0]) jumpToLine(parsedDiagnostics[0].line);
    }

    compileInFlightRef.current = false;
    if (pendingTriggerRef.current) {
      const nextTrigger = pendingTriggerRef.current;
      pendingTriggerRef.current = null;
      setCompileState('queued');
      void startCompile(nextTrigger);
    }
  }, [compiler, documentTitle, jumpToLine, projectId]);

  const queueCompile = useCallback((trigger: CompileTrigger) => {
    if (trigger === 'manual' && compileTimerRef.current) {
      window.clearTimeout(compileTimerRef.current);
      compileTimerRef.current = null;
    }

    if (compileInFlightRef.current) {
      pendingTriggerRef.current = trigger;
      setCompileState('queued');
      return;
    }

    void startCompile(trigger);
  }, [startCompile]);

  const submitPrompt = useCallback(() => {
    const text = prompt.trim();
    if (!text) return;
    const action: ProposedAction = {
      id: crypto.randomUUID(),
      intent: inferIntent(text),
      title: text,
      summary: 'Generated from your prompt. Apply explicitly.',
      startLine: selection.startLine,
      endLine: selection.endLine,
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };
    setActions((prev) => [action, ...prev]);
    setPrompt('');
  }, [prompt, selection.endLine, selection.startLine]);

  const applyAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: 'accepted' } : item)));
    const selected = actions.find((item) => item.id === actionId);
    if (!selected) return;
    setContent((prev) => {
      const lines = prev.split('\n');
      const insertAt = Math.max(0, selected.startLine - 1);
      lines.splice(insertAt, 0, `% [agent] ${selected.title}`);
      return lines.join('\n');
    });
    jumpToLine(selected.startLine);
  }, [actions, jumpToLine]);

  const rejectAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: 'rejected' } : item)));
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      const projects = await listProjects(workspaceId);
      const activeProject = projects.find((item) => item.id === projectId);
      if (activeProject) setProjectName(activeProject.name);

      const doc = await getDocument(projectId);
      if (doc?.content) {
        setContent(doc.content);
        contentRef.current = doc.content;
        setDocumentTitle(doc.title || 'main.tex');
      } else {
        setContent(DEFAULT_LATEX);
        contentRef.current = DEFAULT_LATEX;
        setDocumentTitle('main.tex');
      }

      hydratedRef.current = true;
      setSaveNotice('All changes saved');
      queueCompile('retry');
    };

    void loadProject();
  }, [getDocument, listProjects, projectId, queueCompile, workspaceId]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!projectId || !hydratedRef.current) return;
    setSaveNotice('Saving...');
    const timer = window.setTimeout(async () => {
      const ok = await saveDocument(projectId, content);
      setSaveNotice(ok ? 'All changes saved' : 'Save failed');
    }, 650);

    return () => window.clearTimeout(timer);
  }, [content, projectId, saveDocument]);

  useEffect(() => {
    if (!projectId || !hydratedRef.current) return;
    if (compileTimerRef.current) {
      window.clearTimeout(compileTimerRef.current);
    }
    setCompileState('queued');
    compileTimerRef.current = window.setTimeout(() => {
      queueCompile('auto');
    }, 1200);

    return () => {
      if (compileTimerRef.current) {
        window.clearTimeout(compileTimerRef.current);
      }
    };
  }, [content, projectId, queueCompile]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (compileTimerRef.current) {
        window.clearTimeout(compileTimerRef.current);
      }
    };
  }, []);

  if (!workspaceId || !projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-bg text-text-secondary">
        Invalid route
      </div>
    );
  }

  const inlineHunks = actions.map((action) => ({
    id: action.id,
    startLine: action.startLine,
    endLine: action.endLine,
    status: action.status,
  }));

  return (
    <>
      <EditorShell
        leftRail={{
          projectName,
          documentTitle,
          sections,
          saveNotice,
          onCompileNow: () => queueCompile('manual'),
          onBackToProjects: () => navigate(`/app/${workspaceId}/projects`),
          onJumpToLine: jumpToLine,
        }}
        composerPane={{
          prompt,
          onPromptChange: setPrompt,
          onPromptSubmit: submitPrompt,
        }}
        artifactPane={{
          content,
          onContentChange: setContent,
          documentTitle,
          diagnostics,
          revealLine,
          onSelectionChange: (startLine, endLine) => setSelection({ startLine, endLine }),
          onCompileNow: () => queueCompile('manual'),
          inlineHunks,
          onResolveInlineHunk: (hunkId, action) => {
            if (action === 'accept') {
              applyAction(hunkId);
            } else {
              rejectAction(hunkId);
            }
          },
        }}
        previewPane={{
          compileState,
          pdfBlob,
          onCompileNow: () => queueCompile('manual'),
        }}
      />
      <AICommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  );
};

export default EditorPage;
