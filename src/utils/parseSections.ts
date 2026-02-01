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
  const lines = content.split('\n');
  
  lines.forEach((line, lineNumber) => {
    // Check for \section or \section* commands
    let match = line.match(/\\section\*?\{/);
    if (match) {
      const braceIndex = match.index! + match[0].length - 1; // Index of the opening brace
      const braceContent = extractBraceContent(line, braceIndex);
      if (braceContent) {
        sections.push({
          level: 1,
          title: braceContent.content,
          line: lineNumber + 1
        });
      }
    }
    
    // Check for \subsection or \subsection* commands
    match = line.match(/\\subsection\*?\{/);
    if (match) {
      const braceIndex = match.index! + match[0].length - 1; // Index of the opening brace
      const braceContent = extractBraceContent(line, braceIndex);
      if (braceContent) {
        sections.push({
          level: 2,
          title: braceContent.content,
          line: lineNumber + 1
        });
      }
    }
    
    // Check for \subsubsection or \subsubsection* commands
    match = line.match(/\\subsubsection\*?\{/);
    if (match) {
      const braceIndex = match.index! + match[0].length - 1; // Index of the opening brace
      const braceContent = extractBraceContent(line, braceIndex);
      if (braceContent) {
        sections.push({
          level: 3,
          title: braceContent.content,
          line: lineNumber + 1
        });
      }
    }
  });
  
  return sections;
}