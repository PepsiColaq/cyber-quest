/* WebAudio: BGM + SFX для USB Sentinel — без шума/шипения. */
window.UsbAudio = (function () {
  let ctx = null;
  let master = null;
  let bgmGain = null;
  let sfxGain = null;
  let muted = false;
  let bgmTimer = null;
  let padNodes = [];
  let stepCool = 0;
  let beat = 0;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.65;
    master.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.22;
    bgmGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.38;
    sfxGain.connect(master);
    return ctx;
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.65, ctx ? ctx.currentTime : 0, 0.02);
  }

  function tone(freq, dur, type, gain, when, dest) {
    if (!ensure() || muted) return;
    const t0 = (when != null ? when : ctx.currentTime) + 0.001;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(Math.max(40, freq), t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain || 0.12), t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.04, dur));
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.04);
  }

  const sfx = {
    step() {
      if (!ensure() || muted) return;
      const now = performance.now();
      if (now < stepCool) return;
      stepCool = now + 280;
      tone(240 + Math.random() * 20, 0.03, "sine", 0.028);
    },
    jump() {
      if (!ensure() || muted) return;
      const t = ctx.currentTime;
      tone(260, 0.08, "sine", 0.09, t);
      tone(390, 0.1, "triangle", 0.06, t + 0.04);
    },
    land() {
      tone(110, 0.06, "sine", 0.07);
    },
    shoot() {
      if (!ensure() || muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      f.type = "lowpass";
      f.frequency.setValueAtTime(1800, t);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.1);
      o.frequency.setValueAtTime(720, t);
      o.frequency.exponentialRampToValueAtTime(280, t + 0.1);
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(f);
      f.connect(g);
      g.connect(sfxGain);
      o.start(t);
      o.stop(t + 0.13);
    },
    hit() {
      tone(180, 0.08, "triangle", 0.1);
      tone(90, 0.12, "sine", 0.08, ctx && ctx.currentTime + 0.04);
    },
    falsePos() {
      tone(220, 0.07, "triangle", 0.08);
      tone(185, 0.1, "sine", 0.06, ctx && ctx.currentTime + 0.05);
    },
    quarantine() {
      tone(440, 0.12, "sine", 0.09);
      tone(660, 0.16, "sine", 0.06, ctx && ctx.currentTime + 0.06);
    },
    pickup() {
      tone(523, 0.08, "sine", 0.09);
      tone(659, 0.1, "sine", 0.07, ctx && ctx.currentTime + 0.07);
      tone(784, 0.14, "sine", 0.07, ctx && ctx.currentTime + 0.14);
    },
    boss() {
      tone(70, 0.2, "sine", 0.1);
      tone(55, 0.25, "triangle", 0.06, ctx && ctx.currentTime + 0.05);
    },
    win() {
      [523, 659, 784, 987].forEach((f, i) =>
        tone(f, 0.18, "sine", 0.08, ctx && ctx.currentTime + i * 0.09)
      );
    },
    lose() {
      tone(260, 0.18, "triangle", 0.08);
      tone(175, 0.28, "sine", 0.07, ctx && ctx.currentTime + 0.12);
    },
    usb() {
      tone(880, 0.035, "sine", 0.06);
      tone(1320, 0.05, "sine", 0.045, ctx && ctx.currentTime + 0.04);
    },
    whoosh() {
      tone(400, 0.12, "sine", 0.05);
      tone(220, 0.18, "triangle", 0.04, ctx && ctx.currentTime + 0.05);
    },
  };

  function stopPad() {
    padNodes.forEach((n) => {
      try {
        n.stop();
      } catch (e) {}
    });
    padNodes = [];
  }

  function stopBgm() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
    stopPad();
  }

  function startBgm() {
    if (!ensure() || muted) return;
    stopBgm();
    resume();
    beat = 0;

    const padGain = ctx.createGain();
    padGain.gain.value = 0.035;
    padGain.connect(bgmGain);

    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 82.41;
    o1.connect(padGain);
    o1.start();

    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = 164.81;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    o2.connect(g2);
    g2.connect(padGain);
    o2.start();

    padNodes = [o1, o2];

    const melody = [164.81, 196.0, 220.0, 246.94, 261.63, 246.94, 220.0, 196.0];
    const bass = [82.41, 98.0, 87.31, 98.0];

    bgmTimer = setInterval(() => {
      if (!ctx || muted || !bgmGain) return;
      const t = ctx.currentTime;
      const i = beat % melody.length;
      tone(melody[i], 0.28, "sine", 0.045, t, bgmGain);
      if (beat % 2 === 0) {
        tone(bass[(beat / 2) % bass.length], 0.35, "triangle", 0.03, t, bgmGain);
      }
      if (beat % 4 === 0) {
        tone(55, 0.12, "sine", 0.06, t, bgmGain);
      }
      beat++;
    }, 320);
  }

  return {
    resume,
    setMuted,
    isMuted: () => muted,
    startBgm,
    stopBgm,
    sfx,
  };
})();
