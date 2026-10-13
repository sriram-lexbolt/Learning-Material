// Build + verify the atlas: shots.js, reference checks, annotated screenshots, markdown companion.
// Usage: node build.js [--no-render]
const fs = require('fs'), path = require('path');
const ATLAS = path.resolve(__dirname, '..', 'AL_Pilot_Atlas');
const SHOTS_DIR = path.join(ATLAS, 'shots');
const manifest = JSON.parse(fs.readFileSync(path.join(SHOTS_DIR, 'manifest.json'), 'utf8'));
const pngSize = f => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

// 1. shots.js (manifest + any extra PNG without hotspots)
for (const f of fs.readdirSync(SHOTS_DIR).filter(f => f.endsWith('.png'))) {
  const id = f.replace(/\.png$/, '');
  if (!manifest[id]) { const s = pngSize(path.join(SHOTS_DIR, f)); manifest[id] = { file: f, w: s.w, h: s.h, spots: [] }; }
}
fs.writeFileSync(path.join(SHOTS_DIR, 'shots.js'), 'window.SHOTS=' + JSON.stringify(manifest) + ';');

// 2. load content like the browser does
global.window = global;
global.SHOTS = manifest;
for (const f of ['glossary.js', ...fs.readdirSync(ATLAS).filter(f => /^content_\d+.*\.js$/.test(f)).sort(), 'labs.js']) require(path.join(ATLAS, f));
const problems = [], skipped = [];
const G = window.GLOSSARY, AL = window.GLOSSARY_ALIAS;
const textOf = o => JSON.stringify(o);
let spotsTotal = 0, screensTotal = 0;
for (const sec of SECTIONS) {
  for (const scr of sec.screens) {
    screensTotal++;
    const sh = manifest[scr.shot];
    if (!sh) { problems.push(`missing shot ${scr.shot} (${sec.id}/${scr.id})`); continue; }
    if (!fs.existsSync(path.join(SHOTS_DIR, sh.file))) problems.push(`missing file ${sh.file}`);
    for (const sp of scr.spots || []) { spotsTotal++; if (!sh.spots.find(b => b.id === sp.id)) skipped.push(`no hotspot box "${sp.id}" in ${scr.shot} (${sec.id}/${scr.id})`); }
  }
}
const all = textOf(SECTIONS) + window.PRACTICE + window.DEMO + window.INTRO + textOf(window.TAGS) + textOf(Object.values(window.WIDGETS).map(w => w.sub));
for (const m of all.matchAll(/\[\[([^\]|"\[]+)(?:\|[^\]]+)?\]\]/g)) if (!G[m[1]] && !G[AL[m[1]]]) problems.push('unknown term ' + m[1]);
for (const m of all.matchAll(/\{\{go:([^|}]+)\|/g)) { const [s, c] = m[1].split('/'); const sec = SECTIONS.find(x => x.id === s); if (!sec || (c && !sec.screens.find(x => x.id === c))) problems.push('bad link ' + m[1]); }
for (const m of all.matchAll(/data-widget=\\?"(\w+)/g)) if (!window.WIDGETS[m[1]]) problems.push('unknown widget ' + m[1]);
const ids = new Set(); for (const s of SECTIONS) { if (ids.has(s.id)) problems.push('dup section ' + s.id); ids.add(s.id); const sc = new Set(); for (const x of s.screens) { if (sc.has(x.id)) problems.push('dup screen ' + s.id + '/' + x.id); sc.add(x.id); } }
const unused = Object.keys(manifest).filter(k => !SECTIONS.some(s => s.screens.some(x => x.shot === k)));
console.log(`${SECTIONS.length} sections, ${screensTotal} screens, ${spotsTotal} hotspot notes, ${Object.keys(G).length} terms, ${window.TAGS.length} tags`);
console.log('notes skipped (part not on that screenshot):', skipped.length);
console.log('unused shots:', unused.join(', ') || 'none');
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'All references resolve.');

// 3 + 4. annotated screenshots and markdown
(async () => {
  if (!process.argv.includes('--no-render')) {
    const { chromium } = require('playwright-core');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const OUT = path.join(ATLAS, 'annotated'); fs.mkdirSync(OUT, { recursive: true });
    const url = 'file:///' + path.join(ATLAS, 'index.html').replace(/\\/g, '/');
    for (const sec of SECTIONS) for (const scr of sec.screens) {
      const sh = manifest[scr.shot]; if (!sh || !(scr.spots || []).length) continue;
      await page.setViewportSize({ width: sh.w + 60, height: Math.min(sh.h + 60, 8000) });
      await page.goto(url + `#/render/${sec.id}/${scr.id}`); await page.waitForSelector('#rw img');
      await page.waitForFunction(() => document.querySelector('#rw img').complete);
      await (await page.$('#rw')).screenshot({ path: path.join(OUT, `${sec.id}__${scr.id}.png`) });
    }
    // Route sweep for JS errors.
    await page.setViewportSize({ width: 1400, height: 900 });
    const routes = ['home', 'tags', 'labs', 'glossary', 'practice', 'demo', ...SECTIONS.flatMap(s => ['learn/' + s.id, ...s.screens.map(x => `learn/${s.id}/${x.id}`)])];
    await page.goto(url + '#/home');
    for (const r of routes) { await page.evaluate(h => { location.hash = '#/' + h; }, r); await page.waitForTimeout(40); }
    console.log(`route sweep: ${routes.length} routes, ${errors.length} JS errors`, errors.slice(0, 5));
    await browser.close();
  }
  writeMarkdown();
})();

function mdText(s) {
  return String(s ?? '').replace(/\{\{go:([^|}]+)\|([^}]+)\}\}/g, '$2').replace(/\{\{pill:\w*\|([^}]+)\}\}/g, '`$1`').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<\/?(div|span|b|br|p|ol|ul|li|em|i|small|h1|h2|h3|code)[^>]*>/g, m => /<li/.test(m) ? '\n- ' : /<br|<\/p|<\/div|<\/h\d|<\/ol|<\/ul/.test(m) ? '\n' : /<\/?b>/.test(m) ? '**' : /<\/?code>/.test(m) ? '`' : '')
    .replace(/<table class="t">([\s\S]*?)<\/table>/g, (_, t) => '\n' + t.split(/<tr>/).filter(r => r.trim()).map((r, i) => { const cells = r.replace(/<\/tr>/, '').split(/<t[hd][^>]*>/).slice(1).map(c => c.replace(/<\/t[hd]>/, '').replace(/\|/g, '/').trim()); return '| ' + cells.join(' | ') + ' |' + (i === 0 ? '\n|' + cells.map(() => '---').join('|') + '|' : ''); }).join('\n') + '\n')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n');
}
function paras(s) { return (Array.isArray(s) ? s : [s]).filter(Boolean).map(mdText).join('\n\n'); }
function DIAGRAM_F() { return '```'+String.fromCharCode(10)+'Vehicle library -> Validation request -> Edit values -> Every test sorted -> PDF package -> Agency approves -> Record homologation'+String.fromCharCode(10)+'(truck + PDFs)     (copy of a vehicle)   (linked cells)   (reuse/review/inputs/edition)  (forms+schedules)  (outside the app)  (locks; new recorded vehicle)'+String.fromCharCode(10)+'Side areas: Evidence library (reports) | AIS-007 templates (blank forms) | Regulatory updates (rule changes) | Settings'+String.fromCharCode(10)+'```'+String.fromCharCode(10,10)+'**The rule behind it all:** the app sorts and explains; people decide. The AI only explains.'; }
function writeMarkdown() {
  const W = { all: 'everyone', eng: 'engineer +', rev: 'reviewer / admin', adm: 'admin only' };
  let o = `# AL Pilot v5.1.2: every screen, every button\n\n> Companion to the interactive atlas (open \`AL_Pilot_Atlas/index.html\`). Same content, one long document. Numbers on each screenshot match the numbered notes under it. Screenshots: practice copy of the exact v5.1.2 server code with the Full Demo Seed; AI answers are simulated ("SIMULATED…").\n\n${mdText(window.INTRO)}\n\n${DIAGRAM_F()}\n\n## Contents\n`;
  o += SECTIONS.map((s, i) => `${i}. [${s.title}](#${s.title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')})`).join('\n') + '\n- Tag decoder · Practice copy · Demo script (end of file)\n\n---\n';
  for (const sec of SECTIONS) {
    o += `\n## ${sec.title}\n\n*${sec.kicker || ''}*\n\n${mdText(sec.lead)}\n\n`;
    if (sec.words) o += '**📖 Words used here**\n\n' + sec.words.map(([t, d]) => `- **${mdText(t)}**: ${mdText(d)}`).join('\n') + '\n\n';
    if (sec.body) o += paras(sec.body) + '\n\n';
    sec.screens.forEach((scr, i) => {
      const img = (scr.spots || []).length ? `annotated/${sec.id}__${scr.id}.png` : `shots/${manifest[scr.shot]?.file}`;
      o += `### ${i + 1}. ${scr.title}\n\n`;
      if (scr.how) o += `**How to get here:** ${mdText(scr.how)}\n\n`;
      o += `![${scr.title}](AL_Pilot_Atlas/${img})\n\n${paras(scr.intro)}\n\n`;
      (scr.spots || []).filter(sp => manifest[scr.shot]?.spots.some(b => b.id === sp.id)).forEach((sp, j) => {
        o += `**${j + 1}. ${mdText(sp.label)}**${sp.who ? ` *(${W[sp.who]})*` : ''}: ${mdText(sp.what)}`;
        if (sp.options) o += '\n' + sp.options.map(x => `   - ${mdText(x)}`).join('\n');
        if (sp.press) o += `\n   - *When you press it:* ${mdText(sp.press)}`;
        if (sp.why) o += `\n   - *Why it exists:* ${mdText(sp.why)}`;
        if (sp.warn) o += `\n   - ⚠️ ${mdText(sp.warn)}`;
        if (sp.code) o += `\n   - *Under the hood:* ${mdText(sp.code)}`;
        o += '\n\n';
      });
      if (scr.after) o += paras(scr.after) + '\n\n';
      if (scr.teach) o += `> 🎓 **When you teach this:** ${paras(scr.teach)}\n\n`;
    });
    if (sec.explain) o += `#### Explained two ways\n\n**Simply:** ${paras(sec.explain.simple)}\n\n**Precisely:** ${paras(sec.explain.precise)}\n\n**Putting it together:** ${paras(sec.explain.together)}\n\n`;
    if (sec.takeaways) o += '#### 🔑 Key takeaways\n\n' + sec.takeaways.map(t => '- ' + mdText(t)).join('\n') + '\n\n';
    if (sec.say) o += `> 💬 **Say it like a pro:** ${paras(sec.say)}\n\n`;
    if (sec.teach) o += `> 🎓 **Teaching AL this section:** ${paras(sec.teach)}\n\n`;
    if (sec.tasks) o += '#### ✅ Try it on the practice copy\n\n' + sec.tasks.map(t => '- [ ] ' + mdText(t)).join('\n') + '\n\n';
    if (sec.quiz) o += '#### Quiz\n\n' + sec.quiz.map((q, i) => `${i + 1}. ${mdText(q.q)}\n${q.opts.map((x, j) => `   - ${'abc'[j]}) ${mdText(x)}`).join('\n')}\n   <details><summary>Answer</summary>${'abc'[q.a]}) ${mdText(q.why)}</details>`).join('\n') + '\n\n';
    o += '---\n';
  }
  const groups = [...new Set(window.TAGS.map(t => t.where))];
  o += '\n## Tag decoder\n\n' + groups.map(g => `### ${g}\n\n| Tag | Meaning | Next | Set by |\n|---|---|---|---|\n` + window.TAGS.filter(t => t.where === g).map(t => `| \`${t.tag}\` | ${mdText(t.means)} | ${mdText(t.next)} | ${mdText(t.by)} |`).join('\n')).join('\n\n') + '\n\n';
  o += '## Glossary\n\n' + Object.keys(window.GLOSSARY).sort().map(k => `- **${k}**${window.GLOSSARY[k].f ? ' (' + window.GLOSSARY[k].f + ')' : ''}: ${mdText(window.GLOSSARY[k].d)}`).join('\n') + '\n\n';
  o += mdText(window.PRACTICE).replace(/^Your practice copy/m, '## Your practice copy') + '\n\n' + mdText(window.DEMO).replace(/^Demo script/m, '## Demo script') + '\n';
  fs.writeFileSync(path.join(ATLAS, '..', 'AL_Pilot_v5_1_2_Full_Walkthrough.md'), o);
  console.log('markdown written:', Math.round(o.length / 1024) + ' KB');
}
