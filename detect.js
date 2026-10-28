// Farsi detection. Loaded before content.js and exposed on globalThis.
(() => {
  const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g;
  const LETTER = /\p{L}/gu;
  // Letters Persian uses that Arabic doesn't (پ چ ژ گ), plus Persian ک/ی and Persian digits.
  const PERSIAN_MARKER = /[پچژگکی۰-۹]/;
  // Post containers also hold English UI text (names, buttons), so the ratio is lenient; the
  // minimum count keeps a single quoted Farsi word in an English post from being hidden.
  const MIN_RATIO = 0.2;
  const MIN_ARABIC_LETTERS = 20;

  globalThis.isFarsi = (text) => {
    if (!text) return false;
    const arabic = (text.match(ARABIC_SCRIPT) || []).length;
    if (arabic < MIN_ARABIC_LETTERS || !PERSIAN_MARKER.test(text)) return false;
    const letters = (text.match(LETTER) || []).length;
    return letters > 0 && arabic / letters >= MIN_RATIO;
  };
})();
