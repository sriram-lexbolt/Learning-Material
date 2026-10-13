'use strict';
// AL Pilot Atlas engine: routes, screen viewer with measured hotspots, markup, glossary tooltips, quizzes, progress.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SECTIONS = window.SECTIONS || [];
const SHOTS = window.SHOTS || {};
const G = window.GLOSSARY || {};
const PROG = JSON.parse(localStorage.getItem('alAtlasProgress') || '{}');
const saveProg = () => localStorage.setItem('alAtlasProgress', JSON.stringify(PROG));
document.documentElement.dataset.theme = localStorage.getItem('alAtlasTheme') || 'light';
$('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('alAtlasTheme', t); };

// Markup: `On-screen text` -> ui chip; [[KEY]] or [[KEY|shown]] -> glossary term; {{go:section/screen|text}} -> link;
// {{pill:color|text}} -> app-style tag; **bold**.
function md(s) {
  if (s == null) return '';
  return String(s)
    .replace(/`([^`]+)`/g, (_, t) => `<span class="ui">${esc(t)}</span>`)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, k, t) => { const key = (window.GLOSSARY_ALIAS || {})[k] || k; return `<span class="term" data-term="${esc(key)}">${t || (G[key] ? k : k)}</span>`; })
    .replace(/\{\{go:([^|}]+)\|([^}]+)\}\}/g, (_, h, t) => `<a href="#/learn/${h}">${t}</a>`)
    .replace(/\{\{pill:(\w*)\|([^}]+)\}\}/g, (_, c, t) => `<span class="pill ${c}">${t}</span>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}
const para = s => (Array.isArray(s) ? s : [s]).filter(Boolean).map(p => p.startsWith('<') ? md(p) : `<p>${md(p)}</p>`).join('');
const WHO = { all: ['all', 'Everyone'], eng: ['all', 'Engineer +'], rev: ['rev', 'Reviewer / admin'], adm: ['adm', 'Admin only'] };
const who = w => w && WHO[w] ? `<span class="who ${WHO[w][0]}">${WHO[w][1]}</span>` : '';

// ---------- tooltip ----------
document.addEventListener('mouseover', e => {
  const t = e.target.closest('.term'); const tip = $('#tip');
  if (!t) { tip.classList.remove('show'); return; }
  const g = G[t.dataset.term]; if (!g) return;
  tip.innerHTML = `<b>${esc(g.f || t.dataset.term)}</b><br>${md(g.d)}`;
  const r = t.getBoundingClientRect(); tip.style.left = Math.min(r.left, innerWidth - 380) + 'px'; tip.style.top = (r.bottom + 8) + 'px'; tip.classList.add('show');
});
document.addEventListener('click', e => { const t = e.target.closest('.term'); if (t) location.hash = '#/glossary/' + encodeURIComponent(t.dataset.term); });

// ---------- routes ----------
const routes = { home, learn, tags, labs, glossary, practice, demo, render };
function route() {
  const [name, ...rest] = location.hash.slice(2).split('/');
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === (name || 'home')));
  document.body.classList.toggle('render', name === 'render');
  (routes[name] || home)(...rest.map(decodeURIComponent));
  if (name !== 'learn') scrollTo(0, 0);
}
addEventListener('hashchange', route);

function progressOf(sec) { const ids = sec.screens.map(s => sec.id + '/' + s.id); const done = ids.filter(i => PROG[i]).length; return { done, total: ids.length }; }

function home() {
  $('#app').innerHTML = `<h1>The AL Pilot, every screen and every button</h1>
  <p class="lead">${md(window.INTRO || '')}</p>
  ${window.CORE_DIAGRAM || ''}
  <h2>The path</h2><div class="grid">${SECTIONS.map((s, i) => { const p = progressOf(s); return `<a class="tile" href="#/learn/${s.id}"><small>${s.kicker || 'Section ' + i}</small><b>${esc(s.title)}</b><small>${esc(s.sub || '')}</small><small>${p.done} / ${p.total} screens</small><div class="bar"><i style="width:${p.total ? 100 * p.done / p.total : 0}%"></i></div></a>`; }).join('')}</div>
  <h2>Also here</h2><div class="grid">
   <a class="tile" href="#/tags"><b>Tag decoder</b><small>Every coloured tag in the app: what it means and what to do next.</small></a>
   <a class="tile" href="#/labs"><b>Labs</b><small>Status ladder, "will this report be reused?", rule-change phase calculator. Same rules as the app's code.</small></a>
   <a class="tile" href="#/practice"><b>Practice copy</b><small>Run v5.1.2 on this laptop with the demo seed and a pretend AI. Break anything.</small></a>
   <a class="tile" href="#/demo"><b>Demo script for AL</b><small>A timed walkthrough for the first pilot session, with the questions AL is likely to ask.</small></a>
   <a class="tile" href="../AL_Pilot_v5_1_2_Full_Walkthrough.md"><b>Markdown version</b><small>The same content as one long document, with numbered screenshots.</small></a></div>`;
}

