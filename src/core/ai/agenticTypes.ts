export type ComposerIntent = 'ask' | 'edit' | 'analyze' | 'compile_fix';

export type ProposedActionStatus = 'proposed' | 'accepted' | 'rejected';

export interface ProposedAction {
  id: string;
  intent: ComposerIntent;
  title: string;
  summary: string;
  startLine: number;
  endLine: number;
  status: ProposedActionStatus;
  createdAt: string;
}

export interface ActionApplyResult {
  actionId: string;
  status: 'applied' | 'rejected' | 'failed';
  detail?: string;
}
