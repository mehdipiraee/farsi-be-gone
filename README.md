# Farsi Be Gone

Chrome extension that hides Farsi-language posts from your LinkedIn feed.

## Install (unpacked)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Open LinkedIn. Use the toolbar popup to toggle filtering.

## How it works

- `detect.js` flags text as Farsi when Arabic-script letters make up at least 30% of its letters
  and it contains a Persian-only marker (پ چ ژ گ ک ی or Persian digits), so Arabic posts are left alone.
- `content.js` watches the feed with a `MutationObserver` and hides matching posts via `content.css`.
- LinkedIn changes its markup often. Posts are currently matched by `[componentkey^="update-card"]` (verified on the live feed, Oct 2026); if posts stop being hidden, update `POST_SELECTOR` in `content.js`.
