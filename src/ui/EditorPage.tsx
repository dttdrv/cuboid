import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditorView from './EditorView';
import PdfViewer from './PdfViewer';
import CompileButton from './CompileButton';
import { projectService } from '../core/data/ProjectService';
import { TeXCompiler } from '../core/tex-compiler'; // Updated path

// Mock Encryption Util (Inline)
const decrypt = (ciphertext: string) => {
  if (ciphertext.startsWith('ENC:')) {
    try {
      return atob(ciphertext.substring(4));
    } catch (e) {
      console.error('Decryption failed', e);
      return 'Error: Decryption Failed';
    }
  }
  return ciphertext;
};

const compiler = new TeXCompiler();

const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Loading...');
  const [pdf, setPdf] = useState<Blob | null>(null);

  // Ref to get content from EditorView for compilation
  const editorContentRef = useRef<() => string>(() => '');

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    projectService.getDocument(projectId)
      .then(doc => {
        const plaintext = decrypt(doc.encrypted_content);
        setContent(plaintext);
        // We also need project metadata ideally, but for now just show ID or stub
        setProjectName(`Project ${projectId.substring(0, 8)}`);
      })
      .catch(err => {
        console.error('Failed to load document', err);
        setProjectName('Error loading project');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCompile = async (): Promise<Blob | null> => {
    const texContent = editorContentRef.current();
    const result = await compiler.compile(texContent);
    if (result.success && result.pdf) {
      return result.pdf;
    }
    throw new Error(result.log || 'Compilation failed');
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-slate-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-700"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📄</span>
            <h1 className="font-semibold text-slate-800">{projectName}</h1>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              🔒 E2E Encrypted
            </span>
          </div>
        </div>
        <div>
          <CompileButton onCompile={handleCompile} onPdfReady={setPdf} />
        </div>
      </header>

      {/* Split Pane */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-slate-200 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              Decrypting content...
            </div>
          ) : (
            <EditorView getContentRef={editorContentRef} initialContent={content} />
            // We need to inject 'content' into EditorView. 
            // Current EditorView doesn't accept 'initialContent'.
            // We need to update EditorView to use Yjs or accept prop.
            // For this step, let's assume Yjs handles it via CollaborationManager if connected?
            // OR we need to manually insert it.
            // See next step.
          )}
        </div>
        <div className="flex-1 bg-slate-100 overflow-hidden">
          <PdfViewer pdf={pdf} />
        </div>
      </main>
    </div>
  );
};

export default EditorPage;