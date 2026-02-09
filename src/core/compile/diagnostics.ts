import { CompileDiagnostic } from './types';

export const parseTeXErrors = (log: string): CompileDiagnostic[] => {
  const errors: CompileDiagnostic[] = [];
  const regex = /^! (.+)$/gm;
  let match;

  while ((match = regex.exec(log)) !== null) {
    errors.push({
      line: 0,
      message: match[1],
    });
  }

  return errors;
};

