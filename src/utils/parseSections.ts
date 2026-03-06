export interface Section {
  level: number;
  title: string;
  line: number;
}

/**
 * Extracts content between matching braces starting at the given index.
 * Handles nested braces and escaped braces (e.g., \{ and \}).
 * 
 * Performance Optimization:
 * Iterates directly over the string and uses `substring` extraction
 * at the end rather than building a new string character-by-character
 * to minimize intermediate string allocations.
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
      // Skip escaped characters
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
 * Performance Optimization:
 * Uses a single global regular expression to find all section commands
 * in one pass, and counts newlines on the fly using `indexOf`.
 * This avoids memory-heavy `split('\n')` calls and multiple regex
 * passes over the same content.
 *
 * @param content - The LaTeX content to parse.
 * @returns An array of Section objects with level, title, and line number.
 */
export function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  
  // A single regex for all section commands, ensuring we capture everything efficiently.
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;

  let currentLine = 1;
  let lastIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    const levelStr = match[1];
    const level = levelStr === 'section' ? 1 : levelStr === 'subsection' ? 2 : 3;
    const braceIndex = match.index + match[0].length - 1; // Index of the opening brace
    
    const braceContent = extractBraceContent(content, braceIndex);
    if (braceContent) {
      // Calculate line number: count newlines from the last match
      // Using indexOf is much faster than iterating character by character in JS
      let nlIndex = content.indexOf('\n', lastIndex);
      while (nlIndex !== -1 && nlIndex < match.index) {
        currentLine++;
        nlIndex = content.indexOf('\n', nlIndex + 1);
      }
      lastIndex = match.index;

      sections.push({
        level,
        title: braceContent.content,
        line: currentLine
      });
    }
  }
  
  return sections;
}
