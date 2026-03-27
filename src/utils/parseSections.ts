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
        // Optimize: Extract the substring once instead of building it character-by-character
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
  
  // Optimize: Single-pass global regex instead of splitting by lines
  // This avoids memory-heavy O(N) split('\n') and O(N) substring matchers on every line
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;

  let match;
  let currentLine = 1;
  let lastNewlineIndex = -1;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;
    
    // Optimize: Lazily count newlines up to the current match index
    // Using indexOf is significantly faster than splitting the entire string
    while (true) {
      const nextNewline = content.indexOf('\n', lastNewlineIndex + 1);
      if (nextNewline !== -1 && nextNewline < matchIndex) {
        currentLine++;
        lastNewlineIndex = nextNewline;
      } else {
        break;
      }
    }
    
    const command = match[1];
    const level = command === 'section' ? 1 : command === 'subsection' ? 2 : 3;

    const braceIndex = matchIndex + match[0].length - 1; // Index of the opening brace
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