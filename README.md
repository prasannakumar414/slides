# Slides

A static slideshow website built with React + Vite. Author presentations in Markdown and present them with a clean, responsive UI.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Creating a Deck

Add a `.md` file to the `content/` folder. Each file becomes its own presentation deck, listed on the homepage.

### Frontmatter (optional)

```markdown
---
title: My Presentation
description: A short summary shown on the homepage
---
```

### Slide Separator

Separate slides with a horizontal rule:

```markdown
# First Slide

Content here.

---

# Second Slide

More content.
```

## Controls

| Key / Action | Description |
|---|---|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `F` | Toggle fullscreen |
| `Esc` | Exit fullscreen |
| 🌙 / ☀️ button | Toggle light/dark mode |

## Build for Production

```bash
npm run build
```

Static output is written to `dist/` and can be deployed to any static host (GitHub Pages, Netlify, Vercel, etc.).

## Project Structure

```
content/          Markdown slide decks (one file per deck)
src/
  components/     Slide, SlideDeck, ThemeToggle
  lib/            Markdown parser, deck loader
  pages/          Home and Presentation views
  styles/         Theme variables and slide layout
index.html        Static entrypoint
vite.config.js    Vite configuration
```
