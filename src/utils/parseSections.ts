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
  const contentStart = i;
  
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
        return { content: content.substring(contentStart, i), endIndex: i };
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
  // Performance optimization: Avoid splitting the entire document into an array of lines.
  // We use a single global regex match and count newlines to track the current line number,
  // which significantly reduces memory allocations and parsing time on large documents.
  const sections: Section[] = [];
  const sectionRegex = /\\(subsubsection|subsection|section)\*?\{/g;
  
  let match;
  let currentLine = 1;
  let lastIndex = 0;

  while ((match = sectionRegex.exec(content)) !== null) {
    // Fast single-pass loop to advance line numbers
    for (let i = lastIndex; i < match.index; i++) {
      if (content[i] === '\n') {
        currentLine++;
      }
    }
    lastIndex = match.index;
    
    const matchStr = match[0];
    let level = 1;
    if (matchStr.startsWith('\\subsubsection')) {
      level = 3;
    } else if (matchStr.startsWith('\\subsection')) {
      level = 2;
    }
    
    // Index of the opening brace
    const braceIndex = match.index + matchStr.length - 1;
    const braceContent = extractBraceContent(content, braceIndex);

    if (braceContent) {
      sections.push({
        level,
        title: braceContent.content,
        line: currentLine
      });
    }
  }
  
  return sections;
}
