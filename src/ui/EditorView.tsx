import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { EditorState } from 'prosemirror-state';
import { EditorView as PMView } from 'prosemirror-view';
import { ySyncPlugin } from 'y-prosemirror';
import { schema } from 'prosemirror-schema-basic';
import 'prosemirror-view/style/prosemirror.css';

interface EditorViewProps {
  getContentRef?: React.MutableRefObject<() => string>;
  initialContent?: string;
}

const EditorView: React.FC<EditorViewProps> = ({ getContentRef, initialContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<PMView | null>(null);
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (initialized.current) return;
    initialized.current = true;

    const ytext = ydoc.current.getText('prosemirror');

    // Initialize content if provided
    if (initialContent && ytext.toString().length === 0) {
      ytext.insert(0, initialContent);
    }

    const state = EditorState.create({
      schema,
      plugins: [ySyncPlugin(ytext)]
    });

    const view = new PMView(containerRef.current, {
      state,
    });

    viewRef.current = view;

    if (getContentRef) {
      getContentRef.current = () => {
        // Return current text content
        // Ideally use a serializer if schema has blocks, but checking schema... basic schema has doc/paragraph/text.
        return view.state.doc.textContent;
      };
    }

    return () => {
      view.destroy();
      initialized.current = false;
    };
  }, []); // Run once on mount. 

  // React to initialContent changes if they happen after mount? 
  // For this simple version, we assume key prop or mount-unmount.
  // Step 2022's EditorPage conditionally renders EditorView until loading is done, so initialContent will be ready.

  return (
    <div
      ref={containerRef}
      className="prosemirror-editor min-h-[500px] outline-none p-4"
    />
  );
};

export default EditorView;