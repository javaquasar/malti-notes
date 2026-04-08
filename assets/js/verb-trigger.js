document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('.verb-trigger');
  if (!trigger) {
    return;
  }

  const verb = (trigger.dataset.verb || trigger.textContent || '').trim();
  if (!verb) {
    return;
  }

  const sibling = trigger.parentElement?.querySelector('.muted');
  const rawDescription = (sibling?.textContent || '').replace(/^\s*-\s*/, '').trim();
  const publicDescription = rawDescription.includes('| Lesson')
    ? rawDescription.split('| Lesson', 1)[0].trim()
    : rawDescription;

  const handled = typeof window.MaltiVerbLookup?.open === 'function'
    ? window.MaltiVerbLookup.open({
        verb,
        lookupHint: (trigger.dataset.lookupHint || '').trim(),
        slugHint: (trigger.dataset.slugHint || '').trim(),
        description: publicDescription,
      })
    : false;
  if (!handled && typeof window.MaltiVerbLookup?.openFallback === 'function') {
    return window.MaltiVerbLookup.openFallback(verb, publicDescription);
  }
  if (!handled && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(verb);
    } catch (error) {
      // Ignore clipboard failures.
    }
  }
});

document.querySelectorAll('.verb-trigger').forEach((trigger) => {
  const verb = (trigger.dataset.verb || trigger.textContent || '').trim();
  if (!verb) {
    return;
  }

  if (!trigger.title) {
    trigger.title = `Click to view forms for: ${verb}`;
  }
});
