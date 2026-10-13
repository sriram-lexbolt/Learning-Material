// Focused copy of the walkthrough: each screenshot cropped to its marked area, and each numbered note
// gets its own zoomed crop placed directly above its text (no scrolling back to the big picture).
// Usage: node build_focused.js   (run node build.js first if content changed)
const fs = require('fs'), path = require('path');
const ATLAS = path.resolve(__dirname, '..', 'AL_Pilot_Atlas');
const OUT = path.join(ATLAS, 'focused');
const MD = path.join(ATLAS, '..', 'AL_Pilot_v5_1_2_Walkthrough_Focused.md');
const manifest = JSON.parse(fs.readFileSync(path.join(ATLAS, 'shots', 'manifest.json'), 'utf8'));
// Extra PNGs without hotspots (e.g. PDF pages), as build.js does.
for (const f of fs.readdirSync(path.join(ATLAS, 'shots')).filter(f => f.endsWith('.png'))) if (!manifest[f.replace(/\.png$/, '')]) manifest[f.replace(/\.png$/, '')] = { file: f, spots: [] };
global.window = global; global.SHOTS = manifest;
for (const f of ['glossary.js', ...fs.readdirSync(ATLAS).filter(f => /^content_\d+.*\.js$/.test(f)).sort(), 'labs.js']) require(path.join(ATLAS, f));

const PAD_OVERVIEW = 24, PAD_NOTE = 36, MIN_NOTE_W = 420, MIN_NOTE_H = 90;
// Same numbering as the atlas; `seen` is false when the measured part lies outside the captured image
// (very tall dialogs were capped at 7000 px, so their bottom buttons are not in the picture).
const spotsOf = scr => { const sh = manifest[scr.shot]; return (scr.spots || []).filter(sp => sh?.spots.some(b => b.id === sp.id)).map(sp => { const box = sh.spots.find(b => b.id === sp.id); return { sp, box, seen: box.w > 0 && box.h > 0 && box.x >= 0 && box.y >= 0 && box.x < sh.w && box.y < sh.h }; }); };
// Pad a box (badge sits 11px up-left of the box), grow to a minimum size around its centre, clamp to the image.
function region(boxes, sh, pad, minW = 0, minH = 0) {
  let x1 = Math.min(...boxes.map(b => b.x)) - pad, y1 = Math.min(...boxes.map(b => b.y)) - pad;
  let x2 = Math.max(...boxes.map(b => b.x + Math.max(b.w, 18))) + pad, y2 = Math.max(...boxes.map(b => b.y + Math.max(b.h, 14))) + pad;
  if (x2 - x1 < minW) { const c = (x1 + x2) / 2; x1 = c - minW / 2; x2 = c + minW / 2; }
  if (y2 - y1 < minH) { const c = (y1 + y2) / 2; y1 = c - minH / 2; y2 = c + minH / 2; }
  x1 = Math.max(-12, Math.round(x1)); y1 = Math.max(-12, Math.round(y1));
  x2 = Math.min(sh.w + 12, Math.round(x2)); y2 = Math.min(sh.h + 12, Math.round(y2));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  const url = 'file:///' + path.join(ATLAS, 'index.html').replace(/\\/g, '/');
  let files = 0;
  for (const sec of SECTIONS) for (const scr of sec.screens) {
    const sh = manifest[scr.shot], S = spotsOf(scr), V = S.filter(s => s.seen); if (!V.length) continue;
    await page.setViewportSize({ width: sh.w + 60, height: Math.min(sh.h + 60, 8000) });
    await page.goto(url + `#/render/${sec.id}/${scr.id}`); await page.waitForSelector('#rw img');
    await page.waitForFunction(() => document.querySelector('#rw img').complete);
    const o = await page.evaluate(() => { const r = document.querySelector('#rw').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY }; });
    const shoot = async (r, name) => { await page.screenshot({ path: path.join(OUT, name), clip: { x: o.x + r.x, y: o.y + r.y, width: r.width, height: r.height }, fullPage: true }); files++; };
    if (V.length > 1) await shoot(region(V.map(s => s.box), sh, PAD_OVERVIEW), `${sec.id}__${scr.id}.png`);
    for (let i = 0; i < S.length; i++) if (S[i].seen) await shoot(region([S[i].box], sh, PAD_NOTE, MIN_NOTE_W, MIN_NOTE_H), `${sec.id}__${scr.id}__${i + 1}.png`);
  }
  await browser.close();
  console.log('crops written:', files);
  writeMarkdown();
})();

