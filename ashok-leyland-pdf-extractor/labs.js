/* Labs + line-by-line JavaScript ports of engine.py rules (checked by tools/verify.cjs). */
(function () {
const SX = window.SX;

/* ---------- ports of extractor/engine.py (keep in step with the Python) ---------- */
const CODE = /^((?:[A-Z]\s*)?\d+(?:\s*\.\s*\d+)+)\s*\.?(?:\s+[A-Z]\.)?$/;
const PORT = {
  clean: s => String(s || '').split(/\r?\n/).map(l => l.trim()).join('\n').trim(),
  // field_code(): fullmatch, strip whitespace, strip trailing dots
  fieldCode(text) {
    const m = CODE.exec(PORT.clean(text));
    return m ? m[1].replace(/\s+/g, '').replace(/\.+$/, '') : null;
  },
  // cells as objects {row, col, text, bbox}
  cellObjs: t => t.cells.map(c => ({row: c[0], col: c[1], rs: c[2], cs: c[3], text: c[4], bbox: c[5], key: c[0] + ',' + c[1]})),
  // _active_cells(): cells crossing the row's top line + 0.05 pt, left to right
  activeCells(cells, r) {
    const owners = cells.filter(c => c.row === r);
    if (!owners.length) return [];
    const middle = Math.min(...owners.map(c => c.bbox[1])) + 0.05;
    return cells.filter(c => c.bbox[1] <= middle && middle < c.bbox[3]).sort((a, b) => a.bbox[0] - b.bbox[0]);
  },
  // value_x vote from _interpret_table()
  votes(cells, rowCount, tableBbox) {
    const out = [];
    for (let r = 0; r < rowCount; r++) {
      const act = PORT.activeCells(cells, r), ne = act.filter(c => c.text);
      if (!ne.length || !PORT.fieldCode(ne[0].text)) continue;
      const code = ne[0], desc = act.filter(c => c.bbox[0] >= code.bbox[2] - 0.1).find(c => c.text);
      if (desc && desc.bbox[2] < tableBbox[2] - 5) out.push({row: r, x: Math.round(desc.bbox[2] * 10) / 10});
    }
    return out;
  },
  mode(xs) { // Counter.most_common(1): highest count, first seen wins ties
    const n = new Map(); xs.forEach(x => n.set(x, (n.get(x) || 0) + 1));
    let best = null; n.forEach((v, k) => { if (best === null || v > n.get(best)) best = k; });
    return best;
  },
  // _header(): overlap / wider width > 0.8
  overlapRatio(h, c) {
    const left = Math.max(h[0], c[0]), right = Math.min(h[2], c[2]);
    const width = Math.max(h[2] - h[0], c[2] - c[0]);
    return width > 0 ? (right - left) / width : 0;
  },
  header(cellBox, headers) { const h = headers.find(x => PORT.overlapRatio(x.bbox, cellBox) > 0.8); return h ? h.text : null; },
  // _hierarchy(): records [{id, code, kind}] in order → adds parent, level, tried
  hierarchy(records) {
    const seen = {}; let section = null;
    records.forEach(rec => {
      rec.parent = null; rec.level = rec.code ? rec.code.split('.').length : 1; rec.tried = [];
      if (rec.code) {
        const parts = rec.code.split('.'), cands = [];
        for (let i = parts.length - 1; i > 0; i--) cands.push(parts.slice(0, i).join('.'));
        let parent = null;
        outer: for (const stem of cands) for (const k of [stem, stem + '.0']) { rec.tried.push(k); if (seen[k]) { parent = seen[k]; break outer; } }
        if (parent) { rec.parent = parent.id; rec.level = parent.level + 1; } else rec.level = 1;
        seen[rec.code] = rec;
      } else if (section && rec.kind === 'section' && !section.code) { rec.parent = section.parent; rec.level = section.level; rec.viaSection = 'sibling'; }
      else if (section) { rec.parent = section.id; rec.level = section.level + 1; rec.viaSection = true; }
      if (rec.kind === 'section') section = rec;
    });
    return records;
  },
  wilson(k, n, z = 1.96) {
    if (!n) return [0, 0];
    const p = k / n, z2 = z * z, den = 1 + z2 / n;
    const c = (p + z2 / (2 * n)) / den, m = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return [Math.max(0, c - m), Math.min(1, c + m)];
  },
};
window.PORT = PORT;

/* ---------- helpers (DOM only at render time) ---------- */
const H = () => window.SXJ;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const emit = (d) => H() && H().emit('lab', d);
const short = (s, n = 40) => { s = String(s ?? '').replace(/\n/g, ' ⏎ '); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
function fieldBy(doc, pred) { return (SX.fields[doc] || []).find(pred); }

const LABS = {};
const has = id => !SX.withheld || (SX.available || []).includes(id);
const needsNote = what => `<div class="out">This lab uses ${what}. That material is not included in the shared copy of this course; follow the README to rebuild the full version locally.</div>`;

/* ================= regex ================= */
LABS.regex = {
  title: 'Is this a field code?', where: 'Station 7 · engine.py CODE + field_code()',
  sub: 'Type any cell text. The JavaScript copy of the regex runs live; Python\'s own answer is shown when the text is one of the real cells captured from your PDFs.',
  render(el) {
    const cases = SX.regex_cases, py = new Map(cases);
    const agree = cases.filter(([t, c]) => PORT.fieldCode(t) === c).length;
    const presets = ['D 22.14.4 I.', 'B 2.3.4', '1.2.1.', 'A1.6', 'E 31.10', '4x2', '2026', '1.65', '0.70', '16.5±1.0 : 1', '1.0 kW', 'a1.6', 'AB1.2', 'A 1 . 6', 'Table 2', '10 degs'];
    el.innerHTML = `<div class="ctl"><input type="text" value="D 22.14.4 I." style="flex:1;min-width:220px;font-family:var(--mono)" aria-label="Cell text"></div>
      <div class="ctl">${presets.map(p => `<span class="chip" data-p="${esc(p)}">${esc(p)}</span>`).join('')}</div><div class="out"></div>
      <p class="small">Port check: the JavaScript regex agrees with Python on <b>${agree}/${cases.length}</b> ${SX.withheld ? 'test texts' : 'real cell texts from the specimen pages'}.</p>`;
    const inp = el.querySelector('input'), out = el.querySelector('.out');
    const why = t => {
      const c = PORT.clean(t);
      if (!c) return 'empty cell';
      const head = /^(?:[A-Z]\s*)?\d+(?:\s*\.\s*\d+)+/.exec(c);
      if (!head) {
        if (/^\d+$/.test(c)) return 'a plain number: the regex needs at least one ".number" part';
        if (/^[a-z]/.test(c)) return 'starts with a lowercase letter; only one optional CAPITAL is allowed';
        if (/^[A-Z]{2}/.test(c)) return 'two letters before the number; only one is allowed';
        if (/^[A-Z]\s*\d+$/.test(c)) return 'letter + number but no ".number" part';
        return 'does not start with the shape [Letter] number.number';
      }
      return `the code shape "${head[0]}" is followed by extra text "${c.slice(head[0].length)}", and fullmatch needs the whole cell to match`;
    };
    const run = () => {
      const t = inp.value, js = PORT.fieldCode(t), known = py.has(t) || py.has(PORT.clean(t));
      const pyv = py.has(t) ? py.get(t) : py.get(PORT.clean(t));
      out.innerHTML = js ? `<span class="ok">✔ field code</span> → <code>${esc(js)}</code> <span class="small">(spaces removed, trailing dot stripped)</span>`
        : `<span class="bad">✖ not a code</span>: ${esc(why(t))}`;
      if (known) out.innerHTML += `<div class="small" style="margin-top:6px">Python (real engine) says: <code>${esc(JSON.stringify(pyv))}</code> ${pyv === js ? '<span class="ok">agrees</span>' : '<span class="bad">differs</span>'}</div>`;
      if (/^\d+\.\d+$/.test(js || '')) out.innerHTML += `<div class="why-box">Careful: this looks like a number (a ratio or a measurement). It only becomes a code if it is the <b>first non-empty cell</b> of a row. In the value column it is just a value.</div>`;
      emit({id: 'regex', what: 'test', code: js, text: t});
    };
    inp.addEventListener('input', run);
    el.querySelectorAll('[data-p]').forEach(c => c.addEventListener('click', () => { inp.value = c.dataset.p; run(); }));
    run();
  },
};

/* ================= merge (active cells) ================= */
LABS.merge = {
  title: 'Who crosses this row?', where: 'Station 5 · engine.py _active_cells()',
  sub: 'Real cells from Table 03 page 1. Pick a row: the dashed probe line is drawn 0.05 pt below the row\'s top, and every cell it crosses is active. Switch on "naive" to see what a reader that only uses each row\'s own cells would produce.',
  render(el, opts) {
    const groups = {
      s22: {label: 'Practice form · A2.2 Height (Van / Bus / Mini)', spec: 'smp-01', rows: [7, 8, 9], vx: 300},
      s23: {label: 'Practice form · A2.3 Seats (shared answer)', spec: 'smp-01', rows: [10, 11, 12], vx: 300},
      b11: {label: 'Table 03 · B1.1 Overall Length (CC / FSD / HSD)', spec: 't03-01', rows: [2, 3, 4], vx: 269},
      b18: {label: 'Table 03 · B1.8 Refer Annexure', spec: 't03-01', rows: [21, 22, 23, 24], vx: 269}};
    Object.keys(groups).forEach(k => { if (!has(groups[k].spec)) delete groups[k]; });
    let g = 's22', row = 9, naive = false, cells = PORT.cellObjs(SX.specimens['smp-01'].tables[0]);
    el.innerHTML = `<div class="ctl"><select aria-label="Example">${Object.entries(groups).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select><span class="rows"></span><label class="small"><input type="checkbox" class="nv"> naive: own cells only</label></div><svg></svg><div class="out"></div>`;
    const svg = el.querySelector('svg'), out = el.querySelector('.out');
    const draw = () => {
      const G = groups[g];
      cells = PORT.cellObjs(SX.specimens[G.spec].tables[0]);
      el.querySelector('.rows').innerHTML = G.rows.map(r => `<button class="${r === row ? 'primary' : ''}" data-r="${r}">row ${r}</button>`).join(' ');
      el.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { row = Number(b.dataset.r); draw(); }));
      const shown = cells.filter(c => G.rows.some(r => PORT.activeCells(cells, r).includes(c)));
      const x0 = Math.min(...shown.map(c => c.bbox[0])), y0 = Math.min(...shown.map(c => c.bbox[1])), x1 = Math.max(...shown.map(c => c.bbox[2])), y1 = Math.max(...shown.map(c => c.bbox[3]));
      const act = naive ? cells.filter(c => c.row === row) : PORT.activeCells(cells, row);
      const own = cells.filter(c => c.row === row), probe = Math.min(...own.map(c => c.bbox[1])) + 0.05;
      svg.setAttribute('viewBox', `${x0 - 4} ${y0 - 4} ${x1 - x0 + 8} ${y1 - y0 + 8}`);
      svg.style.maxHeight = '260px';
      svg.innerHTML = shown.map(c => {
        const on = act.includes(c), merged = c.rs > 1 || c.cs > 1;
        return `<rect x="${c.bbox[0]}" y="${c.bbox[1]}" width="${c.bbox[2] - c.bbox[0]}" height="${c.bbox[3] - c.bbox[1]}" fill="${on ? (c.row === row ? '#3987e540' : '#9085e966') : (merged ? '#9085e918' : 'none')}" stroke="${on ? '#3987e5' : '#6b7c8c'}" stroke-width="${on ? 1.6 : .6}"/>` +
          `<text x="${c.bbox[0] + 3}" y="${Math.min(c.bbox[3] - 3, c.bbox[1] + 10)}" font-size="8" fill="currentColor">${esc(short(c.text, 26))}</text>`;
      }).join('') + (naive ? '' : `<line x1="${x0 - 4}" x2="${x1 + 4}" y1="${probe}" y2="${probe}" stroke="#d95926" stroke-width="1.2" stroke-dasharray="4 3"/>`);
      const vals = act.filter(c => c.bbox[0] >= G.vx - .2);
      out.innerHTML = `<b>Row ${row}</b>: ${act.length} ${naive ? 'own' : 'active'} cell(s)<ul class="keys" style="margin:6px 0">${act.map(c => `<li><code>${esc(short(c.text || '(empty)', 34))}</code> · owner row ${c.row}${c.row !== row ? ' · <span style="color:#9085e9">inherited ↩</span>' : ''}</li>`).join('')}</ul>` +
        (naive && !vals.some(v => v.text) ? `<div class="bad">Naive result: this row has <b>no values</b>, a false blank. The form does answer it, through the merged cell above.</div>` : '');
      if (opts && opts.pv) opts.pv.set(opts.pv.state.spec === G.spec ? {sel: {row}} : {spec: G.spec, layers: ['cells'], focus: {rows: G.rows}, sel: {row}});
      emit({id: 'merge', what: 'row', row, naive});
    };
    el.querySelector('select').addEventListener('change', e => { g = e.target.value; row = groups[g].rows[groups[g].rows.length - 1]; draw(); });
    el.querySelector('.nv').addEventListener('change', e => { naive = e.target.checked; draw(); });
    draw();
  },
};

/* ================= boundary (value_x) ================= */
LABS.boundary = {
  title: 'Drag the value boundary', where: 'Station 6 · engine.py value_x vote',
  sub: 'The bars are the real votes (where each description box ends). The orange line starts at the winner. Drag it and count how many rows the script would now read differently: violet = row name, orange = answer.',
  render(el, opts) {
    const specs = ['smp-01', 't02-01', 't03-01', 't4e-01', 't06-04', 't06-09'].filter(has);
    let spec = 'smp-01';
    el.innerHTML = `<div class="ctl"><select aria-label="Page">${specs.map(s => `<option value="${s}" ${s === spec ? 'selected' : ''}>${H().pageLabel(s)}</option>`).join('')}</select><input type="range" step="0.1" style="flex:1;min-width:200px" aria-label="value_x"><b class="vx mono"></b><button class="ghost reset">reset to vote</button></div><svg class="hist" style="max-height:150px"></svg><div class="out"></div><svg class="map"></svg>`;
    const range = el.querySelector('input'), out = el.querySelector('.out');
    let t, cells, cx, tr, votes, real, lo, hi;
    const load = () => {
      const sp = SX.specimens[spec]; t = sp.tables[0]; tr = sp.traces[0]; cells = PORT.cellObjs(t); cx = {}; cells.forEach(c => { cx[c.key] = c; });
      votes = PORT.votes(cells, t.row_count, t.bbox); real = tr.value_x;
      lo = Math.floor(Math.min(...votes.map(v => v.x)) - 60); hi = Math.ceil(Math.max(...votes.map(v => v.x)) + 60);
      range.min = lo; range.max = hi; range.value = real;
      const counts = {}; votes.forEach(v => { counts[v.x] = (counts[v.x] || 0) + 1; });
      const max = Math.max(...Object.values(counts)), W = 600, sx = x => (x - lo) / (hi - lo) * W;
      el.querySelector('.hist').setAttribute('viewBox', `0 -34 ${W} 144`);
      el.querySelector('.hist').innerHTML = Object.entries(counts).sort((a, b) => a[0] - b[0]).map(([x, n], i) => `<rect x="${sx(+x) - 5}" y="${90 - 80 * n / max}" width="10" height="${80 * n / max}" fill="#3987e5"/><text x="${sx(+x)}" y="${84 - 80 * n / max - (i % 2) * 15}" text-anchor="${i % 2 ? 'start' : 'end'}" font-size="11" fill="currentColor">${n}× ${x}</text>`).join('') + `<line class="vl" y1="0" y2="100" stroke="#d95926" stroke-width="2" stroke-dasharray="5 3"/><line x1="0" x2="${W}" y1="90" y2="90" stroke="var(--line2)"/>`;
      update();
    };
    const update = () => {
      const vx = Number(range.value), W = 600;
      el.querySelector('.vx').textContent = `value_x = ${vx.toFixed(1)}${Math.abs(vx - real) < .05 ? ' (the vote)' : ''}`;
      const l = el.querySelector('.vl'); const X = (vx - lo) / (hi - lo) * W; l.setAttribute('x1', X); l.setAttribute('x2', X);
      let changed = 0; const diffs = [], paint = {};
      tr.rows.filter(r => r.kind === 'record' && r.code).forEach(r => {
        const cand = r.row_labels.concat(r.values).map(k => cx[k]);
        const realLabels = new Set(r.row_labels);
        const nowLabels = new Set(cand.filter(c => c.bbox[0] < vx - .2).map(c => c.key));
        cand.forEach(c => { paint[c.key] = nowLabels.has(c.key) ? 'label' : 'value'; });
        paint[r.description] = 'desc'; if (r.code_cell) paint[r.code_cell] = 'code';
        const same = realLabels.size === nowLabels.size && [...realLabels].every(k => nowLabels.has(k));
        if (!same) {
          changed++;
          const moved = cand.filter(c => realLabels.has(c.key) !== nowLabels.has(c.key));
          if (diffs.length < 6) diffs.push(`<li><code>${esc(r.code)}</code>: ${moved.map(c => `"${esc(short(c.text || '(empty)', 18))}" → ${nowLabels.has(c.key) ? 'row label' : 'value'}`).join(', ')}</li>`);
        }
      });
      out.innerHTML = changed ? `<span class="bad">✖ ${changed} row(s) classified differently from the real engine.</span><ul class="keys" style="margin:6px 0">${diffs.join('')}</ul>` : `<span class="ok">✔ Same classification as the real engine on every code row.</span>`;
      const b = t.bbox, map = el.querySelector('.map');
      map.setAttribute('viewBox', `${b[0] - 2} ${b[1] - 2} ${b[2] - b[0] + 4} ${b[3] - b[1] + 4}`); map.style.maxHeight = '560px';
      const col = {code: '#199e70', desc: '#3987e5', label: '#9085e9', value: '#d95926'};
      map.innerHTML = cells.map(c => `<rect x="${c.bbox[0]}" y="${c.bbox[1]}" width="${c.bbox[2] - c.bbox[0]}" height="${c.bbox[3] - c.bbox[1]}" fill="${paint[c.key] ? col[paint[c.key]] : 'none'}" fill-opacity=".35" stroke="var(--line2)" stroke-width=".5"/>`).join('') +
        `<line x1="${vx}" x2="${vx}" y1="${b[1] - 2}" y2="${b[3] + 2}" stroke="#d95926" stroke-width="2.5" stroke-dasharray="6 3"/>`;
      emit({id: 'boundary', what: 'drag', changed, spec});
    };
    el.querySelector('select').addEventListener('change', e => { spec = e.target.value; load(); if (opts && opts.pv) opts.pv.set({spec, layers: ['roles', 'valuex'], focus: null}); });
    range.addEventListener('input', update);
    el.querySelector('.reset').addEventListener('click', () => { range.value = real; update(); });
    load();
  },
};

/* ================= overlap (_header) ================= */
LABS.overlap = {
  title: 'Does this value get the header?', where: 'Station 8 · engine.py _header()',
  sub: 'Two horizontal spans: a header cell and a value cell. The label is assigned only when overlap ÷ the wider width is strictly greater than 0.8. Presets use real boxes from Table 02 A3.0 / A3.1.',
  render(el) {
    const real = has('t02-01'), sp = SX.specimens[real ? 't02-01' : 'smp-01'], cells = PORT.cellObjs(sp.tables[0]), k = key => cells.find(c => c.key === key);
    const tr = sp.traces[0].rows, hr = tr.find(r => r.row === (real ? 27 : 5)), vr = tr.find(r => r.row === (real ? 28 : 6));
    const h1 = k(hr.values[0]), h2 = k(hr.values[1]), v1 = k(vr.values[0]), v2 = k(vr.values[1]);
    const q = c => `"${c.text}"`;
    const presets = [
      [`${q(v1)} vs ${q(h1)}`, h1, v1], [`${q(v2)} vs ${q(h2)}`, h2, v2], [`${q(v2)} vs ${q(h1)}`, h1, v2],
      ['half-width value', h1, {text: 'made up', bbox: [h1.bbox[0], 0, (h1.bbox[0] + h1.bbox[2]) / 2, 0]}],
    ];
    let H0 = h1, V = [v1.bbox[0], v1.bbox[2]];
    el.innerHTML = `<div class="ctl">${presets.map((p, i) => `<button data-i="${i}">${esc(p[0])}</button>`).join('')}</div>
      <div class="ctl"><span class="small">value x0</span><input type="range" class="a" min="280" max="566" step="0.5" style="flex:1"><span class="small">x1</span><input type="range" class="b" min="280" max="570" step="0.5" style="flex:1"></div><svg viewBox="270 0 310 90"></svg><div class="out"></div>`;
    const a = el.querySelector('.a'), b = el.querySelector('.b'), svg = el.querySelector('svg'), out = el.querySelector('.out');
    const draw = () => {
      let x0 = Number(a.value), x1 = Number(b.value); if (x1 < x0 + 1) { x1 = x0 + 1; b.value = x1; } V = [x0, x1];
      const hb = H0.bbox, r = PORT.overlapRatio(hb, [x0, 0, x1, 0]), hit = r > 0.8;
      const ol = Math.max(hb[0], x0), or = Math.min(hb[2], x1);
      svg.innerHTML = `<rect x="${hb[0]}" y="10" width="${hb[2] - hb[0]}" height="22" fill="#9085e955" stroke="#9085e9"/><text x="${hb[0] + 3}" y="25" font-size="10" fill="currentColor">header: ${esc(H0.text)}</text>
        <rect x="${x0}" y="50" width="${x1 - x0}" height="22" fill="#d9592655" stroke="#d95926"/><text x="${x0 + 3}" y="65" font-size="10" fill="currentColor">value</text>
        ${or > ol ? `<rect x="${ol}" y="34" width="${or - ol}" height="14" fill="#199e70aa"/>` : ''}`;
      out.innerHTML = `overlap = ${Math.max(0, or - ol).toFixed(1)} pt · wider width = ${Math.max(hb[2] - hb[0], x1 - x0).toFixed(1)} pt · ratio = <b>${r.toFixed(3)}</b> → ${hit ? `<span class="ok">✔ column_label = "${esc(H0.text)}"</span>` : '<span class="bad">✖ no label (needs &gt; 0.8)</span>'}`;
      emit({id: 'overlap', what: 'try', ratio: r});
    };
    const setP = i => { const p = presets[i]; H0 = p[1]; a.value = p[2].bbox[0]; b.value = p[2].bbox[2]; draw(); };
    el.querySelectorAll('[data-i]').forEach(x => x.addEventListener('click', () => setP(Number(x.dataset.i))));
    a.addEventListener('input', draw); b.addEventListener('input', draw);
    setP(0);
  },
};

/* ================= tree (_hierarchy) ================= */
LABS.tree = {
  title: 'Build the family tree', where: 'Station 9 · engine.py _hierarchy()',
  sub: 'One record per line, in printed order. Write a code (A1.6.1), or "- Title" for a row without a code. Add " §" to mark a section. The JavaScript port of _hierarchy() links them and shows every lookup it tried.',
  render(el) {
    const fmt = fs => fs.map(f => `${f.code || '- ' + f.desc.split('\n')[0].slice(0, 30)}${f.kind === 'section' ? ' §' : ''}`).join('\n');
    const t06 = (SX.fields.t06 || []).filter(f => /^E1[0-4]\.\d/.test(f.code || '') || /^E1[0-4]\.0$/.test(f.code || ''));
    const presets = {
      ...(SX.fields.t02 ? {t02: ['Table 02 (all 31)', fmt(SX.fields.t02)]} : {smp: ['Practice form', fmt(SX.fields.smp)]}),
      gap: ['gaps + .0 aliases', '1.0 §\n1.1\n1.2.1 §\n1.2.1.13 §\n1.2.1.13.1\nA1.0 §\nA1.1\nB7.4'],
      misprint: ['misprint (Table 06 E10–E14)', t06.length ? fmt(t06) : (SX.code_lists || {}).misprint || ''],
      ...(SX.fields.t07 ? {uncoded: ['no codes (Table 07 p.1)', fmt(SX.fields.t07.filter(f => f.page === 1).slice(0, 30))]} : {}),
      dup: ['repeated code', 'B1.0 §\nB1.1\nB1.1.1\nB1.1 §\nB1.1.1'],
    };
    let preset = 'gap';
    el.innerHTML = `<div class="ctl">${Object.entries(presets).map(([k, v]) => `<button data-p="${k}">${esc(v[0])}</button>`).join('')}</div>
      <div style="display:grid;grid-template-columns:minmax(160px,1fr) 2fr;gap:12px"><textarea rows="14" class="mono" style="width:100%;background:var(--panel2);border:1px solid var(--line2);border-radius:8px;padding:8px;font-size:12.5px" aria-label="Records"></textarea><div class="out" style="margin:0;max-height:420px;overflow:auto"></div></div>`;
    const ta = el.querySelector('textarea'), out = el.querySelector('.out');
    const run = () => {
      const recs = ta.value.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
        const sec = /\s§$/.test(l); const body = l.replace(/\s§$/, '').trim();
        const code = body.startsWith('-') ? null : (PORT.fieldCode(body) || body);
        return {id: 'r' + (i + 1), code, kind: sec ? 'section' : 'field', label: body.startsWith('-') ? body.slice(1).trim() : ''};
      });
      PORT.hierarchy(recs);
      const kids = {}; recs.forEach(r => { (kids[r.parent || 'root'] = kids[r.parent || 'root'] || []).push(r); });
      const node = r => `<li><code>${esc(r.code || '—')}</code> ${esc(r.label)} <span class="small">L${r.level}${r.kind === 'section' ? ' §' : ''} · ${r.code ? (r.parent ? `tried ${r.tried.map(esc).join(' → ')} ✔` : `tried ${r.tried.map(esc).join(' → ') || 'nothing'} → top level`) : (r.parent ? 'no code → last section' : 'no code, no section yet')}</span>${kids[r.id] ? `<ul>${kids[r.id].map(node).join('')}</ul>` : ''}</li>`;
      const deep = Math.max(...recs.map(r => r.level));
      out.innerHTML = `<ul style="padding-left:16px;margin:0;line-height:1.65;font-size:13.5px">${(kids.root || []).map(node).join('')}</ul>` + (deep > 6 ? `<div class="why-box">Depth reaches level ${deep}: uncoded sections chain into each other. Values stay right; parent_id and level mislead.</div>` : '');
      emit({id: 'tree', what: 'run', preset});
    };
    el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { preset = b.dataset.p; ta.value = presets[preset][1]; run(); }));
    ta.addEventListener('input', () => { preset = 'custom'; run(); });
    ta.value = presets[preset][1]; run();
  },
};

