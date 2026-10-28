// Minimal chrome.* stub so content.js can run on a plain page.
window.chrome = {
  storage: {
    sync: { get: (d, cb) => cb({ ...d, ...(window.__stored || {}) }) },
    onChanged: { addListener: (fn) => (window.__onChanged = fn) },
  },
};
