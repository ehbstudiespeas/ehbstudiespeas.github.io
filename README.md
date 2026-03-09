# peas.phd (GitHub Pages)

This repository is my personal website for **peas.phd**, hosted on **GitHub Pages**.

## Update the CV from Dropbox
`cv.html` always points to `assets/Elias_H_Bloom_CV.pdf`.

To refresh that file from your Dropbox CV folder (newest PDF wins):

```bash
./scripts/sync_latest_cv.sh
```

Optional custom paths:

```bash
./scripts/sync_latest_cv.sh \
  "$HOME/Library/CloudStorage/Dropbox/Curriculum Vitae" \
  "assets/Elias_H_Bloom_CV.pdf"
```

Then commit + push to publish the update on GitHub Pages.

## Update the animated landing video
Place your PowerPoint-exported MP4 here:

- `assets/PEASLogoAnimated.mp4`

Commit + push, and GitHub Pages will update.

## Custom domain
In GitHub: **Settings → Pages → Custom domain** set to `peas.phd`.

In GoDaddy DNS (apex domain), ensure you have A records:

- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

(Keep your Microsoft 365 MX/TXT/CNAME email records intact.)
