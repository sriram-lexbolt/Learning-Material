/* Step-by-step visuals used inside lessons. Every picture is drawn from the engine's real trace
   (data.js), mostly of the practice form (smp-01), so what you see is what the script did. */
(function () {
const SX = window.SX, PORT = window.PORT;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const C = {code: '#199e70', desc: '#3987e5', value: '#d95926', label: '#9085e9', line: '#d95926', own: '#3987e5', borrowed: '#9085e9', head: '#c98500', dim: '#8a96a3'};
const emit = d => window.SXJ && window.SXJ.emit('viz', d);
const short = (s, n = 22) => { s = String(s ?? '').replace(/\n/g, ' '); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

const spec = id => SX.specimens[id];
const avail = id => !!SX.specimens[id];
const cellsOf = (id, ti = 0) => PORT.cellObjs(spec(id).tables[ti]);
const traceOf = (id, ti = 0) => spec(id).traces[ti];
const keyMap = cells => { const m = {}; cells.forEach(c => { m[c.key] = c; }); return m; };
const fieldOf = (id, rec) => (SX.fields[id.split('-')[0]] || []).find(f => f.id === rec);

/* Draw cells in PDF points. style(c) → {fill, op, stroke, sw}. */
function cellsSVG(cells, style, opts = {}) {
  const Y = opts.ymap || (y => y);
  return cells.map(c => {
    const st = style(c) || {}, b = [c.bbox[0], Y(c.bbox[1]), c.bbox[2], Y(c.bbox[3])];
    let s = `<rect x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}" fill="${st.fill || 'var(--panel)'}" fill-opacity="${st.op ?? 1}" stroke="${st.stroke || 'var(--line2)'}" stroke-width="${st.sw || .6}"/>`;
    const fs = opts.fs || 9;
    if (c.text && opts.text !== false) s += `<text x="${b[0] + 3}" y="${Math.min(b[3] - 4, b[1] + fs * 1.35)}" font-size="${fs}" fill="currentColor">${esc(short(c.text, Math.max(3, Math.floor((b[2] - b[0] - 4) / (fs * .56)))))}</text>`;
    return s;
  }).join('');
}
function bounds(cells, pad = 6) {
  return [Math.min(...cells.map(c => c.bbox[0])) - pad, Math.min(...cells.map(c => c.bbox[1])) - pad, Math.max(...cells.map(c => c.bbox[2])) + pad, Math.max(...cells.map(c => c.bbox[3])) + pad];
}
function ruler(x0, x1, y, step, marks = []) {
  let s = `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="var(--muted)" stroke-width=".6"/>`;
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) s += `<line x1="${x}" x2="${x}" y1="${y - 3}" y2="${y + 3}" stroke="var(--muted)" stroke-width=".6"/><text x="${x}" y="${y + 14}" font-size="10" text-anchor="middle" fill="var(--muted)">${x}</text>`;
  marks.forEach(m => { s += `<line x1="${m.x}" x2="${m.x}" y1="${y - 8}" y2="${y + 3}" stroke="${m.color}" stroke-width="1.6"/><text x="${m.x}" y="${y - 11}" font-size="11" font-weight="700" text-anchor="middle" fill="${m.color}">${esc(m.label)}</text>`; });
  return s;
}
/* Stretch thin strips vertically so rows are readable; numbers shown stay the real ones. */
const stretch = (y0, k) => y => y0 + (y - y0) * k;
function frame(el, inner) { el.innerHTML = `<div class="viz">${inner}</div>`; return el.firstElementChild; }
/* A generic stepper: steps is an array; draw(i) renders; buttons move. */
function stepper(root, n, draw, extra = '') {
  const ctrl = root.querySelector('.ctrl');
  ctrl.insertAdjacentHTML('beforeend', `<button data-prev>◀ Back</button><button class="primary" data-next>Next step ▶</button>${extra}<span class="stepno"></span>`);
  let i = 0;
  const go = k => { i = Math.max(0, Math.min(n() - 1, k)); root.querySelector('.stepno').textContent = `step ${i + 1} of ${n()}`; root.querySelector('[data-prev]').disabled = i === 0; root.querySelector('[data-next]').disabled = i === n() - 1; draw(i); };
  root.querySelector('[data-prev]').addEventListener('click', () => go(i - 1));
  root.querySelector('[data-next]').addEventListener('click', () => go(i + 1));
  return {go, get i() { return i; }};
}
const syncPage = (pv, id, cfg) => { if (pv && pv.state.spec === id) pv.set(cfg); };

const VIZ = {};

/* ------------------------------------------------------------------ coordinates */
VIZ.coords = (el, o) => {
  const ok = avail(o.spec || 'smp-01'), id = ok ? (o.spec || 'smp-01') : 'smp-01', rows = (ok && o.rows) || [6], cells = cellsOf(id).filter(c => rows.includes(c.row));
  const [W, H] = spec(id).size;
  let pick = cells.find(c => c.key === o.pick) || cells[cells.length - 1];
  const root = frame(el, `<div class="ctrl"><b>Click any box</b><span class="small muted" style="margin-left:6px">to see where it sits</span></div><div style="display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:start"><svg class="pg"></svg><svg class="zm"></svg></div><div class="say2"></div>`);
  const draw = () => {
    const b = pick.bbox, s = 120 / W;
    root.querySelector('.pg').setAttribute('viewBox', `-30 -40 ${W + 60} ${H + 60}`);
    root.querySelector('.pg').innerHTML = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff" stroke="var(--line2)" stroke-width="3"/>
      <circle cx="0" cy="0" r="14" fill="${C.line}"/><text x="20" y="-10" font-size="34" fill="var(--muted)">0,0</text>
      <path d="M0 0 H${W * .55}" stroke="${C.desc}" stroke-width="6" marker-end="url(#a)"/><path d="M0 0 V${H * .4}" stroke="${C.code}" stroke-width="6"/>
      <text x="${W * .25}" y="40" font-size="38" fill="${C.desc}">x →</text><text x="12" y="${H * .3}" font-size="38" fill="${C.code}">y ↓</text>
      ${cells.map(c => `<rect x="${c.bbox[0]}" y="${c.bbox[1]}" width="${c.bbox[2] - c.bbox[0]}" height="${c.bbox[3] - c.bbox[1]}" fill="${c === pick ? C.value : '#bbb'}" fill-opacity="${c === pick ? .9 : .5}"/>`).join('')}
      <text x="0" y="${H + 40}" font-size="34" fill="var(--muted)">page ${Math.round(W)} × ${Math.round(H)} pt</text>`;
    const v0 = bounds(cells, 8), Y = stretch(v0[1], 3.6), v = [v0[0], v0[1], v0[2], Y(v0[3])];
    const zm = root.querySelector('.zm');
    zm.setAttribute('viewBox', `${v[0] - 10} ${v[1] - 30} ${v[2] - v[0] + 40} ${v[3] - v[1] + 58}`);
    zm.innerHTML = cellsSVG(cells, c => c === pick ? {fill: C.value, op: .25, stroke: C.value, sw: 2} : {}, {ymap: Y, fs: 13}) +
      ruler(v[0] + 8, v[2] - 8, v[1] - 12, 50, [{x: b[0], label: `left ${Math.round(b[0])}`, color: C.desc}, {x: b[2], label: `right ${Math.round(b[2])}`, color: C.value}]) +
      `<line x1="${b[0]}" x2="${b[2]}" y1="${v[3] + 8}" y2="${v[3] + 8}" stroke="${C.value}" stroke-width="1.2"/><text x="${(b[0] + b[2]) / 2}" y="${v[3] + 21}" font-size="10" text-anchor="middle" fill="${C.value}">width = ${Math.round(b[2] - b[0])} pt</text>`;
    zm.querySelectorAll('rect').forEach((r, i) => { r.style.cursor = 'pointer'; r.addEventListener('click', () => { pick = cells[i]; draw(); emit({id: 'coords', key: pick.key}); }); });
    root.querySelector('.say2').innerHTML = `The box with <b>“${esc(short(pick.text || '(empty)', 30))}”</b> starts <b>${Math.round(b[0])} pt</b> from the left edge of the page and ends at <b>${Math.round(b[2])} pt</b>. Its top is <b>${Math.round(b[1])} pt</b> down from the top of the page, its bottom <b>${Math.round(b[3])} pt</b>. The script stores exactly these four numbers as <code>bbox: [${b.map(n => Math.round(n * 10) / 10).join(', ')}]</code>.`;
  };
  draw();
};

/* ------------------------------------------------------------------ the probe line (_active_cells) */
VIZ.probe = (el, o) => {
  const id = o.spec || 'smp-01', group = o.rows || [7, 8, 9], cells = cellsOf(id);
  const names = o.names || {};
  let row = o.start || group[group.length - 1];
  const shown = () => cells.filter(c => group.some(r => PORT.activeCells(cells, r).includes(c)) || group.includes(c.row));
  const root = frame(el, `<div class="ctrl seg">${group.map(r => `<button data-r="${r}">${esc(names[r] || 'row ' + r)}</button>`).join('')}</div><svg class="main"></svg><svg class="inset" style="max-width:300px;margin:6px auto 0"></svg><div class="say2"></div>`);
  let steps = [];
  const build = () => {
    const own = cells.filter(c => c.row === row), top = Math.min(...own.map(c => c.bbox[1])), act = PORT.activeCells(cells, row);
    steps = [{k: 'own'}, {k: 'top', top}, {k: 'nudge', top}];
    act.forEach((c, i) => steps.push({k: 'cross', top, upto: i}));
    steps.push({k: 'done', top});
    return {own, top, act};
  };
  let info = build();
  const svg = root.querySelector('svg.main'), insetSvg = root.querySelector('svg.inset');
  const draw = i => {
    const st = steps[i], {own, top, act} = info, sh = shown(), v0 = bounds(sh, 10);
    const Y = stretch(v0[1], 3.4), v = [v0[0], v0[1], v0[2], Y(v0[3])];
    const probeY = Y(top + (st.k === 'own' || st.k === 'top' ? 0 : 0.05));
    const lit = st.k === 'cross' ? act.slice(0, st.upto + 1) : st.k === 'done' ? act : [];
    const inset = st.k === 'nudge';
    svg.setAttribute('viewBox', `${v[0] - 52} ${v[1]} ${v[2] - v[0] + 58} ${v[3] - v[1]}`);
    let s = cellsSVG(sh, c => {
      if (lit.includes(c)) return {fill: c.row === row ? C.own : C.borrowed, op: .35, stroke: c.row === row ? C.own : C.borrowed, sw: 2};
      if (st.k === 'own' && own.includes(c)) return {fill: C.own, op: .3, stroke: C.own, sw: 2};
      return {};
    }, {ymap: Y, fs: 15});
    if (st.k !== 'own') {
      s += `<line x1="${v[0] - 48}" x2="${v[2]}" y1="${probeY}" y2="${probeY}" stroke="${C.line}" stroke-width="${st.k === 'top' ? 2 : 3.5}" stroke-dasharray="${st.k === 'top' ? '7 4' : ''}"/>`;
      s += `<text x="${v[0] - 50}" y="${probeY - 6}" font-size="13" fill="${C.line}" font-weight="700">y=${st.k === 'top' ? top : (top + .05).toFixed(2)}</text>`;
    }
    insetSvg.style.display = inset ? '' : 'none';
    if (inset) {
      // magnified 60x, same scale for everything: the printed border (0.6 pt thick, centred on the row top)
      // and the ruler 0.05 pt below the row top
      const k = 60, ix = 0, mid = 46, iy = 0;
      insetSvg.setAttribute('viewBox', '0 0 132 92');
      insetSvg.innerHTML = `<rect x="${ix}" y="${iy}" width="132" height="92" rx="6" fill="var(--panel)" stroke="var(--line2)"/>
        <text x="${ix + 6}" y="${iy + 12}" font-size="8.5" font-weight="700" fill="var(--muted)">zoom × ${k}</text>
        <rect x="${ix + 6}" y="${mid - .3 * k}" width="120" height="${.6 * k}" fill="#9aa5b1" fill-opacity=".55"/>
        <text x="${ix + 10}" y="${mid - .3 * k + 9}" font-size="7.5" fill="var(--ink)">printed border, 0.6 pt</text>
        <line x1="${ix + 6}" x2="${ix + 126}" y1="${mid}" y2="${mid}" stroke="var(--ink)" stroke-width=".8" stroke-dasharray="3 2"/>
        <line x1="${ix + 6}" x2="${ix + 126}" y1="${mid + .05 * k}" y2="${mid + .05 * k}" stroke="${C.line}" stroke-width="1.4"/>
        <text x="${ix + 8}" y="${iy + 76}" font-size="7.5" fill="var(--ink)">dashed: row top ${top}</text>
        <text x="${ix + 8}" y="${iy + 87}" font-size="7.5" fill="${C.line}" font-weight="700">orange: ruler ${(top + .05).toFixed(2)}</text>`;
    }
    if (st.k === 'cross') { const c = act[st.upto]; s += `<circle cx="${c.bbox[0] + 7}" cy="${probeY}" r="7" fill="${C.line}"/>`; }
    lit.forEach((c, n) => { s += `<circle cx="${c.bbox[2] - 14}" cy="${Y(c.bbox[1]) + 14}" r="11" fill="${c.row === row ? C.own : C.borrowed}"/><text x="${c.bbox[2] - 14}" y="${Y(c.bbox[1]) + 19}" font-size="14" font-weight="700" text-anchor="middle" fill="#fff">${n + 1}</text>`; });
    svg.innerHTML = s;
    const nm = names[row] || 'row ' + row;
    const txt = {
      own: `Pick the row <b>${esc(nm)}</b> (grid row ${row}). The blue boxes are its <b>own cells</b>: boxes whose top edge is in this row. ${own.length === 1 ? 'Only one! Everything else you see on this line of the page belongs to boxes that started higher up.' : ''}`,
      top: `Find the <b>top of the row</b>: the smallest “top” number among its own boxes, here <b>y = ${top}</b> pt from the top of the page. Picture a ruler laid across the page at that height.`,
      nudge: `Move that ruler down by <b>0.05 pt</b>, about 0.02 mm, much thinner than the printed border itself. Why: in real Word PDFs the boxes of one row don't start at exactly the same height (one at 109.68, the next at 109.70). Sliding just inside makes sure the ruler is <i>inside</i> every box of this row, and no longer touching the row above, whose boxes end exactly at y = ${top}.`,
      cross: `Slide along the ruler from left to right. Box <b>${st.upto + 1}</b> “${esc(short((act[st.upto] || {}).text || '(empty)', 24))}” is under the ruler: its top is above it and its bottom below it. ${act[st.upto] && act[st.upto].row !== row ? `It <b>started in row ${act[st.upto].row}</b> but reaches down into this row, so it counts too (violet = borrowed).` : 'It started in this row (blue = own).'}`,
      done: `Done. The ruler crossed <b>${act.length}</b> boxes. That list, in left-to-right order, is what the script calls the row's <b>active cells</b>: ${act.map(c => `“${esc(short(c.text || '(empty)', 14))}”${c.row !== row ? ' ↩' : ''}`).join(', ')}. ${act.some(c => c.row !== row) ? 'The ↩ ones are borrowed, so their values get <code>inherited_from_merged_cell: true</code>.' : ''}`,
    }[st.k];
    root.querySelector('.say2').innerHTML = txt;
    root.querySelectorAll('[data-r]').forEach(b => b.classList.toggle('on', Number(b.dataset.r) === row));
    syncPage(o.pv, id, {sel: {row}});
  };
  const sp = stepper(root, () => steps.length, draw);
  root.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { row = Number(b.dataset.r); info = build(); sp.go(0); emit({id: 'probe', row}); }));
  sp.go(0);
};

