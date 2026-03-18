export interface Section {
  level: number;
  title: string;
  line: number;
}

/**
 * Extracts content between matching braces starting at the given index.
 * Handles nested braces and escaped braces (e.g., \{ and \}).
 * 
 * Performance: Optimized to use character indexing and substring extraction
 * instead of building strings character-by-character.
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
  
  while (i < len && depth > 0) {
    const char = content[i];
    if (char === '\\' && i + 1 < len) {
      // Handle escaped character (e.g., \{, \}, \\)
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
 * Performance: Uses a global regular expression and `indexOf` for lazy line number
 * calculation instead of `split('\n')`, which avoids allocating large intermediate
 * string arrays. This approach is significantly faster for large text blobs.
 *
 * @param content - The LaTeX content to parse.
 * @returns An array of Section objects with level, title, and line number.
 */
export function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  
  // Single-pass global regex for all sectioning commands
  const regex = /\\(subsubsection|subsection|section)\*?\{/g;
  let match;

  let currentLineNumber = 1;
  let lastNewlineIndex = -1;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;

    // Count newlines lazily up to the current match to determine the line number
    let nextNewlineIndex = content.indexOf('\n', lastNewlineIndex + 1);
    while (nextNewlineIndex !== -1 && nextNewlineIndex < matchIndex) {
      currentLineNumber++;
      lastNewlineIndex = nextNewlineIndex;
      nextNewlineIndex = content.indexOf('\n', lastNewlineIndex + 1);
    }
    
    const command = match[1];
    let level = 1;
    if (command === 'subsection') {
      level = 2;
    } else if (command === 'subsubsection') {
      level = 3;
    }
    
    // The match ends with '{', so the opening brace is the last character of the match
    const braceIndex = matchIndex + match[0].length - 1;
    const braceContent = extractBraceContent(content, braceIndex);

    if (braceContent) {
      sections.push({
        level,
        title: braceContent.content,
        line: currentLineNumber
      });
    }
  }
  
  return sections;
}
