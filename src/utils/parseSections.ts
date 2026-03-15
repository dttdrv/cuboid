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
  
  // Optimization: use substring over character-by-character string building
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
  
  // Optimization: Single pass global regex instead of splitting by newlines and doing 3 matches per line
  const regex = /\\(?:sub)*section\*?\{/g;
  let match;

  let lastIndex = 0;
  let currentLine = 1;

  while ((match = regex.exec(content)) !== null) {
    // Lazily count newlines up to the match index to avoid memory-heavy string splitting
    let nlIndex = content.indexOf('\n', lastIndex);
    while (nlIndex !== -1 && nlIndex < match.index) {
      currentLine++;
      lastIndex = nlIndex + 1;
      nlIndex = content.indexOf('\n', lastIndex);
    }
    lastIndex = match.index;

    const matchText = match[0];
    let level = 1;
    if (matchText.startsWith('\\subsubsection')) {
      level = 3;
    } else if (matchText.startsWith('\\subsection')) {
      level = 2;
    }

    const braceIndex = match.index + matchText.length - 1;
    const braceContent = extractBraceContent(content, braceIndex);
    
    if (braceContent) {
      sections.push({
        level: level,
        title: braceContent.content,
        line: currentLine
      });
      // Skip parsing inside the section title to avoid false positives and speed up parsing
      regex.lastIndex = braceContent.endIndex;
      lastIndex = braceContent.endIndex;

      // We must account for newlines that might exist inside the section title
      let innerNlIndex = content.indexOf('\n', match.index);
      while (innerNlIndex !== -1 && innerNlIndex < braceContent.endIndex) {
          currentLine++;
          innerNlIndex = content.indexOf('\n', innerNlIndex + 1);
      }
    }
  }
  
  return sections;
}