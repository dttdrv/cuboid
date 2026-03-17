export interface Section {
  level: number;
  title: string;
  line: number;
}

/**
 * Extracts content between matching braces starting at the given index.
 * Handles nested braces and escaped braces (e.g., \{ and \}).
 * 
 * @param content - The string to search in.
 * @param startIndex - The index where the opening brace is located.
 * @returns An object with the extracted content and the index of the closing brace, or null if no match.
 */
function extractBraceContent(content: string, startIndex: number): { content: string, endIndex: number } | null {
  if (content[startIndex] !== '{') return null;
  
  let depth = 1;
  let i = startIndex + 1;
  
  // ⚡ Bolt: Performance improvement - Avoid character-by-character string building
  // Prefer substring extraction to minimize memory allocations.
  while (i < content.length && depth > 0) {
    if (content[i] === '\\' && i + 1 < content.length) {
      // Handle escaped character (e.g., \{, \}, \\)
      // Skip the escaped character
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        // ⚡ Bolt: Use substring to extract the content efficiently without string concatenation
        return { content: content.substring(startIndex + 1, i), endIndex: i };
      }
      i++;
    } else {
      i++;
    }
  }
  
  return null; // Unmatched braces
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
  
  // ⚡ Bolt: Performance improvement
  // Use a single-pass global regular expression instead of splitting the entire document
  // by newlines and allocating a massive array, which consumes significant memory and CPU.
  const regex = /\\(subsubsection|subsection|section)\*?\{/g;
  let match;

  // ⚡ Bolt: Lazily count newlines for efficient line number tracking
  let currentLineNumber = 1;
  let lastNewlineIndex = -1;

  while ((match = regex.exec(content)) !== null) {
    const command = match[1];
    let level = 1;
    if (command === 'subsection') level = 2;
    else if (command === 'subsubsection') level = 3;

    // The index of the opening brace '{'
    const braceIndex = match.index + match[0].length - 1;
    const braceContent = extractBraceContent(content, braceIndex);
    
    if (braceContent) {
      // Advance line number tracking up to the current match index
      while (true) {
        const nextNewline = content.indexOf('\n', lastNewlineIndex + 1);
        if (nextNewline !== -1 && nextNewline < match.index) {
          currentLineNumber++;
          lastNewlineIndex = nextNewline;
        } else {
          break;
        }
      }

      sections.push({
        level,
        title: braceContent.content,
        line: currentLineNumber
      });
    }
  }
  
  return sections;
}