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

  // Fast path for simple string extraction without concatenation
  let hasEscapesOrNesting = false;
  const startStr = i;
  
  while (i < content.length && depth > 0) {
    if (content[i] === '\\' && i + 1 < content.length) {
      hasEscapesOrNesting = true;
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      hasEscapesOrNesting = true;
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        if (!hasEscapesOrNesting) {
          // Fast return avoiding string concatenation
          return { content: content.substring(startStr, i), endIndex: i };
        }
        break; // Drop to slow path
      }
      hasEscapesOrNesting = true;
      i++;
    } else {
      i++;
    }
  }

  if (depth > 0) return null; // Unmatched braces

  // Slow path with chunked string concatenation for escapes/nesting
  depth = 1;
  i = startIndex + 1;
  let result = '';

  while (i < content.length && depth > 0) {
    if (content[i] === '\\' && i + 1 < content.length) {
      result += content.substring(i, i + 2);
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      result += '{';
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: result, endIndex: i };
      }
      result += '}';
      i++;
    } else {
      // Consume a chunk of normal characters efficiently
      let nextSpecial = i;
      while (nextSpecial < content.length && content[nextSpecial] !== '\\' && content[nextSpecial] !== '{' && content[nextSpecial] !== '}') {
        nextSpecial++;
      }
      result += content.substring(i, nextSpecial);
      i = nextSpecial;
    }
  }
  
  return null;
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
  
  // Find all sections in a single pass using regex instead of splitting by newline
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;

  let currentLine = 1;
  let lastNewlineSearchIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    // Count newlines from the last checked index up to this match
    for (let i = lastNewlineSearchIndex; i < match.index; i++) {
      if (content.charCodeAt(i) === 10) { // '\n'
        currentLine++;
      }
    }
    lastNewlineSearchIndex = match.index;

    const command = match[1];
    let level = 1;
    if (command === 'subsection') level = 2;
    else if (command === 'subsubsection') level = 3;

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