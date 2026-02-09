export type CommandSource = 'cmdk' | 'slash' | 'context';

export interface CommandInvocation {
  id: string;
  source: CommandSource;
  command: string;
  args: string;
  selection?: {
    lineStart: number;
    lineEnd: number;
  };
  createdAt: string;
}

export interface CommandExecution {
  invocationId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  activityIds: string[];
  changeSetIds: string[];
  error?: string;
}

export interface CommandContext {
  hasSelection: boolean;
  hasVision: boolean;
  hasVoice: boolean;
  hasTools: boolean;
}

export interface RegisteredCommand {
  id: string;
  label: string;
  description: string;
  supportsSelection: boolean;
  requiresCapabilities: Array<'tool_calling' | 'vision_input' | 'audio_input'>;
}

