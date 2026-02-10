import { CompileRunState } from '../../core/compile/types';
import { DiagnosticItem } from '../../core/data/types';
import { Section } from '../../utils/parseSections';

export interface LeftRailProps {
  projectName: string;
  documentTitle: string;
  sections: Section[];
  saveNotice: string;
  onCompileNow: () => void;
  onBackToProjects: () => void;
  onJumpToLine: (line: number) => void;
}

export interface ComposerPaneProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onPromptSubmit: () => void;
}

export interface ArtifactPaneProps {
  content: string;
  onContentChange: (value: string) => void;
  documentTitle: string;
  diagnostics: DiagnosticItem[];
  revealLine: number | null;
  onSelectionChange: (startLine: number, endLine: number) => void;
  onCompileNow: () => void;
  inlineHunks: Array<{ id: string; startLine: number; endLine: number; status: 'proposed' | 'accepted' | 'rejected' }>;
  onResolveInlineHunk: (hunkId: string, action: 'accept' | 'reject') => void;
}

export interface PreviewPaneProps {
  compileState: CompileRunState;
  pdfBlob: Blob | null;
  onCompileNow: () => void;
}

export interface EditorShellProps {
  leftRail: LeftRailProps;
  composerPane: ComposerPaneProps;
  artifactPane: ArtifactPaneProps;
  previewPane: PreviewPaneProps;
}