/* ------------------------------------------------------------------ left/right edges */
VIZ.edges = (el, o) => {
  const id = o.spec || 'smp-01', rows = o.rows || [2], cells = cellsOf(id).filter(c => rows.includes(c.row));
  let pick = cells.find(c => c.col === 1) || cells[1];
  const root = frame(el, `<div class="ctrl"><b>Tap a box</b></div><svg></svg><div class="say2"></div>`);
  const draw = () => {
    const v0 = bounds(cells, 6), Y = stretch(v0[1], 3.2), v = [v0[0], v0[1], v0[2], Y(v0[3])], b = pick.bbox;
    const svg = root.querySelector('svg');
    svg.setAttribute('viewBox', `${v[0] - 10} ${v[1] - 34} ${v[2] - v[0] + 40} ${v[3] - v[1] + 50}`);
    svg.innerHTML = cellsSVG(cells, c => c === pick ? {fill: C.desc, op: .25, stroke: C.desc, sw: 2} : {}, {ymap: Y, fs: 13}) +
      ruler(v[0] + 6, v[2] - 6, v[1] - 14, 50, [{x: b[0], label: 'left edge ' + Math.round(b[0]), color: C.code}, {x: b[2], label: 'right edge ' + Math.round(b[2]), color: C.value}]) +
      `<line x1="${b[2]}" x2="${b[2]}" y1="${v[1] - 6}" y2="${v[3] + 6}" stroke="${C.value}" stroke-width="2" stroke-dasharray="4 3"/>`;
    svg.querySelectorAll('rect').forEach((r, i) => { r.style.cursor = 'pointer'; r.addEventListener('click', () => { pick = cells[i]; draw(); }); });
    root.querySelector('.say2').innerHTML = `“${esc(short(pick.text || '(empty)', 30))}”: <b>left edge</b> = where the box starts = ${Math.round(b[0])} pt, <b>right edge</b> = where it ends = ${Math.round(b[2])} pt (measured from the left side of the page).`;
  };
  draw();
};

