import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProposedAction } from '../core/ai/agenticTypes';
import { activityStore } from '../core/activity/ActivityStore';
import { CompileRunMeta, CompileRunState, CompileTrigger } from '../core/compile/types';
import { ActivityEvent, DiagnosticItem, UiSessionState } from '../core/data/types';
import { PrimaryPane, RightDrawerMode } from '../core/editor/types';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { TeXCompiler } from '../core/tex-compiler';
import { parseSections } from '../utils/parseSections';
import EditorShell from './editor-shell/EditorShell';
import { DrawerComment, ProjectInfoStats } from './editor-shell/contracts';

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage[margin=1in]{geometry}
\\begin{document}
\\section*{Introduction}
Write your paper here.
\\end{document}`;

const UI_SESSION_KEY = 'cuboid_editor_ui_session_v2';

const readUiSession = (projectId: string): UiSessionState | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const all = JSON.parse(window.localStorage.getItem(UI_SESSION_KEY) || '{}') as Record<string, UiSessionState>;
    return all[projectId] || null;
  } catch {
    return null;
  }
};

const writeUiSession = (state: UiSessionState) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const all = JSON.parse(window.localStorage.getItem(UI_SESSION_KEY) || '{}') as Record<string, UiSessionState>;
    all[state.projectId] = state;
    window.localStorage.setItem(UI_SESSION_KEY, JSON.stringify(all));
  } catch {
    // no-op
  }
};

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

const computeProjectInfoStats = (content: string): ProjectInfoStats => {
  const words = (content.match(/[A-Za-z0-9_]+/g) || []).length;
  const sections = parseSections(content).length;
  const figures = (content.match(/\\includegraphics|\\begin\{figure\}/g) || []).length;
  const mathInline = (content.match(/\$(?!\$)([^$\n]+)\$/g) || []).length;
  const mathDisplay = (content.match(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g) || []).length;

  return {
    words,
    headings: sections,
    figures,
    mathInline,
    mathDisplay,
  };
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
  const [compileMeta, setCompileMeta] = useState<CompileRunMeta | null>(null);
  const [compileLog, setCompileLog] = useState('');
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [primaryPane, setPrimaryPane] = useState<PrimaryPane>('composer');
  const [layoutMode, setLayoutMode] = useState<'split' | 'focus_composer' | 'focus_editor' | 'focus_preview'>('split');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerMode, setDrawerMode] = useState<RightDrawerMode>('activity');
  const [prompt, setPrompt] = useState('');
  const [selection, setSelection] = useState({ startLine: 1, endLine: 1 });
  const [revealLine, setRevealLine] = useState<number | null>(null);
  const [actions, setActions] = useState<ProposedAction[]>([]);
  const [comments, setComments] = useState<DrawerComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  const sections = useMemo(() => parseSections(content), [content]);
  const projectInfo = useMemo(() => computeProjectInfoStats(content), [content]);

  const appendActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    if (!projectId) return;
    const nextEvent: ActivityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };
    activityStore.append(projectId, nextEvent);
    setActivityEvents(activityStore.read(projectId));
  }, [projectId]);

  const jumpToLine = useCallback((line: number) => {
    setRevealLine(line);
    setPrimaryPane('editor');
    window.setTimeout(() => setRevealLine(null), 30);
  }, []);

  const startCompile = useCallback(async (trigger: CompileTrigger) => {
    if (!projectId) return;
    compileInFlightRef.current = true;
    pendingTriggerRef.current = null;

    const startedAt = new Date();
    setCompileState('compiling');
    setCompileMeta({
      trigger,
      startedAt: startedAt.toISOString(),
      cancelled: false,
    });
    appendActivity({
      kind: 'compile_start',
      title: `Compile started (${trigger})`,
      detail: `Compiling ${documentTitle}`,
      fileId: documentTitle,
    });

    const result = await compiler.compile(contentRef.current);
    const finishedAt = new Date();

    const parsedDiagnostics = parseCompileDiagnostics(result.log || '', documentTitle);
    setCompileLog(result.log || '[no logs]');
    setDiagnostics(parsedDiagnostics);

    if (result.success && result.pdf) {
      setPdfBlob(result.pdf);
      setCompileState('success');
      setCompileMeta((prev) => ({
        trigger: prev?.trigger || trigger,
        startedAt: prev?.startedAt || startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        cancelled: false,
      }));
      appendActivity({
        kind: 'compile_end',
        title: 'Compile succeeded',
        detail: `PDF updated with ${parsedDiagnostics.length} diagnostics`,
        fileId: documentTitle,
      });
      if (primaryPane !== 'preview') setPrimaryPane('preview');
    } else {
      setCompileState('error');
      setCompileMeta((prev) => ({
        trigger: prev?.trigger || trigger,
        startedAt: prev?.startedAt || startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        cancelled: false,
      }));
      setDrawerOpen(true);
      setDrawerMode('logs');
      appendActivity({
        kind: 'error',
        title: 'Compile failed',
        detail: parsedDiagnostics[0]?.message || 'Compilation failed',
        fileId: documentTitle,
        line: parsedDiagnostics[0]?.line,
      });
      if (parsedDiagnostics[0]) jumpToLine(parsedDiagnostics[0].line);
    }

    compileInFlightRef.current = false;
    if (pendingTriggerRef.current) {
      const nextTrigger = pendingTriggerRef.current;
      pendingTriggerRef.current = null;
      setCompileState('queued');
      void startCompile(nextTrigger);
    }
  }, [appendActivity, compiler, documentTitle, jumpToLine, primaryPane, projectId]);

  const queueCompile = useCallback((trigger: CompileTrigger) => {
    if (trigger === 'manual' && compileTimerRef.current) {
      window.clearTimeout(compileTimerRef.current);
      compileTimerRef.current = null;
    }

    if (compileInFlightRef.current) {
      pendingTriggerRef.current = trigger;
      setCompileState('queued');
      appendActivity({
        kind: 'reasoning_step',
        title: 'Compile queued',
        detail: `Queued ${trigger} compile while another run is in progress`,
      });
      return;
    }

    void startCompile(trigger);
  }, [appendActivity, startCompile]);

  const submitPrompt = useCallback(() => {
    const text = prompt.trim();
    if (!text) return;
    const action: ProposedAction = {
      id: crypto.randomUUID(),
      intent: inferIntent(text),
      title: text,
      summary: 'Generated from your composer request. Review and apply explicitly.',
      startLine: selection.startLine,
      endLine: selection.endLine,
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };
    setActions((prev) => [action, ...prev]);
    setPrompt('');
    appendActivity({
      kind: 'changeset_created',
      title: 'Agent proposed action',
      detail: action.title,
      line: selection.startLine,
    });
  }, [appendActivity, prompt, selection.endLine, selection.startLine]);

  const applyAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: 'accepted' } : item)));
    const selected = actions.find((item) => item.id === actionId);
    if (selected) {
      setContent((prev) => {
        const lines = prev.split('\n');
        const insertAt = Math.max(0, selected.startLine - 1);
        lines.splice(insertAt, 0, `% [agent] ${selected.title}`);
        return lines.join('\n');
      });
      appendActivity({
        kind: 'changeset_applied',
        title: 'Applied action',
        detail: selected.title,
        line: selected.startLine,
      });
      jumpToLine(selected.startLine);
    }
  }, [actions, appendActivity, jumpToLine]);

  const rejectAction = useCallback((actionId: string) => {
    const selected = actions.find((item) => item.id === actionId);
    setActions((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: 'rejected' } : item)));
    if (selected) {
      appendActivity({
        kind: 'reasoning_step',
        title: 'Rejected action',
        detail: selected.title,
      });
    }
  }, [actions, appendActivity]);

  const addComment = useCallback(() => {
    const body = commentDraft.trim();
    if (!body) return;
    const next: DrawerComment = {
      id: crypto.randomUUID(),
      body,
      startLine: selection.startLine,
      endLine: selection.endLine,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [next, ...prev]);
    setCommentDraft('');
    appendActivity({
      kind: 'tool_result',
      title: 'Comment added',
      detail: `L${next.startLine}-L${next.endLine}`,
      line: next.startLine,
    });
  }, [appendActivity, commentDraft, selection.endLine, selection.startLine]);

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

      const sessionState = readUiSession(projectId);
      if (sessionState) {
        setPrimaryPane(sessionState.primaryPane);
        setLayoutMode(sessionState.layoutMode);
        setDrawerMode(sessionState.rightDrawerMode);
        setDrawerOpen(sessionState.rightDrawerOpen);
      }

      setActivityEvents(activityStore.read(projectId));
      hydratedRef.current = true;
      setSaveNotice('All changes saved');
      appendActivity({
        kind: 'reasoning_step',
        title: 'Editor session loaded',
        detail: activeProject?.name || 'Untitled project',
      });
      queueCompile('retry');
    };

    void loadProject();
  }, [appendActivity, getDocument, listProjects, projectId, queueCompile, workspaceId]);

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
    setCompileState((current) => (current === 'compiling' ? 'queued' : 'queued'));
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
    if (!projectId || !hydratedRef.current) return;
    writeUiSession({
      projectId,
      workspaceId,
      primaryPane,
      layoutMode,
      rightDrawerMode: drawerMode,
      rightDrawerOpen: drawerOpen,
      updatedAt: new Date().toISOString(),
    });
  }, [drawerMode, drawerOpen, layoutMode, primaryPane, projectId, workspaceId]);

  useEffect(() => {
    return () => {
      if (compileTimerRef.current) {
        window.clearTimeout(compileTimerRef.current);
      }
    };
  }, []);

  if (!workspaceId || !projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950 text-text-secondary">
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
    <EditorShell
      leftRail={{
        projectName,
        documentTitle,
        sections,
        saveNotice,
        onBackToProjects: () => navigate(`/app/${workspaceId}/projects`),
        onJumpToLine: jumpToLine,
      }}
      runStatusBar={{
        compileState,
        compileMeta,
        layoutMode,
        primaryPane,
        drawerOpen,
        onCompileNow: queueCompile,
        onPrimaryPaneChange: setPrimaryPane,
        onLayoutModeChange: setLayoutMode,
        onToggleDrawer: () => setDrawerOpen((open) => !open),
      }}
      composerPane={{
        prompt,
        selection,
        actions,
        deferredImageToLatex: true,
        deferredVoiceMode: true,
        onPromptChange: setPrompt,
        onPromptSubmit: submitPrompt,
        onApplyAction: applyAction,
        onRejectAction: rejectAction,
        onViewAction: (actionId) => {
          const target = actions.find((item) => item.id === actionId);
          if (target) jumpToLine(target.startLine);
        },
      }}
      artifactPane={{
        primaryPane,
        content,
        onContentChange: setContent,
        documentTitle,
        diagnostics,
        revealLine,
        onSelectionChange: (startLine, endLine) => setSelection({ startLine, endLine }),
        pdfBlob,
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
      rightDrawer={{
        isOpen: drawerOpen,
        mode: drawerMode,
        onClose: () => setDrawerOpen(false),
        onModeChange: setDrawerMode,
        projectInfo,
        comments,
        commentDraft,
        activityEvents,
        compileLog,
        diagnostics,
        onCommentDraftChange: setCommentDraft,
        onAddComment: addComment,
        onJumpToLine: jumpToLine,
      }}
    />
  );
};

export default EditorPage;
