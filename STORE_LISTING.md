# Chrome Web Store listing

**Name:** Farsi Be Gone
**Category:** Productivity
**Language:** English
**Summary (max 132 chars):** Hides Farsi-language posts from your LinkedIn feed. Private, no tracking, one-click toggle.

**Description:**
Farsi Be Gone quietly removes posts written in Farsi from your LinkedIn feed.

- Detects Farsi text automatically (Arabic posts are left alone)
- Works on posts that load as you scroll
- One-click on/off toggle in the toolbar popup
- Runs locally: no data collected, no network requests

**Single purpose:** Hide Farsi-language posts on linkedin.com.

**Permission justifications:**
- `storage`: remember the on/off toggle.
- Host access `https://www.linkedin.com/*`: read post text in the feed to detect Farsi and hide matching posts.

**Privacy policy URL:** https://github.com/mehdipiraee/farsi-be-gone/blob/main/PRIVACY.md
**Data use disclosures:** collects no user data; no remote code.
**Upload:** dist/farsi-be-gone.zip (run `scripts/package.sh`)
**Screenshots needed (1280x800):** feed with a Farsi post hidden; toolbar popup.
