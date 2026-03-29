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
        // ⚡ Bolt: utilize content.substring instead of character-by-character appending
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
  
  // ⚡ Bolt: Use a single regex over the entire text instead of splitting by newline.
  // This avoids massive array allocation for large documents and 3x regex passes per line.
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;

  let lineNumber = 1;
  let lastNewlineIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    const type = match[1];
    let level = 1;
    if (type === 'subsection') level = 2;
    else if (type === 'subsubsection') level = 3;
    
    // ⚡ Bolt: Lazily track line numbers instead of splitting strings, avoiding O(N) memory
    const matchIndex = match.index;
    while (true) {
      const nextNewline = content.indexOf('\n', lastNewlineIndex);
      if (nextNewline !== -1 && nextNewline < matchIndex) {
        lineNumber++;
        lastNewlineIndex = nextNewline + 1;
      } else {
        break;
      }
    }
    
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