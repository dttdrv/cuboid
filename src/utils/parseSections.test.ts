import { describe, it, expect } from 'vitest';
import { parseSections } from './parseSections';

describe('parseSections', () => {
  it('should parse basic sections correctly', () => {
    const content = `\\section{Introduction}
Some text.
\\subsection{Background}
More text.
\\subsubsection{Details}
End.`;
    const sections = parseSections(content);
    expect(sections).toHaveLength(3);

    expect(sections[0]).toEqual({ level: 1, title: 'Introduction', line: 1 });
    expect(sections[1]).toEqual({ level: 2, title: 'Background', line: 3 });
    expect(sections[2]).toEqual({ level: 3, title: 'Details', line: 5 });
  });

  it('should parse sections with asterisks (starred commands)', () => {
    const content = `\\section*{Introduction}
\\subsection*{Background}
\\subsubsection*{Details}`;
    const sections = parseSections(content);
    expect(sections).toHaveLength(3);

    expect(sections[0]).toEqual({ level: 1, title: 'Introduction', line: 1 });
    expect(sections[1]).toEqual({ level: 2, title: 'Background', line: 2 });
    expect(sections[2]).toEqual({ level: 3, title: 'Details', line: 3 });
  });

  it('should handle nested and escaped braces correctly in titles', () => {
    const content = `\\section{Title {with} nested {braces {here}} and \\{escaped\\} ones}`;
    const sections = parseSections(content);
    expect(sections).toHaveLength(1);

    expect(sections[0].title).toBe('Title {with} nested {braces {here}} and \\{escaped\\} ones');
  });

  it('should return empty array when no sections exist', () => {
    const content = `Just plain text.
Nothing to see here.
Not a \\section{}`; // Valid section format but let's test a string without real sections first
    const sections = parseSections(`No sections at all.`);
    expect(sections).toHaveLength(0);
  });

  it('should calculate correct line numbers with lots of whitespace and text', () => {
    const content = `

\\section{One}


Some text...

\\subsection{Two}

`;
    const sections = parseSections(content);
    expect(sections).toHaveLength(2);
    expect(sections[0]).toEqual({ level: 1, title: 'One', line: 3 });
    expect(sections[1]).toEqual({ level: 2, title: 'Two', line: 8 });
  });

  it('should handle unmatched braces gracefully (by skipping them)', () => {
    const content = `\\section{Unmatched brace`;
    const sections = parseSections(content);
    // Since the brace is unmatched, extractBraceContent returns null, so no section is added
    expect(sections).toHaveLength(0);
  });
});
