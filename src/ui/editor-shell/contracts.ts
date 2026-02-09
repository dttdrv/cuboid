import { ProposedAction } from '../../core/ai/agenticTypes';
import { CompileRunMeta, CompileRunState, CompileTrigger } from '../../core/compile/types';
import { ActivityEvent, DiagnosticItem } from '../../core/data/types';
import { EditorLayoutMode, PrimaryPane, RightDrawerMode } from '../../core/editor/types';
import { Section } from '../../utils/parseSections';

export interface DrawerComment {
  id: string;
  body: string;
  startLine: number;
  endLine: number;
  createdAt: string;
}

export interface ProjectInfoStats {
  words: number;
  headings: number;
  figures: number;
  mathInline: number;
  mathDisplay: number;
}

export interface LeftRailProps {
  projectName: string;
  documentTitle: string;
  sections: Section[];
  saveNotice: string;
  onBackToProjects: () => void;
  onJumpToLine: (line: number) => void;
}

export interface ComposerPaneProps {
  prompt: string;
  selection: { startLine: number; endLine: number };
  actions: ProposedAction[];
  deferredImageToLatex: boolean;
  deferredVoiceMode: boolean;
  onPromptChange: (value: string) => void;
  onPromptSubmit: () => void;
  onApplyAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
  onViewAction: (actionId: string) => void;
}

export interface ArtifactPaneProps {
  primaryPane: PrimaryPane;
  content: string;
  onContentChange: (value: string) => void;
  documentTitle: string;
  diagnostics: DiagnosticItem[];
  revealLine: number | null;
  onSelectionChange: (startLine: number, endLine: number) => void;
  pdfBlob: Blob | null;
  onCompileNow: () => void;
  inlineHunks: Array<{ id: string; startLine: number; endLine: number; status: 'proposed' | 'accepted' | 'rejected' }>;
  onResolveInlineHunk: (hunkId: string, action: 'accept' | 'reject') => void;
}

export interface RunStatusBarProps {
  compileState: CompileRunState;
  compileMeta: CompileRunMeta | null;
  layoutMode: EditorLayoutMode;
  primaryPane: PrimaryPane;
  drawerOpen: boolean;
  onCompileNow: (trigger: CompileTrigger) => void;
  onPrimaryPaneChange: (pane: PrimaryPane) => void;
  onLayoutModeChange: (mode: EditorLayoutMode) => void;
  onToggleDrawer: () => void;
}

export interface RightDrawerProps {
  isOpen: boolean;
  mode: RightDrawerMode;
  onClose: () => void;
  onModeChange: (mode: RightDrawerMode) => void;
  projectInfo: ProjectInfoStats;
  comments: DrawerComment[];
  commentDraft: string;
  activityEvents: ActivityEvent[];
  compileLog: string;
  diagnostics: DiagnosticItem[];
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onJumpToLine: (line: number) => void;
}

export interface EditorShellProps {
  leftRail: LeftRailProps;
  runStatusBar: RunStatusBarProps;
  composerPane: ComposerPaneProps;
  artifactPane: ArtifactPaneProps;
  rightDrawer: RightDrawerProps;
}
