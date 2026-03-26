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
      // Skip escaped character (e.g., \{, \}, \\)
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        // ⚡ Bolt: Use `substring` to avoid the overhead of building the string character-by-character
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
  
  // ⚡ Bolt: Single-pass global regex search instead of memory-heavy content.split('\n')
  // This avoids allocating a large array of lines and running regexes on every single line.
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;

  let currentLine = 1;
  let lastNewlineIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    // Determine level from the captured group
    const levelStr = match[1];
    const level = levelStr === 'section' ? 1 : levelStr === 'subsection' ? 2 : 3;
    
    const braceIndex = match.index + match[0].length - 1; // Index of the opening brace

    // ⚡ Bolt: Lazily count newlines up to the current match index
    // This is much faster than splitting the entire document upfront.
    let newlineIndex = content.indexOf('\n', lastNewlineIndex);
    while (newlineIndex !== -1 && newlineIndex < match.index) {
      currentLine++;
      lastNewlineIndex = newlineIndex + 1;
      newlineIndex = content.indexOf('\n', lastNewlineIndex);
    }
    
    const braceContent = extractBraceContent(content, braceIndex);
    if (braceContent) {
      sections.push({
        level,
        title: braceContent.content,
        line: currentLine
      });
      // Skip ahead to avoid finding sections inside other section titles
      regex.lastIndex = braceContent.endIndex;
    }
  }
  
  return sections;
}