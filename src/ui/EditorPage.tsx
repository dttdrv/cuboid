import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataLayer } from '../core/hooks/useDataLayer';
import { useAuth } from '../core/auth/AuthProvider';
import MonacoEditor from './editor/MonacoEditor';
import PreviewPane from './editor/PreviewPane';
import { Menu, X, Save, FileText, Settings, ChevronRight, Moon, Sun } from 'lucide-react';
import { parseSections } from '../utils/parseSections';

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveDocument, loadDocument } = useDataLayer();

  // State
  const [content, setContent] = useState<string>('\\documentclass{article}\n\\begin{document}\n\\section{Introduction}\nHello world.\n\\end{document}');
  const [isTocOpen, setIsTocOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const editorRef = useRef<any>(null);

  // Parse sections from LaTeX content
  const sections = useMemo(() => parseSections(content), [content]);

  // Effects
  useEffect(() => {
    const init = async () => {
      if (id) {
        try {
          // In a real app, fetch from backend
          // const data = await loadDocument(id);
          // setContent(data.content);
          console.log('Loading document:', id);
        } catch (error) {
          console.error('Failed to load document', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  // Handlers
  const handleSave = async () => {
    if (!id) return;
    try {
      // await saveDocument(id, content);
      setLastSaved(new Date());
      console.log('Document saved');
    } catch (error) {
      console.error('Failed to save document', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="rounded p-2 hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Toggle Menu"
          >
            {isTocOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h1 className="font-semibold text-gray-800 text-sm md:text-base truncate max-w-[150px] md:max-w-xs">
              {id || 'Untitled Document'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded hover:bg-gray-100 text-gray-500"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          
          <button className="p-2 rounded hover:bg-gray-100 text-gray-600">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Outline */}
        {isTocOpen && (
          <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300">
            <div className="p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                Outline
              </h3>
              
              {/* Dynamic Outline Section */}
              <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                {sections.length === 0 ? (
                  <div className="px-6 py-1 text-gray-400 italic">No sections found</div>
                ) : (
                  sections.map((section, index) => (
                    <div 
                      key={index}
                      className={`py-1 hover:bg-gray-200 cursor-pointer transition-colors ${
                        section.level === 1 ? 'px-6 font-medium' : section.level === 2 ? 'px-8 text-gray-700' : 'px-10 text-gray-600'
                      }`}
                    >
                      *{section.title}
                    </div>
                  ))
                )}
              </div>
              {/* End Dynamic Outline Section */}
              
              <div className="mt-8 border-t border-gray-200 pt-4">
                 <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Info</h3>
                 <div className="text-xs text-gray-500">
                   <p>Author: {user?.name || 'Guest'}</p>
                   <p>Last Saved: {lastSaved ? lastSaved.toLocaleTimeString() : 'Never'}</p>
                 </div>
              </div>
            </div>
          </aside>
        )}

        {/* Editor Area */}
        <main className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 h-full flex flex-col">
            <MonacoEditor
              height="100%"
              language="latex"
              value={content}
              onChange={(val) => setContent(val || '')}
              editorDidMount={(editor, monaco) => {
                editorRef.current = editor;
                // Layout fix
                window.addEventListener('resize', () => editor.layout());
              }}
              theme={isDarkMode ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
          
          {/* Preview Pane Split */}
          <div className="w-[400px] border-l border-gray-200 bg-white hidden lg:block overflow-y-auto">
            <PreviewPane content={content} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;