/* ================= jobs (app.py flow) ================= */
LABS.jobs = {
  title: 'Run a batch through the front door', where: 'Station 3 · app.py upload + _run_job + download_zip',
  sub: 'A simulation of app.py\'s rules with realistic files. Upload validation rejects the <b>whole batch</b>; extraction failures are isolated <b>per document</b>. Watch the difference.',
  render(el) {
    const FILES = [
      {name: 'Table 02_Ver.01.pdf', mb: 0.3, pages: 1, fields: 31, on: true},
      {name: 'locked_spec.pdf', mb: 0.2, pages: 3, kind: 'locked', on: true},
      {name: 'Table 05_Ver.01.pdf', mb: 0.6, pages: 8, fields: 306, on: true},
      {name: 'scanned_table03.pdf', mb: 4.1, pages: 2, kind: 'scan'},
      {name: 'notes.pdf', mb: 0.01, kind: 'notpdf'},
      {name: 'huge_drawings.pdf', mb: 31, pages: 40, kind: 'big'},
    ];
    el.innerHTML = `<div class="ctl" style="flex-direction:column;align-items:stretch">${FILES.map((f, i) => `<label class="small"><input type="checkbox" data-f="${i}" ${f.on ? 'checked' : ''}> <code>${esc(f.name)}</code> · ${f.mb} MB${f.kind === 'locked' ? ' · password-protected' : f.kind === 'scan' ? ' · scanned images only' : f.kind === 'notpdf' ? ' · really a .txt, renamed' : ''}</label>`).join('')}</div>
      <div class="ctl"><button class="primary up">POST /api/jobs</button><button class="zip" disabled>GET …/download (ZIP)</button></div><div class="out log mono" style="font-size:12.5px;white-space:pre-wrap">Choose files and upload.</div>`;
    const log = el.querySelector('.log'), zipB = el.querySelector('.zip'); let job = null, timer = null;
    const pick = () => [...el.querySelectorAll('[data-f]')].filter(c => c.checked).map(c => FILES[Number(c.dataset.f)]);
    el.querySelector('.up').addEventListener('click', () => {
      clearInterval(timer); zipB.disabled = true; job = null;
      const files = pick(); const lines = [];
      if (!files.length || files.length > 10) { log.innerHTML = `<span class="bad">400</span> Upload 1 to 10 PDFs at a time.`; return emit({id: 'jobs', what: 'upload', status: 400}); }
      let total = 0;
      for (const f of files) {
        total += f.mb;
        if (f.mb > 25) { log.innerHTML = `<span class="bad">413</span> ${esc(f.name)} exceeds the 25 MB limit.\n→ whole batch rejected; tmp/uploads/&lt;id&gt;/ deleted; nothing queued.`; return emit({id: 'jobs', what: 'upload', status: 413}); }
        if (total > 100) { log.innerHTML = `<span class="bad">413</span> The batch exceeds the 100 MB limit.`; return emit({id: 'jobs', what: 'upload', status: 413}); }
        if (f.kind === 'notpdf') { log.innerHTML = `<span class="bad">400</span> ${esc(f.name)} is not a valid PDF.  (no "%PDF-" in the first 1 KB)\n→ whole batch rejected; folder deleted; nothing queued.`; return emit({id: 'jobs', what: 'upload', status: 400}); }
      }
      job = files.map((f, i) => ({f, id: i, status: 'queued', done: 0}));
      lines.push(`<span class="ok">202 Accepted</span> {"id": "3f9c…", "status": "queued", documents: ${files.length}}\nworker thread picks the job up…`);
      log.innerHTML = lines.join('\n');
      emit({id: 'jobs', what: 'upload', status: 202});
      let i = 0;
      timer = setInterval(() => {
        const d = job[i];
        if (!d) {
          clearInterval(timer); const okN = job.filter(x => x.status === 'complete').length;
          log.innerHTML += `\njob.status = "${okN ? 'complete' : 'failed'}"${okN ? '' : ' (no document succeeded)'}`; zipB.disabled = !okN; return;
        }
        if (d.f.kind === 'locked') { d.status = 'failed'; d.err = 'This PDF cannot be read. It may be damaged or password protected.'; log.innerHTML += `\n[${d.id}] ${esc(d.f.name)}: <span class="bad">failed</span>: ${d.err}`; i++; return; }
        d.done++; d.status = 'processing';
        if (d.done >= d.f.pages) {
          d.status = 'complete';
          log.innerHTML += `\n[${d.id}] ${esc(d.f.name)}: <span class="ok">complete</span> · ${d.f.pages}/${d.f.pages} pages · ${d.f.kind === 'scan' ? '0 fields · status needs_review (requires_ocr pages 1, 2)' : d.f.fields + ' fields'}`;
          i++;
        }
      }, 260);
    });
    zipB.addEventListener('click', () => {
      const ok = job.filter(d => d.status === 'complete'), bad = job.filter(d => d.status === 'failed');
      const names = ok.map(d => `${String(d.id + 1).padStart(2, '0')}_${d.f.name.replace(/\.pdf$/i, '')}.json`);
      if (bad.length) names.push('errors.json');
      log.innerHTML += `\n\nextracted_documents.zip\n${names.map(n => '  ├─ ' + esc(n)).join('\n')}${bad.length ? `\n\nerrors.json = ${esc(JSON.stringify(bad.map(d => ({filename: d.f.name, error: d.err}))))}\nNote the numbering: files keep their upload position, so a gap shows where a failure was.` : ''}`;
      emit({id: 'jobs', what: 'zip', failed: bad.length});
    });
  },
};

