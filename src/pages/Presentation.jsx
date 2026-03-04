import { useParams, Link } from 'react-router-dom';
import { getDeckBySlug } from '../lib/loadDecks';
import { parseDeck } from '../lib/parseMarkdownSlides';
import SlideDeck from '../components/SlideDeck';

export default function Presentation() {
  const { slug } = useParams();
  const deck = getDeckBySlug(slug);

  if (!deck) {
    return (
      <div className="not-found">
        <h2>Deck not found</h2>
        <Link to="/">&#8592; Back to all decks</Link>
      </div>
    );
  }

  const { meta, slides } = parseDeck(deck.raw);

  return (
    <div className="presentation">
      <div className="presentation-header">
        <Link to="/" className="back-link">
          &#8592; All Decks
        </Link>
        <h1 className="presentation-title">{meta.title}</h1>
      </div>
      <SlideDeck slides={slides} />
    </div>
  );
}
