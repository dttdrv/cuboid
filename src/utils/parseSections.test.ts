import { describe, it, expect } from 'vitest';
import { parseSections } from './parseSections';

describe('parseSections', () => {
  it('should parse basic sections', () => {
    const content = `
\\section{Introduction}
Some text.
\\subsection{Background}
More text.
\\subsubsection{Details}
Even more text.
    `;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Introduction', line: 2 },
      { level: 2, title: 'Background', line: 4 },
      { level: 3, title: 'Details', line: 6 },
    ]);
  });

  it('should parse starred sections', () => {
    const content = `
\\section*{Starred Section}
\\subsection*{Starred Subsection}
\\subsubsection*{Starred Subsubsection}
    `;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Starred Section', line: 2 },
      { level: 2, title: 'Starred Subsection', line: 3 },
      { level: 3, title: 'Starred Subsubsection', line: 4 },
    ]);
  });

  it('should handle nested braces in titles', () => {
    const content = '\\section{Title with {nested} braces}';
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Title with {nested} braces', line: 1 },
    ]);
  });

  it('should handle escaped braces in titles', () => {
    const content = '\\section{Title with \\{escaped\\} braces}';
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Title with \\{escaped\\} braces', line: 1 },
    ]);
  });

  it('should handle other LaTeX commands inside titles', () => {
    const content = '\\section{Title with \\textbf{bold} text}';
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Title with \\textbf{bold} text', line: 1 },
    ]);
  });

  it('should handle multiple sections on different lines', () => {
    const content = `\\section{First}
\\section{Second}`;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'First', line: 1 },
      { level: 1, title: 'Second', line: 2 },
    ]);
  });

  it('should return an empty array for empty input', () => {
    const result = parseSections('');
    expect(result).toEqual([]);
  });

  it('should return an empty array for input with no sections', () => {
    const content = 'This is just some text without any section commands.';
    const result = parseSections(content);
    expect(result).toEqual([]);
  });

  it('should handle leading and trailing whitespace on the line', () => {
    const content = '  \\section{Whitespace}  ';
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Whitespace', line: 1 },
    ]);
  });

  it('should handle unmatched opening brace gracefully', () => {
    const content = '\\section{Unmatched';
    const result = parseSections(content);
    expect(result).toEqual([]);
  });

  it('should correctly identify level and not mismatch sub(sub)sections', () => {
    const content = `
\\section{Sec}
\\subsection{Sub}
\\subsubsection{Subsub}
    `;
    const result = parseSections(content);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ level: 1, title: 'Sec' });
    expect(result[1]).toMatchObject({ level: 2, title: 'Sub' });
    expect(result[2]).toMatchObject({ level: 3, title: 'Subsub' });
  });
});
