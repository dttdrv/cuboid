import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, Cog, Download, File, FileWarning, Image,
  LayoutPanelLeft, MoreHorizontal, Pencil, RefreshCw, Search, Send, Settings, Sparkles, Waves, Plus, MessageSquare,
} from 'lucide-react';
import MonacoEditor from './editor/MonacoEditor';
import PdfViewer from './PdfViewer';
import { parseSections } from '../utils/parseSections';
import { TeXCompiler } from '../core/tex-compiler';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { useAuth } from '../core/auth/AuthProvider';
import { DiagnosticItem } from '../core/data/types';

const DEFAULT_LATEX = `\\documentclass{article}
\\begin{document}
\\section*{What is Prism?}
\\textbf{Prism} is an AI-powered \\LaTeX{} editor for writing scientific documents.
\\section*{Features}
Prism includes ChatGPT directly in the editor and can access your project.
\\end{document}`;

type CompileState = 'idle' | 'compiling' | 'success' | 'error';
type RightTab = 'preview' | 'assistant' | 'logs' | 'comments';
type AssistantChange = { id: string; start: number; end: number; title: string; status: 'proposed' | 'accepted' | 'rejected' };
type CommentThread = { id: string; body: string; start: number; end: number; resolved: boolean };

const parseCompileDiagnostics = (log: string, fileName: string): DiagnosticItem[] => {
  const lines = log.split('\n');
  const diagnostics: DiagnosticItem[] = [];
  let fallbackLine = 1;
  lines.forEach((line, index) => {
    const lineMatch = line.match(/^l\.(\d+)/);
    if (lineMatch) fallbackLine = Number(lineMatch[1]);
    if (line.startsWith('! ')) diagnostics.push({ id: `e-${index}`, severity: 'error', fileId: fileName, line: fallbackLine, column: 1, message: line.replace(/^!\s*/, '') });
    if (line.includes('Warning')) diagnostics.push({ id: `w-${index}`, severity: 'warning', fileId: fileName, line: fallbackLine, column: 1, message: line });
  });
  return diagnostics;
};

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { listProjects, getDocument, saveDocument } = useDataLayer();
  const { workspaces } = useAuth();
  const compiler = useMemo(() => new TeXCompiler(), []);
  const hydratedRef = useRef(false);

  const [projectName, setProjectName] = useState('New Project');
  const [content, setContent] = useState(DEFAULT_LATEX);
  const [documentTitle, setDocumentTitle] = useState('main.tex');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [compileState, setCompileState] = useState<CompileState>('idle');
  const [compileLog, setCompileLog] = useState('');
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [saveNotice, setSaveNotice] = useState('Loading...');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [selection, setSelection] = useState({ start: 1, end: 1 });
  const [revealLine, setRevealLine] = useState<number | null>(null);
  const [leftTab, setLeftTab] = useState<'files' | 'chats'>('files');
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [showTools, setShowTools] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [changes, setChanges] = useState<AssistantChange[]>([]);
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [commentDraft, setCommentDraft] = useState('');

  const sections = useMemo(() => parseSections(content), [content]);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
  const errorCount = diagnostics.filter((item) => item.severity === 'error').length;
  const warningCount = diagnostics.filter((item) => item.severity === 'warning').length;

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      const projects = await listProjects(workspaceId);
      const current = projects.find((item) => item.id === projectId);
      if (current) setProjectName(current.name);
      const doc = await getDocument(projectId);
      if (doc?.content) {
        setContent(doc.content);
        setDocumentTitle(doc.title || 'main.tex');
      }
      hydratedRef.current = true;
      setSaveNotice('All changes saved');
    };
    void load();
  }, [projectId, workspaceId, listProjects, getDocument]);

  useEffect(() => {
    if (!projectId || !hydratedRef.current) return;
    setSaveNotice('Saving...');
    const timer = window.setTimeout(async () => {
      const ok = await saveDocument(projectId, content);
      setSaveNotice(ok ? 'All changes saved' : 'Save failed');
    }, 650);
    return () => window.clearTimeout(timer);
  }, [projectId, content, saveDocument]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const compileNow = async () => {
    if (compileState === 'compiling') return;
    setCompileState('compiling');
    const result = await compiler.compile(content);
    setCompileLog(result.log || '[no logs]');
    const parsed = parseCompileDiagnostics(result.log || '', documentTitle);
    setDiagnostics(parsed);
    if (result.success && result.pdf) {
      setPdfBlob(result.pdf);
      setCompileState('success');
    } else {
      setCompileState('error');
      setRightTab('logs');
    }
  };

  const jumpToLine = (line: number) => {
    setRevealLine(line);
    setTimeout(() => setRevealLine(null), 30);
  };

  const sendPrompt = () => {
    const prompt = assistantPrompt.trim();
    if (!prompt) return;
    const id = `chg-${Date.now()}`;
    setChanges((prev) => [{ id, start: selection.start, end: selection.end, title: prompt, status: 'proposed' }, ...prev]);
    setAssistantPrompt('');
    setRightTab('assistant');
    setToast('Assistant generated a proposed change');
  };

  const addComment = () => {
    const body = commentDraft.trim();
    if (!body) return;
    setComments((prev) => [{ id: `c-${Date.now()}`, body, start: selection.start, end: selection.end, resolved: false }, ...prev]);
    setCommentDraft('');
    setToast('Comment added');
  };

  if (!workspaceId || !projectId) return <div className="flex min-h-screen items-center justify-center bg-charcoal-950 text-text-secondary">Invalid route.</div>;

  return (
    <div className="min-h-screen bg-black p-2 text-text-primary">
      {toast && <div className="fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-white/[0.08] bg-charcoal-900 px-4 py-2 text-xs text-text-secondary">{toast}</div>}
      <div className="mx-auto grid min-h-[calc(100vh-1rem)] max-w-[1600px] grid-cols-[280px_1fr_650px] gap-2 rounded-2xl border border-white/[0.05] bg-[#050506] p-2">
        <aside className="flex min-h-0 flex-col rounded-2xl bg-[#0e0f12]">
          <div className="flex items-center justify-between px-3 pt-3 text-text-muted">
            <button type="button" onClick={() => navigate(`/app/${workspaceId}/projects`)} className="rounded-full border border-white/[0.08] px-3 py-1 text-xs hover:bg-charcoal-850">Back to projects</button>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-lg p-2 hover:bg-charcoal-850"><Cog size={16} /></button>
              <button type="button" className="rounded-lg p-2 hover:bg-charcoal-850"><Settings size={16} /></button>
              <button type="button" className="rounded-lg p-2 hover:bg-charcoal-850"><LayoutPanelLeft size={16} /></button>
            </div>
          </div>
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="truncate text-[40px] leading-none text-white/90">{projectName}</p>
              <button type="button" className="rounded-lg p-1 hover:bg-charcoal-850"><ChevronDown size={15} /></button>
            </div>
            <button type="button" onClick={() => setToast('Share link copied')} className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-black">Share</button>
          </div>
          <div className="mt-4 border-b border-white/[0.06] px-3 pb-2">
            <div className="flex items-center gap-4 text-[15px]">
              <button type="button" onClick={() => setLeftTab('files')} className={leftTab === 'files' ? 'border-b border-white pb-1 text-white' : 'pb-1 text-text-secondary'}>Files</button>
              <button type="button" onClick={() => setLeftTab('chats')} className={leftTab === 'chats' ? 'border-b border-white pb-1 text-white' : 'pb-1 text-text-secondary'}>Chats</button>
              <button type="button" className="ml-auto rounded-lg p-1 hover:bg-charcoal-850"><Search size={18} /></button>
              <button type="button" onClick={() => setToast('New file action wired')} className="rounded-lg p-1 hover:bg-charcoal-850"><Plus size={18} /></button>
            </div>
          </div>
          <div className="space-y-1 px-3 py-4">
            <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-text-secondary hover:bg-charcoal-850">diagram.jpg</button>
            <button type="button" className="w-full rounded-xl bg-charcoal-850 px-3 py-2 text-left text-white">{documentTitle}</button>
          </div>
          <div className="mt-auto border-t border-white/[0.06] px-3 py-3">
            <p className="mb-2 text-[18px] text-text-secondary">Outline</p>
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {sections.map((section) => (
                <button key={`${section.line}-${section.title}`} type="button" onClick={() => jumpToLine(section.line)} className="w-full truncate rounded-lg px-2 py-1 text-left text-xs text-text-muted hover:bg-charcoal-850 hover:text-white">*{section.title}</button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted"><span>Connected</span><span>{saveNotice}</span></div>
          </div>
        </aside>

        <section className="relative min-h-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-3">
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-lg p-2 text-text-muted hover:bg-charcoal-850"><Pencil size={16} /></button>
              <div className="rounded-2xl border border-white/40 px-4 py-1 text-sm text-white"><File className="mr-2 inline" size={14} />{documentTitle}</div>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowTools((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl bg-[#013a93] px-4 py-2 text-sm text-white"><Sparkles size={14} />Tools</button>
              {showTools && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-white/[0.08] bg-charcoal-900 p-2 shadow-2xl shadow-black/50">
                  <button type="button" onClick={() => void compileNow()} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-charcoal-850">Compile now</button>
                  <button type="button" onClick={() => setRightTab('assistant')} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-charcoal-850">Open assistant</button>
                  <button type="button" onClick={() => setToast('Download wired from preview toolbar')} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-charcoal-850">Download PDF</button>
                </div>
              )}
            </div>
          </div>
          <div className="h-[calc(100%-7.5rem)]">
            <MonacoEditor
              value={content}
              onChange={setContent}
              revealLine={revealLine}
              onSelectionChange={(start, end) => setSelection({ start, end })}
              markers={diagnostics.map((item) => ({ startLineNumber: item.line, endLineNumber: item.line, startColumn: 1, endColumn: 2, message: item.message, severity: item.severity === 'error' ? 8 : 4 }))}
              inlineHunks={changes.map((change) => ({ id: change.id, startLine: change.start, endLine: change.end, status: change.status }))}
              onResolveHunk={(id, action) => setChanges((prev) => prev.map((item) => item.id === id ? { ...item, status: action === 'accept' ? 'accepted' : 'rejected' } : item))}
            />
          </div>
          <div className="absolute bottom-3 left-4 right-4 rounded-full border border-white/[0.08] bg-[#131418] px-5 py-2 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3">
              <input value={assistantPrompt} onChange={(event) => setAssistantPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); sendPrompt(); } }} placeholder="Ask anything" className="flex-1 bg-transparent text-[18px] text-text-primary outline-none placeholder:text-text-muted" />
              <button type="button" onClick={() => setImageMode((prev) => !prev)} className={`rounded-lg p-2 hover:bg-charcoal-850 ${imageMode ? 'text-accent' : 'text-text-muted'}`}><Image size={20} /></button>
              <button type="button" onClick={() => setVoiceMode((prev) => !prev)} className={`rounded-lg p-2 hover:bg-charcoal-850 ${voiceMode ? 'text-accent' : 'text-text-muted'}`}><Waves size={20} /></button>
              <button type="button" onClick={sendPrompt} className="rounded-lg p-2 text-text-muted hover:bg-charcoal-850"><Send size={20} /></button>
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => void compileNow()} className="rounded-lg p-1 text-text-muted hover:bg-charcoal-850"><RefreshCw size={20} className={compileState === 'compiling' ? 'animate-spin' : ''} /></button>
              <button type="button" onClick={() => void compileNow()} className="text-white hover:text-accent">{compileState === 'compiling' ? 'Compiling...' : 'Compile'}</button>
              <button type="button" onClick={() => setRightTab('logs')} className={`rounded-full px-3 py-1 text-xs ${compileState === 'success' ? 'bg-success/20 text-success' : compileState === 'error' ? 'bg-danger/20 text-danger' : 'bg-charcoal-850 text-text-secondary'}`}>{compileState}</button>
            </div>
            <div className="flex items-center gap-4 text-text-secondary">
              <span className="border-b-2 border-white pb-1 text-white">01</span><span>of 01</span>
              <select className="rounded-lg border border-white/[0.16] bg-black px-2 py-1 text-white"><option>Zoom to fit</option><option>100%</option></select>
              <button type="button" onClick={() => setToast('Download action is wired')} className="rounded-lg p-1 hover:bg-charcoal-850"><Download size={18} /></button>
              <button type="button" onClick={() => setToast('More menu opened')} className="rounded-lg p-1 hover:bg-charcoal-850"><MoreHorizontal size={18} /></button>
            </div>
          </div>
          <div className="border-b border-white/[0.06] px-3 py-2 text-sm">
            <div className="flex gap-2">
              {(['preview', 'assistant', 'logs', 'comments'] as RightTab[]).map((tab) => (
                <button key={tab} type="button" onClick={() => setRightTab(tab)} className={`rounded-full px-3 py-1 ${rightTab === tab ? 'bg-charcoal-850 text-white' : 'text-text-secondary hover:bg-charcoal-850'}`}>{tab === 'logs' ? 'Activity' : tab[0].toUpperCase() + tab.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="h-[calc(100%-11rem)] overflow-y-auto">
            {rightTab === 'preview' && <PdfViewer pdf={pdfBlob} onCompileNow={() => void compileNow()} />}
            {rightTab === 'assistant' && (
              <div className="space-y-3 p-4 text-sm">
                <div className="rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-3 text-text-secondary">Suggested prompts: Fix compile errors, Generate abstract, Explain theorem.</div>
                {changes.length === 0 ? <p className="text-text-muted">No proposed changes yet.</p> : changes.map((change) => (
                  <div key={change.id} className="rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-3">
                    <p className="text-xs text-text-muted">L{change.start}-L{change.end}</p><p>{change.title}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => jumpToLine(change.start)} className="rounded-full border border-white/[0.08] px-2 py-1 text-xs">View diff</button>
                      <button type="button" onClick={() => setChanges((prev) => prev.map((c) => c.id === change.id ? { ...c, status: 'accepted' } : c))} className="rounded-full bg-success/20 px-2 py-1 text-xs text-success">Accept</button>
                      <button type="button" onClick={() => setChanges((prev) => prev.map((c) => c.id === change.id ? { ...c, status: 'rejected' } : c))} className="rounded-full bg-danger/20 px-2 py-1 text-xs text-danger">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rightTab === 'logs' && (
              <div className="space-y-3 p-4">
                <div className="rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-3 text-sm text-text-secondary">
                  <p>Errors: {errorCount} · Warnings: {warningCount}</p>
                  {diagnostics.map((item) => (<button key={item.id} type="button" onClick={() => jumpToLine(item.line)} className="mt-1 block w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-charcoal-850">{item.fileId}:{item.line} {item.message}</button>))}
                </div>
                <details className="rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-3 text-sm text-text-secondary"><summary>Raw logs</summary><pre className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-black/30 p-2 text-xs">{compileLog || '[no logs]'}</pre></details>
              </div>
            )}
            {rightTab === 'comments' && (
              <div className="space-y-3 p-4">
                <div className="rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-3">
                  <p className="mb-2 text-sm text-text-secondary">Anchor: L{selection.start}-L{selection.end}</p>
                  <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} className="h-20 w-full resize-none rounded-lg border border-white/[0.08] bg-charcoal-850 p-2 text-sm" />
                  <div className="mt-2 flex justify-end"><button type="button" onClick={addComment} className="rounded-full bg-white px-3 py-1 text-xs text-black">Add comment</button></div>
                </div>
                {comments.map((comment) => (<div key={comment.id} className="rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-3 text-sm"><button type="button" onClick={() => jumpToLine(comment.start)} className="text-xs text-text-muted">L{comment.start}-L{comment.end}</button><p className="mt-1 text-text-secondary">{comment.body}</p></div>))}
              </div>
            )}
          </div>
          <div className="flex h-14 items-center justify-center gap-3 border-t border-white/[0.06]">
            <button type="button" onClick={() => void compileNow()} className="rounded-full bg-charcoal-850 p-2 text-text-secondary hover:text-white"><RefreshCw size={18} /></button>
            <button type="button" onClick={() => setRightTab('assistant')} className="rounded-full bg-charcoal-850 p-2 text-text-secondary hover:text-white"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => setRightTab('logs')} className="rounded-full bg-charcoal-850 p-2 text-text-secondary hover:text-white"><ChevronRight size={18} /></button>
            <button type="button" onClick={() => setRightTab('comments')} className="rounded-full bg-charcoal-850 p-2 text-text-secondary hover:text-white"><MessageSquare size={16} /></button>
            <button type="button" onClick={() => setRightTab('logs')} className="rounded-full bg-charcoal-850 p-2 text-text-secondary hover:text-white"><FileWarning size={16} /></button>
          </div>
        </aside>
      </div>
      <button type="button" onClick={() => navigate(`/app/${workspaceId}/projects`)} className="sr-only">Back to projects {activeWorkspace ? `· ${activeWorkspace.name}` : ''}</button>
    </div>
  );
};

export default EditorPage;
