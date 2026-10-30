/* Kịch bản chạy tuần tự: mỗi scene là 1 hàm async, xong scene này mới qua scene kế. */
(() => {
  const C = window.CONTENT;
  const CFG = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const c of kids.flat()) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(c));
    }
    return el;
  }

  const waitClick = (el) => new Promise((r) => el.addEventListener("click", r, { once: true }));
  const center = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  /* =================================================================== */
  /*        Lớp nổi: chữ nền lơ lửng, sticker (không che chữ), fx          */
  /* =================================================================== */
  const floaters = h("div", { class: "floaters" });
  const stickers = h("div", { class: "stickers" });
  document.body.append(floaters, stickers);

  let ambientTimer = null;
  let fxTimers = [];

  // các cụm chữ trôi lững lờ phía sau nội dung
  function spawnAmbient() {
    if (!C.floatingWords?.length || floaters.childElementCount > 6) return;
    const w = h("div", { class: "ambient" }, pick(C.floatingWords));
    w.style.left = rand(-5, 65) + "%";
    w.style.fontSize = rand(28, 48) + "px";
    floaters.append(w);
    const sway = rand(-60, 60);
    w.animate(
      [
        { transform: `translate(0, ${innerHeight + 40}px) rotate(${rand(-10, 10)}deg)`, opacity: 0 },
        { opacity: 0.2, offset: 0.2 },
        { opacity: 0.2, offset: 0.75 },
        { transform: `translate(${sway}px, -80px) rotate(${rand(-10, 10)}deg)`, opacity: 0 },
      ],
      { duration: rand(12000, 17000), easing: "linear" },
    ).onfinish = () => w.remove();
  }

  // những thứ sticker không được che: chữ, ảnh, nút, ô nhập… của cảnh hiện tại
  const OBSTACLES = "p,.lead,.ms-head,.caption,.stack,.counter,.swipe-hint,.fact,.btn,input,.paper,.env2,.fl-stop,.yay,.gift-box,.gift-reveal,.m-text,.heart-wrap,.lock-title,.pw-msg,.and-then,.moon,.tap-hint,.footer-note,.m-photo.last";
  function obstacleRects() {
    const list = [];
    const add = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.bottom > 0 && r.top < innerHeight) list.push(r);
    };
    if (current) current.querySelectorAll(OBSTACLES).forEach((el) => !el.closest(".later:not(.on)") && add(el));
    document.querySelectorAll(".runaway.flying, .sticker:not(.out)").forEach(add);
    return list;
  }

  // sticker động: luôn hiện. Ưu tiên chỗ trống sát mép màn hình; nếu không còn chỗ trống
  // thì thu nhỏ lại và đặt vào chỗ che chữ ít nhất
  function sticker({ sticker: name, bubble, dur = 4200 }) {
    const src = C.stickerDir + (name.includes(".") ? name : name + ".webp");
    const GAP = 6, pad = 8;
    const b = bubble ? h("div", { class: "bubble" }, bubble) : null;
    const el = h("div", { class: "sticker" }, h("img", { src, alt: "", draggable: "false" }), b);
    el.style.visibility = "hidden";
    stickers.append(el);
    const bw = b ? b.offsetWidth + GAP : 0;
    const bh = b ? b.offsetHeight : 0;
    const W = innerWidth, H = innerHeight, top = 46, bottom = H - 16;
    const obs = obstacleRects();
    const overlap = (box) => obs.reduce((sum, o) => {
      const w = Math.min(box.right, o.right + GAP) - Math.max(box.left, o.left - GAP);
      const hh = Math.min(box.bottom, o.bottom + GAP) - Math.max(box.top, o.top - GAP);
      return w > 0 && hh > 0 ? sum + w * hh : sum;
    }, 0);
    // thử lần lượt: to + bong bóng → nhỏ + ló ra từ mép → nhỏ, ló mép, bỏ bong bóng
    const tries = [{ S: 84, bub: true, peek: 0 }, { S: 64, bub: true, peek: 0.4 }, { S: 64, bub: false, peek: 0.45 }];
    let best = null;
    for (const t of tries) {
      const S = t.S, bwT = t.bub ? bw : 0, bhT = t.bub ? bh : 0;
      for (let y = top; y <= bottom - S; y += 16) {
        for (let x = pad - S * t.peek; x <= W - S - pad + S * t.peek; x += 16) {
          const bubbleRight = x + S / 2 < W / 2;
          const box = {
            left: Math.max(0, bubbleRight ? x : x - bwT), right: Math.min(W, bubbleRight ? x + S + bwT : x + S),
            top: Math.min(y, y + S / 2 - bhT / 2), bottom: Math.max(y + S, y + S / 2 + bhT / 2),
          };
          if (t.bub && (box.left < pad - S * t.peek || box.right > W - pad + S * t.peek)) continue;
          if (box.top < top || box.bottom > bottom) continue;
          // điểm: che chữ càng ít càng tốt, rồi ưu tiên sát mép trái/phải, trên/dưới
          const ov = overlap(box);
          const score = ov * 10 + Math.min(Math.abs(x), Math.abs(W - S - x)) + Math.min(y - top, bottom - S - y) * 0.6 + rand(0, 30) + (t.bub ? 0 : 300);
          if (!best || score < best.score) best = { x, y, S, bubbleRight, score, ov, bub: t.bub };
        }
      }
      if (best && best.ov === 0) break; // đã có chỗ không che gì thì dừng
    }
    if (!best.bub && b) b.remove();
    const c = best;
    el.style.width = c.S + "px";
    el.style.setProperty("--s", c.S + "px");
    el.style.left = c.x + "px";
    el.style.top = c.y + "px";
    if (b) b.classList.add(c.bubbleRight ? "b-right" : "b-left");
    el.style.visibility = "";
    el.classList.add("in");
    el.querySelector("img").onerror = () => el.remove();
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 500); }, dur);
  }
  function clearStickers() {
    [...stickers.children].forEach((el) => { el.classList.add("out"); setTimeout(() => el.remove(), 500); });
  }

  // chạy 1 danh sách hiệu ứng: [{ rain, n } | { sticker, bubble } | { fireworks }], mỗi cái có thể có "at" (ms)
  function runFx(list) {
    if (!list) return;
    for (const f of [].concat(list)) {
      const t = setTimeout(() => {
        if (f.rain) FX.rain(f.rain, f.n);
        if (f.sticker) sticker(f);
        if (f.fireworks) for (let i = 0; i < f.fireworks; i++) setTimeout(() => FX.firework(rand(50, innerWidth - 50), rand(80, innerHeight * 0.4)), i * 420);
      }, f.at || 0);
      fxTimers.push(t);
    }
  }

  // câu nói nhỏ bay lên (dùng khi né nút)
  function sayAt(x, y, text) {
    const s = h("div", { class: "say" }, text);
    s.style.left = x + "px";
    s.style.top = y + "px";
    document.body.append(s);
    setTimeout(() => s.remove(), 1600);
  }

  /* =================================================================== */
  /*                 Chữ "sống": keyword, chữ lượn, gõ chữ                */
  /* =================================================================== */
  //  **chữ|emoji**  → keyword (emoji nảy ra ngay sau chữ)   ~~chữ~~ → chữ lượn sóng
  function parseRich(text) {
    const re = /\*\*(.+?)\*\*|~~(.+?)~~/g;
    const segs = [];
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ t: text.slice(last, m.index) });
      if (m[1] != null) { const [t, emoji] = m[1].split("|"); segs.push({ t, kw: true, emoji }); }
      else segs.push({ t: m[2], wave: true });
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ t: text.slice(last) });
    const out = [];
    for (const seg of segs) {
      if (!seg.kw || !seg.emoji) { out.push(seg); continue; }
      const i = seg.t.lastIndexOf(" ");
      if (i > 0) out.push({ t: seg.t.slice(0, i + 1), kw: true });
      out.push({ t: seg.t.slice(i + 1), kw: true, emoji: seg.emoji, glue: true });
    }
    return out;
  }
  // nơi chứa keyword: keyword có emoji nằm trong khung không ngắt dòng cùng emoji
  const kwHost = (el, seg) => (seg.glue ? el.appendChild(h("span", { class: "glue" })) : el);
  // "\n" trong nội dung → xuống dòng
  const appendText = (el, text) => text.split("\n").forEach((part, i) => { if (i) el.append(h("br")); if (part) el.append(part); });
  const kwSpan = (seg) => h("span", { class: "kw" + (seg.t.length <= 16 ? " ib" : "") });
  const emojiSpan = (seg) => (seg.emoji ? h("span", { class: "kw-emoji" }, seg.emoji) : null);
  const waveSpan = () => h("span", { class: "wave" });
  const waveChar = (wrap, ch) => wrap.append(h("span", { style: `--i:${wrap.childElementCount}` }, ch));

  function popKeyword(span) {
    span.classList.add("pop");
    const e = span.nextElementSibling;
    if (e && e.classList.contains("kw-emoji")) e.classList.add("on");
  }

  // dựng sẵn toàn bộ chữ (hiện ngay hoặc dùng để giữ chỗ); keyword nổ sau popDelay ms (null = không nổ)
  function richStatic(el, text, popDelay = 900) {
    for (const seg of parseRich(text.normalize("NFC"))) {
      if (seg.kw) {
        const host = kwHost(el, seg);
        const s = kwSpan(seg);
        s.textContent = seg.t;
        host.append(s);
        const e = emojiSpan(seg);
        if (e) host.append(e);
        if (popDelay != null) setTimeout(() => popKeyword(s), popDelay);
      } else if (seg.wave) {
        const w = waveSpan();
        Array.from(seg.t).forEach((ch) => waveChar(w, ch));
        el.append(w);
      } else appendText(el, seg.t);
    }
    return el;
  }

  // gõ từng ký tự (chạm màn hình để hiện nhanh)
  let hurry = false;
  let typing = 0;
  document.addEventListener("pointerdown", () => { if (typing > 0) hurry = true; }, true);
  const TYPE_BOOST = 1.5;

  async function typeRich(el, text, speed = 42) {
    speed /= TYPE_BOOST;
    typing++;
    hurry = false;
    el.classList.add("typing");
    for (const seg of parseRich(text.normalize("NFC"))) {
      let target = el, host = el;
      if (seg.kw) { host = kwHost(el, seg); target = kwSpan(seg); host.append(target); }
      else if (seg.wave) { target = waveSpan(); el.append(target); }
      for (const ch of Array.from(seg.t)) {
        if (ch === "\n") { target.append(h("br")); continue; }
        if (seg.wave) waveChar(target, ch);
        else target.append(ch);
        if (!hurry) await sleep(/[,.!?…:]/.test(ch) ? speed * 5 : speed + Math.random() * speed * 0.5);
      }
      if (seg.kw) {
        const e = emojiSpan(seg);
        if (e) host.append(e);
        popKeyword(target);
      }
    }
    el.classList.remove("typing");
    typing--;
  }

  // hiện từng chữ nảy lên; trả về promise khi hiện xong
  function revealWords(el, text, stagger = 75) {
    let i = 0;
    const units = [];
    for (const seg of parseRich(text.normalize("NFC"))) {
      if (seg.kw || seg.wave) {
        const host = seg.kw ? kwHost(el, seg) : el;
        const s = seg.kw ? kwSpan(seg) : waveSpan();
        if (seg.kw) s.textContent = seg.t; else Array.from(seg.t).forEach((ch) => waveChar(s, ch));
        s.classList.add("w");
        units.push([s, seg, i++]);
        host.append(s);
        const e = seg.kw && emojiSpan(seg);
        if (e) host.append(e);
        continue;
      }
      seg.t.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) appendText(el, part);
        else { const w = h("span", { class: "w" }, part); units.push([w, null, i++]); el.append(w); }
      });
    }
    units.forEach(([w, seg, k]) => {
      w.style.setProperty("--d", k * stagger + "ms");
      if (seg && seg.kw) setTimeout(() => popKeyword(w), k * stagger + 450);
    });
    return sleep(i * stagger + 500);
  }

  /* ---------------- Ảnh ---------------- */
  function placeholder(label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd8c8"/><stop offset="1" stop-color="#ff9fb6"/></linearGradient></defs>
      <rect width="400" height="500" fill="url(#g)"/>
      <text x="200" y="230" font-size="70" text-anchor="middle">📷</text>
      <text x="200" y="300" font-size="22" font-family="sans-serif" fill="#8a2846" text-anchor="middle">${label}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function img(path) {
    const i = h("img", { alt: "", decoding: "async", draggable: "false" });
    i.onerror = () => { i.onerror = null; i.src = placeholder(path.split("/").pop()); };
    i.src = path;
    return i;
  }
  const photoPath = (src) => C.photoDir + src;
  const montagePaths = () =>
    Array.from({ length: C.montage.count }, (_, i) => C.photoDir + C.montage.dir + String(i + 1).padStart(2, "0") + "." + C.montage.ext);

  // tải + giải mã sẵn mọi ảnh ngay từ màn "chạm vào đây"; giữ lại đối tượng Image để tới lúc cần là hiện liền, không bị khung trắng
  const cache = new Map(); // src → { el, ready: Promise }
  function preloadOne(src) {
    if (cache.has(src)) return cache.get(src).ready;
    const el = new Image();
    el.decoding = "async";
    const ready = new Promise((res) => {
      el.onload = () => (el.decode ? el.decode().catch(() => {}) : Promise.resolve()).then(res);
      el.onerror = res;
    });
    cache.set(src, { el, ready });
    el.src = src;
    return ready;
  }
  // tối đa 6 ảnh tải song song, theo đúng thứ tự cần dùng (ảnh mở đầu trước, ảnh dồn dập sau)
  async function preloadList(list, lanes = 6) {
    const queue = [...list];
    await Promise.all(Array.from({ length: lanes }, async () => {
      while (queue.length) await preloadOne(queue.shift());
    }));
  }
  let preloading = null;
  function preloadAll() {
    if (preloading) return preloading;
    const list = [];
    C.intro.photos.forEach((p) => list.push(photoPath(p.src)));
    const names = new Set();
    JSON.stringify(C).replace(/"sticker":"([^"]+)"/g, (_, n) => names.add(n));
    names.forEach((n) => list.push(C.stickerDir + (n.includes(".") ? n : n + ".webp")));
    C.milestones.forEach((m) => (m.photos || []).forEach((p) => list.push(photoPath(p.src))));
    list.push(...montagePaths());
    return (preloading = preloadList(list));
  }
  // ảnh đã tải sẵn thì dùng luôn đối tượng đó (đã giải mã), chưa có thì tải như thường
  function cachedImg(path) {
    const c = cache.get(path);
    if (!c || !c.el.complete || !c.el.naturalWidth || c.el.isConnected) return img(path);
    c.el.alt = "";
    c.el.draggable = false;
    return c.el;
  }

  /* ---------------- Scene engine ---------------- */
  const stage = $("#stage");
  const THEME_COLOR = { night: "#2a0f1f", warm: "#ffe3d6", dusk: "#e88aa6", film: "#1a0912", paper: "#fbe7d8" };
  let current = null;

  function scene(cls, theme) {
    const s = h("section", { class: "scene " + (cls || "") });
    s._theme = theme;
    return s;
  }
  async function show(s) {
    if (s._theme) {
      document.body.dataset.theme = s._theme;
      $('meta[name="theme-color"]').setAttribute("content", THEME_COLOR[s._theme]);
    }
    fxTimers.forEach(clearTimeout);
    fxTimers = [];
    clearStickers();
    clearInterval(ambientTimer);
    ambientTimer = setInterval(spawnAmbient, 1700);
    if (current) {
      const old = current;
      old.classList.remove("active");
      old.classList.add("leaving");
      setTimeout(() => old.remove(), 1100);
    }
    stage.append(s);
    current = s;
    void s.offsetWidth;
    requestAnimationFrame(() => s.classList.add("active"));
    await sleep(350);
  }
  function setProgress(f) {
    $(".progress").classList.add("on");
    $(".progress span").style.width = Math.round(f * 100) + "%";
  }
  function nextButton(label = "Tiếp nè", extraClass = "") {
    return h("button", { class: `btn next later ${extraClass}` }, label, " ", h("span", { class: "arrow" }, "→"));
  }
  // nút "tiếp": hiện vạch đếm ngược, hết giờ tự chuyển, bấm thì chuyển luôn
  function autoNext(btn, ms = 4500) {
    btn.style.setProperty("--auto", ms + "ms");
    btn.classList.add("on", "pulse", "auto");
    return Promise.race([waitClick(btn), sleep(ms)]);
  }

  function toast(text, ms = 3200) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("on"), ms);
  }

  /* ---------------- Nhạc nền ---------------- */
  // không có nút tắt nhạc: nhạc chạy suốt từ màn "chạm vào đây" tới cuối, hết bài thì lặp lại
  const bgm = $("#bgm");
  const MUSIC_VOLUME = 0.6; // âm lượng vừa phải
  let fadeTimer = null;
  function initMusic() {
    if (bgm.src) return;
    bgm.src = C.music;
    bgm.loop = true;
    bgm.volume = 0;
  }
  // phát nhạc và tăng âm lượng từ từ lên mức vừa (trên iPhone âm lượng theo nút cứng của máy)
  function playMusic() {
    initMusic();
    if (!bgm.paused) return;
    bgm.play().then(() => {
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        bgm.volume = Math.min(MUSIC_VOLUME, bgm.volume + MUSIC_VOLUME / 25);
        if (bgm.volume >= MUSIC_VOLUME) clearInterval(fadeTimer);
      }, 100);
    }).catch(() => {});
  }
  // nhạc chạy ngay từ lúc vào trang; trình duyệt chặn tự phát thì bắt đầu ở lần chạm/gõ phím đầu tiên.
  // Nếu nhạc bị dừng giữa chừng (Nu chuyển app rồi quay lại...) thì lần chạm kế tiếp phát tiếp.
  // Chỉ các sự kiện này mới được trình duyệt tính là "người dùng cho phép phát" (chạm thì pointerdown không tính)
  const ACTIVATION_EVENTS = ["click", "touchend", "pointerup", "keydown"];
  function startMusicOnFirstTouch() {
    playMusic();
    ACTIVATION_EVENTS.forEach((ev) => addEventListener(ev, playMusic, true));
  }

  /* ---------------- Chồng ảnh polaroid: vuốt ảnh cuối là qua cảnh tiếp ---------------- */
  function photoStack(photos) {
    const caption = h("div", { class: "caption" });
    const counter = h("div", { class: "counter" });
    const hint = h("div", { class: "swipe-hint" }, h("span", { class: "hand" }, "👆"), "vuốt ảnh sang bên nha");
    const wrap = h("div", { class: "stack" });
    const order = photos.map((_, i) => i);
    let resolveDone;
    const done = new Promise((r) => (resolveDone = r));

    const cards = photos.map((p, i) => {
      const c = h("div", {
        class: "polaroid in",
        style: `--r:${rand(-7, 7).toFixed(1)}deg;--r-top:${rand(-2.5, 2.5).toFixed(1)}deg;--deal:${(photos.length - 1 - i) * 0.12 + 0.2}s`,
      }, h("div", { class: "ph" }, img(photoPath(p.src))), h("div", { class: "pl-label" }, p.label || "♡"));
      c.addEventListener("animationend", () => c.classList.remove("in"), { once: true });
      return c;
    });
    cards.slice().reverse().forEach((c) => wrap.append(c));

    let capToken = 0;
    async function setCaption(lines) {
      const token = ++capToken;
      caption.classList.toggle("single", lines.length <= 1);
      if (caption.childElementCount) { caption.classList.add("fade"); await sleep(280); }
      if (token !== capToken) return;
      caption.innerHTML = "";
      caption.classList.remove("fade");
      for (const line of lines) {
        const p = h("p", {});
        caption.append(p);
        await revealWords(p, line, 65);
        if (token !== capToken) return;
      }
    }
    function layout() {
      order.forEach((idx, pos) => {
        const c = cards[idx];
        c.style.zIndex = 100 - pos;
        c.style.setProperty("--pos", pos);
        c.classList.toggle("top", pos === 0);
      });
      const p = photos[order[0]];
      setCaption(p.caption || []);
      runFx(p.fx);
      counter.textContent = photos.length > 1 ? `${photos.length - order.length + 1} / ${photos.length}` : "";
    }

    let drag = null;
    wrap.addEventListener("pointerdown", (e) => {
      const el = cards[order[0]];
      if (!el || !el.contains(e.target) || el._flying) return;
      drag = { el, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0 };
      try { el.setPointerCapture(e.pointerId); } catch {}
      el.style.transition = "none";
    });
    wrap.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.dx = e.clientX - drag.sx;
      drag.dy = e.clientY - drag.sy;
      drag.el.style.transform = `translate(${drag.dx}px, ${drag.dy * 0.35}px) rotate(${drag.dx / 14}deg)`;
    });
    const end = () => {
      if (!drag) return;
      const { el, dx } = drag;
      drag = null;
      if (Math.abs(dx) > 70) flyOut(el, Math.sign(dx));
      else { el.style.transition = ""; el.style.transform = ""; }
    };
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);

    function flyOut(el, dir) {
      el._flying = true;
      FX.burst(...center(el), 12);
      el.style.transition = "transform .5s cubic-bezier(.5,0,.75,0), opacity .5s";
      el.style.transform = `translate(${dir * window.innerWidth}px, -60px) rotate(${dir * 35}deg)`;
      el.style.opacity = "0";
      hint.style.opacity = "0";
      order.shift();
      if (!order.length) { setTimeout(resolveDone, 250); return; }
      setTimeout(() => el.remove(), 520);
      layout();
    }

    const block = h("div", { style: "width:100%;display:flex;flex-direction:column;align-items:center" }, wrap, counter, hint, caption);
    return { block, done, start: layout };
  }

  /* ---------------- Nút "chạy trốn": nút còn lại vẫn đứng yên ---------------- */
  function makeRunaway(btn, lines = [], avoid = []) {
    btn.classList.add("runaway");
    let n = 0;
    const move = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const r = btn.getBoundingClientRect();
      if (!btn.classList.contains("flying")) {
        // giữ chỗ để nút kia không bị xê dịch
        const ph = btn.cloneNode(true);
        ph.style.visibility = "hidden";
        ph.classList.remove("runaway");
        btn.before(ph);
        btn.style.left = r.left + "px";
        btn.style.top = r.top + "px";
        btn.classList.add("flying");
        void btn.offsetWidth;
      }
      const W = window.innerWidth, H = window.innerHeight;
      let x, y, tries = 0;
      const pad = 18;
      const hits = (x, y) => avoid.some((el) => {
        const a = el.getBoundingClientRect();
        return x < a.right + pad && x + r.width > a.left - pad && y < a.bottom + pad && y + r.height > a.top - pad;
      });
      do {
        x = rand(12, W - r.width - 12);
        y = rand(70, H - r.height - 90);
        tries++;
      } while ((hits(x, y) || Math.hypot(x - r.left, y - r.top) < 140) && tries < 60);
      btn.style.left = x + "px";
      btn.style.top = y + "px";
      btn.style.transform = `rotate(${rand(-12, 12)}deg)`;
      if (lines.length) sayAt(r.left + r.width / 2, r.top, lines[n % lines.length]);
      if (n === 0) sticker({ sticker: "tongue", dur: 2500 });
      n++;
    };
    btn.addEventListener("pointerdown", move);
    btn.addEventListener("click", move);
  }

  /* =================================================================== */
  /*                              SCENES                                 */
  /* =================================================================== */

  // màn mở đầu "chạm để bắt đầu": trình duyệt chỉ cho phát nhạc sau khi người dùng chạm vào trang,
  // nên cú chạm này vừa mở màn vừa bật nhạc nền
  async function sceneStart() {
    const s = scene("start", "night");
    s.append(h("div", { class: "start-tap" },
      h("div", { class: "start-heart rv" }, "💗"),
      h("div", { class: "start-text rv", style: "--d:.3s" }, C.startText),
      h("div", { class: "start-hint rv", style: "--d:.7s" }, "🎵 nhớ mở âm lượng nha"),
    ));
    s.addEventListener("click", playMusic, { once: true }); // gọi ngay trong lúc chạm để chắc chắn được phép phát
    await show(s);
    await waitClick(s);
    FX.burst(innerWidth / 2, innerHeight * 0.42, 26, { maxSp: 6 });
    await sleep(400);
  }

  async function sceneLock() {
    const s = scene("lock", "night");
    const cv = h("canvas", { class: "heart-canvas" });
    const icon = h("div", { class: "lock-icon" }, "🔒");
    const input = h("input", { class: "pw rv", style: "--d:.7s", inputmode: "numeric", placeholder: "dd/mm/yyyy", maxlength: "10", autocomplete: "off" });
    const msg = h("div", { class: "pw-msg" });
    s.append(
      h("div", { class: "heart-wrap rv" }, cv, icon),
      h("div", { class: "lock-title rv", style: "--d:.35s" }, C.passwordTitle),
      input, msg,
    );
    await show(s);
    const heart = FX.beatingHeart(cv);

    const want = C.password.split(/\D+/).map(Number);
    let wrong = 0;
    let resolve;
    const unlocked = new Promise((r) => (resolve = r));

    // nhập đủ 8 số là tự kiểm tra, đúng thì tự mở khóa
    input.addEventListener("input", () => {
      const d = input.value.replace(/\D/g, "").slice(0, 8);
      input.value = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
      msg.textContent = "";
      if (d.length === 8) check();
    });
    function check() {
      const got = input.value.split(/\D+/).filter(Boolean).map(Number);
      if (got.length === 3 && got.every((v, i) => v === want[i])) { input.blur(); return resolve(); }
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      msg.textContent = C.passwordWrong[Math.min(wrong, C.passwordWrong.length - 1)];
      clearStickers();
      sticker({ sticker: "sob", bubble: "sai ròi huhu", dur: 2600 });
      wrong++;
      if (navigator.vibrate) navigator.vibrate(120);
    }

    await unlocked;
    playMusic(); // phòng khi chưa phát được (mở khóa luôn là lúc Nu đã chạm vào trang)
    preloadAll();
    icon.textContent = "🔓";
    icon.style.transform = "translate(-50%,-54%) scale(1.6)";
    heart.explode();
    for (let i = 0; i < 4; i++) setTimeout(() => FX.burst(...center(cv), 16, { maxSp: 6 }), i * 120);
    msg.textContent = "💗";
    await sleep(1300);
  }

  // đồng hồ cát: cát bầu trên rút xuống, chảy qua cổ, bầu dưới dâng lên → lật 180° → lặp lại.
  // Lúc lật, cát bầu dưới trượt về phía cổ để khớp đúng trạng thái bầu trên lúc bắt đầu (vòng lặp không giật)
  function hourglass() {
    const top = "M22 14 C22 50, 46 58, 47 70 L53 70 C54 58, 78 50, 78 14 Z";
    const bot = "M47 70 C46 82, 22 90, 22 126 L78 126 C78 90, 54 82, 53 70 Z";
    const wrap = h("div", { class: "hourglass" });
    wrap.innerHTML = `
      <svg viewBox="0 0 100 140" aria-hidden="true">
        <defs>
          <clipPath id="hg-top"><path d="${top}"/></clipPath>
          <clipPath id="hg-bot"><path d="${bot}"/></clipPath>
          <linearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#f4a96a"/></linearGradient>
        </defs>
        <g class="hg-body">
          <path d="${top} ${bot}" class="hg-glass"/>
          <g clip-path="url(#hg-top)"><rect class="hg-sand-top" x="0" y="34" width="100" height="36" fill="url(#hg-sand)"/></g>
          <g clip-path="url(#hg-bot)"><rect class="hg-sand-bot" x="0" y="90" width="100" height="36" fill="url(#hg-sand)"/></g>
          <line class="hg-stream" x1="50" y1="68" x2="50" y2="124"/>
          <path d="${top} ${bot}" class="hg-shine"/>
          <rect class="hg-cap" x="10" y="4" width="80" height="11" rx="4"/>
          <rect class="hg-cap" x="10" y="125" width="80" height="11" rx="4"/>
        </g>
      </svg>`;
    return wrap;
  }

  async function sceneIntro() {
    setProgress(0.05);
    const s = scene("intro", "warm");
    const greet = h("p", { class: "lead" });
    const st = photoStack(C.intro.photos);
    const stackWrap = h("div", { class: "later", style: "width:100%" }, st.block);
    // ngày kỉ niệm to trên đầu, cùng kiểu với ngày ở các cột mốc
    const date = C.intro.date && h("div", { class: "ms-date intro-date rv" }, C.intro.date);
    s.append(...[date, greet, stackWrap].filter(Boolean));
    await show(s);
    await sleep(400);
    runFx(C.intro.greetingFx);
    await typeRich(greet, C.intro.greeting);
    stackWrap.classList.add("on");
    st.start();
    await st.done;

    // "Đi liền" / "Ai thèmmmmm"
    setProgress(0.1);
    const s2 = scene("question", "warm");
    const q = h("p", { class: "lead" });
    const yes = h("button", { class: "btn pulse" }, C.intro.yes + " 💕");
    const no = h("button", { class: "btn ghost" }, C.intro.no);
    const row = h("div", { class: "btn-row later" }, yes, no);
    s2.append(h("div", { class: "rv", style: "margin-bottom:16px" }, hourglass()), q, row);
    await show(s2);
    await sleep(300);
    await typeRich(q, C.intro.question);
    row.classList.add("on");
    makeRunaway(no, C.intro.noDodge, [yes, q]);
    await waitClick(yes);
    FX.burst(...center(yes), 24, { maxSp: 6 });
  }

  async function sceneMilestones() {
    const list = C.milestones;
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      setProgress(0.12 + (0.48 * i) / list.length);
      const s = scene("milestone", "warm");
      s.append(h("div", { class: "ms-head" },
        h("div", { class: "ms-date rv" }, m.date),
        richStatic(h("div", { class: "ms-title rv", style: "--d:.35s" }), m.title, 1100),
      ));

      let done, start = () => {};
      if (m.route) {
        // bản đồ chuyến bay: ảnh ở điểm đi → máy bay bay → ảnh ở điểm đến
        const f = flightBlock(m);
        s.append(h("div", { class: "rv", style: "--d:.4s;width:100%" }, f.el));
        let resolveDone;
        done = new Promise((r) => (resolveDone = r));
        start = () => f.play().then(resolveDone);
      } else if (m.photos?.length) {
        const st = photoStack(m.photos);
        s.append(h("div", { class: "rv", style: "--d:.5s;width:100%" }, st.block));
        done = st.done;
        start = st.start;
      } else {
        done = sleep(2500);
      }

      const fact = m.fact ? richStatic(h("div", { class: "fact later" }), m.fact, 3700) : null;
      if (fact) s.append(fact);
      await show(s);
      runFx(m.fx);
      start();
      if (fact) {
        setTimeout(() => {
          fact.classList.add("on");
          runFx(m.factFx);
          s.scrollTo({ top: s.scrollHeight, behavior: "smooth" });
        }, 3200);
      }
      await done;
    }
  }

  // bản đồ chuyến bay: ảnh 1 bật ra cạnh điểm đi → máy bay bay theo đường cong (mũi quay theo hướng bay,
  // vệt bay vẽ dần) → hạ cánh thì ảnh 2 bật ra cạnh điểm đến
  function flightBlock(m) {
    const { from, to, vehicle = "✈️" } = m.route;
    const [p1, p2] = m.photos || [];
    const A = [58, 70], B = [242, 430];
    const d = `M${A} C 110 180, 190 320, ${B}`; // đường chéo giữa 2 tấm ảnh (ảnh 1 góc trên phải, ảnh 2 góc dưới trái)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 300 500");
    svg.innerHTML = `
      <path class="path-bg" d="${d}"/>
      <path class="trail" d="${d}"/>
      <circle cx="${A[0]}" cy="${A[1]}" r="7" fill="#e0577f"/><circle class="ping" cx="${A[0]}" cy="${A[1]}" r="14" fill="#e0577f" opacity=".2"/>
      <circle cx="${B[0]}" cy="${B[1]}" r="7" fill="#e0577f"/><circle class="ping" cx="${B[0]}" cy="${B[1]}" r="14" fill="#e0577f" opacity=".2"/>
      <text class="city" x="${A[0]}" y="${A[1] - 24}" text-anchor="middle">${from}</text>
      <text class="city" x="${B[0]}" y="${B[1] + 38}" text-anchor="middle">${to}</text>
      <text class="plane" text-anchor="middle" dominant-baseline="middle">${vehicle}</text>`;
    const trail = svg.querySelector(".trail");
    const plane = svg.querySelector(".plane");

    const stop = (p, cls) => {
      if (!p) return null;
      const cap = h("div", { class: "fl-cap" });
      const el = h("div", { class: `fl-stop ${cls}` }, h("div", { class: "fl-photo" }, img(photoPath(p.src))), cap);
      return Object.assign(el, { _cap: cap, _p: p });
    };
    const s1 = stop(p1, "from"), s2 = stop(p2, "to");
    const next = nextButton("Tiếp nè");
    const el = h("div", { class: "flight-wrap" }, h("div", { class: "flight" }, svg, s1, s2), next);

    const showStop = async (st) => {
      if (!st) return;
      st.classList.add("on");
      FX.burst(...center(st), 12);
      runFx(st._p.fx);
      for (const line of st._p.caption || []) {
        const p = h("p");
        st._cap.append(p);
        await revealWords(p, line, 80);
      }
    };
    // đặt máy bay tại vị trí e (0 → 1) trên đường bay, mũi quay theo hướng bay (emoji ✈️ vốn chúc lên góc phải 45°)
    const len = () => trail.getTotalLength();
    const place = (e) => {
      const L = len(), at = L * e;
      const p = trail.getPointAtLength(at), q = trail.getPointAtLength(Math.min(L, at + 1));
      const pr = trail.getPointAtLength(Math.max(0, at - 1));
      const ang = (Math.atan2(q.y - pr.y, q.x - pr.x) * 180) / Math.PI + 45;
      const size = 1 + Math.sin(Math.PI * e) * 0.45; // bay lên cao thì to ra, hạ cánh nhỏ lại
      plane.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang}) scale(${size})`);
      trail.style.strokeDasharray = L;
      trail.style.strokeDashoffset = L - at;
    };
    const fly = () => new Promise((resolve) => {
      const t0 = performance.now(), dur = 4200;
      const step = () => {
        if (!el.isConnected) return resolve();
        const k = Math.min(1, (performance.now() - t0) / dur);
        place(k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
        if (k >= 1) return resolve();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    const play = async () => {
      place(0);
      await sleep(700);
      await showStop(s1);
      await sleep(700);
      await fly();
      const r = svg.getBoundingClientRect();
      FX.burst(r.left + r.width * (B[0] / 300), r.top + r.height * (B[1] / 500), 20, { maxSp: 5 });
      next.classList.add("on"); // hiện nút trước để sticker chọn chỗ không đè lên nút
      const shown = showStop(s2);
      await sleep(250); // ảnh 2 bung ra xong rồi sticker mới tìm chỗ trống
      runFx(m.arriveFx);
      await shown;
      await autoNext(next, 6000);
    };
    return { el, play };
  }

  async function sceneConfession() {
    setProgress(0.62);
    const s = scene("confess", "dusk");
    const title = h("h2", { class: "c-title" });
    const divider = h("div", { class: "c-divider" }, h("span"), "♡", h("span"));
    const lines = C.confession.map(() => h("p", { class: "c-line" }));
    s.append(h("div", { class: "c-head" }, h("div", { class: "moon rv" }, "🌙"), title, divider), h("div", { class: "c-body" }, ...lines));
    await show(s);
    await sleep(700);
    await typeRich(title, C.confessionTitle, 110);
    divider.classList.add("on");
    await sleep(1200);
    for (let i = 0; i < lines.length; i++) {
      const { text, fx } = C.confession[i];
      lines[i].classList.add("on");
      runFx(fx);
      lines[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      const fxEnd = Math.max(0, ...[].concat(fx || []).map((f) => f.at || 0));
      await Promise.all([revealWords(lines[i], text, 120), sleep(fxEnd + 1200)]);
      await sleep(1800);
    }
    s.scrollTo({ top: s.scrollHeight, behavior: "smooth" });
    // không có nút: chờ Nu đọc xong đoạn cuối rồi tự chuyển, hoặc Nu chạm màn hình thì chuyển luôn
    await Promise.race([sleep(6000), waitClick(s)]);
  }

  async function sceneMontage() {
    setProgress(0.72);
    // "Và rồi..."
    const s1 = scene("andthen", "film");
    const word = C.andThen.replace(/\.+$/, "");
    s1.append(h("div", { class: "and-then rv" }, word, h("span", {}, "."), h("span", {}, "."), h("span", {}, ".")));
    await show(s1);
    // ảnh dồn dập đã tải từ đầu; mạng chậm thì nán thêm ở "Và rồi..." (tối đa 8s) cho ảnh về đủ
    const montageReady = Promise.all(montagePaths().map(preloadOne));
    await Promise.all([Promise.race([sleep(2800), waitClick(s1)]), Promise.race([montageReady, sleep(8000)])]);

    // ~30 ảnh hiện liên tục
    const s = scene("montage", "film");
    const wall = h("div", { class: "wall" }, h("div", { class: "dim" }));
    const text = h("div", { class: "m-text" });
    s.append(wall, text);
    await show(s);
    // dòng chữ hiện ngay khi vào cảnh, ảnh trôi vào phía sau
    text.classList.add("on");
    richStatic(text, C.montageText, 900);

    const paths = montagePaths();
    // rải ảnh phủ kín màn hình: chia lưới, mỗi ô 1 ảnh (lệch ngẫu nhiên), xáo thứ tự; hết lưới thì rải thêm lớp lệch nửa ô
    const W = innerWidth, H = innerHeight;
    const pw = Math.min(W * 0.6, 320), ph = pw * 1.25;
    const cols = Math.max(2, Math.ceil(W / (pw * 0.72))), rows = Math.max(3, Math.ceil(H / (ph * 0.68)));
    const spots = [];
    for (let layer = 0; spots.length < paths.length - 1; layer++) {
      const off = layer % 2 ? 0.5 : 0;
      const cells = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells.push([((c + 0.5 + off) / cols) * W + rand(-pw, pw) * 0.15, ((r + 0.5 + off) / rows) * H + rand(-ph, ph) * 0.15]);
      cells.sort(() => Math.random() - 0.5);
      spots.push(...cells);
    }
    // từng tấm trượt nhẹ từ mép màn hình gần nhất vào chỗ của nó, cho tới khi phủ kín màn hình
    const slideIn = (el, x, y, r, duration) => {
      const edges = [
        [x, -x - pw], // từ trái
        [W - x, W - x + pw], // từ phải
        [y, -y - ph], // từ trên
        [H - y, H - y + ph], // từ dưới
      ];
      const k = edges.reduce((best, e, idx) => (e[0] < edges[best][0] ? idx : best), 0);
      const dx = k === 0 ? edges[0][1] : k === 1 ? edges[1][1] : rand(-40, 40);
      const dy = k === 2 ? edges[2][1] : k === 3 ? edges[3][1] : rand(-40, 40);
      el.animate(
        [
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${r * 2.2}deg)`, opacity: 0.6 },
          { transform: `translate(-50%, -50%) rotate(${r}deg)`, opacity: 1 },
        ],
        { duration, easing: "cubic-bezier(.16,.8,.25,1)", fill: "backwards" },
      );
    };
    // nhịp: nhanh dần đều từ tấm đầu tới tấm cuối (khoảng cách giữa 2 tấm giảm đều 530ms → 100ms)
    const pace = (i) => {
      const t = i / Math.max(1, paths.length - 2); // 0 → 1
      return { delay: Math.round(530 - 430 * t), duration: Math.round(800 - 370 * t) };
    };
    for (let i = 0; i < paths.length; i++) {
      const last = i === paths.length - 1;
      // tấm cuối cùng trượt từ dưới lên đúng giữa màn hình và dừng hình ở đó
      const [x, y] = last ? [W / 2, H * 0.44] : spots[i];
      const r = last ? -2 : rand(-14, 14);
      const el = h("div", {
        class: "m-photo slide" + (last ? " last" : ""),
        style: `left:${x}px;top:${y}px;--r:${r.toFixed(1)}deg;z-index:${last ? 100 : i + 1}`,
      }, cachedImg(paths[i]));
      wall.append(el);
      const { delay, duration } = pace(i);
      slideIn(el, x, y, r, last ? 1600 : duration);
      if (i === 14) FX.rain("💗", 6);
      setProgress(0.72 + (0.12 * i) / paths.length);
      if (last) s.classList.add("final");
      await sleep(last ? 1900 : delay);
    }
    runFx([{ fireworks: 2 }, { sticker: "love", at: 400 }]);
    // dừng hình một nhịp rồi tấm ảnh cuối bay vào bì thư (xem sceneLetter)
    await Promise.race([sleep(4200), waitClick(s)]);
    montageLast = wall.querySelector(".m-photo.last");
  }

  // tấm ảnh cuối của montage, để cảnh bức thư cho nó bay vào bì thư
  let montageLast = null;

  // nối 2 cảnh: tấm ảnh bay tới miệng bì thư, thu nhỏ, rồi trượt hẳn vào túi bì
  // (ảnh được chuyển vào giữa lá thư và mặt trước bì → mặt trước che ảnh thật sự, không cắt ảnh bằng clip)
  async function tuckIntoEnvelope(carrier, env) {
    await sleep(1300); // đợi bì thư trồi lên xong
    const c = carrier.getBoundingClientRect();
    const e = env.getBoundingClientRect();
    const front = env.querySelector(".e-front");
    const mouth = front.getBoundingClientRect().top; // miệng túi: mép trên mặt trước bì
    const sc = (e.width * 0.56) / c.width;
    const hh = c.height * sc;
    const dx = e.left + e.width / 2 - (c.left + c.width / 2);
    const dy = mouth + 6 - hh / 2 - (c.top + c.height / 2); // đáy ảnh vừa chạm miệng túi
    // a) ảnh nhấc bổng bay lên, nghiêng nhẹ và nhỏ dần, rồi lượn tới lơ lửng ngay trên miệng túi
    const lift = Math.min(110, innerHeight * 0.13);
    const hover = `translate(${dx}px,${dy - 46}px) rotate(4deg) scale(${sc})`;
    await carrier.animate(
      [
        { transform: "translate(0px,0px) rotate(-2deg) scale(1)", easing: "cubic-bezier(.3,.1,.3,1)" },
        { transform: `translate(${dx * 0.35}px,${-lift}px) rotate(-8deg) scale(${(1 + sc) / 2})`, offset: 0.42, easing: "cubic-bezier(.45,0,.3,1)" },
        { transform: hover },
      ],
      { duration: 1500, fill: "forwards" },
    ).finished;

    // túi bì: lớp nằm sau mặt trước, chỉ cắt phần lọt xuống dưới đáy bì; giữ nguyên vị trí ảnh trên màn hình khi chuyển lớp
    const pocket = h("div", { class: "e-pocket" });
    env.insertBefore(pocket, front);
    const p = pocket.getBoundingClientRect();
    Object.assign(carrier.style, {
      position: "absolute", zIndex: "auto",
      left: parseFloat(carrier.style.left) - p.left + "px", top: parseFloat(carrier.style.top) - p.top + "px",
    });
    pocket.append(carrier);
    // b) rồi lao xuống, nhanh dần, xuyên qua miệng túi vào hẳn trong bì
    await carrier.animate(
      [{ transform: hover }, { transform: `translate(${dx}px,${dy + hh + 10}px) rotate(0deg) scale(${sc * 0.92})` }],
      { duration: 750, easing: "cubic-bezier(.55,0,.8,.45)", fill: "forwards" },
    ).finished;
    pocket.remove();
    env.classList.add("gulp");
    FX.burst(e.left + e.width / 2, e.top, 18, { maxSp: 4.5 });
    await sleep(500);
  }

  async function sceneLetter() {
    setProgress(0.86);
    const s = scene("envelope-scene", "paper");
    const strip = h("div", { class: "e-strip" }, h("span", { class: "e-cut" }, "✂️"));
    // lá thư trong bì: tờ giấy vở trống trơn, chữ chỉ gõ ra sau khi đã lấy thư ra
    const letter = h("div", { class: "e-letter ruled" });
    const env = h("div", { class: "env2" },
      h("div", { class: "e-back" }),
      letter,
      h("div", { class: "e-front" }, h("div", { class: "e-stamp" }, "💌"), h("div", { class: "e-to" }, "To: Nu iu của Húi"), h("div", { class: "e-seal" }, "❤")),
      strip);
    // bàn tay hướng dẫn: lướt ngang qua đường xé, sau đó lướt lên trên lá thư
    const guide = h("div", { class: "guide-hand gx" }, h("span", { class: "trail" }), h("span", { class: "finger" }, "👆"));
    env.append(guide);
    const hintText = h("span", {}, "vuốt ngang mép trên để xé bì thư");
    const hand = h("span", { class: "hand" }, "👆");
    s.append(
      h("div", { class: "lead rv", style: "font-family:var(--script);font-size:34px;color:var(--rose-deep)" }, "Thư cho Nu"),
      h("div", { class: "rv", style: "--d:.2s" }, env),
      h("div", { class: "swipe-hint rv", style: "--d:.8s;margin-top:30px" }, hand, hintText),
    );

    // tấm ảnh cuối của montage tách ra, nằm đè lên trên trong lúc chuyển cảnh rồi bay vào bì thư
    let carrier = null;
    if (montageLast?.isConnected) {
      montageLast.getAnimations().forEach((a) => a.finish()); // chắc chắn ảnh đã nằm yên giữa màn hình trước khi đo
      const r = montageLast.getBoundingClientRect();
      const w = montageLast.offsetWidth, hh = montageLast.offsetHeight;
      carrier = h("div", { class: "carrier" }, montageLast.querySelector("img").cloneNode());
      Object.assign(carrier.style, { left: r.left + r.width / 2 - w / 2 + "px", top: r.top + r.height / 2 - hh / 2 + "px", width: w + "px", height: hh + "px" });
      document.body.append(carrier);
      montageLast.style.visibility = "hidden";
      guide.classList.add("hide");
    }
    montageLast = null;
    await show(s);
    if (carrier) {
      await tuckIntoEnvelope(carrier, env);
      guide.classList.remove("hide");
    }

    // 1) vuốt ngang để xé mép trên: phần đã xé biến mất theo đường răng cưa, vụn giấy bay ra
    const tearClip = (p, d) => {
      const x = p * 100;
      const jag = [];
      for (let i = 0; i <= 8; i++) {
        const xx = (d > 0 ? x : 100 - x) + (i % 2 ? 2.2 : -2.2);
        jag.push(`${xx.toFixed(1)}% ${(i / 8) * 100}%`);
      }
      return d > 0 ? `polygon(${jag.join(",")},100% 100%,100% 0%)` : `polygon(0% 0%,${jag.join(",")},0% 100%)`;
    };
    let torn = false;
    await new Promise((resolve) => {
      let active = false, x0 = 0, d = 0, prog = 0, lastBit = 0;
      env.addEventListener("pointerdown", (e) => {
        if (torn) return;
        active = true;
        x0 = e.clientX;
        guide.classList.add("hide");
        try { env.setPointerCapture(e.pointerId); } catch {}
      });
      env.addEventListener("pointermove", (e) => {
        if (!active || torn) return;
        if (!d) { if (Math.abs(e.clientX - x0) < 6) return; d = e.clientX > x0 ? 1 : -1; }
        const r = env.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, d > 0 ? (e.clientX - r.left) / r.width : (r.right - e.clientX) / r.width));
        if (p <= prog) return;
        prog = p;
        strip.style.clipPath = strip.style.webkitClipPath = tearClip(prog, d);
        if (performance.now() - lastBit > 50) {
          lastBit = performance.now();
          FX.burst(e.clientX, r.top + r.height * 0.12, 3, { kind: "rect", colors: ["#fffaf2", "#f9cad0", "#eaa7b2"], minS: 5, maxS: 10, maxSp: 2.5, up: 0.6, g: 0.12 });
        }
        if (prog > 0.9) {
          torn = true;
          active = false;
          strip.style.transition = "transform .7s ease-in, opacity .7s";
          strip.style.transform = `translate(${d * 60}px,-40px) rotate(${-d * 14}deg)`;
          strip.style.opacity = "0";
          resolve();
        }
      });
      const stop = () => {
        active = false;
        if (!torn) guide.classList.remove("hide");
      };
      env.addEventListener("pointerup", stop);
      env.addEventListener("pointercancel", stop);
    });
    FX.burst(...center(env), 16, { maxSp: 5 });
    guide.className = "guide-hand gy";
    letter.classList.add("peek");
    hand.classList.add("up");
    hintText.textContent = "vuốt lên để lấy thư ra";

    // 2) vuốt lên để rút thư ra
    await new Promise((resolve) => {
      let y0 = null, dy = 0;
      env.addEventListener("pointerdown", (e) => {
        y0 = e.clientY;
        dy = 0;
        letter.classList.remove("peek");
        guide.classList.add("hide");
        letter.style.transition = "none";
        try { env.setPointerCapture(e.pointerId); } catch {}
      });
      env.addEventListener("pointermove", (e) => {
        if (y0 == null) return;
        dy = Math.min(0, e.clientY - y0);
        letter.style.transform = `translateY(${dy}px)`;
      });
      const up = () => {
        if (y0 == null) return;
        y0 = null;
        if (-dy > letter.offsetHeight * 0.3) { guide.remove(); resolve(); return; }
        letter.style.transition = "";
        letter.style.transform = "";
        letter.classList.add("peek");
        guide.classList.remove("hide");
      };
      env.addEventListener("pointerup", up);
      env.addEventListener("pointercancel", up);
    });

    // 3) lá thư bay hẳn ra khỏi bì (tờ giấy trắng tinh), bì thư rơi xuống khỏi màn hình,
    //    tờ giấy tự phóng to thành trang thư vừa màn hình, rồi chữ mới lần lượt gõ ra
    const paper = h("div", { class: "paper ruled" });
    const items = [];
    // mỗi dòng: lớp chữ đầy đủ (ẩn, để giữ đúng kích thước giấy) + lớp gõ chữ chồng lên trên
    const addLine = (cls, text, speed) => {
      const typed = h("div", { class: "typed" });
      paper.append(h("div", { class: cls }, richStatic(h("div", { class: "full" }), text, null), typed));
      items.push([typed, text, speed]);
    };
    addLine("greet", C.letter.greeting, 80);
    for (const line of C.letter.lines) {
      if (line) addLine("l", line, 58);
      else { paper.append(h("div", { class: "gap" })); items.push(null); } // null = hết đoạn, nghỉ lâu hơn chút
    }
    addLine("sign", C.letter.sign + " ♡", 110);

    const yes = h("button", { class: "btn pulse" }, C.letter.yes + " 💍");
    const no = h("button", { class: "btn ghost tiny-no", style: "padding:5px 9px;font-size:10px" }, C.letter.no);
    const row = h("div", { class: "btn-row later", style: "margin-bottom:20px" }, yes, no);

    // tờ giấy trắng thay chỗ lá thư, vọt lên khỏi miệng bì
    const lr = letter.getBoundingClientRect();
    const sheet = h("div", { class: "sheet ruled" });
    Object.assign(sheet.style, { left: lr.left + "px", top: lr.top + "px", width: lr.width + "px", height: lr.height + "px" });
    document.body.append(sheet);
    letter.style.visibility = "hidden";
    // bì thư tách ra, rơi thẳng xuống khỏi màn hình; tiêu đề và gợi ý mờ đi
    const er = env.getBoundingClientRect();
    Object.assign(env.style, { position: "fixed", left: er.left + "px", top: er.top + "px", width: er.width + "px", margin: 0, zIndex: 20 });
    document.body.append(env);
    [...s.children].forEach((c) => c.classList.add("fade-out"));
    const lift = Math.max(0, Math.min(lr.height * 0.55, lr.top - 24));
    const rise = sheet.animate(
      [{ transform: "none" }, { transform: `translateY(${-lift}px) rotate(-3deg)` }],
      { duration: 700, easing: "cubic-bezier(.2,.9,.3,1)", fill: "forwards" },
    );
    await sleep(180);
    env.animate(
      [{ transform: "none", opacity: 1 }, { transform: `translateY(${innerHeight - er.top + 40}px) rotate(9deg)`, opacity: 1 }],
      { duration: 900, easing: "cubic-bezier(.55,0,.85,.35)", fill: "forwards" },
    ).finished.then(() => env.remove());
    await rise.finished;
    FX.burst(...center(sheet), 18, { maxSp: 4.5 });

    // dựng sẵn trang thư (ẩn) để biết kích thước đích, rồi tờ giấy phóng to khớp vào đó
    [...s.children].forEach((c) => c.classList.add("gone"));
    s.classList.add("letter-scene");
    s.append(paper, row);
    s.scrollTop = 0;
    paper.style.animation = "none";
    paper.style.opacity = "0";
    const to = paper.getBoundingClientRect();
    const cur = sheet.getBoundingClientRect();
    rise.cancel();
    Object.assign(sheet.style, { left: cur.left + "px", top: cur.top + "px", width: cur.width + "px", height: cur.height + "px" });
    const toH = Math.min(to.height, innerHeight - to.top - 14);
    await sheet.animate(
      [
        { left: cur.left + "px", top: cur.top + "px", width: cur.width + "px", height: cur.height + "px", transform: "rotate(-3deg)" },
        { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: toH + "px", transform: "none" },
      ],
      { duration: 1000, easing: "cubic-bezier(.3,.8,.25,1)", fill: "forwards" },
    ).finished;
    paper.style.opacity = "";
    await sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).finished;
    sheet.remove();
    await sleep(300);

    // gõ chậm cho sâu lắng: mỗi dòng nghỉ một nhịp, hết đoạn (dòng trống) nghỉ lâu hơn một xíu
    for (const it of items) {
      if (!it) { await sleep(550); continue; }
      const [typed, text, speed] = it;
      const r = typed.getBoundingClientRect();
      if (r.bottom > innerHeight * 0.7) s.scrollBy({ top: r.bottom - innerHeight * 0.55, behavior: "smooth" });
      await typeRich(typed, text, speed);
      await sleep(450);
    }
    row.classList.add("on");
    await sleep(100);
    s.scrollTo({ top: s.scrollHeight, behavior: "smooth" });

    let scale = 1;
    no.addEventListener("click", () => {
      scale /= 2;
      no.style.transform = `scale(${scale})`;
      if (scale === 0.5) sticker({ sticker: "pleading", bubble: "đừng mà", dur: 2500 });
      if (scale < 0.04) { no.style.opacity = "0"; no.style.pointerEvents = "none"; }
    });
    await waitClick(yes);
  }

  async function sceneYay() {
    setProgress(0.94);
    const s = scene("yay-scene", "night");
    const cv = h("canvas", { class: "heart-canvas" });
    const word = h("div", { class: "yay" }, ...Array.from(C.yay).map((ch, i) => h("span", { style: `--i:${i}` }, ch)));
    const hint = h("div", { class: "tap-hint later" }, "còn nữa nè ♥");
    s.append(cv, word, hint);
    await show(s);
    const heart = FX.beatingHeart(cv, { scale: 1.05, romantic: true });
    FX.confetti(40);
    runFx([{ sticker: "party" }, { sticker: "love", at: 700 }, { rain: "🎉", n: 10, at: 400 }]);
    const fw = setInterval(() => FX.firework(rand(40, innerWidth - 40), rand(70, innerHeight * 0.45)), 950);
    await Promise.race([sleep(2500), waitClick(s)]);
    hint.classList.add("on");
    await Promise.race([sleep(3500), waitClick(s)]);
    clearInterval(fw);
    setTimeout(() => FX.removeHeart(heart), 1200);
  }

  // Nu vừa tới màn nhận quà → gửi email báo Húi qua Web3Forms (Húi tự nhắn mã cho Nu).
  // Lần nào vào màn quà cũng gửi (kể cả tải lại trang). Xem thử bằng ?from=... thì tiêu đề email có chữ [Thử].
  function notifyArrival() {
    const key = CFG.web3formsKey;
    if (!key) return console.warn("Chưa điền CONFIG.web3formsKey trong js/content.js — không gửi email báo.");
    const test = new URLSearchParams(location.search).has("from");
    const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: key,
        subject: `${test ? "[Thử] " : ""}🎁 Nu đã tới màn nhận quà! (${time})`,
        from_name: "Nu & Húi 💗",
        message: `Nu vừa vào màn nhận quà lúc ${time}${test ? " (đang xem thử)" : ""}.\n\nGửi mã cho Nu liền đi nè: ${C.gift.code}`,
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => { if (!data.success) console.warn("[notify]", data.message || data.body?.message || data); })
      .catch((err) => console.warn("[notify]", err));
  }

  async function sceneGift() {
    setProgress(1);
    const g = C.gift;
    const s = scene("gift-scene", "warm");
    const text = h("p", { class: "lead" });
    const box = h("div", { class: "gift-box later" }, h("div", { class: "box" }), h("div", { class: "lid" }, h("div", { class: "bow" }, "🎀")));
    const input = h("input", { class: "gift-input", placeholder: g.placeholder, autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    const getBtn = h("button", { class: "btn pulse" }, g.button + " 💌");
    const form = h("div", { class: "gift-form later" }, input, getBtn);
    const reveal = h("div", { class: "gift-reveal" });
    const footer = h("div", { class: "footer-note later" }, g.footer);
    s.append(text, box, form, reveal, footer);
    notifyArrival();
    await show(s);
    await sleep(400);
    runFx(g.textFx);
    await typeRich(text, g.text);
    box.classList.add("on");
    await sleep(400);
    form.classList.add("on");

    // Húi đã được báo qua email từ lúc Nu vào màn này; nút chỉ trấn an Nu đợi tin nhắn
    getBtn.addEventListener("click", () => {
      getBtn.disabled = true;
      toast(g.sentToast, 4000);
      sticker({ sticker: "kiss", bubble: "đợi xíu nha", dur: 3000 });
      getBtn.textContent = "Đợi xíu nha ✓";
      setTimeout(() => { getBtn.disabled = false; getBtn.textContent = g.button + " 💌"; }, 15000);
    });

    const norm = (v) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/\s+/g, "").toLowerCase();
    await new Promise((resolve) => {
      const check = (strict) => {
        if (norm(input.value) === norm(g.code)) return resolve();
        if (strict) { input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake"); }
      };
      input.addEventListener("input", () => check(false));
      input.addEventListener("keydown", (e) => e.key === "Enter" && check(true));
    });

    input.blur();
    form.style.transition = "opacity .5s, transform .5s";
    form.style.opacity = "0";
    form.style.transform = "scale(.9)";
    setTimeout(() => form.classList.add("gone"), 500);
    box.classList.add("open");
    const [bx, by] = center(box);
    for (let i = 0; i < 5; i++) setTimeout(() => FX.burst(bx, by - 40, 18, { maxSp: 7, up: 3 }), i * 140);
    FX.confetti(50);
    runFx(g.revealFx);
    await sleep(900);
    await typeRich(reveal, g.reveal, 60);
    footer.classList.add("on");
    setInterval(() => FX.burst(rand(30, innerWidth - 30), rand(innerHeight * 0.5, innerHeight - 60), 6, { minS: 6, maxS: 12 }), 1600);
  }

  /* ---------------- Run ---------------- */
  const STEPS = [
    ["start", sceneStart],
    ["lock", sceneLock],
    ["intro", sceneIntro],
    ["milestones", sceneMilestones],
    ["confession", sceneConfession],
    ["montage", sceneMontage],
    ["letter", sceneLetter],
    ["yay", sceneYay],
    ["gift", sceneGift],
  ];
  async function main() {
    // xem thử 1 đoạn: index.html?from=letter
    const from = new URLSearchParams(location.search).get("from");
    const start = Math.max(0, STEPS.findIndex((s) => s[0] === from));
    startMusicOnFirstTouch(); // nhạc nền chạy từ lúc vào trang, lặp lại khi hết bài
    preloadAll(); // tải sẵn mọi ảnh ngay từ đầu
    for (let i = start; i < STEPS.length; i++) await STEPS[i][1]();
  }
  main();
})();
