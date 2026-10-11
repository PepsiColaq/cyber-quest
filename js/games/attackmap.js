/* 11 — USB Sentinel / Страж флешки · 2D-платформер внутри флешки. */
window.GameModules.attackmap = function (root, ctx) {
  const E = window.Engine;
  const Audio = () => window.UsbAudio;

  E.intro(
    root,
    {
      id: "attackmap",
      title: "Страж флешки",
      kicker: "USB Sentinel · антивирус внутри",
      goal: "Зачисти флешку: убери трояны, пока угроза не ушла на диск C:.",
      rules: [
        {
          ic: "bolt",
          tone: "bad",
          t: "<b>Трояны</b> — прыжок сверху или бластер. <b>Стелкер</b> виден после SIG.db.",
        },
        {
          ic: "shield",
          tone: "ok",
          t: "<b>Карантин (Q/X)</b> — клетка на врага. Зелёные файлы не бей.",
        },
        {
          ic: "key",
          tone: "gold",
          t: "WASD / стрелки, прыжок Space/W, бластер J, карантин Q. На телефоне — кнопки.",
        },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
    const stage = E.buildStage(root, {
      id: "attackmap",
      title: "Страж флешки",
      kicker: "USB Sentinel · зачисти носитель",
      rounds: 0,
      timed: false,
    });

    stage.body.innerHTML = "";
    const wrap = E.el('<div class="usb-wrap"></div>');
    stage.body.appendChild(wrap);

    /* ---------- Сразу платформер (без интро) ---------- */
    const gameRoot = E.el(`
      <div class="usb-game" id="usbGame">
        <div class="usb-hud">
          <span>Утечка C: <b id="usbTimer">90</b>с</span>
          <span>♥ <b id="usbLives">3</b></span>
          <span>Карантин <b id="usbQ">готов</b></span>
          <span>SIG <b id="usbSig">нет</b></span>
          <span>Очки <b id="usbScore">0</b></span>
          <button type="button" class="usb-mute" id="usbMute" title="Звук">♪</button>
        </div>
        <canvas id="usbCanvas" width="960" height="480"></canvas>
        <div class="usb-toast" id="usbToast" hidden></div>
        <div class="usb-touch" id="usbTouch">
          <button type="button" data-k="left">◀</button>
          <button type="button" data-k="right">▶</button>
          <button type="button" data-k="jump">⬆</button>
          <button type="button" data-k="shoot">◎</button>
          <button type="button" data-k="q">⌘</button>
        </div>
      </div>`);
    wrap.appendChild(gameRoot);

    const bootAudio = () => {
      if (!Audio()) return;
      Audio().resume();
      Audio().startBgm();
    };
    gameRoot.addEventListener("pointerdown", bootAudio, { once: true });
    window.addEventListener("keydown", bootAudio, { once: true });

    startPlatformer();

    /* ---------- ПЛАТФОРМЕР ---------- */
    function startPlatformer() {
      const canvas = gameRoot.querySelector("#usbCanvas");
      const c = canvas.getContext("2d");
      const W = canvas.width;
      const H = canvas.height;

      const keys = {};
      const bindKey = (k, v) => {
        keys[k] = v;
      };
      const onKey = (e, down) => {
        // e.code — работает и при русской раскладке
        const c = e.code;
        if (c === "ArrowLeft" || c === "KeyA") bindKey("left", down);
        if (c === "ArrowRight" || c === "KeyD") bindKey("right", down);
        if (c === "ArrowDown" || c === "KeyS") bindKey("down", down);
        if (c === "Space" || c === "KeyW" || c === "ArrowUp") {
          bindKey("jump", down);
          if (down) e.preventDefault();
        }
        if (c === "KeyJ" || c === "KeyZ") bindKey("shoot", down);
        if (c === "KeyQ" || c === "KeyK" || c === "KeyX") bindKey("q", down);
      };
      window.addEventListener("keydown", (e) => onKey(e, true));
      window.addEventListener("keyup", (e) => onKey(e, false));
      canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0) keys.shoot = true;
        if (e.button === 2) {
          e.preventDefault();
          keys.q = true;
        }
      });
      canvas.addEventListener("mouseup", (e) => {
        if (e.button === 0) keys.shoot = false;
        if (e.button === 2) keys.q = false;
      });
      canvas.addEventListener("contextmenu", (e) => e.preventDefault());

      gameRoot.querySelectorAll("#usbTouch button").forEach((btn) => {
        const k = btn.dataset.k;
        const set = (v) => (keys[k] = v);
        btn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          set(true);
        });
        btn.addEventListener("pointerup", () => set(false));
        btn.addEventListener("pointerleave", () => set(false));
      });

      gameRoot.querySelector("#usbMute").addEventListener("click", () => {
        if (!Audio()) return;
        Audio().setMuted(!Audio().isMuted());
        const btn = gameRoot.querySelector("#usbMute");
        btn.textContent = Audio().isMuted() ? "🔇" : "♪";
        btn.classList.toggle("is-off", Audio().isMuted());
        if (!Audio().isMuted()) Audio().startBgm();
        else Audio().stopBgm();
      });

      // ---- level ----
      const TILE = 40;
      const levelW = 96; // tiles
      const solids = []; // {x,y,w,h,type,label?}
      const entities = [];
      const pending = [];
      const bullets = [];
      const particles = [];

      function addPlat(tx, ty, tw, th, type, label) {
        solids.push({
          x: tx * TILE,
          y: ty * TILE,
          w: tw * TILE,
          h: th * TILE,
          type: type || "ground",
          label: label || "",
          broken: false,
        });
      }

      // ground strips
      for (let x = 0; x < 14; x++) addPlat(x, 10, 1, 2, "ground");
      addPlat(14, 9, 4, 1, "ground");
      addPlat(19, 8, 3, 1, "safe", "диплом.pdf");
      addPlat(23, 7, 3, 1, "safe", "фото.jpg");
      addPlat(27, 9, 5, 1, "ground");
      for (let x = 32; x < 42; x++) addPlat(x, 10, 1, 2, "ground");
      addPlat(36, 7, 2, 1, "ground");
      addPlat(40, 5, 2, 1, "sig", "SIG.db");
      addPlat(44, 8, 4, 1, "ground");
      addPlat(49, 10, 6, 2, "ground");
      // fork platforms
      addPlat(56, 9, 3, 1, "choiceBad", "Удалить всё");
      addPlat(61, 9, 3, 1, "choiceGood", "По сигнатуре");
      addPlat(66, 10, 4, 2, "ground");
      // bridge (opens on good choice)
      addPlat(70, 9, 5, 1, "bridge", "");
      solids[solids.length - 1].hidden = true;
      // spikes alt path + emergency platforms
      addPlat(70, 11, 5, 1, "spike", "");
      addPlat(71, 7, 1, 1, "ground");
      addPlat(73, 6, 1, 1, "ground");
      addPlat(75, 8, 1, 1, "ground");
      // boss arena
      for (let x = 76; x < 94; x++) addPlat(x, 10, 1, 2, "ground");
      addPlat(82, 6, 6, 1, "ground");
      // eject
      addPlat(94, 8, 2, 1, "exit", "EJECT");

      // walls / ceiling hints
      addPlat(-1, 0, 1, 14, "wall");
      addPlat(levelW, 0, 1, 14, "wall");

      function spawnEnemy(type, tx, ty, queue) {
        const e = {
          type,
          x: tx * TILE,
          y: ty * TILE,
          w: type === "boss" ? 80 : 28,
          h: type === "boss" ? 72 : 28,
          vx: type === "trojan" || type === "minion" ? 1.2 : type === "stalker" ? 0.9 : type === "worm" ? 1.0 : 0,
          dir: 1,
          hp: type === "boss" ? 3 : 1,
          alive: true,
          quarantine: 0,
          blink: 0,
          split: type === "worm",
        };
        (queue || entities).push(e);
      }

      spawnEnemy("trojan", 8, 9);
      spawnEnemy("trojan", 28, 8);
      spawnEnemy("stalker", 45, 7);
      spawnEnemy("worm", 50, 9);
      spawnEnemy("boss", 84, 8);

      const player = {
        x: 2 * TILE,
        y: 8 * TILE,
        w: 28,
        h: 28,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        lives: 3,
        score: 0,
        inv: 0,
        stun: 0,
        hasSig: false,
        qCd: 0,
        shootCd: 0,
        jumpBuf: 0,
        anim: 0,
      };

      let camX = 0;
      let leak = 90;
      let running = true;
      let finished = false;
      let shake = 0;
      let choiceDone = false;
      let bossQ = 0;
      let bossSpawn = 0;
      let toastT = 0;
      let shootHeld = false;
      let qHeld = false;
      let jumpHeld = false;

      const elTimer = gameRoot.querySelector("#usbTimer");
      const elLives = gameRoot.querySelector("#usbLives");
      const elQ = gameRoot.querySelector("#usbQ");
      const elSig = gameRoot.querySelector("#usbSig");
      const elScore = gameRoot.querySelector("#usbScore");
      const elToast = gameRoot.querySelector("#usbToast");

      function toast(msg, ms) {
        elToast.hidden = false;
        elToast.textContent = msg;
        toastT = ms || 1800;
      }

      function aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      }

      function rect(x, y, w, h) {
        return { x, y, w, h };
      }

      function killEnemy(e, pts) {
        if (!e.alive) return;
        e.alive = false;
        player.score += pts || 40;
        if (Audio()) Audio().sfx.hit();
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 30,
            color: e.type === "stalker" ? "#8a7bff" : "#ff6b6b",
          });
        }
        if (e.type === "boss") {
          toast("autorun.inf уничтожен! К EJECT →", 2200);
          solids.forEach((s) => {
            if (s.type === "bridge") s.hidden = false;
          });
          // open path after boss - ensure exit reachable
          addPlat(90, 9, 4, 1, "ground");
        }
      }

      function hurtPlayer() {
        if (player.inv > 0 || player.stun > 0) return;
        player.lives--;
        player.inv = 90;
        player.vy = -6;
        shake = 10;
        if (Audio()) Audio().sfx.falsePos();
        elLives.textContent = player.lives;
        if (player.lives <= 0) endGame(false);
      }

      function endGame(win) {
        if (finished) return;
        finished = true;
        running = false;
        if (Audio()) {
          Audio().stopBgm();
          if (win) Audio().sfx.win();
          else Audio().sfx.lose();
        }
        const bonus = win ? Math.max(0, Math.floor(leak) * 2) : 0;
        player.score = Math.max(0, player.score + bonus);
        stage.feedback(
          win,
          win ? "Носитель чист!" : "Троян на C:",
          win
            ? "Не вставляй чужие флешки. Не запускай .exe — отдай в ИБ."
            : "Утечка на хост. Флешку следовало не открывать."
        );
        E.later(
          () =>
            ctx.done({
              score: Math.min(900, player.score),
              detail: { win, leak: Math.floor(leak), lives: player.lives },
            }),
          1800
        );
      }

      function tryShoot() {
        if (player.shootCd > 0 || player.stun > 0) return;
        player.shootCd = 18;
        bullets.push({
          x: player.x + (player.facing > 0 ? player.w : -8),
          y: player.y + 10,
          w: 14,
          h: 6,
          vx: player.facing * 9,
          life: 45,
        });
        if (Audio()) Audio().sfx.shoot();
      }

      function tryQuarantine() {
        if (player.qCd > 0 || player.stun > 0) return;
        player.qCd = 240; // 4s at 60fps
        if (Audio()) Audio().sfx.quarantine();
        shake = 6;
        const zone = rect(player.x - 50, player.y - 40, player.w + 100, player.h + 80);
        entities.forEach((e) => {
          if (!e.alive) return;
          if (!aabb(zone, e)) return;
          if (e.type === "boss") {
            bossQ = 180; // 3s
            e.quarantine = 180;
            toast("Дверь autorun в карантине!", 1500);
          } else {
            e.quarantine = 72;
          }
        });
      }

      let last = performance.now();
      let accLeak = 0;

      function update(dt) {
        if (!running) return;
        player.anim++;
        if (toastT > 0) {
          toastT -= dt * 1000;
          if (toastT <= 0) elToast.hidden = true;
        }
        if (shake > 0) shake--;
        if (player.inv > 0) player.inv--;
        if (player.stun > 0) player.stun--;
        if (player.shootCd > 0) player.shootCd--;
        if (player.qCd > 0) player.qCd--;
        if (bossQ > 0) bossQ--;

        accLeak += dt;
        if (accLeak >= 1) {
          accLeak = 0;
          leak--;
          elTimer.textContent = Math.max(0, leak);
          if (leak <= 0) endGame(false);
        }

        elQ.textContent = player.qCd > 0 ? Math.ceil(player.qCd / 60) + "с" : "готов";
        elSig.textContent = player.hasSig ? "есть" : "нет";
        elScore.textContent = player.score;
        elQ.style.color = player.qCd > 0 ? "var(--warn)" : "var(--ok)";

        // input
        if (player.stun <= 0) {
          let move = 0;
          if (keys.left) move -= 1;
          if (keys.right) move += 1;
          player.vx = move * 4.2;
          if (move) player.facing = move;
          if (move && player.onGround && Audio()) Audio().sfx.step();

          if (keys.jump && !jumpHeld && player.onGround) {
            player.vy = -11.2;
            player.onGround = false;
            if (Audio()) Audio().sfx.jump();
          }
          jumpHeld = !!keys.jump;

          if (keys.shoot && !shootHeld) tryShoot();
          shootHeld = !!keys.shoot;

          if (keys.q && !qHeld) tryQuarantine();
          qHeld = !!keys.q;
        } else {
          player.vx *= 0.8;
        }

        player.vy += keys.down && !player.onGround ? 0.95 : 0.55;
        if (player.vy > 16) player.vy = 16;

        // move X
        player.x += player.vx;
        solids.forEach((s) => {
          if (s.hidden || s.broken || s.type === "spike") return;
          if (s.type === "sig" || s.type === "exit" || s.type === "choiceBad" || s.type === "choiceGood")
            return;
          if (!aabb(player, s)) return;
          if (player.vx > 0) player.x = s.x - player.w;
          else if (player.vx < 0) player.x = s.x + s.w;
        });

        // move Y
        player.y += player.vy;
        player.onGround = false;
        solids.forEach((s) => {
          if (s.hidden || s.broken) return;
          if (s.type === "sig" || s.type === "exit" || s.type === "choiceBad" || s.type === "choiceGood")
            return;
          if (s.type === "spike") {
            if (aabb(player, s)) hurtPlayer();
            return;
          }
          if (!aabb(player, s)) return;
          if (player.vy > 0) {
            player.y = s.y - player.h;
            player.vy = 0;
            if (!player.onGround && Audio()) Audio().sfx.land();
            player.onGround = true;
          } else if (player.vy < 0) {
            player.y = s.y + s.h;
            player.vy = 0;
          }
        });

        if (player.y > H + 80) {
          player.y = 6 * TILE;
          player.x = Math.max(TILE, camX + 40);
          hurtPlayer();
        }

        // pickups / choices / exit
        solids.forEach((s) => {
          if (s.broken || s.hidden) return;
          if (!aabb(player, s)) return;
          if (s.type === "sig" && !player.hasSig) {
            player.hasSig = true;
            s.broken = true;
            player.score += 40;
            if (Audio()) Audio().sfx.pickup();
            toast("SIG.db загружена — стелкеры видны", 2000);
          }
          if (s.type === "exit") {
            const bossDead = !entities.some((e) => e.type === "boss" && e.alive);
            if (bossDead) endGame(true);
            else toast("Сначала уничтожь autorun.inf", 1500);
          }
          if (!choiceDone && (s.type === "choiceBad" || s.type === "choiceGood")) {
            choiceDone = true;
            if (s.type === "choiceBad") {
              player.score = Math.max(0, player.score - 40);
              solids.forEach((p) => {
                if (p.type === "safe") p.broken = true;
              });
              solids.forEach((p) => {
                if (p.type === "bridge") p.hidden = true;
              });
              toast("Слишком агрессивный AV (−40)", 2000);
              if (Audio()) Audio().sfx.falsePos();
            } else {
              player.score += 30;
              solids.forEach((p) => {
                if (p.type === "bridge") p.hidden = false;
                if (p.type === "spike") p.broken = true;
              });
              toast("Умная политика (+30)", 2000);
              if (Audio()) Audio().sfx.pickup();
            }
          }
        });

        // enemies
        entities.forEach((e) => {
          if (!e.alive) return;
          if (e.quarantine > 0) {
            e.quarantine--;
            return;
          }
          if (e.type === "boss") {
            e.blink = bossQ > 0 ? 0 : (e.blink + 1) % 40;
            if (bossQ <= 0) {
              bossSpawn++;
              if (bossSpawn >= 180) {
                bossSpawn = 0;
                if (Audio()) Audio().sfx.boss();
                spawnEnemy("minion", 80 + Math.random() * 6, 9, pending);
                spawnEnemy("minion", 86 + Math.random() * 4, 9, pending);
              }
            }
            return;
          }
          e.x += e.vx * e.dir;
          // reverse on ledge / wall
          const foot = rect(e.x + (e.dir > 0 ? e.w : -2), e.y + e.h + 1, 4, 4);
          let ground = false;
          solids.forEach((s) => {
            if (s.hidden || s.broken || s.type === "spike") return;
            if (["ground", "safe", "bridge"].includes(s.type) && aabb(foot, s)) ground = true;
            if (aabb(e, s) && ["ground", "wall", "safe", "bridge"].includes(s.type)) e.dir *= -1;
          });
          if (!ground) e.dir *= -1;

          if (e.type === "stalker" && !player.hasSig) {
            // still collides
          }

          // stomp
          if (
            player.vy > 0 &&
            player.y + player.h < e.y + e.h * 0.55 &&
            aabb(player, e)
          ) {
            if (e.type === "stalker" && !player.hasSig) {
              /* can't stomp invisible well - still works if land */
            }
            if (e.type === "boss") {
              if (bossQ > 0) {
                e.hp--;
                player.vy = -8;
                if (e.hp <= 0) killEnemy(e, 150);
                else if (Audio()) Audio().sfx.hit();
              }
            } else {
              if (e.split && e.quarantine <= 0 && Math.random() < 0.35) {
                e.alive = false;
                spawnEnemy("minion", e.x / TILE, e.y / TILE, pending);
                spawnEnemy("minion", e.x / TILE + 0.5, e.y / TILE, pending);
                player.vy = -7;
                if (Audio()) Audio().sfx.hit();
              } else {
                killEnemy(e, e.type === "stalker" ? 60 : e.type === "worm" ? 50 : 40);
                player.vy = -7;
              }
            }
          } else if (aabb(player, e)) {
            if (e.type === "stalker" && !player.hasSig) {
              // hard to see but still hurts
            }
            hurtPlayer();
          }
        });

        // bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx;
          b.life--;
          let dead = b.life <= 0;
          solids.forEach((s) => {
            if (dead || s.hidden || s.broken) return;
            if (s.type === "safe" && aabb(b, s)) {
              dead = true;
              player.score = Math.max(0, player.score - 25);
              player.stun = 24;
              toast("ЛОЖНОЕ СРАБАТЫВАНИЕ (−25)", 1600);
              if (Audio()) Audio().sfx.falsePos();
            } else if (
              ["ground", "wall", "bridge"].includes(s.type) &&
              aabb(b, s)
            )
              dead = true;
          });
          entities.forEach((e) => {
            if (!e.alive || dead) return;
            if (!aabb(b, e)) return;
            if (e.type === "stalker" && !player.hasSig) return;
            if (e.type === "boss" && bossQ <= 0) {
              dead = true;
              return;
            }
            dead = true;
            if (e.split && e.quarantine <= 0 && Math.random() < 0.4) {
              e.alive = false;
              spawnEnemy("minion", e.x / TILE, e.y / TILE, pending);
              spawnEnemy("minion", (e.x + 20) / TILE, e.y / TILE, pending);
              if (Audio()) Audio().sfx.hit();
            } else if (e.type === "boss") {
              e.hp--;
              if (e.hp <= 0) killEnemy(e, 150);
              else if (Audio()) Audio().sfx.hit();
            } else {
              killEnemy(e, e.type === "stalker" ? 60 : 40);
            }
          });
          if (dead) bullets.splice(i, 1);
        }

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          p.life--;
        });
        for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
        while (pending.length) entities.push(pending.pop());

        // camera
        const target = player.x - W * 0.35;
        camX += (target - camX) * 0.12;
        camX = Math.max(0, Math.min(camX, levelW * TILE - W));
      }

      function draw() {
        const sx = shake ? (Math.random() - 0.5) * shake : 0;
        const sy = shake ? (Math.random() - 0.5) * shake : 0;
        c.save();
        c.translate(-camX + sx, sy);

        // bg
        const grd = c.createLinearGradient(camX, 0, camX, H);
        grd.addColorStop(0, "#05070c");
        grd.addColorStop(1, "#0b1520");
        c.fillStyle = grd;
        c.fillRect(camX, 0, W, H);

        // grid
        c.strokeStyle = "rgba(88,224,216,0.05)";
        c.lineWidth = 1;
        for (let x = Math.floor(camX / TILE) * TILE; x < camX + W; x += TILE) {
          c.beginPath();
          c.moveTo(x, 0);
          c.lineTo(x, H);
          c.stroke();
        }

        // contacts glow line
        c.fillStyle = "rgba(232,195,106,0.08)";
        c.fillRect(camX, H - 28, W, 28);

        solids.forEach((s) => {
          if (s.hidden || s.broken) return;
          if (s.x + s.w < camX - 20 || s.x > camX + W + 20) return;
          if (s.type === "wall") return;
          if (s.type === "spike") {
            c.fillStyle = "#ff6b6b";
            for (let i = 0; i < s.w; i += 12) {
              c.beginPath();
              c.moveTo(s.x + i, s.y + s.h);
              c.lineTo(s.x + i + 6, s.y);
              c.lineTo(s.x + i + 12, s.y + s.h);
              c.fill();
            }
            return;
          }
          if (s.type === "safe") {
            c.fillStyle = "rgba(88,224,216,0.25)";
            c.strokeStyle = "#58e0d8";
          } else if (s.type === "sig") {
            c.fillStyle = "rgba(232,195,106,0.35)";
            c.strokeStyle = "#e8c36a";
          } else if (s.type === "choiceBad") {
            c.fillStyle = "rgba(255,107,107,0.25)";
            c.strokeStyle = "#ff6b6b";
          } else if (s.type === "choiceGood") {
            c.fillStyle = "rgba(79,211,150,0.25)";
            c.strokeStyle = "#4fd396";
          } else if (s.type === "exit") {
            c.fillStyle = "rgba(232,195,106,0.4)";
            c.strokeStyle = "#e8c36a";
          } else if (s.type === "bridge") {
            c.fillStyle = "rgba(88,224,216,0.3)";
            c.strokeStyle = "#58e0d8";
          } else {
            c.fillStyle = "rgba(232,195,106,0.2)";
            c.strokeStyle = "#e8c36a";
          }
          c.lineWidth = 2;
          roundRect(c, s.x, s.y, s.w, s.h, 6);
          c.fill();
          c.stroke();
          if (s.label) {
            c.fillStyle = "#eef2f8";
            c.font = "11px JetBrains Mono, monospace";
            c.fillText(s.label, s.x + 6, s.y + s.h / 2 + 4);
          }
        });

        // entities
        entities.forEach((e) => {
          if (!e.alive) return;
          if (e.x + e.w < camX - 40 || e.x > camX + W + 40) return;
          const qx = e.quarantine > 0;
          if (e.type === "boss") {
            c.save();
            if (bossQ > 0) {
              c.strokeStyle = "#58e0d8";
              c.lineWidth = 3;
              c.strokeRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
            }
            c.fillStyle = e.blink < 20 && bossQ <= 0 ? "#ff3b3b" : "#5a1020";
            roundRect(c, e.x, e.y, e.w, e.h, 8);
            c.fill();
            c.fillStyle = "#fff";
            c.font = "bold 12px Manrope, sans-serif";
            c.fillText("autorun.inf", e.x + 8, e.y + 24);
            c.fillText("▶ AUTO", e.x + 18, e.y + 44);
            if (bossQ > 0) {
              c.fillStyle = "#ff6b6b";
              c.beginPath();
              c.arc(e.x + e.w / 2, e.y + e.h / 2 + 8, 10, 0, Math.PI * 2);
              c.fill();
            }
            c.restore();
            return;
          }
          if (e.type === "stalker" && !player.hasSig) {
            c.strokeStyle = "rgba(138,123,255,0.5)";
            c.lineWidth = 2;
            c.setLineDash([4, 4]);
            c.strokeRect(e.x, e.y, e.w, e.h);
            c.setLineDash([]);
          } else {
            c.fillStyle =
              e.type === "stalker" ? "#8a7bff" : e.type === "worm" || e.type === "minion" ? "#ff8e5a" : "#ff6b6b";
            roundRect(c, e.x, e.y, e.w, e.h, 6);
            c.fill();
            c.fillStyle = "#fff";
            c.font = "10px monospace";
            c.fillText(
              e.type === "stalker" ? "KL" : e.type === "trojan" ? "TR" : "W",
              e.x + 8,
              e.y + 20
            );
          }
          if (qx) {
            c.strokeStyle = "#58e0d8";
            c.lineWidth = 2;
            c.strokeRect(e.x - 3, e.y - 3, e.w + 6, e.h + 6);
          }
        });

        bullets.forEach((b) => {
          c.fillStyle = "#58e0d8";
          c.shadowColor = "#58e0d8";
          c.shadowBlur = 8;
          c.fillRect(b.x, b.y, b.w, b.h);
          c.shadowBlur = 0;
        });

        particles.forEach((p) => {
          c.globalAlpha = Math.max(0, p.life / 30);
          c.fillStyle = p.color;
          c.fillRect(p.x, p.y, 3, 3);
          c.globalAlpha = 1;
        });

        // player sentinel drone
        if (player.inv <= 0 || player.anim % 6 < 3) {
          const px = player.x;
          const py = player.y;
          c.fillStyle = "#e8c36a";
          roundRect(c, px, py + 4, player.w, player.h - 4, 8);
          c.fill();
          c.fillStyle = "#58e0d8";
          c.beginPath();
          c.arc(px + player.w / 2 + player.facing * 2, py + 14, 5, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(232,195,106,0.5)";
          c.fillRect(px + 4, py + player.h - 2, 8, 4);
          c.fillRect(px + player.w - 12, py + player.h - 2, 8, 4);
          if (player.facing > 0) {
            c.fillStyle = "#58e0d8";
            c.fillRect(px + player.w - 2, py + 12, 6, 3);
          } else {
            c.fillStyle = "#58e0d8";
            c.fillRect(px - 4, py + 12, 6, 3);
          }
        }

        // section labels
        drawLabel(c, 3 * TILE, 60, "E:\\ BOOT");
        drawLabel(c, 20 * TILE, 40, "Documents");
        drawLabel(c, 40 * TILE, 40, "Hidden\\System");
        drawLabel(c, 56 * TILE, 40, "Policy");
        drawLabel(c, 80 * TILE, 40, "autorun gate");

        c.restore();
      }

      function drawLabel(ctx2, x, y, text) {
        ctx2.fillStyle = "rgba(167,176,194,0.45)";
        ctx2.font = "12px JetBrains Mono, monospace";
        ctx2.fillText(text, x, y);
      }

      function roundRect(ctx2, x, y, w, h, r) {
        ctx2.beginPath();
        ctx2.moveTo(x + r, y);
        ctx2.arcTo(x + w, y, x + w, y + h, r);
        ctx2.arcTo(x + w, y + h, x, y + h, r);
        ctx2.arcTo(x, y + h, x, y, r);
        ctx2.arcTo(x, y, x + w, y, r);
        ctx2.closePath();
      }

      function frame(now) {
        if (finished) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        update(dt);
        draw();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      // cleanup listeners roughly via Engine.clearAll on exit — keys stay; acceptable for booth
    }
  }
};
