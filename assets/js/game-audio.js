(() => {
  let audioContext = null;

  const getAudioContext = () => {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  };

  const playTone = (frequency, startTime, duration, type, gainValue) => {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  };

  const play = (type, options = {}) => {
    if (options.enabled === false) return;
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    if (type === "success") {
      playTone(523.25, now, 0.16, "sine", 0.055);
      playTone(659.25, now + 0.08, 0.18, "sine", 0.05);
      playTone(783.99, now + 0.16, 0.2, "sine", 0.045);
      return;
    }

    if (type === "refresh") {
      playTone(392, now, 0.1, "sine", 0.035);
      playTone(493.88, now + 0.06, 0.12, "sine", 0.032);
      return;
    }

    if (type === "tick") {
      playTone(176, now, 0.035, "triangle", 0.018);
      return;
    }

    if (type === "victory") {
      playTone(523.25, now, 0.14, "sine", 0.055);
      playTone(659.25, now + 0.08, 0.16, "sine", 0.052);
      playTone(783.99, now + 0.16, 0.18, "sine", 0.05);
      playTone(1046.5, now + 0.3, 0.32, "triangle", 0.045);
      playTone(1318.51, now + 0.38, 0.28, "sine", 0.035);
      return;
    }

    playTone(196, now, 0.12, "triangle", 0.045);
    playTone(146.83, now + 0.09, 0.16, "triangle", 0.04);
  };

  const readEnabled = (storageKey, fallback = true) => {
    try {
      return window.localStorage.getItem(storageKey) !== "off";
    } catch (error) {
      return fallback;
    }
  };

  const writeEnabled = (storageKey, enabled) => {
    try {
      window.localStorage.setItem(storageKey, enabled ? "on" : "off");
    } catch (error) {
      // Ignore storage failures on restrictive browsers.
    }
  };

  window.MaltiGameAudio = {
    play,
    readEnabled,
    writeEnabled
  };
})();
