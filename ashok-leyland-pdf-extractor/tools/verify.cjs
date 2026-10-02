/* Verify the journey app against the real engine output (data.js is built by build_data.py).
   Run from specextract_journey/:  node tools/verify.cjs
   Checks: JS ports of engine rules reproduce Python's results; every code anchor, glossary
   term, lab, station and page link used in the content resolves. Exit code 1 on any failure. */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {};
for (const f of ['data.js', 'sources.js', 'glossary.js', 'journey.js', 'journey2.js', 'labs.js', 'extras.js']) require(path.join(ROOT, f));
const {SX, SOURCES, GLOSSARY, GLOSSARY_ALIAS = {}, STATIONS, LABS, PORT, CODE_NOTES} = window;
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL', msg); } };

/* 1. field_code() port vs Python on every captured cell text */
SX.regex_cases.forEach(([t, py]) => ok(PORT.fieldCode(t) === py, `field_code(${JSON.stringify(t)}) js=${PORT.fieldCode(t)} py=${py}`));

/* 2. _active_cells() and value_x vote vs the traced engine, every specimen table */
for (const [id, sp] of Object.entries(SX.specimens)) {
  sp.tables.forEach((t, ti) => {
    const cells = PORT.cellObjs(t), tr = sp.traces[ti];
    tr.rows.forEach(r => ok(PORT.activeCells(cells, r.row).map(c => c.key).join('|') === r.active.join('|'), `${id} ${t.id} row ${r.row} active cells`));
    if (tr.role === 'footer') return;
    const v = PORT.votes(cells, t.row_count, t.bbox);
    ok((v.length ? PORT.mode(v.map(x => x.x)) : null) === tr.value_x, `${id} ${t.id} value_x js=${v.length ? PORT.mode(v.map(x => x.x)) : null} py=${tr.value_x}`);
  });
}

/* 3. _header() port reproduces every column_label on the specimen pages */
for (const [id, sp] of Object.entries(SX.specimens)) {
  const doc = id.split('-')[0], page = Number(id.split('-')[1]);
  sp.traces.forEach((tr, ti) => {
    const cx = {}; PORT.cellObjs(sp.tables[ti]).forEach(c => { cx[c.key] = c; });
    tr.rows.forEach(r => {
      if (r.kind !== 'record') return;
      const f = SX.fields[doc].find(x => x.id === r.record);
      if (!f || r.record_kind === 'section') return;
      const headers = (r.header_keys || []).map(k => cx[k]);
      r.values.forEach((k, i) => ok(PORT.header(cx[k].bbox, headers) === f.values[i].col, `${id} ${f.code} value ${i} column_label`));
    });
  });
}

/* 4. _hierarchy() port reproduces parent_id and level for every record */
for (const [doc, fs] of Object.entries(SX.fields)) {
  const recs = PORT.hierarchy(fs.map(f => ({id: f.id, code: f.code, kind: f.kind})));
  recs.forEach((r, i) => ok(r.parent === fs[i].parent && r.level === fs[i].level, `${doc} ${fs[i].id} ${fs[i].code} parent/level js=${r.parent}/${r.level} py=${fs[i].parent}/${fs[i].level}`));
}

/* 5. Wilson interval for 72/74 matches the glossary claim (≈ 90.7–99.3%) */
const w = PORT.wilson(72, 74); ok(Math.abs(w[0] - 0.907) < 0.001 && Math.abs(w[1] - 0.993) < 0.001, `wilson 72/74 = ${w}`);

/* 6. content links resolve */
const lines = f => SOURCES[f].text.split('\n');
const anchor = (src, find, where) => { ok(!!SOURCES[src], `${where}: unknown source ${src}`); if (SOURCES[src]) ok(lines(src).some(l => l.includes(find)), `${where}: anchor not found in ${src}: ${find}`); };
const texts = [];
STATIONS.forEach((s, si) => {
  ok(s.n === si, `station ${s.id} n=${s.n} at index ${si}`);
  ok(s.quiz && s.quiz.length && s.keys && s.say, `station ${s.id} has checkpoint content`);
  (s.quiz || []).forEach((q, qi) => ok(q.why.length === q.o.length && q.a < q.o.length, `${s.id} quiz ${qi} shape`));
  texts.push(s.goal, s.say, ...s.keys, ...(s.quiz || []).flatMap(q => [q.q, ...q.o, ...q.why]));
  const specs = [s.page && s.page.spec];
  s.beats.forEach((b, bi) => {
    [].concat(b.code || []).forEach(c => anchor(c.src, c.find, `${s.id} beat ${bi}`));
    if (b.lab) ok(!!LABS[b.lab], `${s.id} beat ${bi}: unknown lab ${b.lab}`);
    texts.push(b.t, b.x, b.x2, b.analogy, b.warn, b.pro, b.task && b.task.text, ...(b.flow || []), ...((b.table || []).flat()), ...((b.tiles || []).flat()));
    [b.page, ...(b.show || []).map(x => x.page)].forEach(p => { if (p && p.spec) specs.push(p.spec); });
  });
  specs.filter(Boolean).forEach(sp => ok(SX.specimens[sp] || SX.docs[sp.split('-')[0]], `${s.id}: unknown page ${sp}`));
});
for (const [f, notes] of Object.entries(CODE_NOTES)) notes.forEach(n => { anchor(f, n.find, `code note ${f}/${n.id}`); texts.push(n.note); });
Object.values(GLOSSARY).forEach(g => texts.push(g.at));
texts.filter(Boolean).forEach(t => {
  for (const m of String(t).matchAll(/\[\[([^\]|]+)/g)) { const k = m[1].trim(); ok(GLOSSARY[k] || GLOSSARY_ALIAS[k], `unknown glossary term [[${k}]]`); }
  for (const m of String(t).matchAll(/\{\{lab:([\w-]+)/g)) ok(LABS[m[1]], `unknown lab {{lab:${m[1]}}}`);
  for (const m of String(t).matchAll(/\{\{st:([\w-]+)/g)) ok(STATIONS.some(s => s.id === m[1]), `unknown station {{st:${m[1]}}}`);
  for (const m of String(t).matchAll(/\{\{code:(\w+)(?::([\w-]+))?/g)) ok(SOURCES[m[1]] && (!m[2] || (CODE_NOTES[m[1]] || []).some(n => n.id === m[2])), `unknown code link ${m[0]}`);
  for (const m of String(t).matchAll(/\{\{page:([\w-]+)/g)) ok(SX.docs[m[1].split('-')[0]], `unknown page link ${m[0]}`);
});

console.log(`${checks - fails}/${checks} checks passed${fails ? `, ${fails} FAILED` : ''}`);
process.exit(fails ? 1 : 0);
