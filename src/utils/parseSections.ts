export interface Section {
  level: number;
  title: string;
  line: number;
}

/**
 * Parses LaTeX content to extract section headers.
 * Handles \section{}, \subsection{}, \subsubsection{} commands,
 * including optional modifiers (e.g., \section*{}) and nested braces in titles.
 * 
 * @param content - The LaTeX content to parse.
 * @returns An array of Section objects with level, title, and line number.
 */
export function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  // Performance: Single-pass global regex avoids multiple allocations and splits
  const regex = /\\(subsubsection|subsection|section)\*?\{/g;
  
  let match;
  let lastNewlineIndex = 0;
  let currentLineNumber = 1;

  while ((match = regex.exec(content)) !== null) {
    // Performance: Lazily count newlines without allocating an array via split('\n')
    let nextNewline = content.indexOf('\n', lastNewlineIndex);
    while (nextNewline !== -1 && nextNewline < match.index) {
      currentLineNumber++;
      lastNewlineIndex = nextNewline + 1;
      nextNewline = content.indexOf('\n', lastNewlineIndex);
    }

    const command = match[1];
    let level = 1;
    if (command === 'subsubsection') level = 3;
    else if (command === 'subsection') level = 2;

    const braceIndex = match.index + match[0].length - 1;
    
    // Inline brace matching to avoid substring allocations during iteration
    let depth = 1;
    let i = braceIndex + 1;
    
    while (i < content.length && depth > 0) {
      if (content[i] === '\\' && i + 1 < content.length) {
        i += 2; // Skip escaped character
      } else if (content[i] === '{') {
        depth++;
        i++;
      } else if (content[i] === '}') {
        depth--;
        if (depth === 0) {
          sections.push({
            level,
            // Zero-allocation substring extraction
            title: content.substring(braceIndex + 1, i),
            line: currentLineNumber
          });
          break;
        }
        i++;
      } else {
        i++;
      }
    }
  }

  return sections;
}