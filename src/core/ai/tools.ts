export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'crossref' | 'arxiv';
  authors?: string[];
  year?: string;
  doi?: string;
}

export interface LiteratureToolOutput {
  query: string;
  results: WebSearchResult[];
  bibtex: string[];
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const toBibTexKey = (author: string | undefined, year: string | undefined, title: string) => {
  const left = (author || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10) || 'paper';
  const right = (year || 'n.d.').replace(/[^0-9]/g, '') || 'n.d.';
  const titleChunk = title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'work';
  return `${left}${right}${titleChunk}`;
};

const buildArticleBibTex = (entry: WebSearchResult) => {
  const firstAuthor = entry.authors?.[0];
  const key = toBibTexKey(firstAuthor, entry.year, entry.title);
  const authors = (entry.authors || ['Unknown']).join(' and ');
  return [
    `@article{${key},`,
    `  title={${entry.title}},`,
    `  author={${authors}},`,
    entry.year ? `  year={${entry.year}},` : '',
    entry.doi ? `  doi={${entry.doi}},` : '',
    `  url={${entry.url}}`,
    '}',
  ]
    .filter(Boolean)
    .join('\n');
};

const parseArxivXml = (xml: string): WebSearchResult[] => {
  const entries = xml.split('<entry>').slice(1);
  return entries
    .map((entry) => {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1];
      const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1];
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1];
      const authors = Array.from(entry.matchAll(/<name>([\s\S]*?)<\/name>/g)).map((item) =>
        normalizeWhitespace(item[1]),
      );
      if (!title || !id) return null;
      return {
        title: normalizeWhitespace(title),
        url: normalizeWhitespace(id),
        snippet: normalizeWhitespace(summary || ''),
        source: 'arxiv' as const,
        authors,
        year: published?.slice(0, 4),
      };
    })
    .filter((entry): entry is WebSearchResult => Boolean(entry));
};

export const webSearch = async (query: string): Promise<WebSearchResult[]> => {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const [crossrefRes, arxivRes] = await Promise.allSettled([
    fetch(`https://api.crossref.org/works?query=${encodeURIComponent(cleaned)}&rows=5`),
    fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(cleaned)}&start=0&max_results=5`),
  ]);

  const results: WebSearchResult[] = [];

  if (crossrefRes.status === 'fulfilled' && crossrefRes.value.ok) {
    const payload = await crossrefRes.value.json();
    const items = payload?.message?.items || [];
    items.forEach((item: any) => {
      const title = Array.isArray(item.title) ? item.title[0] : item.title;
      if (!title) return;
      const authors = Array.isArray(item.author)
        ? item.author
            .map((author: any) => [author.given, author.family].filter(Boolean).join(' ').trim())
            .filter(Boolean)
        : [];
      results.push({
        title: normalizeWhitespace(title),
        url: item.URL || `https://doi.org/${item.DOI || ''}`,
        snippet: normalizeWhitespace(Array.isArray(item.subject) ? item.subject.slice(0, 4).join(', ') : ''),
        source: 'crossref',
        authors,
        year: String(item?.issued?.['date-parts']?.[0]?.[0] || ''),
        doi: item.DOI,
      });
    });
  }

  if (arxivRes.status === 'fulfilled' && arxivRes.value.ok) {
    const xml = await arxivRes.value.text();
    results.push(...parseArxivXml(xml));
  }

  return results.slice(0, 8);
};

export const literatureSearch = async (query: string): Promise<LiteratureToolOutput> => {
  const results = await webSearch(query);
  return {
    query,
    results,
    bibtex: results.slice(0, 5).map((entry) => buildArticleBibTex(entry)),
  };
};

