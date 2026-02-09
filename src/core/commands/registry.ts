import { CommandContext, RegisteredCommand } from './types';

export const COMMAND_REGISTRY: RegisteredCommand[] = [
  {
    id: 'fix_compile',
    label: 'Fix compile errors',
    description: 'Analyze diagnostics and propose patches.',
    supportsSelection: false,
    requiresCapabilities: [],
  },
  {
    id: 'literature_search',
    label: 'Literature search',
    description: 'Search arXiv/Crossref and propose references.',
    supportsSelection: false,
    requiresCapabilities: [],
  },
  {
    id: 'image_to_latex',
    label: 'Image to LaTeX',
    description: 'Generate equation/table/figure snippet from image.',
    supportsSelection: true,
    requiresCapabilities: ['vision_input'],
  },
  {
    id: 'voice_mode',
    label: 'Voice mode',
    description: 'Capture spoken prompt and send to assistant.',
    supportsSelection: false,
    requiresCapabilities: ['audio_input'],
  },
  {
    id: 'format_selection',
    label: 'Format selection',
    description: 'Clean spacing and normalize selected block.',
    supportsSelection: true,
    requiresCapabilities: [],
  },
];

export const filterCommandsByContext = (
  commands: RegisteredCommand[],
  context: CommandContext,
): RegisteredCommand[] =>
  commands.filter((command) => {
    if (command.supportsSelection && !context.hasSelection) return false;
    if (command.requiresCapabilities.includes('tool_calling') && !context.hasTools) return false;
    if (command.requiresCapabilities.includes('vision_input') && !context.hasVision) return false;
    if (command.requiresCapabilities.includes('audio_input') && !context.hasVoice) return false;
    return true;
  });

export const parseSlashCommand = (input: string): { command: string; args: string } | null => {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const content = trimmed.slice(1);
  const [command, ...rest] = content.split(/\s+/);
  if (!command) return null;
  return { command: command.toLowerCase(), args: rest.join(' ') };
};

