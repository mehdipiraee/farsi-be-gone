const POST_SELECTOR = [
  '[componentkey^="update-card"]',
  "div.feed-shared-update-v2",
  '[data-urn^="urn:li:activity"]',
  '[data-urn^="urn:li:share"]',
  '[data-view-name="feed-full-update"]',
].join(",");

// "hidden": post is display:none and a placeholder stands in for it.
// "revealed": the user clicked "Show post"; detection leaves it alone until the filter is toggled.
const STATE_ATTR = "data-farsi-be-gone";
const PLACEHOLDER_CLASS = "fbg-placeholder";
const checkedLength = new WeakMap();
const placeholders = new WeakMap();
let enabled = true;
let timer = null;

// Every quip must say the post was Farsi, so a placeholder always explains why it's there.
const QUIPS = [
  ["🧹", "Swept away. A Farsi post was here."],
  ["🚀", "Farsi post launched into the void."],
  ["🙈", "Nothing to see here. Just a Farsi post, hiding."],
  ["🕵️", "This Farsi post is in witness protection."],
  ["🏝️", "This Farsi post is on vacation."],
  ["✨", "Poof! One Farsi post, gone."],
  ["🦖", "A wild Farsi post was eaten by a dinosaur."],
  ["🥷", "A Farsi post was ninja'd out of your feed."],
  ["🪄", "Abracadabra. Farsi post? Gone."],
  ["🛸", "Farsi post abducted by aliens. Sorry."],
];

function setState(post, state) {
  post.setAttribute(STATE_ATTR, state);
  const placeholder = placeholders.get(post);
  if (!placeholder) return;
  const hidden = state === "hidden";
  placeholder.querySelector(".fbg-text").textContent = hidden
    ? placeholder.dataset.quip
    : "Peeking at the Farsi post. No judgment.";
  placeholder.querySelector("button").textContent = hidden ? "Peek 👀" : "Hide again 🙈";
}

function ensurePlaceholder(post) {
  let placeholder = placeholders.get(post);
  // LinkedIn re-renders its feed and can drop nodes we inserted, so re-attach when missing.
  if (placeholder && placeholder.isConnected) return;
  if (!placeholder) {
    placeholder = document.createElement("div");
    placeholder.className = PLACEHOLDER_CLASS;
    const [emoji, quip] = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    placeholder.dataset.quip = quip;
    const icon = document.createElement("span");
    icon.className = "fbg-emoji";
    icon.textContent = emoji;
    const label = document.createElement("span");
    label.className = "fbg-text";
    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => {
      setState(post, post.getAttribute(STATE_ATTR) === "hidden" ? "revealed" : "hidden");
    });
    placeholder.append(icon, label, button);
    placeholders.set(post, placeholder);
  }
  post.parentNode.insertBefore(placeholder, post);
  setState(post, post.getAttribute(STATE_ATTR));
}

function hide(post) {
  post.setAttribute(STATE_ATTR, "hidden");
  ensurePlaceholder(post);
}

function restore(post) {
  post.removeAttribute(STATE_ATTR);
  placeholders.get(post)?.remove();
}

function scan() {
  timer = null;
  for (const post of document.querySelectorAll(POST_SELECTOR)) {
    if (!enabled) {
      restore(post);
      continue;
    }
    const state = post.getAttribute(STATE_ATTR);
    if (state) ensurePlaceholder(post);
    if (state === "revealed") continue;
    // textContent (not innerText) so the result is the same whether or not the post is currently
    // hidden; innerText differs for display:none elements and made hidden posts flicker.
    const text = post.textContent || "";
    // LinkedIn renders posts lazily; skip posts whose text hasn't changed since last check.
    if (checkedLength.get(post) === text.length) continue;
    checkedLength.set(post, text.length);
    if (isFarsi(text)) hide(post);
    else restore(post);
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