function learn(secId, scrId) {
  const sec = SECTIONS.find(s => s.id === secId) || SECTIONS[0];
  const scr = sec.screens.find(s => s.id === scrId);
  const side = `<aside class="side">${SECTIONS.map(s => `<a class="sec ${s === sec ? 'on' : ''}" href="#/learn/${s.id}">${esc(s.title)}</a>${s === sec ? s.screens.map(x => `<a class="scr ${x === scr ? 'on' : ''} ${PROG[s.id + '/' + x.id] ? 'done' : ''}" href="#/learn/${s.id}/${x.id}">${esc(x.title)}</a>`).join('') : ''}`).join('')}</aside>`;
  $('#app').innerHTML = `<div class="learn">${side}<main id="lm"></main></div>`;
  if (scr) screenView(sec, scr); else sectionIntro(sec);
  if (!scr) scrollTo(0, 0);
}

function sectionIntro(sec) {
  const first = sec.screens[0];
  $('#lm').innerHTML = `<small>${esc(sec.kicker || '')}</small><h1>${esc(sec.title)}</h1><p class="lead">${md(sec.lead)}</p>
   ${sec.words ? `<div class="words"><b>📖 Words used here</b><dl>${sec.words.map(([t, d]) => `<dt>${md(t)}</dt><dd>${md(d)}</dd>`).join('')}</dl></div>` : ''}
   ${para(sec.body)}
   ${first ? `<p><a class="btn primary" href="#/learn/${sec.id}/${first.id}">Start: ${esc(first.title)} →</a></p>` : ''}
   <h2>Screens in this section</h2><ol>${sec.screens.map(s => `<li><a href="#/learn/${sec.id}/${s.id}">${esc(s.title)}</a> ${PROG[sec.id + '/' + s.id] ? '✔' : ''}<br><small>${md(s.intro ? s.intro.split('. ')[0] + '.' : '')}</small></li>`).join('')}</ol>
   ${wrapUp(sec)}`;
  mountQuiz(sec); mountWidgets();
}

function wrapUp(sec) {
  return `${sec.explain ? `<h2>Explained two ways</h2><div class="two"><div class="box"><b>Simply</b>${para(sec.explain.simple)}</div><div class="box"><b>Precisely</b>${para(sec.explain.precise)}</div></div><div class="box"><b>Putting it together</b>${para(sec.explain.together)}</div>` : ''}
   ${sec.takeaways ? `<h2>🔑 Key takeaways</h2><ul>${sec.takeaways.map(t => `<li>${md(t)}</li>`).join('')}</ul>` : ''}
   ${sec.say ? `<div class="callout pro"><b class="k">💬 Say it like a pro</b>${para(sec.say)}</div>` : ''}
   ${sec.teach ? `<div class="callout teach"><b class="k">🎓 Teaching AL this section</b>${para(sec.teach)}</div>` : ''}
   ${sec.tasks ? `<h2>✅ Try it on the practice copy</h2><ul class="check">${sec.tasks.map((t, i) => `<li><label><input type="checkbox" data-task="${sec.id}:${i}" ${PROG['task:' + sec.id + ':' + i] ? 'checked' : ''}>${md(t)}</label></li>`).join('')}</ul>` : ''}
   ${sec.quiz ? `<h2>Quiz</h2><div class="quiz" id="quiz"></div>` : ''}`;
}
document.addEventListener('change', e => { const t = e.target.dataset?.task; if (t) { PROG['task:' + t] = e.target.checked; saveProg(); } });