/* ------------------------------------------------------------------ the value_x vote */
VIZ.votes = (el, o) => {
  const choices = (o.specs || ['smp-01', 't02-01', 't03-01']).filter(avail);
  if (!choices.length) choices.push('smp-01');
  let id = choices.includes(o.spec) ? o.spec : choices[0];
  const root = frame(el, `<div class="ctrl"><select>${choices.map(s => `<option value="${s}">${window.SXJ.pageLabel(s)}</option>`).join('')}</select><button data-all>Count all at once</button><label class="small"><input type="checkbox" class="avg"> show the average too</label></div><div style="display:grid;grid-template-columns:3fr 2fr;gap:10px"><svg class="tb"></svg><div class="board"></div></div><div class="say2"></div>`);
  let votes, cells, cx, t, steps;
  const load = () => {
    cells = cellsOf(id); cx = keyMap(cells); t = traceOf(id); votes = t.votes; steps = votes.length + 1;
    root.querySelector('select').value = id;
    if (o.pv) o.pv.set({spec: id, layers: ['roles'], focus: null});
  };
  load();
  const draw = i => {
    const done = i >= votes.length, cur = done ? null : votes[i], seen = votes.slice(0, done ? votes.length : i + 1);
    const counts = {}; seen.forEach(v => { counts[v.x] = (counts[v.x] || 0) + 1; });
    const tb = t && spec(id).tables[0].bbox, svg = root.querySelector('.tb');
    svg.setAttribute('viewBox', `${tb[0] - 4} ${tb[1] - 4} ${tb[2] - tb[0] + 8} ${tb[3] - tb[1] + 8}`);
    svg.style.maxHeight = '360px';
    const voted = new Set(seen.map(v => v.cell));
    let s = cellsSVG(cells, c => cur && c.key === cur.cell ? {fill: C.desc, op: .5, stroke: C.desc, sw: 2.5} : voted.has(c.key) ? {fill: C.desc, op: .12} : {}, {fs: id === 'smp-01' ? 9 : 6});
    if (cur) s += `<line x1="${cur.x}" x2="${cur.x}" y1="${tb[1]}" y2="${tb[3]}" stroke="${C.value}" stroke-width="2" stroke-dasharray="5 3"/><text x="${cur.x + 3}" y="${cx[cur.cell].bbox[1] - 3}" font-size="10" font-weight="700" fill="${C.value}">${cur.x}</text>`;
    if (done) s += `<line x1="${t.value_x}" x2="${t.value_x}" y1="${tb[1]}" y2="${tb[3]}" stroke="${C.value}" stroke-width="3"/><text x="${t.value_x + 3}" y="${tb[1] + 10}" font-size="11" font-weight="700" fill="${C.value}">value_x = ${t.value_x}</text>`;
    const avg = votes.reduce((a, v) => a + v.x, 0) / votes.length;
    if (done && root.querySelector('.avg').checked) s += `<line x1="${avg}" x2="${avg}" y1="${tb[1]}" y2="${tb[3]}" stroke="#d03b3b" stroke-width="2" stroke-dasharray="2 2"/><text x="${avg - 3}" y="${tb[3] - 6}" font-size="10" font-weight="700" text-anchor="end" fill="#d03b3b">average ${avg.toFixed(1)}</text>`;
    svg.innerHTML = s;
    const max = Math.max(1, ...Object.values(counts)), best = done ? t.value_x : null;
    root.querySelector('.board').innerHTML = `<div class="small muted">Tally board: one dot per row</div><div class="tally">${Object.entries(counts).sort((a, b) => a[0] - b[0]).map(([x, n]) => `<div style="text-align:center"><div style="display:flex;flex-direction:column-reverse;gap:2px;align-items:center;min-height:${Math.min(160, max * 9)}px">${Array.from({length: n}, () => `<span style="width:${n > 18 ? 6 : 12}px;height:${n > 18 ? 4 : 8}px;border-radius:3px;background:${+x === best ? C.value : C.desc};display:block"></span>`).join('')}</div><b style="${+x === best ? `color:${C.value}` : ''}">${x}</b><div class="small">${n} vote${n > 1 ? 's' : ''}</div></div>`).join('')}</div>`;
    const c = cur && cx[cur.cell];
    root.querySelector('.say2').innerHTML = done
      ? `All ${votes.length} rows have voted. The number with the most votes wins: <b>${t.value_x}</b>. From now on, anything that starts at or right of x = ${t.value_x} is an <b>answer</b>; anything between the description and that line is a <b>row name</b>. ${root.querySelector('.avg').checked ? `The red dotted line is the plain average (${avg.toFixed(1)}). ${Math.abs(avg - t.value_x) > 1 ? 'No box starts or ends there, and every unusual row pulls it a bit further from the real column. On this page it would still sort the boxes correctly, but with a few more odd rows it would slide into the wrong column. The vote does not move at all, however odd the few rows are.' : 'Here it agrees, because every row voted the same.'}` : ''}`
      : `Row ${cur.row}${c ? '' : ''}: its description box “${esc(short(c.text, 28))}” ends at <b>x = ${cur.x}</b>. That is its <b>vote</b>: “I think answers start at ${cur.x}.” Drop a dot on the board.`;
    emit({id: 'votes', i, done});
  };
  const sp = stepper(root, () => steps, draw);
  root.querySelector('[data-all]').addEventListener('click', () => sp.go(steps - 1));
  root.querySelector('.avg').addEventListener('change', () => draw(sp.i));
  root.querySelector('select').addEventListener('change', e => { id = e.target.value; load(); sp.go(0); });
  sp.go(0);
};

