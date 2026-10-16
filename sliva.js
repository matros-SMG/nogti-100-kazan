// Стиль «Слива»: подбор оттенка и формы, запись в мессенджер, фото крупно.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const wa = body.dataset.wa, tg = body.dataset.tg;

  // ---------- ногти: форма = контур, оттенок = заливка ----------
  const SHAPES = {
    "Овал": "M8 92 V40 C8 14 18 2 30 2 C42 2 52 14 52 40 V92 Q52 104 30 104 Q8 104 8 92 Z",
    "Миндаль": "M8 92 V48 C8 26 20 8 30 0 C40 8 52 26 52 48 V92 Q52 104 30 104 Q8 104 8 92 Z",
    "Квадрат": "M8 92 V12 Q8 4 16 4 H44 Q52 4 52 12 V92 Q52 104 30 104 Q8 104 8 92 Z",
    "Стилет": "M8 92 V56 C8 34 22 14 30 -14 C38 14 52 34 52 56 V92 Q52 104 30 104 Q8 104 8 92 Z"
  };
  const pick = { shade: null, shape: null };
  const nails = $$(".nails svg");
  const nowShade = $("[data-now-shade]"), nowShape = $("[data-now-shape]");
  // кисть (как в оригинале «Сливы»): новый цвет ложится по ноготку от основания к кончику, по очереди на каждом
  const brushTo = (n, i, p, p2, fill) => {
    const r = n.querySelector("clipPath rect");
    const tok = (n._tok = (n._tok || 0) + 1);
    p2.style.fill = fill;
    const t0 = performance.now() + i * 60, dur = 650;
    const step = (now) => {
      if (n._tok !== tok) return;
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, h = 128 * e;
      r.setAttribute("y", 106 - h); r.setAttribute("height", h);
      if (k < 1) requestAnimationFrame(step);
      else { p.style.fill = fill; r.setAttribute("height", 0); r.setAttribute("y", 106); }
    };
    requestAnimationFrame(step);
  };
  const paint = (brush) => {
    nails.forEach((n, i) => {
      const [p, p2] = n.querySelectorAll(".plate");
      p.setAttribute("d", SHAPES[pick.shape]);
      if (p2) p2.setAttribute("d", SHAPES[pick.shape]);
      if (brush && p2) brushTo(n, i, p, p2, pick.hex); else p.style.fill = pick.hex;
      const sh = n.querySelector(".shine");
      if (sh) sh.setAttribute("d", SHAPES[pick.shape]);
      n.querySelector(".gloss").setAttribute("d", pick.shape === "Квадрат" ? "M16 16 Q16 10 22 10 L22 58 Q16 58 16 52 Z" : "M17 46 C17 30 22 20 26 16 L24 60 Q17 60 17 54 Z");
    });
    if (nowShade) nowShade.textContent = pick.shade;
    if (nowShape) nowShape.textContent = pick.shape.toLowerCase();
  };
  $$(".swatch").forEach((b) => b.addEventListener("click", () => {
    $$(".swatch").forEach((x) => x.setAttribute("aria-pressed", x === b));
    pick.shade = b.dataset.name; pick.hex = b.dataset.hex; paint(true);
  }));
  // веер: пока до блока не докрутили, ноготки сложены в центре, потом разъезжаются
  const fan = $(".nails");
  if (fan && "IntersectionObserver" in window) {
    fan.classList.add("pre");
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setTimeout(() => fan.classList.remove("pre"), 150); io.disconnect(); }
    }, { threshold: .4 });
    io.observe(fan);
  }
  $$(".shape").forEach((b) => b.addEventListener("click", () => {
    $$(".shape").forEach((x) => x.setAttribute("aria-pressed", x === b));
    pick.shape = b.dataset.shape; paint();
  }));
  const s0 = $(".swatch[aria-pressed=true]"), f0 = $(".shape[aria-pressed=true]");
  if (s0 && f0) { pick.shade = s0.dataset.name; pick.hex = s0.dataset.hex; pick.shape = f0.dataset.shape; paint(); }
  let withShade = false;
  const pickGo = $("[data-pick-go]");
  if (pickGo) pickGo.addEventListener("click", () => { withShade = true; update(); });

  // ---------- запись: услуга, день, время → готовое сообщение ----------
  const form = $(".form");
  const bubble = $("[data-bubble]");
  const tpl = form ? form.dataset.message : "";
  const daysBox = $("[data-days]"), timesBox = $("[data-times]");
  const RU_D = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], RU_M = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const chip = (name, value, text, checked) => `<label class="opt"><input type="radio" name="${name}" value="${value}"${checked ? " checked" : ""}><span>${text}</span></label>`;
  const days = [];
  if (daysBox) {
    const n = +daysBox.dataset.n || 7, now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      const label = i === 0 ? "сегодня" : i === 1 ? "завтра" : `${RU_D[d.getDay()]}, ${d.getDate()} ${RU_M[d.getMonth()]}`;
      days.push({ d, label, msg: i === 0 ? "сегодня" : i === 1 ? "завтра" : `${d.getDate()} ${RU_M[d.getMonth()]}` });
    }
    daysBox.innerHTML = days.map((x, i) => chip("day", i, x.label[0].toUpperCase() + x.label.slice(1), i === 1)).join("");
  }
  const slots = timesBox ? timesBox.dataset.slots.split(",") : [];
  const drawTimes = () => {
    if (!timesBox) return;
    const di = +($("input[name=day]:checked") || {}).value || 0;
    const now = new Date(), prev = ($("input[name=time]:checked") || {}).value;
    let first = true;
    timesBox.innerHTML = slots.map((t) => {
      const [h, m] = t.split(":").map(Number);
      const past = di === 0 && (h * 60 + m) <= now.getHours() * 60 + now.getMinutes() + 30;
      if (past) return "";
      const on = prev ? prev === t : first; first = false;
      return chip("time", t, t, on);
    }).join("") || `<p class="form__note">На сегодня свободное время закончилось – выберите другой день.</p>`;
    if (!$("input[name=time]:checked") && $("input[name=time]")) $("input[name=time]").checked = true;
  };
  const text = () => {
    const svc = $("input[name=svc]:checked"), di = $("input[name=day]:checked"), tm = $("input[name=time]:checked");
    let t = tpl.replace("{услуга}", svc ? svc.dataset.name.toLowerCase() : "")
      .replace("{день}", di ? days[+di.value].msg : "")
      .replace("{время}", tm ? tm.value : "");
    if (!tm) t = t.replace(/ в $|\s+в\s*\.$/, ".");
    if (withShade && pick.shade) t = t.replace(/\.$/, `. Оттенок – ${pick.shade.toLowerCase()}, форма – ${pick.shape.toLowerCase()}.`);
    return t;
  };
  function update() {
    if (!form) return;
    bubble.textContent = text();
    const enc = encodeURIComponent(bubble.textContent);
    $$("[data-msg=wa]").forEach((a) => a.href = `https://wa.me/${wa}?text=${enc}`);
  }
  if (form) {
    form.addEventListener("change", (e) => { if (e.target.name === "day") drawTimes(); update(); });
    drawTimes(); update();
  }
  // Telegram не принимает готовый текст по ссылке – копируем его, потом открываем чат
  $$("[data-msg=tg]").forEach((a) => a.addEventListener("click", () => {
    const t = bubble ? bubble.textContent : "";
    if (t && navigator.clipboard) navigator.clipboard.writeText(t).then(() => { const n = $("[data-copied]"); if (n) n.hidden = false; }).catch(() => {});
  }));

  // ---------- фото крупно: нажатие – открыть, ещё нажатие на фото – приблизить в 2,2 раза и вести мышкой или пальцем ----------
  const figs = $$(".work"), lb = $(".lb");
  if (figs.length && lb && lb.showModal) {
    const fr = $(".lb__frame", lb), im = $(".lb__img", lb), cap = $(".lb__cap", lb);
    const touch = matchMedia("(hover: none)").matches;
    let i = 0;
    const unzoom = () => fr.classList.remove("is-zoom");
    const aim = (x, y) => { const r = fr.getBoundingClientRect(); im.style.transformOrigin = Math.min(100, Math.max(0, (x - r.left) / r.width * 100)) + "% " + Math.min(100, Math.max(0, (y - r.top) / r.height * 100)) + "%"; };
    const show = (n) => {
      unzoom(); i = (n + figs.length) % figs.length;
      const src = $("img", figs[i]); im.src = src.src; im.alt = src.alt;
      cap.textContent = $("figcaption", figs[i]).textContent;
      const hint = document.createElement("small");
      hint.textContent = touch ? "Нажмите на фото, чтобы приблизить" : "Нажмите на фото, чтобы приблизить, и ведите мышкой";
      cap.append(hint);
    };
    figs.forEach((f, n) => {
      const open = () => { show(n); lb.showModal(); };
      f.addEventListener("click", open);
      f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    fr.addEventListener("click", (e) => { e.stopPropagation(); aim(e.clientX, e.clientY); fr.classList.toggle("is-zoom"); });
    fr.addEventListener("mousemove", (e) => { if (fr.classList.contains("is-zoom")) aim(e.clientX, e.clientY); });
    $(".lb__x", lb).onclick = () => lb.close();
    $(".lb__prev", lb).onclick = () => show(i - 1);
    $(".lb__next", lb).onclick = () => show(i + 1);
    lb.addEventListener("close", unzoom);
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb__in")) lb.close(); });
    lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(i - 1); if (e.key === "ArrowRight") show(i + 1); });
    let x0 = null;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchmove", (e) => { if (fr.classList.contains("is-zoom")) { e.preventDefault(); aim(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    lb.addEventListener("touchend", (e) => { if (x0 === null || fr.classList.contains("is-zoom")) { x0 = null; return; } const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
  }
})();
