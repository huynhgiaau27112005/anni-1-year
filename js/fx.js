/* Hiệu ứng canvas: nền cánh hoa + tim bay, tim khi chạm, pháo hoa, trái tim hạt đập (跳动的爱心). */
(function () {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function fit(canvas) {
    // clientWidth thay vì getBoundingClientRect: không bị ảnh hưởng bởi transform lúc chuyển cảnh
    const r = { width: canvas.clientWidth, height: canvas.clientHeight };
    canvas.width = Math.max(1, r.width * DPR);
    canvas.height = Math.max(1, r.height * DPR);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function heart(ctx, x, y, s) {
    // trái tim tâm tại (x, y), cao ~ s
    y -= s * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  /* ---------------- Background: petals, rising hearts, bokeh ---------------- */
  const bg = document.getElementById("bg");
  let B = fit(bg);
  const PETAL_COLORS = ["#ffb3c6", "#ffc8d5", "#ff9fb6", "#ffd6de", "#fbc4ab"];
  const HEART_COLORS = ["#ff8fab", "#ff6f91", "#ffb3c6", "#f7c873"];
  const items = [];
  function spawnBg(initial) {
    const type = Math.random() < 0.55 ? "petal" : Math.random() < 0.6 ? "heart" : "bokeh";
    const it = { type, x: rand(0, B.w), life: 0 };
    if (type === "petal") {
      Object.assign(it, { y: initial ? rand(-B.h, B.h) : rand(-60, -20), s: rand(7, 14), vy: rand(0.35, 0.9), sway: rand(0.6, 1.6), ph: rand(0, 6.28), rot: rand(0, 6.28), vr: rand(-0.02, 0.02), c: pick(PETAL_COLORS), a: rand(0.55, 0.9) });
    } else if (type === "heart") {
      Object.assign(it, { y: initial ? rand(0, B.h * 1.4) : B.h + rand(10, 60), s: rand(8, 18), vy: -rand(0.3, 0.75), sway: rand(0.3, 0.9), ph: rand(0, 6.28), c: pick(HEART_COLORS), a: rand(0.25, 0.6) });
    } else {
      Object.assign(it, { y: rand(0, B.h), r: rand(14, 46), vy: -rand(0.05, 0.2), ph: rand(0, 6.28), a: rand(0.06, 0.16) });
    }
    items.push(it);
  }
  const MAX_BG = Math.round(Math.min(30, 16 + (window.innerWidth * window.innerHeight) / 40000));
  for (let i = 0; i < MAX_BG; i++) spawnBg(true);

  let t = 0;
  function drawBg() {
    t += 1;
    const ctx = B.ctx;
    ctx.clearRect(0, 0, B.w, B.h);
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      if (p.type === "petal") {
        p.y += p.vy;
        p.x += Math.sin(t * 0.01 * p.sway + p.ph) * 0.6;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 0.02 + p.ph)));
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.quadraticCurveTo(p.s * 0.9, -p.s * 0.2, 0, p.s);
        ctx.quadraticCurveTo(-p.s * 0.9, -p.s * 0.2, 0, -p.s);
        ctx.fill();
        ctx.restore();
        if (p.y > B.h + 30) items.splice(i, 1);
      } else if (p.type === "heart") {
        p.y += p.vy;
        p.x += Math.sin(t * 0.015 * p.sway + p.ph) * 0.5;
        ctx.globalAlpha = p.a * Math.min(1, (B.h + 60 - p.y) / 120);
        ctx.fillStyle = p.c;
        heart(ctx, p.x, p.y, p.s);
        if (p.y < -30) items.splice(i, 1);
      } else {
        p.y += p.vy;
        const a = p.a * (0.6 + 0.4 * Math.sin(t * 0.02 + p.ph));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,220,230,${a})`);
        g.addColorStop(1, "rgba(255,220,230,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
        if (p.y < -p.r) items.splice(i, 1);
      }
    }
    ctx.globalAlpha = 1;
    drawDrops(ctx);
    while (items.length < MAX_BG) spawnBg(false);
  }

  /* ---------------- FX layer: tap hearts, bursts, fireworks ---------------- */
  const fx = document.getElementById("fx");
  let F = fit(fx);
  const parts = [];
  const FX_COLORS = ["#ff5c8a", "#ff8fab", "#ffb3c6", "#f7c873", "#ff6f91", "#ffd1dc", "#ffffff"];

  function burst(x, y, n = 10, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(opts.minSp || 1.2, opts.maxSp || 4.2);
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 1.2),
        s: rand(opts.minS || 7, opts.maxS || 15), c: pick(opts.colors || FX_COLORS),
        life: 0, max: rand(50, 90), g: opts.g ?? 0.06, kind: opts.kind || "heart", rot: rand(-0.5, 0.5),
      });
    }
  }

  function firework(x, y) {
    const n = 36;
    const c1 = pick(FX_COLORS), c2 = pick(FX_COLORS);
    for (let i = 0; i < n; i++) {
      // tia bắn theo hình trái tim
      const tt = (i / n) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(tt), 3);
      const hy = -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt));
      const k = rand(0.22, 0.27);
      parts.push({ x, y, vx: hx * k, vy: hy * k, s: rand(2, 3.2), c: i % 2 ? c1 : c2, life: 0, max: rand(60, 85), g: 0.035, kind: "spark", drag: 0.965 });
    }
    for (let i = 0; i < 10; i++) {
      const a = rand(0, 6.283), sp = rand(1, 5);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: rand(1.5, 2.5), c: "#fff3c4", life: 0, max: rand(30, 60), g: 0.05, kind: "spark", drag: 0.95 });
    }
  }

  function confetti(n = 40) {
    n = Math.min(n, 50);
    for (let i = 0; i < n; i++) {
      parts.push({ x: rand(0, F.w), y: rand(-F.h * 0.5, -10), vx: rand(-1, 1), vy: rand(2, 4.5), s: rand(6, 13), c: pick(FX_COLORS), life: 0, max: 400, g: 0.02, kind: Math.random() < 0.5 ? "heart" : "rect", rot: rand(0, 6), vr: rand(-0.15, 0.15) });
    }
  }

  const sprites = new Map();
  function emojiSprite(e) {
    let c = sprites.get(e);
    if (c) return c;
    const S = 48 * DPR;
    c = document.createElement("canvas");
    c.width = c.height = S * 1.3;
    const x = c.getContext("2d");
    x.font = `${S}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(e, c.width / 2, c.height / 2 + S * 0.05);
    sprites.set(e, c);
    return c;
  }

  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("vi", { granularity: "grapheme" }) : null;
  const splitEmoji = (str) => (seg ? [...seg.segment(str)].map((s) => s.segment) : str.match(/\p{Extended_Pictographic}️?/gu) || []).filter((s) => s.trim());

  // mưa emoji: rơi từ trên xuống, lắc lư, xoay nhẹ
  const drops = [];
  const MAX_DROPS = 14;
  function rain(emojis, n = 8) {
    const e = splitEmoji(emojis)[0];
    if (!e) return;
    n = Math.min(n, 10, MAX_DROPS - drops.length);
    for (let i = 0; i < n; i++) {
      drops.push({ e, x: rand(16, B.w - 16), y: -rand(30, B.h * 0.7), vy: rand(1.4, 2.4), s: rand(24, 34), rot: rand(-0.4, 0.4), vr: rand(-0.02, 0.02), ph: rand(0, 6.28), sway: rand(0.4, 1.2), t: 0 });
    }
  }
  function drawDrops(ctx) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.t++;
      d.y += d.vy;
      d.x += Math.sin(d.t * 0.04 * d.sway + d.ph) * 0.8;
      d.rot += d.vr;
      if (d.y > B.h + 40) { drops.splice(i, 1); continue; }
      const w = d.s * 1.3;
      ctx.globalAlpha = 0.9;
      ctx.setTransform(DPR * Math.cos(d.rot), DPR * Math.sin(d.rot), -DPR * Math.sin(d.rot), DPR * Math.cos(d.rot), DPR * d.x, DPR * d.y);
      ctx.drawImage(emojiSprite(d.e), -w / 2, -w / 2, w, w);
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
  }

  // 1 emoji bay lên từ 1 điểm (dùng cho keyword)
  function floatEmoji(x, y, e) {
    parts.push({ kind: "emoji", e, x, y, vx: rand(-0.5, 0.5), vy: -2.2, g: 0.015, s: 30, rot: rand(-0.3, 0.3), vr: rand(-0.02, 0.02), ph: 0, sway: 0, life: 0, max: 90 });
  }

  function drawFx() {
    const ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      const k = 1 - p.life / p.max;
      if (k <= 0 || p.y > F.h + 50) { parts.splice(i, 1); continue; }
      if (p.life < 0) continue;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.c;
      if (p.kind === "emoji") {
        if (p.sway) p.x += Math.sin(p.life * 0.04 * p.sway + p.ph) * 0.9;
        p.rot += p.vr;
        const w = p.s * 1.3;
        ctx.setTransform(DPR * Math.cos(p.rot), DPR * Math.sin(p.rot), -DPR * Math.sin(p.rot), DPR * Math.cos(p.rot), DPR * p.x, DPR * p.y);
        ctx.drawImage(emojiSprite(p.e), -w / 2, -w / 2, w, w);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      } else if (p.kind === "spark") {
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * (0.5 + k * 0.5), 0, 6.283);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else if (p.kind === "rect") {
        p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      } else {
        if (p.vr) p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        heart(ctx, 0, 0, p.s);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  // chạm đâu nở tim đó
  window.addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY, 7, { minS: 6, maxS: 13, maxSp: 3 }), { passive: true });

  /* ---------------- Beating particle heart ---------------- */
  class BeatingHeart {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      // romantic: nhịp "thình-thịch" rõ như tim thật, mỗi nhịp lan 1 vòng sóng hình tim, tỏa hào quang và thả tim nhỏ bay lên
      this.opts = Object.assign({ color: "#ff6f9c", glow: "#ffb3c6", scale: 1, romantic: false }, opts);
      this.waves = [];
      this.motes = [];
      this.lastPh = 0;
      this.resize();
      this.time = 0;
      this.exploding = false;
      this.dead = false;
    }
    resize() {
      const R = fit(this.canvas);
      this.ctx = R.ctx; this.w = R.w; this.h = R.h;
      this.S = Math.min(this.w, this.h) / 38 * this.opts.scale;
      this.build();
    }
    build() {
      const pts = [];
      const hp = (tt) => [16 * Math.pow(Math.sin(tt), 3), -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt))];
      const N = this.w < 400 ? 900 : 1300;
      for (let i = 0; i < N; i++) {
        const [x, y] = hp(Math.random() * Math.PI * 2);
        // viền dày, lan vào trong theo log → hiệu ứng trái tim hạt quen thuộc
        const r = i < N * 0.55 ? 1 - Math.random() * 0.06 : 1 - Math.pow(Math.random(), 0.6) * 0.65 * (Math.random() < 0.5 ? 1 : 0.4);
        pts.push({ x: x * r, y: y * r, kind: 0, s: rand(0.9, 2) });
      }
      for (let i = 0; i < N * 0.35; i++) {
        const [x, y] = hp(Math.random() * Math.PI * 2);
        const r = 1 + Math.random() * 0.22;
        pts.push({ x: x * r, y: y * r, kind: 1, s: rand(0.6, 1.4) });
      }
      this.pts = pts;
    }
    explode() {
      this.exploding = true;
      this.ex = 0;
      this.pts.forEach((p) => { const a = Math.atan2(p.y, p.x); const sp = rand(0.4, 1.6); p.vx = Math.cos(a) * sp + rand(-0.3, 0.3); p.vy = Math.sin(a) * sp + rand(-0.3, 0.3); });
    }
    draw() {
      if (this.dead) return;
      const { ctx, w, h, S } = this;
      this.time += 1 / 60;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + S * 0.5;
      const R = this.opts.romantic;
      // nhịp tim: "thình" mạnh rồi "thịch" nhẹ ngay sau, nghỉ (romantic: ~70 nhịp/phút, co bóp rõ hơn)
      const period = R ? 0.86 : 1.1;
      const ph = (this.time % period) / period;
      const bump = (c, wd) => Math.exp(-Math.pow((ph - c) / wd, 2));
      const beat = R ? bump(0.07, 0.045) + 0.62 * bump(0.25, 0.05)
        : ph < 0.15 ? Math.sin((ph / 0.15) * Math.PI) : ph < 0.32 ? 0.6 * Math.sin(((ph - 0.15) / 0.17) * Math.PI) : 0;
      ctx.globalCompositeOperation = "lighter";
      if (this.exploding) this.ex += 1;
      const fade = this.exploding ? Math.max(0, 1 - this.ex / 70) : 1;
      if (this.exploding && fade <= 0) { this.dead = true; ctx.clearRect(0, 0, w, h); return; }
      if (R && !this.exploding) {
        // mỗi tiếng "thình": thêm 1 vòng sóng + vài đốm tim bay lên
        if (this.lastPh < 0.07 && ph >= 0.07) {
          this.waves.push({ t: 0 });
          for (let i = 0; i < 5; i++) {
            const p = this.pts[(Math.random() * this.pts.length * 0.55) | 0];
            this.motes.push({ x: p.x, y: p.y, vx: p.x * 0.012 + rand(-0.04, 0.04), vy: rand(-0.16, -0.08), life: 1, s: rand(0.5, 1) });
          }
        }
        // hào quang hồng phía sau, sáng lên theo nhịp
        const gr = ctx.createRadialGradient(cx, cy - S * 2, 0, cx, cy - S * 2, S * 24);
        gr.addColorStop(0, `rgba(255,111,156,${0.16 + 0.28 * beat})`);
        gr.addColorStop(1, "rgba(255,111,156,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
        // vòng sóng hình tim lan ra rồi tan
        this.waves = this.waves.filter((wv) => (wv.t += 1 / 60 / 1.3) < 1);
        ctx.fillStyle = this.opts.glow;
        for (const wv of this.waves) {
          const k = 1.05 + wv.t * 0.55;
          ctx.globalAlpha = 0.5 * (1 - wv.t) * (1 - wv.t);
          for (let i = 0; i < this.pts.length * 0.55; i += 3) {
            const p = this.pts[i];
            ctx.fillRect(cx + p.x * S * k, cy + p.y * S * k, 1.4, 1.4);
          }
        }
        // tim nhỏ bay lên
        this.motes = this.motes.filter((m) => (m.life -= 1 / 60 / 2.2) > 0);
        ctx.fillStyle = this.opts.color;
        for (const m of this.motes) {
          m.x += m.vx; m.y += m.vy;
          ctx.globalAlpha = 0.85 * m.life;
          heart(ctx, cx + m.x * S, cy + m.y * S, S * 0.9 * m.s);
        }
        ctx.globalAlpha = 1;
      }
      this.lastPh = ph;
      for (const p of this.pts) {
        let x, y;
        if (this.exploding) {
          p.x += p.vx * (1 + this.ex * 0.05); p.y += p.vy * (1 + this.ex * 0.05);
          x = cx + p.x * S; y = cy + p.y * S;
        } else {
          const k = R ? (p.kind === 1 ? 1 + beat * 0.2 + rand(-0.03, 0.03) : 1 + beat * 0.11)
            : p.kind === 1 ? 1 + beat * 0.12 + rand(-0.03, 0.03) : 1 + beat * 0.07;
          const j = p.kind === 1 ? 0.6 : 0.25;
          x = cx + p.x * S * k + rand(-j, j);
          y = cy + p.y * S * k + rand(-j, j);
        }
        ctx.globalAlpha = (p.kind === 1 ? 0.45 : 0.85) * fade;
        ctx.fillStyle = p.kind === 1 ? this.opts.glow : this.opts.color;
        ctx.fillRect(x, y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  const hearts = new Set();
  function loop() {
    drawBg();
    drawFx();
    hearts.forEach((hh) => { hh.draw(); if (hh.dead) hearts.delete(hh); });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener("resize", () => {
    B = fit(bg); F = fit(fx);
    hearts.forEach((hh) => hh.resize());
  });

  window.FX = {
    burst, firework, confetti, rain, floatEmoji, rand,
    beatingHeart(canvas, opts) { const hh = new BeatingHeart(canvas, opts); hearts.add(hh); return hh; },
    removeHeart(hh) { hearts.delete(hh); },
  };
})();