/* ------------------------------------------------------------------ the decision list per row */
VIZ.decide = (el, o) => {
  const id = o.spec || 'smp-01', cells = cellsOf(id), cx = keyMap(cells), t = traceOf(id);
  const rows = t.rows;
  const Q = [['footer', 'Is it the signature box?', 'stop reading'], ['title', 'Is it the title line?', 'skip'], ['empty', 'Is the row empty?', 'skip'], ['continuation', 'No code of its own?', 'add to previous record'], ['record', 'Otherwise', 'make a new record']];
  const kindIndex = k => ({'footer-stop': 0, title: 1, empty: 2, continuation: 3, record: 4}[k] ?? 4);
  const root = frame(el, `<div class="ctrl"></div><div style="display:grid;grid-template-columns:3fr 2fr;gap:10px;align-items:start"><svg></svg><div class="flowq"></div></div><div class="say2"></div>`);
  const tb = spec(id).tables[0].bbox;
  const draw = i => {
    const st = rows[i], q = kindIndex(st.kind), act = new Set(st.active);
    const svg = root.querySelector('svg');
    svg.setAttribute('viewBox', `${tb[0] - 4} ${tb[1] - 4} ${tb[2] - tb[0] + 8} ${tb[3] - tb[1] + 8}`);
    svg.innerHTML = cellsSVG(cells, c => act.has(c.key) ? {fill: [C.dim, C.dim, C.dim, C.head, C.code][q], op: .35, stroke: [C.dim, C.dim, C.dim, C.head, C.code][q], sw: 2} : {});
    root.querySelector('.flowq').innerHTML = Q.map((x, k) => `<div style="padding:6px 9px;margin:4px 0;border-radius:8px;border:1px solid ${k === q ? 'var(--blue)' : 'var(--line)'};background:${k === q ? '#3987e522' : 'transparent'};opacity:${k <= q ? 1 : .45}"><b>${k + 1}. ${x[1]}</b> ${k < q ? '<span class="muted">no →</span>' : k === q ? `<span style="color:var(--blue)">yes → ${x[2]}</span>` : ''}</div>`).join('');
    const f = st.record && fieldOf(id, st.record);
    root.querySelector('.say2').innerHTML = {
      title: 'This line says “Table 99 of AIS-007…”. It is the title, so the script skips it.',
      'footer-stop': 'Signature words found: everything from here down is the signature box, so reading stops.',
      empty: 'Nothing written in this row, so it is skipped.',
      continuation: `No code of its own here (${st.why === 'no code cell in this row' ? 'the first box is not a code' : 'the code box belongs to the row above, it is merged'}), so this row is <b>added to the previous record</b> (${esc(st.attached_to || '')}) instead of starting a new one.${st.heading_row ? ` It also looks like a <b>heading row</b> (${st.heading_row.map(esc).join(' | ')}), so these words become column names for the rows below.` : ''}`,
      record: f ? `Starts with the code <b>${esc(f.code)}</b>, so it becomes a new <b>record</b> (${f.kind === 'section' ? 'a section heading' : 'a field'}): “${esc(short(f.desc, 30))}” with ${f.values.length} value(s): ${f.values.map(v => `“${esc(short(v.t || '(empty)', 16))}”`).join(', ') || 'none'}.` : 'A new record.',
    }[st.kind] || st.kind;
    syncPage(o.pv, id, {sel: {row: st.row}});
  };
  stepper(root, () => rows.length, draw).go(0);
};

