/*
  DormLaundry sounds + notifications (no audio files needed - tones are synthesized).
  window.DormAlerts.bookingConfirmed()  -> short pleasant chime
  window.DormAlerts.bookingTime()       -> louder repeating alarm
  window.DormAlerts.notify(title, body) -> system notification (if permitted)
*/
(() => {
  "use strict";

  let ctx = null;
  let pending = null; // sound waiting for the first user gesture

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function tone(freq, start, duration, volume = 0.25, type = "sine") {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = c.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  const sounds = {
    confirm() {
      tone(659.25, 0, 0.18); // E5
      tone(880.0, 0.14, 0.35); // A5
    },
    time() {
      for (let i = 0; i < 3; i += 1) {
        const o = i * 0.9;
        tone(880, o, 0.22, 0.35, "triangle");
        tone(1108.73, o + 0.25, 0.22, 0.35, "triangle");
        tone(1318.51, o + 0.5, 0.3, 0.35, "triangle");
      }
    },
  };

  function play(name) {
    try {
      const c = getCtx();
      if (!c) return;
      if (c.state === "running") {
        sounds[name]();
      } else {
        c.resume().then(() => {
          if (c.state === "running") sounds[name]();
          else pending = name; // browser still blocks audio - wait for a click
        }).catch(() => { pending = name; });
      }
    } catch {
      /* sound is optional */
    }
  }

  // Browsers block audio until the user interacts with the page.
  function unlock() {
    const c = getCtx();
    if (!c) return;
    c.resume().then(() => {
      if (pending && c.state === "running") {
        const name = pending;
        pending = null;
        sounds[name]();
      }
    }).catch(() => {});
  }
  ["pointerdown", "keydown", "touchstart"].forEach((evt) =>
    document.addEventListener(evt, unlock, { passive: true }),
  );

  function requestPermission() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    try {
      Notification.requestPermission();
    } catch {
      /* older Safari uses a callback API; ignore */
    }
  }

  function notify(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, tag: "dormlaundry", renotify: true });
    } catch {
      /* some mobile browsers require a service worker; the in-page toast still shows */
    }
  }

  window.DormAlerts = {
    bookingConfirmed: () => play("confirm"),
    bookingTime: () => play("time"),
    notify,
    requestPermission,
  };
})();
