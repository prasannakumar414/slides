import { marked } from 'marked';

/**
 * Extracts optional YAML-like frontmatter (title, description) from raw
 * markdown text. Returns the metadata object and the remaining body.
 *
 * Frontmatter is delimited by `---` at the very start of the file:
 *
 *   ---
 *   title: My Deck
 *   description: A short blurb
 *   ---
 */
export function parseFrontmatter(raw) {
  const fm = { title: '', description: '' };
  let body = raw;

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (match) {
    const block = match[1];
    for (const line of block.split('\n')) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        fm[key] = value;
      }
    }
    body = raw.slice(match[0].length).trim();
  }

  return { meta: fm, body };
}

/**
 * Splits the markdown body (after frontmatter) into individual slide objects.
 *
 * Slides are separated by a horizontal rule (`---`) on its own line.
 * Each slide object has `{ title, html }`.
 */
export function parseSlides(markdownBody) {
  const sections = markdownBody
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sections.map((section) => {
    const titleMatch = section.match(/^#{1,3}\s+(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const html = marked.parse(section);
    return { title, html };
  });
}

/**
 * Full pipeline: raw markdown string -> { meta, slides[] }
 */
export function parseDeck(raw) {
  const { meta, body } = parseFrontmatter(raw);
  const slides = parseSlides(body);
  if (!meta.title && slides.length > 0 && slides[0].title) {
    meta.title = slides[0].title;
  }
  return { meta, slides };
}
