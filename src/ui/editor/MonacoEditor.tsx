import React, { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

interface EditorMarker {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
  message: string;
  severity: number;
}

interface EditorDecoration {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  options: Record<string, unknown>;
}

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onTriggerAI?: () => void;
  markers?: EditorMarker[];
  decorations?: EditorDecoration[];
  revealLine?: number | null;
  onSelectionChange?: (startLine: number, endLine: number) => void;
  onCursorLineChange?: (line: number) => void;
  inlineHunks?: Array<{
    id: string;
    startLine: number;
    endLine: number;
    status: 'proposed' | 'accepted' | 'rejected';
  }>;
  activeHunkId?: string | null;
  onNavigateHunk?: (direction: 'next' | 'prev') => void;
  onResolveHunk?: (hunkId: string, action: 'accept' | 'reject') => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'latex',
  onTriggerAI,
  markers = [],
  decorations = [],
  revealLine,
  onSelectionChange,
  onCursorLineChange,
  inlineHunks = [],
  activeHunkId,
  onNavigateHunk,
  onResolveHunk,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (onTriggerAI) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        onTriggerAI();
      });
    }

    editor.addCommand(monaco.KeyCode.Tab, () => {
      if (!activeHunkId || !onResolveHunk) return;
      onResolveHunk(activeHunkId, 'accept');
    });

    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (!activeHunkId || !onResolveHunk) return;
      onResolveHunk(activeHunkId, 'reject');
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.BracketRight, () => {
      onNavigateHunk?.('next');
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.BracketLeft, () => {
      onNavigateHunk?.('prev');
    });

    if (onSelectionChange) {
      editor.onDidChangeCursorSelection((event: any) => {
        const { startLineNumber, endLineNumber } = event.selection;
        onSelectionChange(startLineNumber, endLineNumber);
      });
    }

    if (onCursorLineChange) {
      editor.onDidChangeCursorPosition((event: any) => {
        onCursorLineChange(event.position.lineNumber);
      });
    }
  };

  const handleChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) return;

    monaco.editor.setModelMarkers(model, 'cuboid-diagnostics', markers);
  }, [markers]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const hunkDecorations = inlineHunks.map((hunk) => ({
      range: new monaco.Range(hunk.startLine, 1, hunk.endLine, 1),
      options: {
        isWholeLine: true,
        className:
          hunk.status === 'proposed'
            ? 'ghost-diff-proposed'
            : hunk.status === 'accepted'
              ? 'ghost-diff-accepted'
              : 'ghost-diff-rejected',
        glyphMarginClassName: hunk.id === activeHunkId ? 'gutter-comment' : undefined,
      },
    }));

    const nextDecorations = [...decorations.map((entry) => ({
      range: new monaco.Range(
        entry.range.startLineNumber,
        entry.range.startColumn,
        entry.range.endLineNumber,
        entry.range.endColumn,
      ),
      options: entry.options,
    })), ...hunkDecorations];

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, nextDecorations);
  }, [decorations, inlineHunks, activeHunkId]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !revealLine) return;
    editor.revealLineInCenter(revealLine);
    editor.setPosition({ lineNumber: revealLine, column: 1 });
    editor.focus();
  }, [revealLine]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={handleChange}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          fontSize: 14,
          automaticLayout: true,
          glyphMargin: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
};

export default MonacoEditor;
