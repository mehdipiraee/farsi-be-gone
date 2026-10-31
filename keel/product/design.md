# Design

## Screen: Toolbar popup

```
+----------------------------+
|  Farsi Be Gone             |
|                            |
|  [x] Hide Farsi posts      |
+----------------------------+
```

**Visual**
- 220px-wide popup, system font, a heading and one labelled checkbox.

**Interaction**
- Opens with the checkbox set from `chrome.storage.sync` (default: checked).
- Toggling the checkbox writes `enabled` to `chrome.storage.sync`. Open LinkedIn tabs react immediately through `chrome.storage.onChanged`: turning it off restores every post and removes the placeholders; turning it on rescans the feed.

## Screen: LinkedIn feed with a hidden post (placeholder)

```
+--------------------------------------------------+
|  Regular post                                    |
+--------------------------------------------------+
+ - - - - - - - - - - - - - - - - - - - - - - - - -+
:  🧹  Swept away. A Farsi post was here.  [Peek 👀]:
+ - - - - - - - - - - - - - - - - - - - - - - - - -+
+--------------------------------------------------+
|  Regular post                                    |
+--------------------------------------------------+
```

**Visual**
- In place of the hidden post, a flex row with a dashed grey border and rounded corners: an emoji, a short message, and a pill-shaped **Peek 👀** button.
- The message is chosen at random from ten quips, each of which states that the post was Farsi (for example "Farsi post launched into the void.").
- The placeholder fades and scales in. The emoji wiggles on hover. Both animations are disabled under `prefers-reduced-motion`.
- The original post is `display: none`.

**Interaction**
- **Peek 👀** reveals the post; the message changes to "Peeking at the Farsi post. No judgment." and the button becomes **Hide again 🙈**.
- **Hide again 🙈** hides the post again.
- A revealed post is not re-evaluated until the filter is toggled off and on.
- If LinkedIn re-renders the feed and drops the placeholder, it is re-inserted.
