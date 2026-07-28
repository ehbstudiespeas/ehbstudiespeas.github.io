# Farm Talk webpage plan

## 1. Create the Farm Talk page

Create a dedicated `/farm-talk/` page on the PEAS site with three sections:

- Live broadcast area
- Next-episode countdown
- Past episodes archive

## 2. Build the live broadcast area

- Use WTBQ branding, clear attribution, and a link to WTBQ.
- Before Wednesdays at 12:00 p.m. Eastern Time, display the current week's guest, topic summary, and countdown.
- Wednesdays from 12:00–1:00 p.m. Eastern Time, show the approved WTBQ embedded player.
- After 1:00 p.m., remove the live player and transition that episode to the archive as **Coming soon**.
- Include a reliable fallback link to WTBQ if the embed cannot load.

## 3. Build the archive episode cards

Each card should show:

- Broadcast date
- Guest name
- Short description and discussion topics
- Optional guest title or affiliation

Use three states:

- **Up next** — a future episode
- **Coming soon** — an aired episode whose recording is not yet available
- **Listen now** — an episode with an available MP3

For **Listen now**, provide an accessible HTML audio player and a download or direct-link option. Keep cards for every aired episode, including those that do not yet have MP3s.

## 4. Use Box as the content source

Read the episode folders in:

`CCE OC / Farm Talk / [episode folder]`

For each episode:

- Parse the folder name for the guest identity and broadcast date.
- Read `Show Notes [date].docx` for the guest title, introduction, and discussion topics.
- Detect an MP3 in the same folder.
- De-duplicate recordings that also appear in the separate `Farm Talk Eps` folder.

## 5. Generate website episode data

Generate a small data file, such as `farm-talk/data/episodes.json`, with normalized fields:

- Episode date
- Guest
- Title or affiliation
- Summary
- Topics
- Status
- MP3 path
- Source Box IDs

Render the public page from this file so it never needs direct Box access.

## 6. Add the weekly Tuesday automation

Use a scheduled workflow, with a manual **run now** option, to:

1. Find the current Wednesday's episode folder and update the live area with its guest and topic information.
2. Scan episode folders for newly added recordings.
3. Copy approved MP3s to a public website audio directory and update `episodes.json`.
4. Update each archive status automatically:
   - Future episode → **Up next**
   - Aired without MP3 → **Coming soon**
   - MP3 available → **Listen now**
5. Commit and publish only when generated content changed.

## 7. Secure the automation

- Use a dedicated Box app or service connection limited to the Farm Talk folder.
- Store credentials only in repository secrets, never in source files.
- Use a GitHub Actions scheduled workflow to update the static site and publish through the existing GitHub Pages flow.

## 8. Add safeguards and verification

- Validate dates in Eastern Time, including daylight-saving changes.
- Require one episode folder per broadcast and one `Show Notes [date].docx` file.
- Log skipped or malformed folders rather than publishing incomplete data.
- Test with the current Swayamjit Ray folder, then verify the lifecycle: **Up next** → live → **Coming soon** → **Listen now**.
- Check mobile layout, audio accessibility, and live-player fallback behavior.

## 9. Confirm before implementation

- Obtain WTBQ's approval to embed its player during Farm Talk's scheduled hour.
- Decide how public MP3s should be hosted. Website-hosted audio is recommended for the most dependable player experience.
