/* Lee una captura de un horario semanal: OCR (Tesseract.js) + análisis de la rejilla. */
(function (root) {
  'use strict';
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  const DAY_RE = /^(dill|dima|dime|dijo|dive|lune|mart|mier|juev|vier|mond|tues|wedn|thur|frid|mon$|tue$|wed$|thu$|fri$)/;
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const hm = (t) => { const m = /^(\d{1,2})[:.](\d{2})$/.exec(t); return m ? String(+m[1]).padStart(2, '0') + ':' + m[2] : null; };
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const addMin = (t, n) => { const m = +t.slice(0, 2) * 60 + +t.slice(3) + n; return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function clean(tokens) {
    const t = tokens.map((w) => (/^[Il1|]{2,3}$/.test(w) ? w.replace(/./g, 'I') : w)).join(' ').replace(/[^A-Za-z0-9À-ÿ.\- ]/g, '').replace(/\s+/g, ' ').trim();
    return t.length > 26 ? t.slice(0, 26).trim() : t;
  }
  const TIME_RE = /^(\d{1,2})[:.hH](\d{2})(?:[-–—](\d{1,2})[:.hH](\d{2}))?$/;
  const DAY_FULL = /^(dill|dima|dime|dijo|dive|lune|mart|mier|juev|vier|mond|tues|wedn|thur|frid)/;
  const DAY_SHORT = ['lun', 'mar', 'mie', 'jue', 'vie', 'mon', 'tue', 'wed', 'thu', 'fri', 'dl', 'dt', 'dc', 'dj', 'dv'];
  const DIDX = [[/^(dill|lune|mond|mon$|lun$|dl$|di$|dl$)/, 0], [/^(dima|mart|tues|tue$|mar$|dt$)/, 1], [/^(dime|mier|wedn|wed$|mie$|dc$|de$)/, 2], [/^(dijo|juev|thur|thu$|jue$|dj$)/, 3], [/^(dive|vier|frid|fri$|vie$|dv$|dy$)/, 4]];
  const dayIdx = (t) => { const n = norm(t); if (n.length < 2) return -1; for (const [re, i] of DIDX) if (re.test(n)) return i; return -1; };
  const isDay = (t) => dayIdx(t) >= 0;
  const hm2 = (h, m) => String(+h).padStart(2, '0') + ':' + m;
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  const colored = (p) => Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) > 22;
  const isTimeLine = (t) => t.split(/\s+/).every((x) => TIME_RE.test(x) || /^[-–—]+$/.test(x));
  /** words: [{t,x,y,w,h,c?}] en píxeles. sample(x,y) -> [r,g,b] de la imagen original. */
  function analyze(words, sample, W, H) {
    words = words.filter((w) => w.c == null || w.c >= 35);
    // 1) días (cabecera)
    const heads = words.filter((w) => w.y < H * 0.45 && dayIdx(w.t) >= 0).map((w) => ({ i: dayIdx(w.t), cx: w.x + w.w / 2, y: w.y, h: w.h })).sort((a, b) => a.cx - b.cx);
    let bestG = [], bestN = 0; heads.forEach((h) => { const g = heads.filter((o) => Math.abs(o.y - h.y) < Math.max(h.h, o.h)), n = new Set(g.map((o) => o.i)).size; if (n > bestN || (n === bestN && g.length < bestG.length)) { bestN = n; bestG = g; } });
    const seen = {}; const hs = bestG.filter((h) => (seen[h.i] ? false : (seen[h.i] = true)));
    let cols = [], d0 = 0;
    if (hs.length >= 2) {
      const ps = []; for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) if (hs[j].i > hs[i].i) ps.push((hs[j].cx - hs[i].cx) / (hs[j].i - hs[i].i));
      const pitch = median(ps), org = median(hs.map((h) => h.cx - h.i * pitch)), y = median(hs.map((h) => h.y)), hh = median(hs.map((h) => h.h));
      const imin = Math.min.apply(null, hs.map((h) => h.i)), imax = Math.max.apply(null, hs.map((h) => h.i)), four = hs.length >= 4; if (four) d0 = imin; // con 4 o más cabeceras reconocidas, solo esos días
      if (pitch > W * 0.05) for (let i = four ? imin : 0; i <= (four ? imax : 4); i++) cols.push({ cx: org + i * pitch, y, h: hh });
    } else if (hs.length === 1) {
      const h = hs[0], p = (W * 0.99 - h.cx) / (4.5 - h.i); if (p > W * 0.05 && h.cx - h.i * p - p / 2 > 0) for (let i = 0; i < 5; i++) cols.push({ cx: h.cx + (i - h.i) * p, y: h.y, h: h.h });
    }
    if (cols.length < 4) return { ok: false, error: 'No encuentro los días de la semana (lunes a viernes) en la imagen.' };
    const cx = cols.map((c) => c.cx), colw = median(cx.slice(1).map((v, i) => v - cx[i])), left0 = cx[0] - colw / 2, hb = Math.max.apply(null, cols.map((c) => c.y + c.h)) + 2;
    // 2) horas (columna izquierda)
    const limit = left0 + colw * 0.12;
    const labels = words.filter((w) => TIME_RE.test(w.t) && w.x + w.w / 2 < limit && w.y > hb - 10).map((w) => { const m = TIME_RE.exec(w.t); return { t: hm2(m[1], m[2]), e: m[3] ? hm2(m[3], m[4]) : null, cy: w.y + w.h / 2 }; }).sort((a, b) => a.cy - b.cy);
    // 3) líneas de texto por columna
    const body = words.filter((w) => w.y > hb && !TIME_RE.test(w.t) || (w.y > hb && w.x + w.w / 2 >= limit && TIME_RE.test(w.t)));
    const colLines = cols.map(() => []), mh = median(body.map((w) => w.h));
    body.forEach((w) => { const c = Math.floor((w.x + w.w / 2 - left0) / colw); if (c >= 0 && c < cols.length) colLines[c].push(w); });
    colLines.forEach((ws, c) => {
      ws.sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2)); const lines = [];
      ws.forEach((w) => { const cy = w.y + w.h / 2, l = lines[lines.length - 1]; if (l && Math.abs(cy - l.cy) < Math.max(w.h, l.h) * 0.55) { l.ws.push(w); l.cy = (l.cy * (l.ws.length - 1) + cy) / l.ws.length; l.h = Math.max(l.h, w.h); } else lines.push({ cy, h: w.h, ws: [w] }); });
      colLines[c] = lines.map((l) => { l.ws.sort((a, b) => a.x - b.x); l.text = clean(l.ws.map((w) => w.t)); l.raw = l.ws.map((w) => w.t).join(' '); l.alnum = (l.text.match(/[A-Za-z0-9À-ÿ]/g) || []).length; l.room = /^(aula|sala|room|lab)?\s*[A-Za-z]{0,5}[-. ]?\d{1,3}[A-Za-z]?$/i.test(l.text); return l; }).filter((l) => l.alnum >= 2 && !isTimeLine(l.raw));
    });
    // las líneas pequeñas (profesor, aula) no son títulos: se descartan por altura de letra
    const allH = [].concat.apply([], colLines.map((ls) => ls.map((l) => l.h))).sort((a, b) => a - b), ref = allH[Math.floor(allH.length * 0.8)] || 0;
    if (false && ref) colLines.forEach((ls, c) => { colLines[c] = ls.filter((l) => l.h >= ref * 0.8); });
    // 4) extensión vertical de cada bloque (color / líneas)
    const px = [0.06, 0.2, 0.5, 0.8, 0.94], blocks = [], edges = [];
    const cont = (c, y, col) => { let n = 0; for (const p of px) { const s = sample(Math.round(cx[c] - colw / 2 + colw * p), y); if (s && dist(s, col) <= 36) n++; } return n >= 3; };
    const hline = (c, y, col) => { let n = 0, t = 0; for (let q = 0.04; q < 0.97; q += 0.06) { t++; const x = Math.round(cx[c] - colw / 2 + colw * q); let hit = false; for (let d = -1; d <= 1 && !hit; d++) { const s = sample(x, y + d); if (s && dist(s, col) > 24) hit = true; } if (hit) n++; } return n >= t * 0.8; };
    for (let c = 0; c < cols.length; c++) {
      const lines = colLines[c], cov = new Array(lines.length).fill(false);
      for (let i = 0; i < lines.length; i++) {
        if (cov[i]) continue;
        const l = lines[i], y0 = Math.round(l.cy), cs = px.map((p) => sample(Math.round(cx[c] - colw / 2 + colw * p), y0)).filter(Boolean);
        let col = cs[0] || [255, 255, 255]; for (const a of cs) { if (cs.filter((b) => dist(a, b) <= 20).length >= 2) { col = a; break; } }
        const isCol = colored(col);
        let yt = y0, yb = y0, hitLim = false, txtOnly = false;
        if (isCol) {
          const gap = 2; // tolera la línea fina entre dos horas de un mismo bloque
          let m = 0, y = yt; while (y - 1 > hb && m <= gap) { y--; if (cont(c, y, col)) { yt = y; m = 0; } else m++; }
          m = 0; y = yb; while (y + 1 < H - 1 && m <= gap) { y++; if (cont(c, y, col)) { yb = y; m = 0; } else m++; }
          if (yb >= H - 3) hitLim = true;
        }
        else {
          let k = i; while (lines[k + 1] && lines[k + 1].cy - lines[k].cy < Math.max(lines[k].h, lines[k + 1].h) * 2.1) k++; yt = Math.round(l.cy - l.h); yb = Math.round(lines[k].cy + lines[k].h * 0.9);
          // bordes de la rejilla: baja/sube hasta la primera línea horizontal, sin pasar del texto vecino
          const nx = lines[k + 1] ? Math.round(lines[k + 1].cy - lines[k + 1].h) : H - 2, pv = i > 0 ? Math.round(lines[i - 1].cy + lines[i - 1].h) : hb;
          let y = yb, bd = false; while (y < nx && !hline(c, y, col)) y++; if (y < nx) { yb = y; bd = true; }
          y = yt; while (y > Math.max(pv, hb) && !hline(c, y, col)) y--; if (y > Math.max(pv, hb)) { yt = y; bd = true; }
          txtOnly = !bd;
        }
        const col2 = isCol;
        if (!col2 && yt <= hb + 2) yt = y0 - l.h;
        let title = l.text, j = i; // títulos largos en 2 líneas en mayúsculas
        if (/^[^a-z]*$/.test(l.text) && lines[i + 1] && !cov[i + 1] && lines[i + 1].cy - l.cy < l.h * 1.7 && /^[^a-z]*$/.test(lines[i + 1].text) && Math.abs(lines[i + 1].h - l.h) < l.h * 0.25) { title += ' ' + lines[i + 1].text; }
        lines.forEach((x, k) => { if (x.cy >= yt - 2 && x.cy <= yb + 2) cov[k] = true; }); cov[i] = true;
        blocks.push({ c, yt, yb, title: title.length > 26 ? title.slice(0, 26).trim() : title, colored: col2, txt: txtOnly, sec: !!l.room }); edges.push(yt, yb);
      }
    }
    if (!blocks.length) return { ok: false, error: 'No he encontrado clases en la tabla.' };
    // 5) filas
    let rows = [], guessed = false, rh = 0;
    if (labels.length >= 2) {
      const gaps = labels.slice(1).map((l, i) => l.cy - labels[i].cy), mx = Math.max.apply(null, gaps); rh = median(gaps.filter((g) => g > mx * 0.7));
      const starts = []; labels.forEach((l) => { const p = starts[starts.length - 1]; if (p && !p.e && !l.e && l.cy - p.cy < rh * 0.6) { p.e = l.t; p.ecy = l.cy; } else starts.push({ t: l.t, e: l.e, cy: l.cy }); });
      const fit = (tops) => edges.reduce((s, e) => s + Math.min.apply(null, tops.map((t) => Math.min(Math.abs(e - t), Math.abs(e - t - rh)))), 0);
      const t0 = starts.map((s) => (s.ecy ? (s.cy + s.ecy) / 2 : s.cy) - rh / 2), t1 = starts.map((s) => s.cy);
      const tops = fit(t0) <= fit(t1) ? t0 : t1;
      rows = starts.map((s, i) => ({ s: s.t, e: s.e || (starts[i + 1] && mins(starts[i + 1].t) - mins(s.t) <= 75 && mins(starts[i + 1].t) > mins(s.t) ? starts[i + 1].t : addMin(s.t, 60)), top: tops[i], bot: tops[i] + rh }));
    } else {
      guessed = true; const ys = edges.slice().sort((a, b) => a - b), tp = []; ys.forEach((y) => { if (!tp.length || y - tp[tp.length - 1] > 6) tp.push(y); });
      const df = tp.slice(1).map((v, i) => v - tp[i]).filter((d) => d > 12), mn = Math.min.apply(null, df.length ? df : [60]); rh = median(df.filter((d) => d <= mn * 1.3)) || mn;
      for (let i = 0; i + 1 < tp.length; i++) { const k = Math.max(1, Math.round((tp[i + 1] - tp[i]) / rh)); for (let j = 0; j < k; j++) { const a = tp[i] + (tp[i + 1] - tp[i]) * j / k; rows.push({ top: a, bot: a + (tp[i + 1] - tp[i]) / k }); } }
      rows.forEach((r, i) => { r.s = addMin('08:00', i * 60); r.e = addMin('08:00', i * 60 + 60); });
    }
    if (rows.length > 16 && !guessed) { rows = []; guessed = true; const ys = edges.slice().sort((a, b) => a - b), tp = []; ys.forEach((y) => { if (!tp.length || y - tp[tp.length - 1] > 6) tp.push(y); }); const df = tp.slice(1).map((v, i) => v - tp[i]).filter((d) => d > 12); rh = median(df) || 60; for (let i = 0; i + 1 < tp.length; i++) { const k = Math.max(1, Math.round((tp[i + 1] - tp[i]) / rh)); for (let j = 0; j < k; j++) { const a = tp[i] + (tp[i + 1] - tp[i]) * j / k; rows.push({ top: a, bot: a + (tp[i + 1] - tp[i]) / k }); } } rows.forEach((r, i) => { r.s = addMin('08:00', i * 60); r.e = addMin('08:00', i * 60 + 60); }); }
    if (rows.length > 20) return { ok: false, error: 'No he podido separar las horas de la tabla.' };
    if (rows.length < 2) return { ok: false, error: 'No he podido separar las horas de la tabla.' };
    const out = {}, titles = [], claimed = {};
    blocks.sort((a, b) => a.yt - b.yt).forEach((b) => {
      const idx = []; rows.forEach((r, i) => { const ov = Math.min(b.yb, r.bot) - Math.max(b.yt, r.top); if (ov >= (r.bot - r.top) * 0.45) idx.push(i); });
      if (b.txt) { const cy = (b.yt + b.yb) / 2; let bi = 0, bd = 1e9; rows.forEach((r, i) => { const d = Math.abs((r.top + r.bot) / 2 - cy); if (d < bd) { bd = d; bi = i; } }); const rr = rows[bi]; idx.length = 0; idx.push(bi); const off = cy - (rr.top + rr.bot) / 2; if (Math.abs(off) > (rr.bot - rr.top) * 0.28) idx.push(off > 0 ? bi + 1 : bi - 1); idx.sort((a, b) => a - b); if (idx[0] < 0 || idx[idx.length - 1] >= rows.length) { idx.length = 0; idx.push(bi); } }
      if (!idx.length) { const cy = (b.yt + b.yb) / 2; let bi = 0, bd = 1e9; rows.forEach((r, i) => { const d = Math.abs((r.top + r.bot) / 2 - cy); if (d < bd) { bd = d; bi = i; } }); idx.push(bi); }
      const cl = (claimed[b.c] = claimed[b.c] || {});
      if (b.sec && !cl[idx[0]]) return; // un código de aula nunca es una asignatura
      if (cl[idx[0]]) { // texto secundario (profesor, aula) de un bloque ya contado: solo puede alargarlo
        const pb = cl[idx[0]]; idx.forEach((i) => { if (!cl[i] && i === pb.r0 + pb.n) { cl[i] = pb; pb.n++; } }); return;
      }
      let tt = b.title.replace(/\s+(?:aula\s*)?(?:[A-Za-z]{0,2}[.\-]?\d{1,3}[A-Za-z]?|A\.?S)$/i, '').trim(); if (tt.length < 2) tt = b.title;
      const ent = { subject: tt, r0: idx[0], n: idx.length }; idx.forEach((i) => { cl[i] = ent; });
      (out[b.c + 1 + d0] = out[b.c + 1 + d0] || []).push(ent); titles.push(b.title);
    });
    const subjects = []; Object.keys(out).forEach((d) => out[d].forEach((b) => { if (!subjects.some((s) => s.toLowerCase() === b.subject.toLowerCase())) subjects.push(b.subject); }));
    Object.keys(out).forEach((d) => out[d].forEach((b) => { b.subject = subjects.find((s) => s.toLowerCase() === b.subject.toLowerCase()); }));
    for (let d = 1; d <= 5; d++) out[d] = out[d] || [];
    return { ok: true, rows: rows.map((r) => ({ s: r.s, e: r.e })), blocks: out, subjects, guessed, dbg: { hb, limit, left0, nw: words.length, body: body.filter((w) => w.y < 250).map((w) => [w.t, w.x, w.y]), raw: blocks, rows, cols: cx, colw, lines: colLines.map((ls) => ls.map((l) => [l.text, Math.round(l.cy), l.h])) } };
  }

  /** Copia en grises con el texto fino y claro (horas) reforzado: sube mucho la tasa de acierto del OCR. */
  function darken(cv) {
    const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
    const x2 = c2.getContext('2d', { willReadFrequently: true }); x2.drawImage(cv, 0, 0);
    const im = x2.getImageData(0, 0, c2.width, c2.height), d = im.data, n = d.length / 4, g = new Uint8Array(n), h = new Uint32Array(256);
    for (let i = 0; i < n; i++) { const v = (299 * d[i * 4] + 587 * d[i * 4 + 1] + 114 * d[i * 4 + 2]) / 1000 | 0; g[i] = v; h[v]++; }
    let sum = 0; for (let i = 0; i < n; i++) sum += g[i]; if (sum / n < 110) { for (let i = 0; i < n; i++) { g[i] = 255 - g[i]; } h.fill(0); for (let i = 0; i < n; i++) h[g[i]]++; }
    const cut = n * 0.01; let lo = 0, hi = 255, a = 0;
    for (; lo < 255; lo++) { a += h[lo]; if (a > cut) break; } a = 0;
    for (; hi > 0; hi--) { a += h[hi]; if (a > cut) break; }
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < n; i++) { let v = Math.max(0, Math.min(255, (g[i] - lo) * 255 / span)); v = v < 150 ? 0 : v < 255 ? (v - 150) * 255 / 105 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; }
    x2.putImageData(im, 0, 0); return c2;
  }
  /** ¿Lectura floja? (pocas clases para el tamaño de la tabla) -> conviene otra pasada de OCR */
  function weak(r) { if (!r.ok) return true; let n = 0; for (const d in r.blocks) n += r.blocks[d].length; return n < r.rows.length * 5 * 0.5; }
  /** Variantes de imagen para el OCR: A realce de texto fino, B grises tal cual, C solo texto casi blanco (sobre color). */
  function variant(cv, kind) {
    if (kind === 'A') return darken(cv);
    const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
    const x2 = c2.getContext('2d', { willReadFrequently: true }); x2.drawImage(cv, 0, 0);
    const im = x2.getImageData(0, 0, c2.width, c2.height), d = im.data, n = d.length / 4, g = new Uint8Array(n); let sum = 0;
    for (let i = 0; i < n; i++) { g[i] = (299 * d[i * 4] + 587 * d[i * 4 + 1] + 114 * d[i * 4 + 2]) / 1000 | 0; sum += g[i]; }
    const inv = kind === 'B' && sum / n < 110;
    if (kind === 'D') { if (sum / n < 110) return null; for (let i = 0; i < n; i++) { const v = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) < 90 ? 0 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; } x2.putImageData(im, 0, 0); return c2; }
    for (let i = 0; i < n; i++) { let v = g[i]; if (kind === 'C') v = v >= 200 ? 0 : 255; else if (inv) v = 255 - v; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; }
    x2.putImageData(im, 0, 0); return c2;
  }
  let tessP = null;
  function loadTess() {
    if (root.Tesseract) return Promise.resolve();
    return tessP || (tessP = new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = ok; s.onerror = () => { tessP = null; ko(new Error('net')); }; document.head.appendChild(s); }));
  }
  /** Lee un archivo de imagen. onProgress(0..1, texto). */
  async function read(file, onProgress) {
    onProgress(0, 'Cargando el lector…');
    await loadTess();
    const bmp = await createImageBitmap(file), sc = Math.min(2, 1800 / bmp.width), cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    const w = await root.Tesseract.createWorker('eng', 1, { logger: (m) => { if (m.status === 'recognizing text') onProgress(0.2 + m.progress * 0.8, 'Leyendo tu horario…'); else if (m.progress != null && /load|init/.test(m.status)) onProgress(m.progress * 0.2, 'Preparando el lector (solo la primera vez)…'); } });
    try {
      await w.setParameters({ tessedit_pageseg_mode: '11' });
      const ocr = async (img) => {
        const r = await w.recognize(img, {}, { blocks: true });
        let ws = r.data.words;
        if (!ws) { ws = []; (r.data.blocks || []).forEach((bk) => (bk.paragraphs || []).forEach((p) => (p.lines || []).forEach((l) => (l.words || []).forEach((x) => ws.push(x))))); }
        return ws.filter((x) => x.text && x.text.trim()).map((x) => ({ t: x.text.trim(), x: x.bbox.x0, y: x.bbox.y0, w: x.bbox.x1 - x.bbox.x0, h: x.bbox.y1 - x.bbox.y0, c: x.confidence }));
      };
      const full = ctx.getImageData(0, 0, cv.width, cv.height).data, sample = (x, y) => { if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return null; const i = (y * cv.width + x) * 4; return [full[i], full[i + 1], full[i + 2]]; };
      let words = await ocr(variant(cv, 'A')), res = analyze(words, sample, cv.width, cv.height);
      for (const k of ['B', 'D', 'C']) { if (!weak(res)) break; const v = variant(cv, k); if (!v) continue; onProgress(0.9, 'Afinando la lectura…'); words = merge(words, await ocr(v)); res = analyze(words, sample, cv.width, cv.height); }
      delete res.dbg;
      return Object.assign(res, { photo: URL.createObjectURL(file) });
    } finally { w.terminate(); }
  }
  /** Une dos lecturas OCR (A y B): si dos palabras se solapan se queda la de más confianza. */
  function merge(a, b) {
    const out = a.slice(), ok = (w) => (w.t.match(/[A-Za-z0-9À-ÿ]/g) || []).length >= 2 && w.h < w.w * 3 + 30;
    const iou = (p, q) => { const x = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), y = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y); if (x <= 0 || y <= 0) return 0; const i = x * y; return i / (p.w * p.h + q.w * q.h - i); };
    b.forEach((w) => {
      let k = -1, bi = 0.3;
      for (let i = 0; i < out.length; i++) { const v = iou(w, out[i]); if (v > bi) { bi = v; k = i; } }
      if (k < 0) out.push(w); else if (!ok(out[k]) || (w.c || 0) > (out[k].c || 0) + 10) out[k] = w;
    });
    return out;
  }
  const api = { analyze, read, merge, weak };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTShot = api;
})(typeof window !== 'undefined' ? window : globalThis);