/* ================= accuracy ================= */
LABS.accuracy = {
  title: 'What does 72/74 mean?', where: 'Station 11 · evaluate.py + holdout_report.json',
  sub: 'Every square is one real holdout check from evaluation/holdout_report.json. Click one to see what was expected and what the frozen parser produced. Below: a Wilson interval calculator, with the caveat that it assumes random sampling.',
  render(el) {
    const docs = SX.holdout.docs, all = [];
    docs.forEach(d => d.checks.forEach(c => all.push(Object.assign({doc: d.file, kind: 'value'}, c))));
    docs.forEach(d => d.labels.forEach(c => all.push(Object.assign({doc: d.file, kind: 'label'}, c))));
    const sq = (c, i) => `<button data-i="${i}" title="${esc(c.doc)} p.${c.spec.page}" style="width:22px;height:22px;padding:0;border-radius:4px;background:${c.passed ? '#0ca30c' : '#d03b3b'};border-color:transparent;${c.kind === 'label' ? 'outline:2px dashed #c98500;outline-offset:1px' : ''}"></button>`;
    el.innerHTML = docs.map(d => `<div class="small" style="margin:8px 0 4px"><b>${esc(d.file)}</b> · ${d.fields} fields · value checks ${d.checks.filter(c => c.passed).length}/${d.checks.length}</div><div style="display:flex;flex-wrap:wrap;gap:4px">${all.map((c, i) => c.doc === d.file && c.kind === 'value' ? sq(c, i) : '').join('')}</div>`).join('') +
      `<div class="small" style="margin:10px 0 4px"><b>Variant-label checks</b> (reported separately)</div><div style="display:flex;gap:4px">${all.map((c, i) => c.kind === 'label' ? sq(c, i) : '').join('')}</div>
      <div class="out det">Click a square.</div>
      <h4 style="margin:16px 0 4px">Wilson 95% interval</h4><div class="ctl"><span class="small">passed k</span><input type="number" class="k" value="72" min="0" style="width:70px"><span class="small">of n</span><input type="number" class="n" value="74" min="1" style="width:70px"></div><svg class="wil" viewBox="0 0 600 50"></svg><div class="out wout"></div>`;
    const det = el.querySelector('.det');
    el.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
      const c = all[Number(b.dataset.i)], s = c.spec;
      if (c.withheld) { det.innerHTML = `<b>${esc(c.doc)}</b> · page ${s.page} · ${esc(s.field_id || '')} · ${c.passed ? '<span class="ok">✔ passed</span>' : '<span class="bad">✖ failed</span>'}<br><span class="muted">The expected and actual values are client data and are not included in this copy.</span>`; emit({id: 'accuracy', what: 'check', passed: c.passed, kind: c.kind}); return; }
      const exp = s.values || s.labels || s.expected;
      det.innerHTML = `<b>${esc(c.doc)}</b> · page ${s.page} · ${esc(s.field_id || s.row_label || s.description_contains || '')} · ${c.kind === 'label' ? 'column_label check' : s.type === 'table_cell' ? 'table cell check' : 'value check'}<br>expected <code>${esc(JSON.stringify(exp))}</code><br>actual&nbsp;&nbsp; <code>${esc(JSON.stringify(c.actual))}</code><br>${c.passed ? '<span class="ok">✔ passed</span>' : '<span class="bad">✖ failed</span>' + (c.kind === 'value' ? ' (an extra "" from a 7.0 pt spacer cell)' : ' (no header row recognised, so labels are null)')}`;
      emit({id: 'accuracy', what: 'check', passed: c.passed, kind: c.kind});
    }));
    const kI = el.querySelector('.k'), nI = el.querySelector('.n');
    const w = () => {
      const n = Math.max(1, Number(nI.value) || 1), k = Math.min(n, Math.max(0, Number(kI.value) || 0)), [lo, hi] = PORT.wilson(k, n);
      el.querySelector('.wil').innerHTML = `<line x1="10" x2="590" y1="25" y2="25" stroke="var(--line2)"/><rect x="${10 + lo * 580}" y="15" width="${(hi - lo) * 580}" height="20" fill="#3987e555" stroke="#3987e5"/><circle cx="${10 + k / n * 580}" cy="25" r="5" fill="#d95926"/><text x="10" y="48" font-size="10" fill="currentColor">0%</text><text x="572" y="48" font-size="10" fill="currentColor">100%</text>`;
      el.querySelector('.wout').innerHTML = `${k}/${n} = <b>${(100 * k / n).toFixed(1)}%</b> · 95% Wilson interval <b>${(100 * lo).toFixed(1)}% – ${(100 * hi).toFixed(1)}%</b>. <span class="small">Valid only for a random sample. These checks were chosen to be hard (purposive), so treat it as a rough guide, not a guarantee.</span>`;
    };
    kI.addEventListener('input', w); nI.addEventListener('input', w); w();
  },
};

