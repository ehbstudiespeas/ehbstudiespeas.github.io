# ehbstudiespeas.github.io — Claude Project Context

Personal academic website for **peas.phd**, hosted on GitHub Pages. Static HTML/CSS, no build step — edits go straight to `main` and GitHub Pages deploys automatically.

## Repo structure

- `index.html` — redirect to `index_v2.html`
- `index_v2.html` — landing page with the clickable PEAS SVG pea pod
- `research.html` — card carousel layout for the four PEAS domains
- `cv.html` — links to latest CV PDF hosted on Dropbox
- `contact.html` — contact methods as buttons
- `repos.html` — repository links (minimal, in progress)
- `assets/css/style.css` — shared base styles (nav, cards, buttons, footer)
- `assets/css/site_v2.css` — v2 landing page styles (clamp() type scale, hero, interactions)
- `scripts/sync_latest_cv.sh` — syncs latest CV from Dropbox before push

## Key design details

- High-contrast visual theme
- CSS-first interactions (hover, focus, scroll snap)
- The SVG pea pod on the landing page uses `data-topic-id` attributes + JS to navigate to research.html anchors
- `style.css` and `site_v2.css` need to be merged in a future v3

## Workflow

Edit HTML/CSS files directly → commit → push to `main` → GitHub Pages serves it live.
Run `./scripts/sync_latest_cv.sh` before pushing to keep the CV current.
