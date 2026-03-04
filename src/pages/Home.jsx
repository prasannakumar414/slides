import { Link } from 'react-router-dom';
import { getAllDecks } from '../lib/loadDecks';
import { parseDeck } from '../lib/parseMarkdownSlides';

export default function Home() {
  const decks = getAllDecks();

  return (
    <div className="home">
      <header className="home-header">
        <h1>Slide Decks</h1>
        <p className="home-subtitle">Choose a presentation to begin</p>
      </header>

      {decks.length === 0 ? (
        <p className="empty-state">
          No decks found. Add <code>.md</code> files to the{' '}
          <code>content/</code> folder.
        </p>
      ) : (
        <ul className="deck-grid">
          {decks.map((deck) => {
            const { slides } = parseDeck(deck.raw);
            return (
              <li key={deck.slug}>
                <Link to={`/deck/${deck.slug}`} className="deck-card">
                  <h2>{deck.title}</h2>
                  {deck.description && <p>{deck.description}</p>}
                  <span className="deck-slide-count">{slides.length} slides</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
