import React from 'react';
import ArtifactPane from './ArtifactPane';
import ComposerPane from './ComposerPane';
import LeftRail from './LeftRail';
import RightDrawer from './RightDrawer';
import RunStatusBar from './RunStatusBar';
import { EditorShellProps } from './contracts';

const EditorShell: React.FC<EditorShellProps> = ({
  leftRail,
  runStatusBar,
  composerPane,
  artifactPane,
  rightDrawer,
}) => {
  return (
    <div className="min-h-screen bg-charcoal-950 p-2 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1700px] border border-white/[0.08] bg-charcoal-950">
        <LeftRail {...leftRail} />

        <section className="min-w-0 flex-1">
          <RunStatusBar {...runStatusBar} />
          <div className="grid h-[calc(100%-3.5rem)] min-h-0 grid-cols-[360px_1fr]">
            <ComposerPane {...composerPane} />
            <ArtifactPane {...artifactPane} />
          </div>
        </section>

        <RightDrawer {...rightDrawer} />
      </div>
    </div>
  );
};

export default EditorShell;
