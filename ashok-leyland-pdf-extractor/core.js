'use strict';
/* SpecExtract Journey — core: router, page canvas, beats, quizzes, glossary tips, progress. */
(function () {
const SX = window.SX, SRC = window.SOURCES, GL = window.GLOSSARY, STATIONS = window.STATIONS, LABS = window.LABS;
/* Shared copies leave out the client pages (SX.withheld); only pages in SX.available have images and data. */
const hasPage = id => !SX.withheld || (SX.available || []).includes(id);
const WITHHELD_NOTE = 'This is a real Ashok Leyland page. It is not included in the shared copy of this course. Follow the README to rebuild the full version locally from the PDFs.';
const $ = (s, el = document) => el.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const NS = 'http://www.w3.org/2000/svg';

/* ---------- storage (works even when localStorage is blocked) ---------- */
const store = (() => {
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem('sxj') || '{}'); } catch (e) { mem = {}; }
  const save = () => { try { localStorage.setItem('sxj', JSON.stringify(mem)); } catch (e) { /* session only */ } };
  return {
    get: (k, d) => (k in mem ? mem[k] : d),
    set: (k, v) => { mem[k] = v; save(); },
    reset: () => { mem = {}; save(); },
  };
})();

/* ---------- tiny event bus (tasks listen to it) ---------- */
const handlers = [];
const on = fn => handlers.push(fn);
function emit(type, data) { handlers.slice().forEach(fn => { try { fn(type, data || {}); } catch (e) { console.error(e); } }); }

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.style.display = 'none'; }, 2200);
}

/* ---------- markup ---------- */
function termKey(k) { return GL[k] ? k : (window.GLOSSARY_ALIAS && window.GLOSSARY_ALIAS[k]) || k; }
function markup(s) {
  if (!s) return '';
  return String(s)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, k, txt) => {
      const key = termKey(k.trim());
      return `<span class="term" data-term="${esc(key)}" tabindex="0">${txt || (GL[key] ? GL[key].show || k : k)}</span>`;
    })
    .replace(/\{\{st:([\w-]+)(?:\|([^}]+))?\}\}/g, (m, id, txt) => {
      const st = STATIONS.find(s => s.id === id);
      return `<a href="#/s/${id}">${txt || (st ? `Station ${st.n}: ${st.title}` : id)}</a>`;
    })
    .replace(/\{\{lab:([\w-]+)(?:\|([^}]+))?\}\}/g, (m, id, txt) => `<a href="#/lab/${id}">${txt || (LABS[id] ? LABS[id].title : id)}</a>`)
    .replace(/\{\{code:(\w+)(?::([\w-]+))?(?:\|([^}]+))?\}\}/g, (m, f, a, txt) => `<a href="#/code/${f}${a ? '/' + a : ''}">${txt || SRC[f].path}</a>`)
    .replace(/\{\{page:([\w-]+)(?:@([\d,]+))?(?:\|([^}]+))?\}\}/g, (m, id, rows, txt) => `<a href="#" class="pagelink" data-lightbox="${id}"${rows ? ` data-focus="${rows}"` : ''}>📄 ${txt || pageLabel(id)}</a>`);
}
const DOCNAME = {smp: 'Practice form', t02: 'Table 02', t03: 'Table 03', t05: 'Table 05', t07: 'Table 07', t4e: 'Table 4E', t06: 'Table 06', t11: 'Table 11'};
function pageLabel(id) { const [d, n] = id.split('-'); return `${DOCNAME[d]} p.${Number(n)}`; }

/* glossary tooltip + click */
const tip = $('#tip');
document.addEventListener('mouseover', e => {
  const t = e.target.closest('.term'); if (!t) return;
  const g = GL[t.dataset.term]; if (!g) return;
  tip.innerHTML = `<b>${esc(g.show || t.dataset.term)}${g.f ? ` <span class="muted">· ${esc(g.f)}</span>` : ''}</b>${esc(g.d)}${g.why ? `<small>Why it matters: ${esc(g.why)}</small>` : ''}`;
  tip.style.display = 'block';
  const r = t.getBoundingClientRect();
  const w = Math.min(340, innerWidth - 20);
  tip.style.left = Math.max(10, Math.min(r.left, innerWidth - w - 10)) + 'px';
  tip.style.top = (r.bottom + 8 + 150 > innerHeight ? r.top - tip.offsetHeight - 8 : r.bottom + 8) + 'px';
});
document.addEventListener('mouseout', e => { if (e.target.closest('.term')) tip.style.display = 'none'; });
document.addEventListener('click', e => {
  const t = e.target.closest('.term');
  if (t) { tip.style.display = 'none'; location.hash = '#/glossary/' + encodeURIComponent(t.dataset.term); return; }
  const lb = e.target.closest('[data-lightbox]');
  if (lb && current && current.pv && lb.closest('.side')) { e.preventDefault(); showOnStage(lb.dataset.lightbox, lb.dataset.focus); return; }
  if (lb) { e.preventDefault(); lightbox(lb.dataset.lightbox); }
});

/* lightbox with ← → through a document's pages */
let lbId = null;
function lightbox(id) {
  lbId = id;
  const box = $('#lightbox'); box.style.display = 'flex';
  $('img', box).src = hasPage(id) ? `pages/${id}.jpg` : 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  if (!hasPage(id)) { $('div', box).textContent = `${pageLabel(id)}: ${WITHHELD_NOTE}`; return; }
  const [d, n] = id.split('-'); const count = SX.docs[d].pages.length;
  $('div', box).textContent = `${pageLabel(id)} of ${count} · ← → to move · Esc to close`;
}
$('#lightbox').addEventListener('click', () => { $('#lightbox').style.display = 'none'; lbId = null; });
document.addEventListener('keydown', e => {
  if (lbId) {
    const [d, n] = lbId.split('-'); const count = SX.docs[d].pages.length; let k = Number(n);
    if (e.key === 'Escape') { $('#lightbox').style.display = 'none'; lbId = null; }
    if (e.key === 'ArrowRight' && k < count) lightbox(`${d}-${String(k + 1).padStart(2, '0')}`);
    if (e.key === 'ArrowLeft' && k > 1) lightbox(`${d}-${String(k - 1).padStart(2, '0')}`);
    e.stopPropagation(); return;
  }
}, true);