/* ------------------------------------------------------------------ headings (column labels) */
VIZ.headings = (el, o) => {
  const id = o.spec || 'smp-01', cells = cellsOf(id), cx = keyMap(cells), t = traceOf(id);
  const want = o.rows || [5, 6, 13, 14, 15, 16, 17];
  const rows = t.rows.filter(r => want.includes(r.row));
  const root = frame(el, `<div class="ctrl"></div><svg></svg><div class="say2"></div>`);
  const shownCells = cells.filter(c => want.includes(c.row));
  const draw = i => {
    const st = rows[i], svg = root.querySelector('svg');
    // close the vertical gap between the two groups of rows
    const groups = want.slice().sort((x, y) => x - y), gapAt = groups.findIndex((r, k) => k && r - groups[k - 1] > 1);
    let Y = y => y;
    if (gapAt > 0) {
      const above = shownCells.filter(c => c.row < groups[gapAt]), below = shownCells.filter(c => c.row >= groups[gapAt]);
      const lo = Math.max(...above.filter(c => c.row === groups[gapAt - 1]).map(c => c.bbox[3])), hi = Math.min(...below.map(c => c.bbox[1]));
      Y = y => (y >= hi - .01 ? y - (hi - lo) + 14 : y);
    }
    const mapped = shownCells.map(c => ({bbox: [c.bbox[0], Y(c.bbox[1]), c.bbox[2], Y(c.bbox[3])]})), v = bounds(mapped, 8);
    const heads = new Set(st.header_keys || (st.expanded && st.expanded.header_keys) || []);
    const headSrc = st.headers_set || st.heading_row ? new Set((st.values || []).concat(st.heading_row ? cells.filter(c => c.row === st.row && c.bbox[0] >= (t.value_x - .2) && c.text).map(c => c.key) : [])) : new Set();
    svg.setAttribute('viewBox', `${v[0]} ${v[1]} ${v[2] - v[0]} ${v[3] - v[1] + 4}`);
    let s = cellsSVG(shownCells, c => headSrc.has(c.key) ? {fill: C.head, op: .45, stroke: C.head, sw: 2} : heads.has(c.key) ? {fill: C.head, op: .18, stroke: C.head, sw: 1.2} : c.row === st.row && (st.values || []).includes(c.key) ? {fill: C.value, op: .3, stroke: C.value, sw: 2} : {}, {ymap: Y});
    if (gapAt > 0) { const yy = Y(Math.min(...shownCells.filter(c => c.row >= groups[gapAt]).map(c => c.bbox[1]))) - 7; s += `<text x="${v[0] + 10}" y="${yy + 3}" font-size="10" fill="var(--muted)">⋮ rows ${groups[gapAt - 1] + 1}–${groups[gapAt] - 1} not shown</text>`; }
    const f = st.record && fieldOf(id, st.record);
    if (f && st.record_kind === 'field') f.values.forEach((val, k) => { const c = cx[st.values[k]]; if (c && val.col) s += `<rect x="${c.bbox[0] + 2}" y="${Y(c.bbox[3]) - 10}" width="${val.col.length * 5 + 6}" height="9" rx="2" fill="${C.head}"/><text x="${c.bbox[0] + 5}" y="${Y(c.bbox[3]) - 3}" font-size="7" font-weight="700" fill="#fff">${esc(val.col)}</text>`; });
    svg.innerHTML = s;
    let txt;
    if (st.headers_set) txt = `Row ${st.row} (${esc(st.code)}) has ${st.headers_set.length} answer boxes with ${st.headers_why === 'keyword' ? 'the word “WB”, one of the heading words (WB, GVW, variant, gear, ratio)' : 'words, not numbers, and the row below lines up under them'}. So <b>${st.headers_set.map(esc).join(' | ')}</b> become the column names (yellow).`;
    else if (st.heading_row) txt = `This row has no code, only the words <b>${st.heading_row.map(esc).join(' | ')}</b> sitting over the answer columns, and the next row's answers line up exactly under them. So it is a <b>heading row</b>: these words name the columns for the clause below (A3).`;
    else if (st.record_kind === 'section') txt = `${esc(st.code)} is a section (its code ends in .0). A new section clears the old column names, so nothing carries over by mistake.`;
    else if (f) { const lab = f.values.map(v => v.col); txt = lab.some(Boolean) ? `${esc(f.code)}: each answer box sits under a column name (it overlaps it by more than 80%), so each value gets that name as its <code>column_label</code>: ${f.values.map(v => `“${esc(v.t)}” → <b>${esc(v.col || 'none')}</b>`).join(', ')}.` : `${esc(f.code)}: the answer “${esc(short(f.values[0] && f.values[0].t, 20))}” is one wide box under <i>both</i> columns. It only overlaps each name by half (50%), not more than 80%, so it gets <b>no</b> column name. That is correct: the colour is the same for both.`; }
    else txt = 'This row adds values to the record above.';
    root.querySelector('.say2').innerHTML = txt;
    syncPage(o.pv, id, {sel: {row: st.row}});
  };
  stepper(root, () => rows.length, draw).go(0);
};

