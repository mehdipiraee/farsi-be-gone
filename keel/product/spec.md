# Spec

## Summary
Farsi Be Gone is a Manifest V3 Chrome extension that hides Farsi-language posts in the LinkedIn feed. A content script scans the feed's post containers, classifies each post's text with a local character-counting rule, and hides matches behind a placeholder the user can peek through. There is no backend, no network access, and no LLM.

## Context & Requirements
- Runs only on `https://www.linkedin.com/*`; permission requested: `storage` only.
- LinkedIn lazy-renders posts and changes its markup often, so the scanner must be mutation-driven and its post selectors easy to update.
- Hiding must not flicker (see Component Details).
- Arabic and Urdu posts must not be hidden; a short Farsi quote in an English post must not be hidden.

## Architecture Overview

```
 +-------------------+   chrome.storage.sync   +--------------------+
 |  popup.html/js    | ----------------------> |  { enabled: bool } |
 |  checkbox         |                         +---------+----------+
 +-------------------+                                   |
                                          get + onChanged|
                                                         v
 +--------------------------- LinkedIn page --------------------------+
 |                                                                    |
 |  MutationObserver --(300ms debounce)--> scan()                     |
 |  (document.body)                          |                        |
 |                          POST_SELECTOR -> post elements            |
 |                                           |                        |
 |                      post.textContent --> isFarsi()   (detect.js)  |
 |                                           |                        |
 |                          hide: data-farsi-be-gone="hidden"         |
 |                                + placeholder div (Peek button)     |
 |                          content.css: display:none / placeholder   |
 +--------------------------------------------------------------------+
```

- **popup** writes the `enabled` setting; it is the only UI outside the page.
- **content.js** observes the page, finds posts, applies and removes the hidden state, and builds placeholders.
- **detect.js** exposes `globalThis.isFarsi(text)`, a pure function loaded before `content.js`.
- **content.css** hides posts carrying the `hidden` state attribute and styles the placeholder.
- **chrome.storage.sync** is the only shared state between popup and content script.

## Component Details

### Detection (`detect.js`)
`isFarsi(text)` returns true when all of the following hold:
1. At least 20 Arabic-script letters (`MIN_ARABIC_LETTERS`), counted over the Arabic, Arabic Supplement, and Arabic Presentation Forms ranges.
2. The text contains a Persian marker: پ چ ژ گ ک ی or a Persian digit ۰-۹. This separates Farsi from Arabic and Urdu.
3. Either at least 100 Arabic-script letters (`SUBSTANTIAL_ARABIC_LETTERS`, which catches bilingual posts), or Arabic-script letters are at least 20% (`MIN_RATIO`) of all Unicode letters. The ratio is lenient because post containers also hold English UI text such as names and buttons.

### Scanning (`content.js`)
- `POST_SELECTOR` matches `[componentkey^="update-card"]`, `div.feed-shared-update-v2`, `[data-urn^="urn:li:activity"]`, `[data-urn^="urn:li:share"]`, and `[data-view-name="feed-full-update"]`.
- A `MutationObserver` on `document.body` (childList, subtree) calls `scheduleScan`, which debounces to one `scan()` per 300ms. One scan also runs at load.
- For each post, `scan()` skips it if its `textContent` length equals the length recorded last time (`checkedLength` WeakMap), so lazily loaded text is re-checked and unchanged posts are not.
- `textContent` is used instead of `innerText` so the result is the same for hidden and visible posts; `innerText` differs for `display:none` elements and caused flicker.
- Post states are stored in the `data-farsi-be-gone` attribute: `hidden` (post is `display:none`, placeholder shown) or `revealed` (user clicked Peek; skipped by detection until the filter is toggled).
- Placeholders are cached per post in a WeakMap and re-inserted if LinkedIn's re-render removes them.
- Disabling the filter restores every post and removes placeholders; any change to `enabled` clears the length cache and rescans.

### Placeholder
Built with DOM APIs (`createElement`, `textContent`), never `innerHTML`. One of ten quips is picked at random when the placeholder is first created.

## Data Model & Storage
- `chrome.storage.sync`: `{ enabled: boolean }`, default `true`. No other data is stored.
- Per-page, in memory only: `checkedLength` and `placeholders` WeakMaps, and the `data-farsi-be-gone` attribute on posts.

## Integration Points
- LinkedIn's DOM, through the selectors above. This is an unversioned third-party surface and the main fragility.
- Chrome extension APIs: `chrome.storage.sync`, `chrome.storage.onChanged`.
- No network requests, third-party services, or authentication. `scripts/package.sh` builds the store package into `dist/`.

## Operational Considerations
- No logging, telemetry, or monitoring.
- When LinkedIn changes its markup and posts stop being hidden, update `POST_SELECTOR` in `content.js`. The README records when it was last verified on the live feed (Oct 2026).
- Releases are a version bump in `manifest.json` plus a packaged zip.
- The README states the ratio as 30%, but the code uses 20% (`MIN_RATIO = 0.2`). The code is the source of truth.

## Testing Strategy
Derived from Target Platforms (Chrome extension). The repository has `test/fixture.html` and `test/chrome-stub.js` (a stub of the Chrome API for loading the content scripts in a plain page), and no test framework or runner.

- **Unit tests:** none today. Suggested: Vitest for `isFarsi` (Farsi, Arabic, Urdu, bilingual, short-quote, and empty-text cases).
- **Integration tests:** none today. The fixture page plus the Chrome stub can exercise `content.js` against sample post markup.
- **UI/E2E tests:** Playwright, loading the unpacked extension.
- **Test location:** `keel/product/test/` with `unit/`, `integration/`, `smoke/` subdirectories.

## Risks & Tradeoffs
- **Selector drift:** LinkedIn markup changes can silently stop hiding posts. Mitigated by multiple fallback selectors; a redesign trigger would be a more robust post-detection approach.
- **False positives:** Arabic text containing a Persian marker letter (ک and ی also occur in some Arabic-script text) could be hidden; the 20-letter minimum makes this rare.
- **False negatives:** Latin-script Farsi and short Farsi posts are not detected, by design.
- **Rule-based detection** is private and free, but cannot tell borderline cases apart as a language model could.