/* ---------- code excerpts ---------- */
function findLine(file, find) {
  const lines = SRC[file].text.split('\n');
  const i = lines.findIndex(l => l.includes(find));
  if (i < 0) console.warn('anchor not found', file, find);
  return {lines, i: Math.max(0, i)};
}
function codeBlock(c) {
  const {lines, i} = findLine(c.src, c.find);
  const n = c.n || 6, from = i + (c.off || 0);
  const hl = new Set((c.hl || []).map(x => typeof x === 'number' ? from + x : lines.findIndex((l, j) => j >= from && j < from + n && l.includes(x))));
  let html = `<div class="code"><div class="cap"><span>${esc(SRC[c.src].path)} · line ${from + 1}</span><a href="#/code/${c.src}">open in Code reader →</a></div>`;
  for (let j = from; j < Math.min(lines.length, from + n); j++) html += `<div class="ln${hl.has(j) ? ' hl' : ''}"><i>${j + 1}</i>${esc(lines[j]) || ' '}</div>`;
  return html + '</div>';
}

/* ---------- quiz ---------- */
function quiz(el, items, key, onAllRight) {
  const saved = store.get('quiz', {});
  el.innerHTML = items.map((q, qi) => `<div class="q" data-q="${qi}"><b>Q${qi + 1}. ${markup(q.q)}</b><div class="opts">${q.o.map((o, oi) => `<button data-o="${oi}">${markup(o)}</button>`).join('')}</div><div class="fb"></div></div>`).join('');
  const done = new Set(saved[key] || []);
  const check = () => { if (done.size === items.length && onAllRight) onAllRight(); };
  el.querySelectorAll('.q').forEach(qel => {
    const qi = Number(qel.dataset.q), q = items[qi];
    const show = (oi) => {
      qel.querySelectorAll('button').forEach(b => b.classList.remove('right', 'wrong'));
      const b = qel.querySelector(`[data-o="${oi}"]`); const right = oi === q.a;
      b.classList.add(right ? 'right' : 'wrong');
      const fb = qel.querySelector('.fb'); fb.className = 'fb ' + (right ? 'good' : 'bad');
      fb.innerHTML = (right ? '✔ Right. ' : '✖ Not quite. ') + markup(q.why[oi]);
    };
    if (done.has(qi)) show(q.a);
    qel.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const oi = Number(b.dataset.o); show(oi);
      if (oi === q.a) { done.add(qi); const s = store.get('quiz', {}); s[key] = [...done]; store.set('quiz', s); check(); emit('quiz', {key, qi}); }
    }));
  });
  check();
}

/* ---------- PageView: the real page + overlay layers + row inspector ---------- */
const LAYERS = [
  ['ink', 'Words', '#7f8c99', 'Every word pdfplumber found, with its x/y box'],
  ['rules', 'Ruling lines', '#c98500', 'The drawn lines (edges) that make the grid'],
  ['cells', 'Cells', '#3987e5', 'Cells rebuilt from the lines; violet = merged'],
  ['roles', 'Row roles', '#199e70', 'What the engine decided each cell is'],
  ['valuex', 'Value boundary', '#d95926', 'value_x: where descriptions end and values begin'],
  ['images', 'Images', '#d03b3b', 'Embedded pictures (located, not read)'],
];
const ROLE = {code: ['#199e70', 'code'], desc: ['#3987e5', 'description'], value: ['#d95926', 'value'], rowlabel: ['#9085e9', 'row label'], dropped: ['#d03b3b', 'dropped (narrow spacer)'], cont: ['#c98500', 'continuation'], skip: ['#8a96a3', 'title / footer (skipped)']};

function specDoc(spec) { return spec.split('-')[0]; }
function specPage(spec) { return Number(spec.split('-')[1]); }
function pageSize(spec) {
  if (SX.specimens[spec]) return SX.specimens[spec].size;
  const d = SX.docs[specDoc(spec)]; return d.pages[specPage(spec) - 1].size;
}
function cellsIndex(sp) {
  return sp.tables.map(t => { const m = {}; t.cells.forEach(c => { m[c[0] + ',' + c[1]] = {row: c[0], col: c[1], rs: c[2], cs: c[3], text: c[4], bbox: c[5]}; }); return m; });
}

