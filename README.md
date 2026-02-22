# peas.phd (GitHub Pages)

This is a lightweight static site for **peas.phd** (PEAS: Policy · Ecology · Agriculture · Social science).

## Deploy on GitHub Pages (user/organization site)

**Recommended:** create a repo named **`<your-github-username>.github.io`** and push these files to the repo root.

Then in GitHub:
- Settings → Pages
- Source: Deploy from branch
- Branch: `main` / root

Your site will publish at:
`https://<your-github-username>.github.io/`

## Deploy on GitHub Pages (project site)

If you use a normal repo name (e.g., `peas-phd`), the site publishes at:
`https://<your-github-username>.github.io/peas-phd/`

## Connect your custom domain (peas.phd)

In GitHub repo:
- Settings → Pages → Custom domain: `peas.phd`
- Enable "Enforce HTTPS" after it verifies.

In GoDaddy DNS add:
- **A records** to GitHub Pages IPs
- **CNAME** `www` → `<your-github-username>.github.io`

GitHub shows the exact records to add.

## Editing content

- Home: `index.html`
- Research: `research.html`
- Teaching: `teaching.html`
- CV: `cv.html`
- Contact: `contact.html`

Downloads live in `/downloads/` (DOCX copies).

Last generated: 2026-02-22