function mdText(s) {
  return String(s ?? '').replace(/\{\{go:([^|}]+)\|([^}]+)\}\}/g, '$2').replace(/\{\{pill:\w*\|([^}]+)\}\}/g, '`$1`').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<\/?(div|span|b|br|p|ol|ul|li|em|i|small|h1|h2|h3|code)[^>]*>/g, m => /<li/.test(m) ? '\n- ' : /<br|<\/p|<\/div|<\/h\d|<\/ol|<\/ul/.test(m) ? '\n' : /<\/?b>/.test(m) ? '**' : /<\/?code>/.test(m) ? '`' : '')
    .replace(/<table class="t">([\s\S]*?)<\/table>/g, (_, t) => '\n' + t.split(/<tr>/).filter(r => r.trim()).map((r, i) => { const cells = r.replace(/<\/tr>/, '').split(/<t[hd][^>]*>/).slice(1).map(c => c.replace(/<\/t[hd]>/, '').replace(/\|/g, '/').trim()); return '| ' + cells.join(' | ') + ' |' + (i === 0 ? '\n|' + cells.map(() => '---').join('|') + '|' : ''); }).join('\n') + '\n')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n');
}
function paras(s) { return (Array.isArray(s) ? s : [s]).filter(Boolean).map(mdText).join('\n\n'); }
function DIAGRAM_F() { return '```\nVehicle library -> Validation request -> Edit values -> Every test sorted -> PDF package -> Agency approves -> Record homologation\n(truck + PDFs)     (copy of a vehicle)   (linked cells)   (reuse/review/inputs/edition)  (forms+schedules)  (outside the app)  (locks; new recorded vehicle)\nSide areas: Evidence library (reports) | AIS-007 templates (blank forms) | Regulatory updates (rule changes) | Settings\n```\n\n**The rule behind it all:** the app sorts and explains; people decide. The AI only explains.'; }
function writeMarkdown() {
  const W = { all: 'everyone', eng: 'engineer +', rev: 'reviewer / admin', adm: 'admin only' };
  let o = `# AL Pilot v5.1.2: every screen, every button (focused edition)\n\n> Same content as \`AL_Pilot_v5_1_2_Full_Walkthrough.md\`, laid out for reading without scrolling back and forth: each screenshot is cropped to the part that matters ("Where everything is"), and every numbered note starts with its own close-up of that numbered part. The full-page screenshots are still in the full walkthrough and the interactive atlas (\`AL_Pilot_Atlas/index.html\`). AI answers in screenshots are simulated ("SIMULATED…").\n\n${mdText(window.INTRO)}\n\n${DIAGRAM_F()}\n\n## Contents\n`;
  o += SECTIONS.map((s, i) => `${i}. [${s.title}](#${s.title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')})`).join('\n') + '\n- Tag decoder · Practice copy · Demo script (end of file)\n\n---\n';
  for (const sec of SECTIONS) {
    o += `\n## ${sec.title}\n\n*${sec.kicker || ''}*\n\n${mdText(sec.lead)}\n\n`;
    if (sec.words) o += '**📖 Words used here**\n\n' + sec.words.map(([t, d]) => `- **${mdText(t)}**: ${mdText(d)}`).join('\n') + '\n\n';
    if (sec.body) o += paras(sec.body) + '\n\n';
    sec.screens.forEach((scr, i) => {
      const S = spotsOf(scr), V = S.filter(s => s.seen);
      o += `### ${i + 1}. ${scr.title}\n\n`;
      if (scr.how) o += `**How to get here:** ${mdText(scr.how)}\n\n`;
      o += paras(scr.intro) + '\n\n';
      if (!V.length) o += `![${scr.title}](AL_Pilot_Atlas/shots/${manifest[scr.shot]?.file})\n\n`;
      else if (V.length > 1) o += `**Where everything is:**\n\n![${scr.title}](AL_Pilot_Atlas/focused/${sec.id}__${scr.id}.png)\n\n`;
      S.forEach(({ sp, seen }, j) => {
        o += `#### ${j + 1}. ${mdText(sp.label)}${sp.who ? ` *(${W[sp.who]})*` : ''}\n\n` + (seen ? `![${j + 1}. ${mdText(sp.label).replace(/[\[\]]/g, '')}](AL_Pilot_Atlas/focused/${sec.id}__${scr.id}__${j + 1}.png)` : '*(Not in the picture: this part is further down the same window. Scroll down in the app to see it.)*') + `\n\n${mdText(sp.what)}`;
        if (sp.options) o += '\n\n' + sp.options.map(x => `- ${mdText(x)}`).join('\n');
        o += '\n';
        if (sp.press) o += `\n- *When you press it:* ${mdText(sp.press)}`;
        if (sp.why) o += `\n- *Why it exists:* ${mdText(sp.why)}`;
        if (sp.warn) o += `\n- ⚠️ ${mdText(sp.warn)}`;
        if (sp.code) o += `\n- *Under the hood:* ${mdText(sp.code)}`;
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
  fs.writeFileSync(MD, o);
  const refs = [...o.matchAll(/\]\((AL_Pilot_Atlas\/[^)]+)\)/g)].map(m => m[1]).filter(p => !fs.existsSync(path.join(ATLAS, '..', p)));
  console.log('markdown written:', Math.round(o.length / 1024) + ' KB;', refs.length ? 'MISSING images: ' + refs.join(', ') : 'all image links resolve');
}