function PageView(host) {
  const st = {spec: null, layers: new Set(['cells']), focus: null, sel: null, tab: 'page', lockTabs: false};
  host.innerHTML = `<div class="stagebar"><div class="tabs" role="tablist"><button data-tab="page" class="on">Page</button><button data-tab="tree">Tree</button><button data-tab="json">JSON</button></div><span class="layerchips"></span><span class="specname"></span><button class="ghost show" data-reset title="Show the whole page">⤢ Whole page</button></div>
  <div class="canvas"><svg viewBox="0 0 595 842" preserveAspectRatio="xMidYMid meet"></svg><div class="hint">Click any row</div></div><div class="altview" hidden></div><div class="inspector"></div>`;
  const svg = $('svg', host), canvas = $('.canvas', host), alt = $('.altview', host), insp = $('.inspector', host);
  let idx = null, sp = null, vb = [0, 0, 595, 842], anim = null;

  host.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { setTab(b.dataset.tab); emit('tab', {tab: b.dataset.tab, spec: st.spec}); }));
  $('[data-reset]', host).addEventListener('click', () => { st.focus = null; zoom(); });

  function setTab(tab) {
    st.tab = tab;
    host.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    canvas.hidden = tab !== 'page'; alt.hidden = tab === 'page';
    $('.layerchips', host).style.display = tab === 'page' ? '' : 'none';
    if (tab === 'tree') renderTree(); if (tab === 'json') renderJSON();
  }
  function chips() {
    const el = $('.layerchips', host);
    if (!sp) { el.innerHTML = ''; return; }
    el.innerHTML = LAYERS.filter(l => l[0] !== 'images' || sp.images.length).map(l => `<span class="chip ${st.layers.has(l[0]) ? 'on' : ''}" data-l="${l[0]}" title="${esc(l[3])}"><i style="background:${l[2]}"></i>${l[1]}</span>`).join('');
    el.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      const l = c.dataset.l; st.layers.has(l) ? st.layers.delete(l) : st.layers.add(l);
      draw(); chips(); emit('layer', {layer: l, on: st.layers.has(l), spec: st.spec});
    }));
  }
  function rect(g, b, attrs) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', b[0]); r.setAttribute('y', b[1]); r.setAttribute('width', Math.max(.5, b[2] - b[0])); r.setAttribute('height', Math.max(.5, b[3] - b[1]));
    for (const k in attrs) r.setAttribute(k, attrs[k]);
    g.appendChild(r); return r;
  }
  function text(g, x, y, s, attrs) {
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.textContent = s;
    for (const k in attrs) t.setAttribute(k, attrs[k]); g.appendChild(t); return t;
  }
  function draw() {
    const [W, H] = pageSize(st.spec);
    svg.innerHTML = '';
    if (!hasPage(st.spec)) {
      svg.innerHTML = `<rect width="${W}" height="${H}" fill="#eef1f4" stroke="#c6ced6" stroke-width="2"/><text x="${W / 2}" y="${H / 2 - 30}" text-anchor="middle" font-size="22" font-weight="700" fill="#3a4a5a">${esc(pageLabel(st.spec))}</text><text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="15" fill="#5f6b78">Real Ashok Leyland page: not included in the shared copy.</text><text x="${W / 2}" y="${H / 2 + 24}" text-anchor="middle" font-size="15" fill="#5f6b78">The practice form shows the same rules: open it from any 📄 Practice form link.</text>`;
      return;
    }
    const im = document.createElementNS(NS, 'image');
    im.setAttribute('href', `pages/${st.spec}.jpg`); im.setAttribute('width', W); im.setAttribute('height', H);
    svg.appendChild(im);
    if (!sp) return;
    const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
    const L = st.layers;
    if (L.has('ink')) sp.words.forEach(w => rect(g, [w[1], w[2], w[3], w[4]], {fill: '#3987e514', stroke: '#6b7c8c', 'stroke-width': .35}));
    if (L.has('rules')) sp.lines.forEach(l => { const e = document.createElementNS(NS, 'line'); e.setAttribute('x1', l[0]); e.setAttribute('y1', l[1]); e.setAttribute('x2', l[2]); e.setAttribute('y2', l[3]); e.setAttribute('stroke', '#c98500'); e.setAttribute('stroke-width', 1.3); g.appendChild(e); });
    if (L.has('cells')) sp.tables.forEach((t, ti) => Object.values(idx[ti]).forEach(c => {
      const merged = c.rs > 1 || c.cs > 1;
      rect(g, c.bbox, {fill: merged ? '#9085e933' : 'none', stroke: t.role === 'footer' ? '#8a96a3' : '#3987e5', 'stroke-width': .9, 'stroke-dasharray': t.role === 'footer' ? '3 2' : ''});
    }));
    if (L.has('roles')) sp.traces.forEach((tr, ti) => {
      const cx = idx[ti];
      if (tr.role === 'footer') { const b = sp.tables[ti].bbox; rect(g, b, {fill: '#8a96a355'}); text(g, b[0] + 6, b[1] + 14, 'footer table · skipped', {fill: '#333', 'font-size': 10, 'font-weight': 700}); return; }
      tr.rows.forEach(r => {
        const paint = (keys, color, op) => (keys || []).forEach(k => { if (cx[k]) rect(g, cx[k].bbox, {fill: color, 'fill-opacity': op, stroke: color, 'stroke-width': .6}); });
        if (r.kind === 'title' || r.kind === 'footer-stop') paint(r.active, '#8a96a3', .35);
        else if (r.kind === 'continuation') (r.active || []).filter(k => cx[k] && cx[k].row === r.row).forEach(k => rect(g, cx[k].bbox, {fill: '#c98500', 'fill-opacity': .18, stroke: '#c98500', 'stroke-width': .9, 'stroke-dasharray': '3 2'}));
        else if (r.kind === 'record') {
          paint([r.code_cell].filter(Boolean), '#199e70', .32); paint([r.description], '#3987e5', .2);
          paint(r.values, '#d95926', .22); paint(r.row_labels, '#9085e9', .3); paint(r.narrow_dropped, '#d03b3b', .55);
        }
      });
    });
    if (L.has('valuex')) sp.traces.forEach((tr, ti) => {
      if (tr.value_x == null) return; const b = sp.tables[ti].bbox;
      const e = document.createElementNS(NS, 'line'); e.setAttribute('x1', tr.value_x); e.setAttribute('x2', tr.value_x); e.setAttribute('y1', b[1] - 6); e.setAttribute('y2', b[3] + 6);
      e.setAttribute('stroke', '#d95926'); e.setAttribute('stroke-width', 2); e.setAttribute('stroke-dasharray', '6 3'); g.appendChild(e);
      const lbl = text(g, tr.value_x + 3, b[1] - 8, `value_x = ${tr.value_x}`, {fill: '#d95926', 'font-size': 10, 'font-weight': 700});
      lbl.setAttribute('paint-order', 'stroke'); lbl.setAttribute('stroke', '#fff'); lbl.setAttribute('stroke-width', 3);
    });
    if (L.has('images')) sp.images.forEach(b => { rect(g, b, {fill: '#d03b3b18', stroke: '#d03b3b', 'stroke-width': 1.5, 'stroke-dasharray': '5 3'}); text(g, b[0] + 2, b[3] + 10, 'image · not transcribed', {fill: '#d03b3b', 'font-size': 9, 'font-weight': 700}); });
    if (st.sel) {
      const {ti, row} = st.sel, tr = sp.traces[ti], step = tr && tr.rows.find(r => r.row === row);
      if (step) (step.active || []).forEach(k => { const c = idx[ti][k]; if (c) rect(g, c.bbox, {fill: 'none', stroke: '#111', 'stroke-width': 2.2}); });
    }
  }
  function zoom() {
    const [W, H] = pageSize(st.spec);
    let target = [0, 0, W, H];
    if (st.focus) {
      let b = st.focus;
      if (b.rows && sp) { // union of the rows' active cells
        const ti = b.table || 0, bs = [];
        b.rows.forEach(r => { const s = sp.traces[ti].rows.find(x => x.row === r); (s ? s.active : []).forEach(k => idx[ti][k] && bs.push(idx[ti][k].bbox)); });
        if (bs.length) b = [Math.min(...bs.map(x => x[0])), Math.min(...bs.map(x => x[1])), Math.max(...bs.map(x => x[2])), Math.max(...bs.map(x => x[3]))];
      } else if (b.table != null && sp) b = sp.tables[b.table].bbox;
      if (Array.isArray(b)) { const p = 10; target = [b[0] - p, b[1] - p - 12, b[2] - b[0] + 2 * p, b[3] - b[1] + 2 * p + 12]; }
    }
    const from = vb.slice(), t0 = performance.now();
    cancelAnimationFrame(anim);
    const stepf = now => {
      const k = Math.min(1, (now - t0) / 380), e = 1 - Math.pow(1 - k, 3);
      vb = from.map((v, i) => v + (target[i] - v) * e);
      svg.setAttribute('viewBox', vb.join(' '));
      if (k < 1) anim = requestAnimationFrame(stepf);
    };
    anim = requestAnimationFrame(stepf);
  }
  function stepFor(ti, row) { return sp && sp.traces[ti] && sp.traces[ti].rows.find(r => r.row === row); }
  function field(recId) { return (SX.fields[specDoc(st.spec)] || []).find(f => f.id === recId); }
  function inspect() {
    if (!hasPage(st.spec)) { insp.innerHTML = `<span class="muted">${WITHHELD_NOTE}</span>`; return; }
    if (!sp) { insp.innerHTML = `<span class="muted">This page is shown as an image only. Open it from the <a href="#/atlas">Page atlas</a> to see what the extractor reported.</span>`; return; }
    if (!st.sel) { insp.innerHTML = `<span class="muted">Row inspector: click a row on the page (or a node in the Tree) to see exactly what the engine decided for it.</span>`; return; }
    const {ti, row} = st.sel, s = stepFor(ti, row), cx = idx[ti];
    if (!s) { insp.innerHTML = `<span class="muted">Row ${row} was never reached; the engine stopped earlier at the footer.</span>`; return; }
    const owners = [...new Set((s.active || []).map(k => cx[k] && cx[k].row).filter(r => r !== row && r != null))];
    const own = owners.length ? ` · ${owners.length ? `borrows merged cell(s) from row ${owners.join(', ')}` : ''}` : '';
    const head = (color, label) => `<span class="k" style="background:${color}">${label}</span>`;
    let html = `<div><b>${sp.tables[ti].id} · row ${row}</b> <span class="muted">(${(s.active || []).length} active cells${own})</span></div>`;
    if (s.kind === 'record') {
      const f = field(s.record);
      html += `<div style="margin-top:4px">${head(s.record_kind === 'section' ? '#9085e9' : '#199e70', s.record_kind)} → <b>${s.record}</b> · code <code>${esc(s.code || 'none')}</code>${s.code_raw && s.code_raw !== s.code ? ` <span class="muted">(printed “${esc(s.code_raw)}”)</span>` : ''}${s.section_reason ? ` <span class="why">· section because ${s.section_reason}</span>` : ''}${s.headers_set ? ` <span class="why">· sets column headers: ${s.headers_set.map(esc).join(', ')}</span>` : ''}</div>`;
      if (f) {
        html += `<div class="why" style="margin-top:3px">“${esc(f.desc.split('\n')[0].slice(0, 90))}”${f.parent ? ` · parent ${f.parent}` : ' · top level'}</div>`;
        html += `<div class="vals">${f.values.map(v => `<span class="val${v.inh ? ' inh' : ''}${v.t ? '' : ' blank'}">${v.rowl ? `<b>${esc(v.rowl)}</b>` : ''}${v.col ? `<b>${esc(v.col)}</b>` : ''}${v.t ? esc(v.t.split('\n')[0].slice(0, 60)) : 'empty cell'}${v.inh ? ' ↩' : ''}</span>`).join('') || '<span class="muted">no value cells</span>'}</div>`;
        if (s.narrow_dropped && s.narrow_dropped.length) html += `<div class="why" style="margin-top:4px">✖ dropped ${s.narrow_dropped.length} thin spacer cell(s): 6 pt wide or less, or empty and under 12 pt</div>`;
        if (s.headers_set) html += `<div class="why" style="margin-top:4px">🏷 these cells become the column headings for the rows below (${s.headers_why})</div>`;
      }
    } else if (s.kind === 'continuation') {
      html += `<div style="margin-top:4px">${head('#c98500', 'continuation')} attached to <b>${s.attached_to || '—'}</b> <span class="why">because ${s.why}</span>${s.expanded ? ` · adds values with row label <b>${esc(s.expanded.row_label || '—')}</b>` : ''}${s.heading_row ? ` · <b>heading row</b>: ${s.heading_row.map(esc).join(' | ')} become the column names for the rows below` : ''}</div>`;
    } else if (s.kind === 'title') html += `<div>${head('#8a96a3', 'title')} <span class="why">matches “Table N of AIS…”, skipped</span></div>`;
    else if (s.kind === 'footer-stop') html += `<div>${head('#8a96a3', 'footer')} <span class="why">signature block found inside the table; everything after it is ignored</span></div>`;
    else html += `<div>${head('#8a96a3', s.kind)}</div>`;
    insp.innerHTML = html;
  }
  function select(ti, row, quiet) {
    st.sel = {ti, row}; draw(); inspect();
    if (st.tab === 'tree') renderTree(); if (st.tab === 'json') renderJSON();
    const s = stepFor(ti, row);
    if (!quiet) emit('row', {spec: st.spec, ti, row, step: s, field: s && s.record ? field(s.record) : null});
  }
  svg.addEventListener('click', e => {
    if (!sp) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let best = null;
    sp.tables.forEach((t, ti) => Object.values(idx[ti]).forEach(c => {
      const b = c.bbox; if (p.x < b[0] || p.x > b[2] || p.y < b[1] || p.y > b[3]) return;
      const area = (b[2] - b[0]) * (b[3] - b[1]) * (c.rs > 1 ? 50 : 1);
      if (!best || area < best.area) best = {ti, row: c.row, area};
    }));
    if (best) select(best.ti, best.row);
  });
  function renderTree() {
    const d = specDoc(st.spec), n = specPage(st.spec), all = SX.fields[d];
    if (!all) { alt.innerHTML = '<p class="muted">No field list is bundled for this document.</p>'; return; }
    const fs = all.filter(f => f.page === n), ids = new Set(fs.map(f => f.id)), kids = {};
    fs.forEach(f => { const p = ids.has(f.parent) ? f.parent : 'root'; (kids[p] = kids[p] || []).push(f); });
    const selRec = st.sel && stepFor(st.sel.ti, st.sel.row);
    const node = f => `<li><a href="#" data-rec="${f.id}" style="${selRec && selRec.record === f.id ? 'background:#3987e544;border-radius:5px;' : ''}text-decoration:none;color:inherit"><code>${esc(f.code || '—')}</code> ${esc(f.desc.split('\n')[0].slice(0, 58))} <span class="muted">${f.kind === 'section' ? '§' : ''}${f.values.length ? '· ' + f.values.length + ' value' + (f.values.length > 1 ? 's' : '') : ''}</span></a>${kids[f.id] ? `<ul>${kids[f.id].map(node).join('')}</ul>` : ''}</li>`;
    const outside = fs.filter(f => f.parent && !ids.has(f.parent));
    alt.innerHTML = `<div class="small" style="margin-bottom:6px">Hierarchy built by <code>_hierarchy()</code> for ${DOCNAME[d]} page ${n} · ${fs.length} records${outside.length ? ` · ${outside.length} hang from parents on an earlier page` : ''}. Click a node to find its row.</div><ul style="padding-left:18px;font-size:13.5px;line-height:1.7">${(kids.root || []).map(node).join('')}</ul>`;
    alt.querySelectorAll('[data-rec]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); const f = all.find(x => x.id === a.dataset.rec);
      const ti = sp.tables.findIndex(t => t.id === f.table); if (ti >= 0) { select(ti, f.row); emit('treeclick', {spec: st.spec, rec: f.id}); }
    }));
  }
  function renderJSON() {
    const d = specDoc(st.spec), s = st.sel && stepFor(st.sel.ti, st.sel.row);
    let obj, note;
    if (s && s.record) {
      if (d === 't02') { obj = SX.t02_json.fields.find(f => f.id === s.record); note = 'Exact record from the real output JSON.'; }
      else { obj = field(s.record); note = 'Abbreviated record (same data, shorter key names) — the real JSON also has bbox and source_page per value.'; }
    } else if (d === 't02') { obj = {schema_version: SX.t02_json.schema_version, parser_version: SX.t02_json.parser_version, document: SX.t02_json.document, extraction: SX.t02_json.extraction, fields: `[${SX.t02_json.fields.length} records]`, pages: `[${SX.t02_json.pages.length} page with raw_text, tables, images, warnings]`}; note = 'Top of the output file. Click a row on the page to see its record.'; }
    else { obj = SX.docs[d].document; note = 'Document block. Click a row on the page to see its record.'; }
    alt.innerHTML = `<div class="small" style="margin-bottom:6px">${note}</div><pre class="mono" style="font-size:12.5px;white-space:pre-wrap;margin:0">${esc(JSON.stringify(obj, null, 2))}</pre>`;
    emit('json', {spec: st.spec, rec: s && s.record});
  }
  return {
    set(cfg) {
      cfg = cfg || {};
      const newSpec = cfg.spec && cfg.spec !== st.spec;
      if (newSpec) { st.spec = cfg.spec; sp = SX.specimens[cfg.spec] || null; idx = sp ? cellsIndex(sp) : null; st.sel = null; const [W, H] = pageSize(st.spec); vb = [0, 0, W, H]; }
      if (cfg.layers) st.layers = new Set(cfg.layers);
      if ('focus' in cfg || newSpec) st.focus = cfg.focus || null;
      host.querySelectorAll('[data-tab="tree"],[data-tab="json"]').forEach(b => { b.disabled = !sp || !SX.fields[specDoc(st.spec)]; });
      $('.specname', host).innerHTML = `${pageLabel(st.spec)} · <a href="#" data-lightbox="${st.spec}">enlarge</a>`;
      $('.hint', host).style.display = sp ? '' : 'none';
      chips(); draw(); zoom();
      if (cfg.sel) select(cfg.sel.table || 0, cfg.sel.row, true); else inspect();
      setTab(cfg.tab || (newSpec ? 'page' : st.tab));
    },
    get state() { return st; },
  };
}

