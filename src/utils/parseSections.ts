export interface Section {
  level: number;
  title: string;
  line: number;
}

/**
 * Extracts content between matching braces starting at the given index.
 * Handles nested braces and escaped braces (e.g., \\{ and \\}).
 * Optimized to use single-pass string traversal and `substring` for memory efficiency.
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
      // Skip escaped character (e.g., \\{, \\}, \\\\)
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        // Use substring instead of accumulating characters one by one
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
 * Handles \\section{}, \\subsection{}, \\subsubsection{} commands,
 * including optional modifiers (e.g., \\section*{}) and nested braces in titles.
 * Optimized using single-pass global regex `matchAll` to avoid `split('\\n')` overhead on large documents.
 * 
 * @param content - The LaTeX content to parse.
 * @returns An array of Section objects with level, title, and line number.
 */
export function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  // Match any section, subsection, or subsubsection command globally
  const regex = /\\(sub)*section\*?\{/g;
  
  let currentLine = 1;
  let lastNewlineIndex = -1;

  for (const match of content.matchAll(regex)) {
    const matchStart = match.index;
    if (matchStart === undefined) continue;
    
    // Efficiently count lines since the last match without splitting the string
    while (true) {
      const nextNewline = content.indexOf('\n', lastNewlineIndex + 1);
      if (nextNewline !== -1 && nextNewline < matchStart) {
        currentLine++;
        lastNewlineIndex = nextNewline;
      } else {
        break;
      }
    }
    
    const command = match[0];
    let level = 1;
    if (command.startsWith('\\subsubsection')) level = 3;
    else if (command.startsWith('\\subsection')) level = 2;

    const braceIndex = matchStart + command.length - 1; // Index of the opening brace
    const braceMatch = extractBraceContent(content, braceIndex);

    if (braceMatch) {
      // Need to unescape the brace content to preserve original behavior
      // The original code accumulated characters one by one, implicitly keeping the backslashes
      // Because we used substring, backslashes for escaped chars are preserved.
      sections.push({
        level,
        title: braceMatch.content,
        line: currentLine
      });
    }
  }
  
  return sections;
}