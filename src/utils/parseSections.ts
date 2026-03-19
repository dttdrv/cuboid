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
      // Skip escaped character
      i += 2;
    } else if (content[i] === '{') {
      depth++;
      i++;
    } else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        // Extract substring and resolve escaped braces/slashes if any
        let rawContent = content.substring(startIndex + 1, i);
        return { content: rawContent, endIndex: i };
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
  // ⚡ Bolt: Single-pass regex to find all section commands without splitting by newline
  const regex = /\\(section|subsection|subsubsection)\*?\{/g;
  let match;

  let currentLine = 1;
  let lastNewlineIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    const cmd = match[1]; // 'section', 'subsection', or 'subsubsection'
    const level = cmd === 'section' ? 1 : cmd === 'subsection' ? 2 : 3;
    const braceIndex = match.index + match[0].length - 1; // Index of the opening '{'

    const braceContent = extractBraceContent(content, braceIndex);
    if (braceContent) {
      // ⚡ Bolt: Lazily count newlines up to the match index to resolve the line number
      while (lastNewlineIndex !== -1 && lastNewlineIndex < match.index) {
        lastNewlineIndex = content.indexOf('\n', lastNewlineIndex);
        if (lastNewlineIndex !== -1 && lastNewlineIndex < match.index) {
          currentLine++;
          lastNewlineIndex++;
        } else {
          break;
        }
      }

      sections.push({
        level,
        title: braceContent.content,
        line: currentLine
      });

      // Optimization: we could advance `regex.lastIndex` to `braceContent.endIndex` to skip inner sections,
      // but standard LaTeX parsers typically evaluate sequentially, and there might be nested sections
      // or comments. We leave `regex.lastIndex` alone to ensure full semantic matching parity.
    }
  }

  return sections;
}