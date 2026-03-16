export interface Section {
  level: number;
  title: string;
  line: number;
}

/**
 * Extracts content between matching braces starting at the given index.
 * Handles nested braces and escaped braces (e.g., \{ and \}).
 * 
 * Performance Optimization: Uses single pass and `substring` rather than
 * building strings character-by-character.
 *
 * @param content - The string to search in.
 * @param startIndex - The index where the opening brace is located.
 * @returns An object with the extracted content and the index of the closing brace, or null if no match.
 */
function extractBraceContent(content: string, startIndex: number): { content: string, endIndex: number } | null {
  if (content[startIndex] !== '{') return null;
  
  let depth = 1;
  let i = startIndex + 1;
  
  while (i < content.length && depth > 0) {
    if (content[i] === '\\' && i + 1 < content.length) {
      // Handle escaped character (e.g., \{, \}, \\)
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        // Return substring rather than accumulated character strings for better performance
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
 * Performance Optimization: Uses a single-pass global regular expression
 * and `indexOf('\n')` for counting newlines to avoid `.split('\n')` memory allocation overhead.
 *
 * @param content - The LaTeX content to parse.
 * @returns An array of Section objects with level, title, and line number.
 */
export function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  const regex = /\\(subsubsection|subsection|section)\*?\{/g;
  let match;
  
  let lineNumber = 1;
  let lastNewlineIndex = -1;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;
    
    // Lazily count newlines on the original string from the last known newline to the current match
    while (true) {
      const nextNewline = content.indexOf('\n', lastNewlineIndex + 1);
      if (nextNewline !== -1 && nextNewline < matchIndex) {
        lineNumber++;
        lastNewlineIndex = nextNewline;
      } else {
        break;
      }
    }

    const command = match[1];
    let level = 1;
    if (command === 'subsection') level = 2;
    else if (command === 'subsubsection') level = 3;

    const braceIndex = matchIndex + match[0].length - 1; // Index of the opening brace
    const braceContent = extractBraceContent(content, braceIndex);
    
    if (braceContent) {
      sections.push({
        level,
        title: braceContent.content,
        line: lineNumber
      });
    }
  }
  
  return sections;
}
