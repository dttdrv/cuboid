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
  const len = content.length;
  
  // OPTIMIZATION: Loop runs faster by avoiding frequent string concatenation.
  // We extract the substring only once at the end when the closing brace is found.
  while (i < len && depth > 0) {
    const char = content[i];
    if (char === '\\' && i + 1 < len) {
      // Skip escaped character (e.g., \{, \}, \\)
      i += 2;
    } else if (char === '{') {
      depth++;
      i++;
    } else if (char === '}') {
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
  
  // OPTIMIZATION: Single-pass global regex extraction reduces the need for split('\n')
  // and multiple match() execution per line, reducing memory allocations significantly.
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;
  let currentLine = 1;
  let lastIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    // Advance line counter by efficiently finding next newline
    let nextNewline = content.indexOf('\n', lastIndex);
    while (nextNewline !== -1 && nextNewline < match.index) {
      currentLine++;
      nextNewline = content.indexOf('\n', nextNewline + 1);
    }
    lastIndex = match.index;

    let level = 1;
    if (match[1] === 'subsection') level = 2;
    else if (match[1] === 'subsubsection') level = 3;

    const braceIndex = match.index + match[0].length - 1; // Index of the opening brace
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