function screenView(sec, scr) {
  const shot = SHOTS[scr.shot] || { file: '', w: 1440, h: 900, spots: [] };
  const idx = sec.screens.indexOf(scr), prev = sec.screens[idx - 1], next = sec.screens[idx + 1];
  const spots = (scr.spots || []).filter(s => shot.spots.some(b => b.id === s.id)).map((s, i) => ({ ...s, n: i + 1, box: shot.spots.find(b => b.id === s.id) }));
  const scale = 100 / shot.w;
  $('#lm').innerHTML = `<div class="screenhead"><div><small>${esc(sec.title)} · screen ${idx + 1} of ${sec.screens.length}</small><h1>${esc(scr.title)}</h1></div>
     <div class="pager">${prev ? `<a class="btn" href="#/learn/${sec.id}/${prev.id}">← ${esc(prev.title)}</a>` : `<a class="btn" href="#/learn/${sec.id}">← Section intro</a>`}${next ? `<a class="btn primary" href="#/learn/${sec.id}/${next.id}">${esc(next.title)} →</a>` : `<a class="btn primary" href="#/learn/${sec.id}">Wrap-up & quiz →</a>`}</div></div>
   ${scr.how ? `<div class="callout"><b class="k">How to get here</b>${md(scr.how)}</div>` : ''}
   <div class="viewer">
    <div class="stage"><div class="zoom">Click a number, or use <kbd>←</kbd> <kbd>→</kbd>. Zoom: <button class="btn" data-z="1">Fit</button><button class="btn" data-z="1.5">150%</button><button class="btn" data-z="2.2">220%</button> <a href="#" id="enlarge">Open full size</a></div>
     <div class="wrap">${shot.file ? `<img src="shots/${shot.file}" alt="${esc(scr.title)}">` : '<p>Screenshot missing.</p>'}
     ${spots.filter(s => s.box).map(s => `<div class="hs" data-n="${s.n}" style="left:${s.box.x * scale}%;top:${s.box.y * 100 / shot.h}%;width:${Math.max(s.box.w, 18) * scale}%;height:${Math.max(s.box.h, 14) * 100 / shot.h}%"><b>${s.n}</b></div>`).join('')}</div></div>
    <div class="notes">${para(scr.intro)}
     ${spots.map(s => `<div class="spot" data-n="${s.n}"><h4><i>${s.n}</i><span>${md(s.label)}</span>${who(s.who)}</h4>${para(s.what)}
       ${s.press ? `<div class="row"><b>When you press it:</b> ${md(s.press)}</div>` : ''}${s.options ? `<div class="row"><b>Options:</b><ul>${s.options.map(o => `<li>${md(o)}</li>`).join('')}</ul></div>` : ''}
       ${s.why ? `<div class="row"><b>Why it exists:</b> ${md(s.why)}</div>` : ''}${s.warn ? `<div class="callout warn">${md(s.warn)}</div>` : ''}${s.code ? `<div class="callout code"><b class="k">Under the hood</b>${md(s.code)}</div>` : ''}</div>`).join('')}
     ${scr.after ? `<div class="box">${para(scr.after)}</div>` : ''}
     ${scr.teach ? `<div class="callout teach"><b class="k">🎓 When you teach this</b>${para(scr.teach)}</div>` : ''}
     <p><label><input type="checkbox" id="donebox" ${PROG[sec.id + '/' + scr.id] ? 'checked' : ''}> I understand every number on this screen</label></p></div>
   </div>`;
  let cur = 0;
  const pick = n => { cur = n; document.querySelectorAll('.hs,.spot').forEach(el => el.classList.toggle('on', +el.dataset.n === n)); const card = document.querySelector(`.spot[data-n="${n}"]`); const hs = document.querySelector(`.hs[data-n="${n}"]`); card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); hs?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  document.querySelectorAll('.hs,.spot').forEach(el => el.onclick = () => pick(+el.dataset.n));
  document.onkeydown = e => { if (!location.hash.startsWith('#/learn/') || e.target.matches('input,textarea,select')) return; if (e.key === 'ArrowRight') pick(Math.min(spots.length, cur + 1)); if (e.key === 'ArrowLeft') pick(Math.max(1, cur - 1)); };
  $('#donebox').onchange = e => { PROG[sec.id + '/' + scr.id] = e.target.checked; saveProg(); };
  const Z = +(localStorage.getItem('alAtlasZoom') || 1); const setZ = z => { document.querySelector('.stage .wrap').style.width = (z * 100) + '%'; localStorage.setItem('alAtlasZoom', z); }; setZ(Z);
  document.querySelectorAll('[data-z]').forEach(b => b.onclick = () => setZ(+b.dataset.z));
  $('#enlarge').onclick = e => { e.preventDefault(); const lb = $('#lightbox'); lb.querySelector('img').src = 'shots/' + shot.file; lb.hidden = false; };
  mountWidgets();
}
$('#lightbox').onclick = () => { $('#lightbox').hidden = true; };

function mountQuiz(sec) {
  const box = $('#quiz'); if (!box || !sec.quiz) return;
  box.innerHTML = sec.quiz.map((q, i) => `<div class="q" data-q="${i}"><b>${i + 1}. ${md(q.q)}</b>${q.opts.map((o, j) => `<button data-j="${j}">${md(o)}</button>`).join('')}<div class="why" hidden>${md(q.why)}</div></div>`).join('');
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; const qd = b.closest('.q'), q = sec.quiz[+qd.dataset.q]; qd.querySelectorAll('button').forEach(x => x.classList.toggle('right', +x.dataset.j === q.a)); if (+b.dataset.j !== q.a) b.classList.add('wrong'); qd.querySelector('.why').hidden = false; };
}

