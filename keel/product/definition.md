# Definition

## Who are we building for?
LinkedIn users who read their feed in Chrome and do not read Farsi, but whose network includes people who post in Farsi. No specific role or volume is evidenced in the codebase; the audience is inferred from the product's purpose (hide Farsi posts) and its single target site (`https://www.linkedin.com/*`).

## What problem are we solving for them?
Posts in a language they cannot read take up space in their LinkedIn feed.

## How do we know it's a real problem?
Not evidenced in the codebase. The repository contains no research, metrics, or quotes. The git history shows the detection thresholds were tuned against "real LinkedIn markup" (commits "Fix flicker and loosen Farsi threshold for real LinkedIn markup" and "Hide bilingual posts with a substantial Farsi paragraph"), which suggests the author is a user of the problem. *(To be filled by the owner.)*

## What is the impact of the problem?
Not quantified in the codebase. *(To be filled by the owner.)*

## What's our proposed solution?
A Chrome extension (Manifest V3, named "Farsi Be Gone") that detects Farsi-language posts in the LinkedIn feed and hides them.

- Detection is local and rule-based (Unicode character counting); no LLM and no network calls.
- A hidden post is replaced by a dashed placeholder with a playful message that always says the post was Farsi, plus a **Peek** button to reveal it and **Hide again** to re-hide it.
- A toolbar popup has one checkbox, "Hide Farsi posts", to turn filtering on or off. The setting is stored in `chrome.storage.sync`.

**Non-goals (as built):**
- Arabic, Urdu, or other Arabic-script languages are left alone (a Persian-only letter is required).
- Farsi written in Latin letters is not detected.
- A short Farsi quote inside an otherwise English post is not hidden.
- Sites other than linkedin.com are not touched.
- No per-user word lists, language choices other than Farsi, or analytics.

## Target Platforms

- **Web app** — Chrome extension (Manifest V3) running as a content script on `https://www.linkedin.com/*`, desktop Chrome. Other browsers are not targeted in the manifest.

## How will we measure success?
No metrics are defined or collected in the codebase (no analytics or telemetry; see `PRIVACY.md`). *(To be filled by the owner. Candidate outcome: Farsi posts the user sees in their feed, without hiding English or Arabic posts by mistake.)*
