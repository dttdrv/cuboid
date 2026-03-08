import { parseSections, extractBraceContent } from './parseSections.js';
import { describe, it, expect } from 'vitest';

describe('parseSections', () => {
  it('extracts basic sections correctly', () => {
    const content = `
\\section{Introduction}
Some text here.
\\subsection{Background}
More text.
\\subsubsection{Details}
Even more text.
    `;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Introduction', line: 2 },
      { level: 2, title: 'Background', line: 4 },
      { level: 3, title: 'Details', line: 6 }
    ]);
  });

  it('handles optional asterisk modifier', () => {
    const content = `\\section*{Abstract}\n\\subsection*{Methods}`;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Abstract', line: 1 },
      { level: 2, title: 'Methods', line: 2 }
    ]);
  });

  it('extracts multiple sections on the same line', () => {
    const content = `\\section{One} \\section{Two}`;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'One', line: 1 },
      { level: 1, title: 'Two', line: 1 }
    ]);
  });

  it('handles nested braces', () => {
    const content = `\\section{Title with {nested} braces}`;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Title with {nested} braces', line: 1 }
    ]);
  });

  it('handles escaped braces', () => {
    const content = `\\section{Title with \\{escaped\\} braces}`;
    const result = parseSections(content);
    expect(result).toEqual([
      { level: 1, title: 'Title with \\{escaped\\} braces', line: 1 }
    ]);
  });
});
