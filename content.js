const POST_SELECTOR = [
  '[componentkey^="update-card"]',
  "div.feed-shared-update-v2",
  '[data-urn^="urn:li:activity"]',
  '[data-urn^="urn:li:share"]',
  '[data-view-name="feed-full-update"]',
].join(",");

const HIDDEN_ATTR = "data-farsi-be-gone";
const checkedLength = new WeakMap();
let enabled = true;
let timer = null;

function scan() {
  timer = null;
  for (const post of document.querySelectorAll(POST_SELECTOR)) {
    if (!enabled) {
      post.removeAttribute(HIDDEN_ATTR);
      continue;
    }
    const text = post.innerText || "";
    // LinkedIn renders posts lazily; skip posts whose text hasn't changed since last check.
    if (checkedLength.get(post) === text.length) continue;
    checkedLength.set(post, text.length);
    if (isFarsi(text)) post.setAttribute(HIDDEN_ATTR, "");
    else post.removeAttribute(HIDDEN_ATTR);
  }
}

function scheduleScan() {
  if (timer === null) timer = setTimeout(scan, 300);
}

function applyEnabled(value) {
  enabled = value !== false;
  document.querySelectorAll(POST_SELECTOR).forEach((p) => checkedLength.delete(p));
  scheduleScan();
}

chrome.storage.sync.get({ enabled: true }, (s) => applyEnabled(s.enabled));
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) applyEnabled(changes.enabled.newValue);
});

new MutationObserver(scheduleScan).observe(document.body, {
  childList: true,
  subtree: true,
});
scheduleScan();
