/* The study pages share a quiet first screen; the full navigation stays available. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  if (!header) return;
  let interacted = false;
  header.addEventListener('pointerdown', () => { interacted = true; }, { once: true });
  header.addEventListener('keydown', () => { interacted = true; }, { once: true });
  const settleNavigation = () => {
    const groups = header.querySelectorAll('.nav-group');
    if (!groups.length) return false;
    if (!interacted) groups.forEach(group => { group.open = false; });
    return true;
  };
  if (settleNavigation()) return;
  const observer = new MutationObserver(() => {
    if (settleNavigation()) observer.disconnect();
  });
  observer.observe(header, { childList: true, subtree: true });
})();
