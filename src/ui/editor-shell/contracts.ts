import { CompileRunState } from '../../core/compile/types';
import { DiagnosticItem } from '../../core/data/types';

/* ── Left Pane ── */
export type LeftPaneMode = 'files' | 'chats';

export interface LeftPaneProps {
  mode: LeftPaneMode;
  onModeChange: (mode: LeftPaneMode) => void;

  /* Files mode */
  files: Array<{
    path: string;
    label: string;
    updatedAt?: string;
  }>;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  saveNotice: string;
  onAddFile?: () => void;

  /* Chats mode */
  chatList: Array<{ id: string; title: string; updatedAt: string }>;
  onSelectChat?: (chatId: string) => void;

  /* Bottom bar */
  onOpenSettings: () => void;
  onHidePane: () => void;
}

/* ── Editor Pane (Middle) ── */
export interface EditorTab {
  id: string;
  label: string;
  isModified?: boolean;
}

export interface EditorPaneProps {
  content: string;
  onContentChange: (value: string) => void;
  openTabs: EditorTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  diagnostics: DiagnosticItem[];
  revealLine: number | null;
  onSelectionChange: (startLine: number, endLine: number) => void;
  onCompileNow: () => void;
  inlineHunks: Array<{ id: string; startLine: number; endLine: number; status: 'proposed' | 'accepted' | 'rejected' }>;
  onResolveInlineHunk: (hunkId: string, action: 'accept' | 'reject') => void;
}

/* ── Composer (floating AI bar inside middle pane) ── */
export interface ComposerPaneProps {
  prompt: string;
  aiEnabled: boolean;
  aiBusy: boolean;
  aiProviderLabel: string;
  aiModelLabel?: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
  attachedImageName?: string | null;
  onPromptChange: (value: string) => void;
  onPromptSubmit: () => void;
  onToggleAi: () => void;
  onClearMessages: () => void;
  onAttachImage: (file: File | null) => void;
  onRemoveImage: () => void;
}

/* ── Preview Pane (Right) ── */
export interface PreviewPaneProps {
  compileState: CompileRunState;
  pdfBlob: Blob | null;
  compileLog: string;
  pdfDarkMode?: boolean;
  onCompileNow: () => void;
  onDownloadPdf?: () => void;
  onTogglePdfDarkMode?: (enabled: boolean) => void;
}

/* ── Settings Modal ── */
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  wordWrap: boolean;
  onWordWrapChange: (enabled: boolean) => void;
  autoCompile: boolean;
  onAutoCompileChange: (enabled: boolean) => void;
  pdfDarkMode: boolean;
  onPdfDarkModeChange: (enabled: boolean) => void;
}

/* ── Command Palette ── */
export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCompileNow: () => void;
  onToggleAi: () => void;
  onOpenSettings: () => void;
  onToggleLeftPane: () => void;
}

/* ── Shell ── */
export interface EditorShellProps {
  leftPane: LeftPaneProps;
  editorPane: EditorPaneProps;
  composerPane: ComposerPaneProps;
  previewPane: PreviewPaneProps;
  leftPaneVisible: boolean;
  onShowLeftPane: () => void;
}
