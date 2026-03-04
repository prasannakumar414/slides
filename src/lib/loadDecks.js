import { parseFrontmatter } from './parseMarkdownSlides';

const modules = import.meta.glob('/content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Returns an array of deck descriptors discovered from content/*.md.
 * Each entry has `{ slug, title, description, raw }`.
 */
export function getAllDecks() {
  return Object.entries(modules).map(([path, raw]) => {
    const slug = path.replace('/content/', '').replace('.md', '');
    const { meta } = parseFrontmatter(raw);
    return {
      slug,
      title: meta.title || slug,
      description: meta.description || '',
      raw,
    };
  });
}

/**
 * Finds a single deck by slug. Returns null if not found.
 */
export function getDeckBySlug(slug) {
  return getAllDecks().find((d) => d.slug === slug) ?? null;
}
