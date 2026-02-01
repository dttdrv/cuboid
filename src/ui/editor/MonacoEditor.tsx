import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

interface MonacoEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
    value,
    onChange,
    language = 'latex'
}) => {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
    };

    const handleChange = (newValue: string | undefined) => {
        if (newValue !== undefined) {
            onChange(newValue);
        }
    };

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
                    padding: { top: 16, bottom: 16 },
                }}
            />
        </div>
    );
};

export default MonacoEditor;
