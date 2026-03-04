import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Presentation from './pages/Presentation';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  return (
    <div className="app">
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/deck/:slug" element={<Presentation />} />
      </Routes>
    </div>
  );
}