/* ---------- stations ---------- */
function progress() { return store.get('prog', {}); }
function markStation(id, patch) { const p = progress(); p[id] = Object.assign(p[id] || {}, patch); store.set('prog', p); }
function stationDone(id) { return !!(progress()[id] || {}).done; }
function tasksDone() { return store.get('tasks', {}); }

function renderMetro(active) {
  const m = $('#metro');
  if (active == null) { m.innerHTML = ''; return; }
  m.innerHTML = `<div class="metro">${STATIONS.map(s => `<a href="#/s/${s.id}" class="${stationDone(s.id) ? 'done' : ''} ${s.id === active ? 'here' : ''}" title="${esc(s.title)}"><span class="dot"></span>${s.n}. ${esc(s.short)}</a>`).join('')}</div>`;
  const here = $('.here', m); if (here) here.scrollIntoView({block: 'nearest', inline: 'center'});
}

let current = null; // {station, pv}
/* Show any page a lesson mentions on the left, with a way back to the lesson's own page. */
function showOnStage(id, rows) {
  const cfg = {spec: id, focus: rows ? {rows: rows.split(',').map(Number)} : null};
  if (SX.specimens[id]) cfg.layers = ['roles'];
  current.pv.set(cfg);
  const bar = $('.stagebar', $('.stage'));
  let back = $('[data-back]', bar);
  if (!back) { back = document.createElement('button'); back.className = 'show'; back.dataset.back = '1'; back.textContent = '↩ Back to lesson page'; bar.appendChild(back); back.addEventListener('click', () => { back.remove(); current.shownBeat = -1; renderStation(current.id, current.beat); }); }
  emit('stage', {spec: id});
}
function renderStation(id, beatIx) {
  const si = STATIONS.findIndex(s => s.id === id); if (si < 0) return renderHome();
  const s = STATIONS[si];
  renderMetro(s.id);
  const beats = s.beats.concat([{check: true, t: 'Checkpoint'}]);
  let b = Math.min(Math.max(0, Number(beatIx) || 0), beats.length - 1);
  const app = $('#app');
  if (!current || current.id !== s.id) {
    app.innerHTML = `<div class="station"><div class="stage"></div><div class="side"></div></div>`;
    current = {id: s.id, pv: PageView($('.stage', app)), spec: null, stageCustom: false};
  }
  const beat = beats[b];
  // stage: accumulate page config from station default + all beats up to this one
  let cfg = Object.assign({}, s.page || {});
  for (let i = 0; i <= b; i++) if (beats[i].page) cfg = Object.assign({}, cfg, beats[i].page, {sel: beats[i].page.sel});
  if (!beat.page) cfg.sel = undefined;
  if (beat.page || !current.shown || current.shownBeat !== b) { current.pv.set(Object.assign({}, cfg, current.shown ? {} : {})); current.shown = true; current.shownBeat = b; const bk = document.querySelector('[data-back]'); if (bk) bk.remove(); }
  const seen = progress()[s.id] || {};
  if ((seen.max || 0) < b) markStation(s.id, {max: b});
  const side = $('.side', app);
  const dots = beats.map((x, i) => `<button class="${i === b ? 'on' : ''} ${i <= (progress()[s.id] || {}).max ? 'seen' : ''} ${x.check ? 'check' : ''}" data-b="${i}" aria-label="Beat ${i + 1}: ${esc(x.t)}" title="${esc(x.t)}"></button>`).join('');
  let body = '';
  if (beat.check) {
    const ex = s.explain;
    body = `<div class="eyebrow">Station ${s.n} · checkpoint</div><h2>${esc(s.title)}: check yourself</h2>
      <p class="muted">${markup(s.goal)}</p>
      ${ex ? `<h3 style="font-size:15px">Explained two ways</h3>
      <div class="explain"><div class="ex newbie"><b>🌱 If you are new to programming</b>${markup(ex.newbie)}</div><div class="ex inter"><b>🛠 If you already program</b>${markup(ex.inter)}</div></div>
      <div class="ex together"><b>🧩 Putting it together</b>${markup(ex.together)}</div>` : ''}
      <h3 style="font-size:15px">🔑 Key takeaways</h3><ul class="keys">${s.keys.map(k => `<li>${markup(k)}</li>`).join('')}</ul>
      <div class="say">${markup(s.say)}</div><div class="quizbox"></div><div class="donebox"></div>`;
  } else {
    body = `<div class="eyebrow">Station ${s.n} · ${esc(s.level)} · beat ${b + 1}/${s.beats.length}</div><h2>${markup(beat.t)}</h2>`;
    if (beat.words) body += `<div class="words"><b>📖 Words used here</b>${beat.words.map(w => `<div><span class="w">${esc(w[0])}</span> ${markup(w[1])}</div>`).join('')}</div>`;
    body += markup(beat.x);
    if (beat.viz) body += `<div class="vizmount"></div>`;
    if (beat.flow) body += `<div class="flow">${beat.flow.map((f, i) => (i ? '<em>→</em>' : '') + `<span class="${f.startsWith('*') ? 'hot' : ''}">${markup(f.replace(/^\*/, ''))}</span>`).join('')}</div>`;
    if (beat.tiles) body += `<div class="tiles">${beat.tiles.map(t => `<div class="tile"><b>${markup(t[0])}</b><small>${markup(t[1])}</small></div>`).join('')}</div>`;
    if (beat.table) body += `<table class="t"><tr>${beat.table[0].map(h => `<th>${markup(h)}</th>`).join('')}</tr>${beat.table.slice(1).map(r => `<tr>${r.map(c => `<td>${markup(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    (beat.code ? [].concat(beat.code) : []).forEach(c => { body += codeBlock(c); });
    if (beat.x2) body += markup(beat.x2);
    if (beat.analogy) body += `<div class="analogy">${markup(beat.analogy)}</div>`;
    if (beat.warn) body += `<div class="warn">${markup(beat.warn)}</div>`;
    if (beat.pro) body += `<div class="pro">${markup(beat.pro)}</div>`;
    if (beat.show) body += `<div>${beat.show.map((x, i) => `<button class="show" data-show="${i}">▶ ${esc(x.label)}</button>`).join('')}</div>`;
    if (beat.task) body += `<div class="task ${tasksDone()[beat.task.id] ? 'done' : ''}" data-task="${beat.task.id}"><span class="box">${tasksDone()[beat.task.id] ? '✔' : ''}</span><div><b>Task</b> · ${markup(beat.task.text)}</div></div>`;
    if (beat.lab) body += `<div class="labmount"></div>`;
  }
  side.innerHTML = `<div class="card">${body}<div class="beatnav"><button data-prev ${b === 0 && si === 0 ? 'disabled' : ''}>←</button><div class="dots">${dots}</div><button class="primary" data-next>${beat.check ? (si < STATIONS.length - 1 ? 'Next station →' : 'Finish →') : 'Next →'}</button></div></div>`;
  side.querySelectorAll('[data-b]').forEach(x => x.addEventListener('click', () => go(s.id, Number(x.dataset.b))));
  $('[data-prev]', side).addEventListener('click', () => b > 0 ? go(s.id, b - 1) : si > 0 && go(STATIONS[si - 1].id, STATIONS[si - 1].beats.length));
  $('[data-next]', side).addEventListener('click', () => beat.check ? (si < STATIONS.length - 1 ? go(STATIONS[si + 1].id, 0) : (location.hash = '#/defense')) : go(s.id, b + 1));
  side.querySelectorAll('[data-show]').forEach(x => x.addEventListener('click', () => { const sh = beat.show[Number(x.dataset.show)]; current.pv.set(sh.page); emit('show', {station: s.id, beat: b, i: Number(x.dataset.show)}); }));
  if (beat.viz) { const [name, args] = [].concat(beat.viz); window.VIZ[name]($('.vizmount', side), Object.assign({pv: current.pv}, args || {})); }
  if (beat.lab) LABS[beat.lab].render($('.labmount', side), {mini: true, pv: current.pv});
  if (beat.check) {
    const doneBox = $('.donebox', side);
    const finish = () => { if (!stationDone(s.id)) { markStation(s.id, {done: true}); toast(`Station ${s.n} complete ✔`); renderMetro(s.id); } doneBox.innerHTML = `<p class="ok" style="margin-top:10px">✔ Station complete. ${si < STATIONS.length - 1 ? `Next: <b>${esc(STATIONS[si + 1].title)}</b>.` : 'Journey complete — go rehearse in the <a href="#/defense">Defense room</a>.'}</p>`; };
    quiz($('.quizbox', side), s.quiz, s.id, finish);
  }
  current.beat = b; current.task = beat.task || null;
  side.scrollTop = 0; window.scrollTo({top: 0});
}
on((type, data) => { // auto-check tasks
  if (!current || !current.task) return;
  const t = current.task; if (tasksDone()[t.id]) return;
  if (t.on === type && (!t.test || t.test(data))) {
    const d = tasksDone(); d[t.id] = true; store.set('tasks', d);
    const el = document.querySelector(`[data-task="${t.id}"]`);
    if (el) { el.classList.add('done'); $('.box', el).textContent = '✔'; }
    toast('Task done ✔');
  }
});
document.addEventListener('keydown', e => {
  if (!current || !location.hash.startsWith('#/s/') || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || lbId) return;
  if (e.key === 'ArrowRight') { const n = $('[data-next]'); if (n) n.click(); }
  if (e.key === 'ArrowLeft') { const p = $('[data-prev]'); if (p && !p.disabled) p.click(); }
});
function go(id, b) { location.hash = `#/s/${id}/${b}`; }

/* ---------- home ---------- */
function metroSVG() {
  const perRow = 4, gapX = 250, gapY = 118, x0 = 70, y0 = 60;
  const pos = STATIONS.map((s, i) => { const r = Math.floor(i / perRow), c = i % perRow; const cc = r % 2 ? perRow - 1 - c : c; return [x0 + cc * gapX, y0 + r * gapY]; });
  const colors = {Orientation: '#9085e9', Beginner: '#199e70', Intermediate: '#3987e5', Advanced: '#c98500', Expert: '#d95926', Mastery: '#d03b3b'};
  let path = `M${pos[0][0]} ${pos[0][1]}`;
  for (let i = 1; i < pos.length; i++) {
    const [a, b] = [pos[i - 1], pos[i]];
    if (a[1] !== b[1]) { const dir = a[0] > x0 + gapX ? 1 : -1; path += ` C${a[0] + dir * 70} ${a[1]}, ${b[0] + dir * 70} ${b[1]}, ${b[0]} ${b[1]}`; } else path += ` L${b[0]} ${b[1]}`;
  }
  let svg = `<svg viewBox="0 0 ${x0 * 2 + gapX * (perRow - 1)} ${y0 + gapY * Math.ceil(STATIONS.length / perRow) - 30}" role="img" aria-label="Journey map"><path d="${path}" fill="none" stroke="var(--line2)" stroke-width="6" stroke-linecap="round"/>`;
  STATIONS.forEach((s, i) => {
    const [x, y] = pos[i], done = stationDone(s.id), c = colors[s.level] || '#3987e5';
    svg += `<a href="#/s/${s.id}"><circle cx="${x}" cy="${y}" r="15" fill="${done ? c : 'var(--panel)'}" stroke="${c}" stroke-width="4"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="${done ? '#fff' : 'var(--ink)'}">${done ? '✔' : s.n}</text><text x="${x}" y="${y + 36}" text-anchor="middle" font-size="13.5" font-weight="600">${esc(s.title)}</text><text x="${x}" y="${y + 53}" text-anchor="middle" font-size="11" fill="${c}">${esc(s.level)}</text></a>`;
  });
  return svg + '</svg>';
}
function renderHome() {
  renderMetro(null); current = null;
  const done = STATIONS.filter(s => stationDone(s.id)).length;
  const next = STATIONS.find(s => !stationDone(s.id)) || STATIONS[0];
  const nb = (progress()[next.id] || {}).max || 0;
  $('#app').innerHTML = `<div class="page">
   <div class="hero"><div>
     <div class="eyebrow">Your project · Jags AL Data Extracter</div>
     <h1>Follow one PDF <em>from bytes to JSON</em>, and own every step.</h1>
     <p class="lead">You built a tool that turns Ashok Leyland's AIS-007 specification PDFs into traceable JSON. This app takes it apart on its own data: Table 02 is the engine, and each station opens one part, with the real page, the real code and the real output side by side.</p>
     <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0"><button class="primary" id="go">${done || nb ? 'Continue' : 'Start the journey'}: Station ${next.n} →</button><span class="small">${done}/${STATIONS.length} stations complete</span></div>
     <div class="bar" style="max-width:420px"><span style="width:${100 * done / STATIONS.length}%"></span></div>
   </div>
   <div class="box" style="padding:10px">${hasPage('t02-01') ? `<img src="pages/t02-01.jpg" alt="Table 02 page" style="width:100%;border-radius:8px;display:block;cursor:zoom-in" data-lightbox="t02-01"><div class="small" style="margin-top:6px">The engine we take apart: Table 02, one page, 31 fields.</div>` : `<img src="pages/smp-01.jpg" alt="Practice form" style="width:100%;border-radius:8px;display:block;cursor:zoom-in" data-lightbox="smp-01"><div class="small" style="margin-top:6px">The practice form: a made-up page in the AIS style with one example of each rule. The real Ashok Leyland pages are not included in this shared copy.</div>`}</div></div>
   <h2>The journey</h2><p class="muted" style="margin-top:-4px">Each station takes 5–12 minutes. Colours show depth, from orientation to mastery. Click any station to jump in.</p>
   <div class="mapwrap">${metroSVG()}</div>
   <h2 style="margin-top:28px">Other ways in</h2>
   <div class="grid3">
     <a class="box" href="#/lab" style="text-decoration:none;color:inherit"><h3>🧪 Lab bench</h3><p class="small">${Object.keys(LABS).length} hands-on labs running the engine's real rules on real cells: regex, merged cells, value boundary, hierarchy, accuracy maths, VIN codes and more.</p></a>
     <a class="box" href="#/code" style="text-decoration:none;color:inherit"><h3>📜 Code reader</h3><p class="small">engine.py, app.py, evaluate.py and the tests, with a plain-English note on every function, so you can explain any line.</p></a>
     <a class="box" href="#/atlas" style="text-decoration:none;color:inherit"><h3>🗂 Page atlas</h3><p class="small">All 64 pages of the 7 PDFs: what each page is, what the extractor produced, and its warnings.</p></a>
     <a class="box" href="#/defense" style="text-decoration:none;color:inherit"><h3>🎙 Defense room</h3><p class="small">Practice conversations with a client, a tech lead and an interviewer. Pick your answer and get feedback.</p></a>
     <a class="box" href="#/cheat" style="text-decoration:none;color:inherit"><h3>⚡ Cheat sheet</h3><p class="small">The 60-second version, the key numbers and flashcards.</p></a>
     <div class="box"><h3>⚠ One honest caveat</h3><p class="small">Everything about the code and the numbers is checked against your files: the trace shown here is re-run through the real engine and compared record by record. The regulatory background (AIS, CMVR, categories) is general knowledge and marked as such; your homologation colleague has the final word.</p></div>
   </div>
   <p class="small" style="margin-top:20px">Progress is saved in this browser. <a href="#" id="reset">Reset progress</a></p></div>`;
  $('#go').addEventListener('click', () => go(next.id, nb));
  $('#reset').addEventListener('click', e => { e.preventDefault(); if (confirm('Reset all progress?')) { store.reset(); renderHome(); } });
}

/* ---------- lab bench ---------- */
function renderLab(id) {
  renderMetro(null); current = null;
  const ids = Object.keys(LABS); id = LABS[id] ? id : ids[0];
  const L = LABS[id];
  $('#app').innerHTML = `<div class="page"><h1>Lab bench</h1><p class="lead">Every lab runs the engine's real rules (ported line by line and checked in <code>tools/verify.cjs</code>) on real cells from your PDFs. Presets reproduce the actual cases.</p>
   <div class="labnav">${ids.map(k => `<a href="#/lab/${k}" class="${k === id ? 'on' : ''}">${esc(LABS[k].title)}</a>`).join('')}</div>
   <div class="lab"><div class="eyebrow">${esc(L.where || '')}</div><h3>${esc(L.title)}</h3><p class="muted">${markup(L.sub)}</p><div class="labmount"></div></div></div>`;
  L.render($('.labmount'), {mini: false});
}

/* ---------- code reader ---------- */
function renderCode(file, anchor) {
  renderMetro(null); current = null;
  file = SRC[file] ? file : 'engine';
  const notes = (window.CODE_NOTES[file] || []).map(n => Object.assign({}, n, {line: findLine(file, n.find).i}));
  const lines = SRC[file].text.split('\n');
  const byLine = {}; notes.forEach(n => { (byLine[n.line] = byLine[n.line] || []).push(n); });
  let code = '<div class="code" style="max-height:none">';
  lines.forEach((l, j) => {
    (byLine[j] || []).forEach(n => { code += `</div><div class="note" id="n-${n.id}"><b>${esc(n.title)}</b><br>${markup(n.note)}</div><div class="code" style="max-height:none">`; });
    code += `<div class="ln"><i>${j + 1}</i>${esc(l) || ' '}</div>`;
  });
  code += '</div>';
  $('#app').innerHTML = `<div class="page" style="max-width:1400px"><h1>Code reader</h1><p class="lead">The real files, unchanged. Blue notes explain what each part does, why it exists, and what could break it. The goal is that you can defend every line.</p>
   <div class="labnav">${Object.keys(SRC).map(k => `<a href="#/code/${k}" class="${k === file ? 'on' : ''}">${esc(SRC[k].path)}</a>`).join('')}</div>
   <div class="codepage"><div class="toc box">${notes.map(n => `<a href="#/code/${file}/${n.id}" class="${n.id === anchor ? 'on' : ''}">${esc(n.title)}</a>`).join('') || '<span class="small">No notes for this file; it is here for reference.</span>'}</div><div>${code}</div></div></div>`;
  if (anchor) { const el = document.getElementById('n-' + anchor); if (el) setTimeout(() => el.scrollIntoView({block: 'start'}), 30); }
}

/* ---------- glossary ---------- */
function renderGlossary(term) {
  renderMetro(null); current = null;
  const cats = [...new Set(Object.values(GL).map(g => g.c))];
  $('#app').innerHTML = `<div class="page"><h1>Glossary</h1><p class="lead">${Object.keys(GL).length} terms. Hover over any dotted word in the journey to see its definition here.</p>
   <input class="search" placeholder="Search terms…" aria-label="Search glossary"><div class="labnav" id="cats"><a href="#" data-c="" class="on">All</a>${cats.map(c => `<a href="#" data-c="${esc(c)}">${esc(c)}</a>`).join('')}</div><div class="gl"></div></div>`;
  let cat = '';
  const draw = () => {
    const q = $('.search').value.toLowerCase();
    $('.gl').innerHTML = Object.entries(GL).filter(([k, g]) => (!cat || g.c === cat) && (!q || (k + (g.show || '') + g.f + g.d).toLowerCase().includes(q)))
      .sort((a, b) => (a[1].show || a[0]).localeCompare(b[1].show || b[0]))
      .map(([k, g]) => `<div class="box ${k === term ? 'hit' : ''}" id="g-${esc(k)}"><div class="cat">${esc(g.c)}</div><h3>${esc(g.show || k)}</h3>${g.f ? `<div class="small">${esc(g.f)}</div>` : ''}<p style="font-size:14px;margin:6px 0">${esc(g.d)}</p>${g.why ? `<p class="small" style="margin:0">Why it matters: ${esc(g.why)}</p>` : ''}${g.at ? `<p class="small" style="margin:6px 0 0">Seen in: ${markup(g.at)}</p>` : ''}</div>`).join('');
  };
  $('.search').addEventListener('input', draw);
  $('#cats').addEventListener('click', e => { const a = e.target.closest('[data-c]'); if (!a) return; e.preventDefault(); cat = a.dataset.c; $('#cats').querySelectorAll('a').forEach(x => x.classList.toggle('on', x === a)); draw(); });
  draw();
  if (term) { const el = document.getElementById('g-' + term); if (el) el.scrollIntoView({block: 'center'}); }
}

/* ---------- router ---------- */
function route() {
  tip.style.display = 'none';
  const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  const nav = parts[0] === 's' ? 'home' : (parts[0] || 'home');
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
  if (parts[0] !== 's') current = null;
  try {
    if (parts[0] === 's') renderStation(parts[1], parts[2]);
    else if (parts[0] === 'lab') renderLab(parts[1]);
    else if (parts[0] === 'code') renderCode(parts[1], parts[2]);
    else if (parts[0] === 'glossary') renderGlossary(parts[1]);
    else if (window.PAGES[parts[0]]) { renderMetro(null); window.PAGES[parts[0]]($('#app'), parts.slice(1)); window.scrollTo({top: 0}); }
    else renderHome();
  } catch (e) { console.error(e); $('#app').innerHTML = `<div class="page"><h2>Something broke</h2><pre>${esc(e.stack)}</pre></div>`; }
}
window.addEventListener('hashchange', route);
const theme = store.get('theme', 'dark'); document.documentElement.dataset.theme = theme;
$('#theme').addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.set('theme', t); });

window.SXJ = {hasPage, $, esc, markup, codeBlock, quiz, PageView, store, emit, on, toast, lightbox, pageLabel, DOCNAME, findLine};
route();
})();
