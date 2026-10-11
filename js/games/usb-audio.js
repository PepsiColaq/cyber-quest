/* WebAudio: BGM + SFX для USB Sentinel (без внешних mp3). */
window.UsbAudio = (function () {
  let ctx = null;
  let master = null;
  let bgmGain = null;
  let sfxGain = null;
  let muted = false;
  let bgmTimer = null;
  let stepCool = 0;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.28;
    bgmGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.45;
    sfxGain.connect(master);
    return ctx;
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.7;
  }

  function tone(freq, dur, type, gain, when, dest) {
    if (!ensure() || muted) return;
    const t0 = (when || ctx.currentTime) + 0.001;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, gain) {
    if (!ensure() || muted) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1200;
    g.gain.value = gain || 0.15;
    src.connect(f);
    f.connect(g);
    g.connect(sfxGain);
    src.start();
  }

  const sfx = {
    step() {
      if (!ensure() || muted) return;
      const now = performance.now();
      if (now < stepCool) return;
      stepCool = now + 120;
      tone(180 + Math.random() * 40, 0.05, "triangle", 0.06);
    },
    jump() {
      if (!ensure() || muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(520, t + 0.12);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g);
      g.connect(sfxGain);
      o.start(t);
      o.stop(t + 0.15);
    },
    land() {
      tone(90, 0.08, "triangle", 0.12);
      noiseBurst(0.04, 0.08);
    },
    shoot() {
      if (!ensure() || muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "square";
      f.type = "lowpass";
      f.frequency.setValueAtTime(2400, t);
      f.frequency.exponentialRampToValueAtTime(400, t + 0.12);
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(220, t + 0.12);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(f);
      f.connect(g);
      g.connect(sfxGain);
      o.start(t);
      o.stop(t + 0.15);
    },
    hit() {
      noiseBurst(0.08, 0.2);
      tone(140, 0.1, "sawtooth", 0.1);
    },
    falsePos() {
      tone(200, 0.08, "sawtooth", 0.12);
      tone(160, 0.12, "square", 0.08, ctx && ctx.currentTime + 0.06);
    },
    quarantine() {
      tone(520, 0.15, "sine", 0.12);
      tone(780, 0.2, "sine", 0.08, ctx && ctx.currentTime + 0.05);
    },
    pickup() {
      tone(523, 0.1, "sine", 0.12);
      tone(659, 0.12, "sine", 0.1, ctx && ctx.currentTime + 0.08);
      tone(784, 0.18, "sine", 0.1, ctx && ctx.currentTime + 0.16);
    },
    boss() {
      tone(60, 0.25, "sawtooth", 0.15);
      noiseBurst(0.2, 0.12);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, "sine", 0.1, ctx && ctx.currentTime + i * 0.1));
    },
    lose() {
      tone(300, 0.2, "sawtooth", 0.12);
      tone(180, 0.35, "sawtooth", 0.1, ctx && ctx.currentTime + 0.15);
    },
    usb() {
      tone(800, 0.04, "square", 0.08);
      tone(1200, 0.06, "square", 0.06, ctx && ctx.currentTime + 0.05);
    },
    whoosh() {
      noiseBurst(0.25, 0.18);
    },
  };

  function stopBgm() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function startBgm() {
    if (!ensure() || muted) return;
    stopBgm();
    resume();
    // Простая cyber-петля: арпеджио + kick
    const notes = [110, 130.81, 146.83, 164.81, 196, 164.81, 146.83, 130.81];
    let i = 0;
    bgmTimer = setInterval(() => {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      // pad
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = notes[i % notes.length];
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g);
      g.connect(bgmGain);
      o.start(t);
      o.stop(t + 0.4);
      // soft kick every 4
      if (i % 4 === 0) {
        const k = ctx.createOscillator();
        const kg = ctx.createGain();
        k.type = "sine";
        k.frequency.setValueAtTime(90, t);
        k.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        kg.gain.setValueAtTime(0.12, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        k.connect(kg);
        kg.connect(bgmGain);
        k.start(t);
        k.stop(t + 0.2);
      }
      i++;
    }, 280);
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
