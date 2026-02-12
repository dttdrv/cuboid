import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProposedAction } from '../core/ai/agenticTypes';
import {
  backendListFiles,
  backendReadFile,
  backendWriteFile,
  compileViaBackend,
  fetchBackendSettings,
  requestBackendAiChat,
  requestBackendAiEdits,
  setBackendAiToggle
} from '../core/backend/client';
import { CompileRunState, CompileTrigger } from '../core/compile/types';
import { DiagnosticItem } from '../core/data/types';
import EditorShell from './editor-shell/EditorShell';
import CommandPalette from './editor-shell/CommandPalette';
import SettingsModal from './modals/SettingsModal';
import { EditorTab, LeftPaneMode } from './editor-shell/contracts';

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

const readFileAsDataUrl = async (file: File): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Unable to read image file.'));
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
};

const toLabel = (path: string): string => {
  const chunks = path.split('/');
  return chunks[chunks.length - 1] || path;
};

export const EditorPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();

  const hydratedRef = useRef(false);
  const contentRef = useRef(DEFAULT_LATEX);
  const compileTimerRef = useRef<number | null>(null);
  const compileInFlightRef = useRef(false);
  const pendingTriggerRef = useRef<CompileTrigger | null>(null);

  const [activeFilePath, setActiveFilePath] = useState('main.tex');
  const [files, setFiles] = useState<Array<{ path: string; label: string; updatedAt?: string }>>([]);
  const [fileCache, setFileCache] = useState<Record<string, string>>({});
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'main.tex', label: 'main.tex' }]);
  const [activeTabId, setActiveTabId] = useState('main.tex');

  const [content, setContent] = useState(DEFAULT_LATEX);
  const [saveNotice, setSaveNotice] = useState('Loading...');
  const [compileState, setCompileState] = useState<CompileRunState>('idle');
  const [compileLog, setCompileLog] = useState('');
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [prompt, setPrompt] = useState('');
  const [selection, setSelection] = useState({ startLine: 1, endLine: 1 });
  const [revealLine, setRevealLine] = useState<number | null>(null);
  const [actions, setActions] = useState<ProposedAction[]>([]);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiProviderLabel, setAiProviderLabel] = useState('nvidia');
  const [aiModelLabel, setAiModelLabel] = useState('moonshotai/kimi-k2.5');
  const [aiBusy, setAiBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>>([]);
  const [attachedImage, setAttachedImage] = useState<{ name: string; dataUrl: string } | null>(null);

  const [leftPaneVisible, setLeftPaneVisible] = useState(true);
  const [leftPaneMode, setLeftPaneMode] = useState<LeftPaneMode>('files');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [autoCompile, setAutoCompile] = useState(true);
  const [pdfDarkMode, setPdfDarkMode] = useState(false);

  const jumpToLine = useCallback((line: number) => {
    setRevealLine(line);
    window.setTimeout(() => setRevealLine(null), 30);
  }, []);

  const setEditorContent = useCallback((filePath: string, value: string) => {
    setActiveFilePath(filePath);
    setActiveTabId(filePath);
    setContent(value);
    contentRef.current = value;
    setFileCache((prev) => ({ ...prev, [filePath]: value }));
  }, []);

  const loadFileIntoEditor = useCallback(async (filePath: string) => {
    if (!projectId) return;
    setOpenTabs((prev) => (prev.some((tab) => tab.id === filePath) ? prev : [...prev, { id: filePath, label: toLabel(filePath) }]));
    const cached = fileCache[filePath];
    if (typeof cached === 'string') {
      setEditorContent(filePath, cached);
      return;
    }
    try {
      const value = await backendReadFile(projectId, filePath);
      setEditorContent(filePath, value ?? '');
    } catch {
      setSaveNotice(`Failed to load ${filePath}`);
    }
  }, [fileCache, projectId, setEditorContent]);

  const startCompile = useCallback(async (_trigger: CompileTrigger) => {
    if (!projectId) return;
    compileInFlightRef.current = true;
    pendingTriggerRef.current = null;
    setCompileState('compiling');

    try {
      const result = await compileViaBackend({
        projectId,
        mainFile: activeFilePath,
        content: contentRef.current,
      });

      setCompileLog(result.log || '');

      const parsedDiagnostics = result.diagnostics.length > 0
        ? result.diagnostics
        : parseCompileDiagnostics(result.log || '', activeFilePath);
      setDiagnostics(parsedDiagnostics);

      if (result.status === 'success' && result.pdfBlob) {
        setPdfBlob(result.pdfBlob);
        setCompileState('success');
      } else {
        setCompileState('error');
        if (parsedDiagnostics[0]) jumpToLine(parsedDiagnostics[0].line);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCompileLog(`Compile failed: ${message}`);
      setDiagnostics([{
        id: `compile-fatal-${Date.now()}`,
        severity: 'error',
        fileId: activeFilePath,
        line: 1,
        column: 1,
        message: `Backend compile failed: ${message}`,
      }]);
      setCompileState('error');
    }

    compileInFlightRef.current = false;
    if (pendingTriggerRef.current) {
      const nextTrigger = pendingTriggerRef.current;
      pendingTriggerRef.current = null;
      setCompileState('queued');
      void startCompile(nextTrigger);
    }
  }, [activeFilePath, jumpToLine, projectId]);

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

  const submitPrompt = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !projectId || !aiEnabled || aiBusy) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      }
    ]);
    setPrompt('');

    const lines = contentRef.current.split('\n');
    const startLine = Math.max(1, selection.startLine);
    const endLine = Math.max(startLine, selection.endLine);
    const selectionSnippet = lines.slice(startLine - 1, endLine).join('\n').trim();

    const contextHeader = [
      `file: ${activeFilePath}`,
      `selection: lines ${startLine}-${endLine}`,
      selectionSnippet.length > 0 ? `selected_latex:\n${selectionSnippet}` : 'selected_latex: (none)',
      `request:\n${text}`,
    ].join('\n\n');

    const requestMessages = [
      ...chatMessages.map((message) => ({ role: message.role, content: message.content })),
      attachedImage
        ? {
          role: 'user' as const,
          content: [
            { type: 'text', text: contextHeader },
            { type: 'image_url', image_url: { url: attachedImage.dataUrl } },
          ],
        }
        : { role: 'user' as const, content: contextHeader },
    ];

    setAiBusy(true);
    try {
      const chatResponse = await requestBackendAiChat({
        model: aiModelLabel,
        messages: requestMessages,
        temperature: 0.2,
      });
      const assistantText = chatResponse.assistantText.trim() || 'No textual response returned.';
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantText,
          createdAt: new Date().toISOString(),
        },
      ]);

      const intent = inferIntent(text);
      if (intent === 'edit' || intent === 'compile_fix') {
        const response = await requestBackendAiEdits({
          projectId,
          mainFile: activeFilePath,
          content: contentRef.current,
          prompt: text,
          selection,
        });

        const suggestions = response.suggestions.length > 0
          ? response.suggestions
          : [{
            title: text,
            summary: 'No concrete edit suggested, kept as proposal for manual review.',
            startLine: selection.startLine,
            endLine: selection.endLine,
          }];

        setActions((prev) => [
          ...suggestions.map((item) => ({
            id: crypto.randomUUID(),
            intent,
            title: item.title,
            summary: item.summary,
            startLine: item.startLine,
            endLine: item.endLine,
            status: 'proposed' as const,
            createdAt: new Date().toISOString(),
          })),
          ...prev,
        ]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `AI request failed: ${message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setAttachedImage(null);
      setAiBusy(false);
    }
  }, [activeFilePath, aiBusy, aiEnabled, aiModelLabel, attachedImage, chatMessages, projectId, prompt, selection]);

  const toggleAi = useCallback(async () => {
    const target = !aiEnabled;
    try {
      const updated = await setBackendAiToggle(target);
      setAiEnabled(updated.aiEnabled);
      setAiProviderLabel(updated.aiProvider);
      setAiModelLabel(updated.aiModel);
      if (!updated.aiEnabled) setPrompt('');
    } catch {
      setAiEnabled(target);
      if (!target) setPrompt('');
    }
  }, [aiEnabled]);

  const attachImage = useCallback((file: File | null) => {
    if (!file) {
      setAttachedImage(null);
      return;
    }
    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        setAttachedImage({ name: file.name, dataUrl });
      })
      .catch(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Unable to read image attachment.',
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  }, []);

  const applyAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: 'accepted' } : item)));
    const selected = actions.find((item) => item.id === actionId);
    if (!selected) return;
    setContent((prev) => {
      const lines = prev.split('\n');
      const insertAt = Math.max(0, selected.startLine - 1);
      lines.splice(insertAt, 0, `% [agent] ${selected.title}`);
      const next = lines.join('\n');
      contentRef.current = next;
      setFileCache((cache) => ({ ...cache, [activeFilePath]: next }));
      return next;
    });
    jumpToLine(selected.startLine);
  }, [actions, activeFilePath, jumpToLine]);

  const rejectAction = useCallback((actionId: string) => {
    setActions((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: 'rejected' } : item)));
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    void loadFileIntoEditor(tabId);
  }, [loadFileIntoEditor]);

  const handleTabClose = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      if (prev.length <= 1) return prev;
      const closingIndex = prev.findIndex((item) => item.id === tabId);
      const nextTabs = prev.filter((item) => item.id !== tabId);
      if (activeTabId === tabId) {
        const fallback = nextTabs[Math.max(0, closingIndex - 1)]?.id || nextTabs[0]?.id;
        if (fallback) {
          void loadFileIntoEditor(fallback);
        }
      }
      return nextTabs;
    });
  }, [activeTabId, loadFileIntoEditor]);

  const handleAddFile = useCallback(async () => {
    if (!projectId) return;
    const suggested = `untitled-${files.length + 1}.tex`;
    const input = window.prompt('New file name', suggested);
    if (!input) return;

    let nextPath = input.trim().replace(/\\/g, '/');
    if (!nextPath) return;
    if (!nextPath.endsWith('.tex')) {
      nextPath = `${nextPath}.tex`;
    }

    if (files.some((file) => file.path === nextPath)) {
      void loadFileIntoEditor(nextPath);
      return;
    }

    const template = '% New file\n';
    try {
      await backendWriteFile(projectId, nextPath, template);
      const now = new Date().toISOString();
      setFiles((prev) => [{ path: nextPath, label: toLabel(nextPath), updatedAt: now }, ...prev]);
      setFileCache((prev) => ({ ...prev, [nextPath]: template }));
      setOpenTabs((prev) => [...prev, { id: nextPath, label: toLabel(nextPath), isModified: false }]);
      setEditorContent(nextPath, template);
      setSaveNotice('File created');
    } catch {
      setSaveNotice('Failed to create file');
    }
  }, [files, loadFileIntoEditor, projectId, setEditorContent]);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        const { files: backendFiles } = await backendListFiles(projectId);

        let paths = backendFiles.map((item) => item.path).filter(Boolean);
        if (paths.length === 0) {
          await backendWriteFile(projectId, 'main.tex', DEFAULT_LATEX);
          paths = ['main.tex'];
        }
        const normalizedFiles = paths.map((path) => ({ path, label: toLabel(path) }));
        setFiles(normalizedFiles);

        const initialFile = paths.includes('main.tex') ? 'main.tex' : paths[0];
        const loaded = await backendReadFile(projectId, initialFile);
        const resolved = loaded?.trim().length ? loaded : DEFAULT_LATEX;

        setOpenTabs([{ id: initialFile, label: toLabel(initialFile), isModified: false }]);
        setEditorContent(initialFile, resolved);
      } catch {
        setFiles([{ path: 'main.tex', label: 'main.tex' }]);
        setOpenTabs([{ id: 'main.tex', label: 'main.tex', isModified: false }]);
        setEditorContent('main.tex', DEFAULT_LATEX);
      }

      hydratedRef.current = true;
      setSaveNotice('All changes saved');
      queueCompile('retry');
    };

    void loadProject();
  }, [projectId, queueCompile, setEditorContent]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchBackendSettings();
        setAiEnabled(settings.aiEnabled);
        setAiProviderLabel(settings.aiProvider);
        setAiModelLabel(settings.aiModel);
      } catch {
        setAiEnabled(true);
        setAiProviderLabel('nvidia');
        setAiModelLabel('moonshotai/kimi-k2.5');
      }
    };
    void loadSettings();
  }, []);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!projectId || !hydratedRef.current) return;
    setSaveNotice('Saving...');
    const timer = window.setTimeout(async () => {
      try {
        await backendWriteFile(projectId, activeFilePath, content);
        setFiles((prev) => prev.map((file) => (
          file.path === activeFilePath
            ? { ...file, updatedAt: new Date().toISOString() }
            : file
        )));
        setSaveNotice('All changes saved');
      } catch {
        setSaveNotice('Save failed');
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [activeFilePath, content, projectId]);

  useEffect(() => {
    if (!projectId || !hydratedRef.current || !autoCompile) return;
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
  }, [autoCompile, content, projectId, queueCompile]);

  useEffect(() => {
    return () => {
      if (compileTimerRef.current) {
        window.clearTimeout(compileTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        queueCompile('manual');
      }
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setLeftPaneVisible((prev) => !prev);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [queueCompile]);

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
        leftPaneVisible={leftPaneVisible}
        onShowLeftPane={() => setLeftPaneVisible(true)}
        leftPane={{
          mode: leftPaneMode,
          onModeChange: setLeftPaneMode,
          files,
          activeFilePath,
          onSelectFile: (path) => { void loadFileIntoEditor(path); },
          saveNotice,
          onAddFile: () => { void handleAddFile(); },
          chatList: chatMessages
            .slice(-20)
            .map((message) => ({
              id: message.id,
              title: message.content.split('\n')[0] || message.role,
              updatedAt: new Date(message.createdAt).toLocaleTimeString(),
            })),
          onSelectChat: () => setLeftPaneMode('chats'),
          onOpenSettings: () => setSettingsOpen(true),
          onHidePane: () => setLeftPaneVisible(false),
        }}
        editorPane={{
          content,
          onContentChange: (value) => {
            setContent(value);
            setFileCache((prev) => ({ ...prev, [activeFilePath]: value }));
          },
          openTabs: openTabs.map((tab) => ({
            ...tab,
            isModified: fileCache[tab.id] !== undefined && tab.id === activeFilePath && saveNotice !== 'All changes saved',
          })),
          activeTabId,
          onTabChange: handleTabChange,
          onTabClose: handleTabClose,
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
        composerPane={{
          prompt,
          aiEnabled,
          aiBusy,
          aiProviderLabel,
          aiModelLabel,
          messages: chatMessages,
          attachedImageName: attachedImage?.name || null,
          onPromptChange: setPrompt,
          onPromptSubmit: () => { void submitPrompt(); },
          onToggleAi: () => { void toggleAi(); },
          onClearMessages: () => setChatMessages([]),
          onAttachImage: attachImage,
          onRemoveImage: () => setAttachedImage(null),
        }}
        previewPane={{
          compileState,
          pdfBlob,
          compileLog,
          pdfDarkMode,
          onCompileNow: () => queueCompile('manual'),
          onTogglePdfDarkMode: setPdfDarkMode,
        }}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onCompileNow={() => queueCompile('manual')}
        onToggleAi={() => { void toggleAi(); }}
        onOpenSettings={() => { setCommandPaletteOpen(false); setSettingsOpen(true); }}
        onToggleLeftPane={() => setLeftPaneVisible((prev) => !prev)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        wordWrap={wordWrap}
        onWordWrapChange={setWordWrap}
        autoCompile={autoCompile}
        onAutoCompileChange={setAutoCompile}
        pdfDarkMode={pdfDarkMode}
        onPdfDarkModeChange={setPdfDarkMode}
      />
    </>
  );
};

export default EditorPage;
