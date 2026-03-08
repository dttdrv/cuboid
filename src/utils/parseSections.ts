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
export function extractBraceContent(content: string, startIndex: number): { content: string, endIndex: number } | null {
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
  
  // Single pass RegExp search using exec is significantly faster
  // than splitting by newline and doing line-by-line regex matching.
  // It avoids allocating an array of strings for every line.
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;

  let lastIndex = 0;
  let currentLine = 1;

  while ((match = regex.exec(content)) !== null) {
    // Count newlines between the last match and the current match
    // to maintain the correct line number without full string splitting
    for (let i = lastIndex; i < match.index; i++) {
      if (content[i] === '\n') {
        currentLine++;
      }
    }
    lastIndex = match.index;
    
    let level = 1;
    if (match[1] === 'subsection') level = 2;
    else if (match[1] === 'subsubsection') level = 3;
    
    // match[0] is the matched string, like "\section{"
    // The brace is the last character of the match.
    const braceIndex = match.index + match[0].length - 1;
    const braceContent = extractBraceContent(content, braceIndex);

    if (braceContent) {
      sections.push({
        level,
        title: braceContent.content,
        line: currentLine
      });
      // Skip the matched content to avoid matching inside the section title
      // Also advance the current line count for newlines inside the braces
      const advancedIndex = braceContent.endIndex + 1;
      for (let i = regex.lastIndex; i < advancedIndex; i++) {
        if (content[i] === '\n') {
          currentLine++;
        }
      }
      regex.lastIndex = advancedIndex;
      lastIndex = advancedIndex;
    }
  }
  
  return sections;
}