/* ------------------------------------------------------------------ family tree */
VIZ.tree = (el, o) => {
  const id = o.spec || 'smp-01', fs = SX.fields[id.split('-')[0]];
  const recs = PORT.hierarchy(fs.map(f => ({id: f.id, code: f.code, kind: f.kind, label: f.desc.split('\n')[0]})));
  const root = frame(el, `<div class="ctrl"></div><div class="treebox" style="font-size:14px;line-height:1.7"></div><div class="say2"></div>`);
  const draw = i => {
    const upto = recs.slice(0, i + 1), cur = recs[i], kids = {};
    upto.forEach(r => { (kids[r.parent || 'root'] = kids[r.parent || 'root'] || []).push(r); });
    const node = r => `<li><span style="${r === cur ? `background:${C.desc}33;border-radius:5px;padding:0 4px;` : ''}"><code>${esc(r.code || '—')}</code> ${esc(short(r.label, 26))}${r.kind === 'section' ? ' <span class="muted">§</span>' : ''}</span>${kids[r.id] ? `<ul>${kids[r.id].map(node).join('')}</ul>` : ''}</li>`;
    root.querySelector('.treebox').innerHTML = `<ul style="padding-left:16px;margin:0">${(kids.root || []).map(node).join('')}</ul>`;
    const parent = recs.find(r => r.id === cur.parent);
    root.querySelector('.say2').innerHTML = cur.code
      ? `<b>${esc(cur.code)}</b>: chop pieces off the end and look for a parent already seen: ${cur.tried.map(k => `<code>${esc(k)}</code>${parent && parent.code === k ? ' ✔' : ' ✖'}`).join(' → ') || '(nothing shorter to try)'}. ${parent ? `Found <b>${esc(parent.code)}</b>, so ${esc(cur.code)} goes under it.` : 'Nothing found, so it starts a new branch at the top.'}`
      : 'No code: it goes under the last section seen.';
  };
  stepper(root, () => recs.length, draw).go(0);
};