function mountWidgets() { document.querySelectorAll('[data-widget]').forEach(el => { const w = (window.WIDGETS || {})[el.dataset.widget]; if (w && !el.dataset.done) { el.dataset.done = 1; w.render(el); } }); }

function tags() {
  const T = window.TAGS || [];
  const groups = [...new Set(T.map(t => t.where))];
  $('#app').innerHTML = `<h1>Tag decoder</h1><p class="lead">Every coloured tag the app shows in these six sections, grouped by where you see it. Colour always comes with words in the app, so read the words first.</p>
   ${groups.map(g => `<h2>${esc(g)}</h2><table class="t"><tr><th style="width:230px">Tag on screen</th><th>Plain meaning</th><th>What a person does next</th><th style="width:150px">Set by</th></tr>${T.filter(t => t.where === g).map(t => `<tr><td><span class="pill ${t.color || ''}">${esc(t.tag)}</span></td><td>${md(t.means)}</td><td>${md(t.next)}</td><td>${md(t.by || '')}</td></tr>`).join('')}</table>`).join('')}`;
}

function labs() {
  const W = window.WIDGETS || {};
  $('#app').innerHTML = `<h1>Labs</h1><p class="lead">Change an input and watch the answer change. Each lab copies one rule from the app's own code (file and function named in the lab), so it behaves like the app.</p>${Object.entries(W).map(([k, w]) => `<div class="lab"><h2 style="margin-top:0">${esc(w.title)}</h2><p>${md(w.sub)}</p><div data-widget="${k}"></div></div>`).join('')}`;
  mountWidgets();
}

function glossary(term) {
  const keys = Object.keys(G).sort((a, b) => a.localeCompare(b));
  const cats = [...new Set(keys.map(k => G[k].c))].sort();
  $('#app').innerHTML = `<h1>Glossary</h1><div class="gl"><input id="gq" placeholder="Search ${keys.length} terms…"> <select id="gc"><option value="">All categories</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select><dl id="gl"></dl></div>`;
  const draw = () => { const q = $('#gq').value.toLowerCase(), c = $('#gc').value; $('#gl').innerHTML = keys.filter(k => (!c || G[k].c === c) && (!q || (k + ' ' + G[k].f + ' ' + G[k].d).toLowerCase().includes(q))).map(k => `<div class="g ${k === term ? 'hl' : ''}" id="g-${esc(k)}"><dt>${esc(k)} <small>${esc(G[k].f && G[k].f !== k ? '· ' + G[k].f : '')} · ${esc(G[k].c)}</small></dt><dd>${md(G[k].d)}</dd></div>`).join(''); };
  $('#gq').oninput = draw; $('#gc').onchange = draw; draw();
  if (term) setTimeout(() => document.getElementById('g-' + term)?.scrollIntoView({ block: 'center' }), 50);
}

function practice() { $('#app').innerHTML = `<div class="box">${para(window.PRACTICE || '')}</div>`; mountWidgets(); }
function demo() { $('#app').innerHTML = `<div class="box">${para(window.DEMO || '')}</div>`; }

// Annotated image used to build the markdown's numbered screenshots (opened by the build script).
function render(secId, scrId) {
  const sec = SECTIONS.find(s => s.id === secId), scr = sec?.screens.find(s => s.id === scrId); if (!scr) return;
  const shot = SHOTS[scr.shot]; const spots = (scr.spots || []).filter(s => shot.spots.some(b => b.id === s.id)).map((s, i) => ({ n: i + 1, box: shot.spots.find(b => b.id === s.id) }));
  document.querySelector('.top').style.display = 'none';
  $('#app').style.padding = '0'; $('#app').style.maxWidth = 'none';
  $('#app').innerHTML = `<div class="stage" style="position:relative;top:0;max-height:none;border:0;border-radius:0;padding:12px;width:${shot.w + 24}px"><div class="wrap" id="rw" style="width:${shot.w}px">
   <img src="shots/${shot.file}" style="width:${shot.w}px">${spots.map(s => `<div class="hs on" style="left:${s.box.x}px;top:${s.box.y}px;width:${Math.max(s.box.w, 18)}px;height:${Math.max(s.box.h, 14)}px"><b>${s.n}</b></div>`).join('')}</div></div>`;
}

route();
