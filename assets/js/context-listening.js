(() => {
  'use strict';
  const root = document.querySelector('[data-context-listening]');
  if (!root) return;

  const players = [...root.querySelectorAll('[data-context-clip]')].map(section => ({
    section,
    audio: section.querySelector('audio'),
    button: section.querySelector('[data-context-play]'),
    status: section.querySelector('[data-context-audio-status]')
  }));

  for (const { section, audio, button, status } of players) {
    const update = () => { button.textContent = audio.paused ? 'Play audio' : 'Pause audio'; };
    audio.addEventListener('play', update);
    audio.addEventListener('pause', update);
    audio.addEventListener('ended', update);
    section.addEventListener('toggle', () => { if (!section.open) audio.pause(); });
    button.addEventListener('click', async () => {
      if (!audio.paused) { audio.pause(); return; }
      players.forEach(other => { if (other.audio !== audio) other.audio.pause(); });
      status.hidden = true;
      try {
        await audio.play();
      } catch (error) {
        if (error.name === 'AbortError') return;
        status.textContent = 'Audio is unavailable. Open the transcript to read the sentence.';
        status.hidden = false;
      }
    });
  }
})();
