document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('.verb-trigger');
  if (!trigger) {
    return;
  }

  const verb = (trigger.dataset.verb || trigger.textContent || '').trim();
  if (!verb) {
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(verb);
    } catch (error) {
      // Ignore clipboard failures and still open the resource.
    }
  }

  window.open('https://verb.mt/', '_blank', 'noopener,noreferrer');
});

document.querySelectorAll('.verb-trigger').forEach((trigger) => {
  const verb = (trigger.dataset.verb || trigger.textContent || '').trim();
  if (!verb) {
    return;
  }

  if (!trigger.title) {
    trigger.title = `Click to open verb.mt and copy: ${verb}`;
  }
});