/* ------------------------------------------------------------------ one record ↔ the page */
VIZ.record = (el, o) => {
  const id = o.spec || 'smp-01', code = o.code || 'A2.2', f = fieldOf(id, (SX.fields[id.split('-')[0]].find(x => x.code === code) || {}).id);
  const cells = cellsOf(id), cx = keyMap(cells), v = bounds(cells.filter(c => (o.rows || [7, 8, 9]).includes(c.row)), 8);
  const root = frame(el, `<div class="ctrl"><b>Hover or tap a value</b></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><svg></svg><div class="vals"></div></div><div class="say2"></div>`);
  const show = k => {
    const val = f.values[k], c = val && cx[val.cell[1] + ',' + val.cell[2]];
    const svg = root.querySelector('svg');
    svg.setAttribute('viewBox', v.map((n, i) => i > 1 ? n - v[i - 2] : n).join(' '));
    svg.innerHTML = cellsSVG(cells.filter(x => x.bbox[1] >= v[1] && x.bbox[3] <= v[3] + 1), x => x === c ? {fill: val.inh ? C.borrowed : C.value, op: .45, stroke: val.inh ? C.borrowed : C.value, sw: 2.5} : {});
    root.querySelector('.say2').innerHTML = val ? `<code>"text": "${esc(val.t)}"</code>, <code>"row_label": ${val.rowl ? `"${esc(val.rowl)}"` : 'null'}</code>, <code>"column_label": ${val.col ? `"${esc(val.col)}"` : 'null'}</code>, <code>"inherited_from_merged_cell": ${val.inh}</code>, <code>"source_cell": {"row": ${val.cell[1]}, "column": ${val.cell[2]}}</code>. ${val.inh ? `The box lit up is in <b>row ${val.cell[1]}</b>, the row above: the value is borrowed, and the pointer says where it really lives.` : 'The box lit up is exactly where the value is printed.'}` : '';
  };
  root.querySelector('.vals').innerHTML = `<div class="small muted">${esc(f.code)} “${esc(f.desc)}” · values[]</div>` + f.values.map((val, k) => `<button data-k="${k}" style="display:block;width:100%;text-align:left;margin:4px 0">${esc(val.rowl || '')} · ${esc(val.col || '')} → <b>${esc(val.t)}</b>${val.inh ? ' ↩' : ''}</button>`).join('');
  root.querySelectorAll('[data-k]').forEach(b => { const k = Number(b.dataset.k); b.addEventListener('mouseenter', () => show(k)); b.addEventListener('click', () => show(k)); });
  show(0);
};

/* ------------------------------------------------------------------ v1.0 vs v1.1 on the practice form */
VIZ.versions = (el) => {
  const now = SX.fields.smp, old = SX.sample_v10;
  const rows = now.map(f => { const o = old.find(x => x.code === f.code && x.desc === f.desc); return {f, o}; })
    .filter(({f, o}) => !o || JSON.stringify(o.values.map(v => [v.t, v.col])) !== JSON.stringify(f.values.map(v => [v.t, v.col])));
  const fmt = vs => vs.map(v => `“${esc(v.t || '')}”${v.col ? ` <span class="muted">(${esc(v.col)})</span>` : ''}`).join(', ');
  frame(el, `<div class="ctrl"><b>The practice form, read by both versions</b></div><table class="t"><tr><th>Field</th><th>v1.0.0</th><th>v1.1.0</th></tr>${rows.map(({f, o}) => `<tr><td><code>${esc(f.code)}</code> ${esc(f.desc)}</td><td>${o ? fmt(o.values) : '—'}</td><td>${fmt(f.values)}</td></tr>`).join('')}</table><div class="say2">Everything else on the form comes out the same in both versions.</div>`);
};

window.VIZ = VIZ;
})();
