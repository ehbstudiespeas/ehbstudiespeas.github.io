# peas.phd (GitHub Pages)

This repository is my personal website for **peas.phd**, hosted on **GitHub Pages**.

## How this site was created

The site is a static HTML/CSS project deployed via GitHub Pages. The layout has undergone two versions. The current version (v2) is structured as follows:

- `index_v2.html` as the landing page with the clickable svg
- `research.html`, `cv.html`, and `contact.html` for interior pages
- `assets/css/style.css` and `assets/css/site_v2.css` for styling (this needs to be merged in v3)

Content is updated by editing the HTML files directly in the repo and then committing/pushing to GitHub. GitHub Pages serves the latest `main` branch automatically.

## Updating the CV from Dropbox

`cv.html` always points to my latest curriculum vitae which sits in my dropbox as a pdf. This was implemented with: 

```bash
./scripts/sync_latest_cv.sh
```
Here whenever I commit + push to publish on GitHub, the latest version of my CV is also pushed.

## Research layout

The **Research** page uses a horizontal “card carousel” layout to walk through the four PEAS domains (Policy, Ecology, Agriculture, Social science) and related projects.

- Each "pea" is wrapped in a `section.card.snap` block so it appears as a slide .
- Inside each section, a `.carousel` container holds a `.carousel-track` with individual “slides” laid out using flexbox and scroll snapping.
- Navigation between slides is implemented with simple anchor/scroll behavior and semantic headings.
- Images and figures are static assets from my research.

## Repositories

The **Repositories** minimal at present but I intend to build it over time.

- Repository links are buttons and icons use free/stock images.

## Contacts

The **Contact** page follows the same card‑based layout as repositories.

- Contact methods (email, professional profiles, etc.) are presented as buttons with free images.
- The Bluesky section uses a `https://bsky.app/profile/...` URL, with `rel` attributes for external links.

## Styles and theme

The visual theme is intentionally high‑contrast

- `assets/css/style.css` set the site basics e.g., navigation bar, shared components like cards, buttons, and the footer.
- `assets/css/site_v2.css` was developed for the v2 landing page and hero sections, using responsive type scales (`clamp()`), flexible layouts, and custom coding for interactions.
- Interactions (hover, focus, and scroll behaviors) through CSS were prioritized.

## Clickable SVG Pea

The landing page features a large **PEAS “pea pod” SVG** where each pea represents one research domain (Policy, Ecology, Agriculture, Social science). The SVG itself is embedded directly in `index_v2.html` and each pea is a `<path>` element with:

- A unique `id` such as `pea-policy`, `pea-ecology`, etc.
- A shared class (`pea-hotspot`) plus a `data-topic-id` attribute used to look up the matching content.

JavaScript attaches click and keyboard handlers to these SVG paths, when a pea is activated:

- the script reads its `data-topic-id` and constructs a URL to the matching anchor on `research.html`
- The browser then navigates to that anchored section

## AI statement

The **vision, content, and overall direction** of this site originate with Elias H. Bloom.

- Early versions of the site structure and layout were **”vibe‑coded”** collaboratively with OpenAI Codex. Ongoing development and maintenance also uses **Claude** (Anthropic) for vibe coding, edits, and iterative improvements.
- Subsequent refinements after vibe coding were implemented in **Cursor**, using its script editor and **agentic assistants** to help with HTML/CSS edits, accessibility tweaks, and layout polish.