/* ================= vin (Table 11) ================= */
LABS.vin = {
  title: 'Read the VIN code grids', where: 'Station 12 · Table 11 page 2',
  sub: 'Table 11 prints two lookup grids: digit 10 of the VIN encodes the year, digit 12 the month (per year). The engine extracts every cell; here they are read back as grids. Toggle "naive zip" to see what happens if the blank spacer values are not removed first.',
  render(el) {
    if (!SX.fields.t11) { el.innerHTML = needsNote('the Table 11 code grids'); return; }
    const F = SX.fields.t11;
    let naive = false, years = {}, months = {}, clean = null;
    const build = nv => {
      const ys0 = {}, ms0 = {}, keep = vs => nv ? vs.map(v => v.t) : vs.map(v => v.t).filter(Boolean);
      F.forEach((f, i) => {
        if (f.desc === 'YEAR' && F[i + 1] && F[i + 1].desc === 'CODE') { const ys = keep(f.values), cs = keep(F[i + 1].values); ys.forEach((y, j) => { if (y) ys0[y] = cs[j]; }); }
        if (/^\d{4}$/.test(f.desc)) {
          const ys = [f.desc].concat(keep(f.values));
          for (let m = 1; m <= 12 && F[i + m]; m++) { const row = F[i + m], cs = [row.desc].concat(keep(row.values)); ys.forEach((y, j) => { if (y) (ms0[y] = ms0[y] || {})[row.desc] = cs[j + 1]; }); }
        }
      });
      return {years: ys0, months: ms0};
    };
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    el.innerHTML = `<div class="ctl"><label class="small"><input type="checkbox" class="nv"> naive zip (keep blank "" values)</label></div>
      <div class="ctl"><b class="small">Encode</b><select class="y" aria-label="Year"></select><select class="m" aria-label="Month">${MON.map(m => `<option>${m}</option>`).join('')}</select><span class="enc mono"></span></div>
      <div class="ctl"><b class="small">Decode</b><input type="text" class="v mono" value="XYZABCGCD0JRDX737" maxlength="17" style="width:220px" aria-label="VIN"><button class="go">decode</button></div><div class="out"></div>`;
    const out = el.querySelector('.out');
    const fillYears = () => { const s = el.querySelector('.y'), cur = s.value || '2026'; s.innerHTML = Object.keys(years).sort().map(y => `<option ${y === cur ? 'selected' : ''}>${y}</option>`).join(''); };
    const enc = () => {
      const y = el.querySelector('.y').value, m = el.querySelector('.m').value, yc = years[y], mc = (months[y] || {})[m];
      const wrong = naive && (clean.years[y] !== yc || (clean.months[y] || {})[m] !== mc);
      el.querySelector('.enc').innerHTML = `digit 10 = <b>${esc(yc ?? '?')}</b> · digit 12 = <b>${esc(mc ?? '?')}</b>${wrong ? ` <span class="bad">← shifted by the blank spacer! (correct: ${esc(clean.years[y])} / ${esc((clean.months[y] || {})[m])})</span>` : ''}`;
    };
    const dec = () => {
      const v = el.querySelector('.v').value.trim().toUpperCase();
      if (v.length !== 17) { out.innerHTML = `<span class="bad">A VIN has 17 characters; this has ${v.length}.</span>`; return; }
      const d10 = v[9], d12 = v[11], ys = Object.keys(years).filter(y => years[y] === d10);
      let html = `digit 10 = <b>${esc(d10)}</b>, digit 12 = <b>${esc(d12)}</b><br>`;
      if (!ys.length) html += `<span class="bad">"${esc(d10)}" is not a year code in this grid.</span> <span class="small">The form's example VIN is anonymised (Ashok Leyland copies are masked), so it doesn't decode. Try encoding a date above and pasting a VIN with those digits.</span>`;
      ys.forEach(y => { const ms = MON.filter(m => (months[y] || {})[m] === d12); html += `→ year <b>${y}</b>, month ${ms.length ? `<b>${ms.join(' or ')}</b>${ms.length > 1 ? ' <span class="bad">(ambiguous as printed)</span>' : ''}` : `<span class="bad">no month in ${y} uses "${esc(d12)}"</span>`}<br>`; });
      out.innerHTML = html; emit({id: 'vin', what: 'decode', ok: ys.length > 0});
    };
    const all = () => { clean = build(false); ({years, months} = build(naive)); fillYears(); enc(); };
    el.querySelector('.nv').addEventListener('change', e => { naive = e.target.checked; all(); });
    el.querySelector('.y').addEventListener('change', () => { enc(); emit({id: 'vin', what: 'decode', ok: true}); });
    el.querySelector('.m').addEventListener('change', () => { enc(); emit({id: 'vin', what: 'decode', ok: true}); });
    el.querySelector('.go').addEventListener('click', dec);
    all(); dec();
  },
};

window.LABS = LABS;
})();
