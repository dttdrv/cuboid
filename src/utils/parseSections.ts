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
  let result = '';
  
  while (i < content.length && depth > 0) {
    if (content[i] === '\\' && i + 1 < content.length) {
      // Handle escaped character (e.g., \{, \}, \\)
      result += content[i];
      i++;
      result += content[i];
      i++;
    } else if (content[i] === '{') {
      depth++;
      result += content[i];
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: result, endIndex: i };
      }
      result += content[i];
      i++;
    } else {
      result += content[i];
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
  
  // ⚡ Bolt: Use a single-pass global regex search to avoid split('\n') and repeated small regex matches per line.
  // This avoids massive array allocations and reduces regex overhead, resulting in significant speedup.
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;

  let match;
  let lastNewlineIndex = -1;
  let currentLineNumber = 1;

  while ((match = regex.exec(content)) !== null) {
    const matchStart = match.index;
    
    // ⚡ Bolt: Efficiently count newlines up to the current match using indexOf
    // This is O(N) over the string length but avoids allocating line arrays.
    while (true) {
      const nextNewline = content.indexOf('\n', lastNewlineIndex + 1);
      if (nextNewline !== -1 && nextNewline < matchStart) {
        currentLineNumber++;
        lastNewlineIndex = nextNewline;
      } else {
        break;
      }
    }
    
    let level = 1; // section
    if (match[1] === 'subsection') level = 2;
    else if (match[1] === 'subsubsection') level = 3;

    const braceIndex = match.index + match[0].length - 1;
    const braceContent = extractBraceContent(content, braceIndex);

    if (braceContent) {
      sections.push({
        level: level,
        title: braceContent.content,
        line: currentLineNumber
      });
    }
  }
  
  return sections;
}