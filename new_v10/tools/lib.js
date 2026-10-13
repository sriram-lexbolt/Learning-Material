// Screenshot + hotspot capture helpers for the AL Pilot atlas.
// Every hotspot box is measured from the real DOM, so the atlas markers can't drift from the app.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8090';
const OUT = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'shots');
const MANIFEST = path.join(OUT, 'manifest.json');
const PASSWORD = 'Practice-Pass-2026';
const W = 1440, H = 900;
fs.mkdirSync(OUT, { recursive: true });

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));

async function open(role = 'admin') {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: W, height: H }, acceptDownloads: true, locale: 'en-GB' });
  const page = await context.newPage();
  page.setDefaultTimeout(150000);
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  page.on('dialog', d => d.accept());
  if (role) await login(page, role);
  return { browser, context, page };
}

async function login(page, role) {
  await page.goto(BASE + '/');
  await page.fill('#email', role + '@practice.local');
  await page.fill('#password', PASSWORD);
  await page.click('#login-form button[type=submit]');
  await page.waitForSelector('.sidebar');
  await settle(page);
}

async function settle(page, ms = 400) {
  await page.waitForTimeout(ms);
}

async function nav(page, view) {
  await page.evaluate(() => { const d = document.querySelector('#dialog'); if (d && d.open) d.close(); });
  await page.evaluate(v => { location.hash = v; }, view);
  await page.waitForSelector('#main .pagehead', { timeout: 150000 });
  await page.waitForTimeout(500);
}

// Resolve hotspot specs [{id, sel, nth?}] to boxes relative to (ox, oy).
async function boxes(page, spots, ox = 0, oy = 0) {
  const out = [];
  for (const s of spots) {
    const loc = page.locator(s.sel).nth(s.nth || 0);
    if (!(await loc.count())) { console.log('  ! missing hotspot', s.id, s.sel); continue; }
    const r = await loc.evaluate(el => { const b = el.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height }; });
    out.push({ id: s.id, x: Math.round(r.x - ox), y: Math.round(r.y - oy), w: Math.round(r.w), h: Math.round(r.h) });
  }
  return out;
}

// Full-page screenshot with hotspots. The viewport is grown to the page height so sticky/fixed parts lay out naturally.
async function shot(page, name, spots = [], opts = {}) {
  await settle(page, opts.wait || 300);
  await page.evaluate(() => scrollTo(0, 0));
  let full = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.querySelector('.main')?.scrollHeight || 0));
  const vh = Math.min(Math.max(H, full), opts.maxHeight || 6000);
  await page.setViewportSize({ width: W, height: vh });
  await page.waitForTimeout(300);
  full = await page.evaluate(() => document.documentElement.scrollHeight);
  const h = Math.min(full, opts.maxHeight || 6000);
  if (h > vh) { await page.setViewportSize({ width: W, height: h }); await page.waitForTimeout(200); }
  const file = path.join(OUT, name + '.png');
  const b = await boxes(page, spots);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: h } });
  manifest[name] = { file: name + '.png', w: W, h, spots: b.filter(s => s.y < h) };
  save();
  await page.setViewportSize({ width: W, height: H });
  console.log('shot', name, b.length + '/' + spots.length);
}

// Screenshot just the open <dialog>, grown to its full height so nothing is cut off.
async function shotDialog(page, name, spots = []) {
  await settle(page, 350);
  const full = await page.evaluate(() => document.querySelector('#dialog').scrollHeight);
  const vh = Math.min(Math.max(H, full + 80), 7000);
  await page.setViewportSize({ width: W, height: vh });
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => { const d = document.querySelector('#dialog'); d.scrollTop = 0; const b = d.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const pad = 14;
  const clip = { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + pad * 2, height: r.h + pad * 2 };
  const file = path.join(OUT, name + '.png');
  const b = await boxes(page, spots, clip.x, clip.y);
  await page.screenshot({ path: file, clip });
  manifest[name] = { file: name + '.png', w: Math.round(clip.width), h: Math.round(clip.height), dialog: true, spots: b };
  save();
  await page.setViewportSize({ width: W, height: H });
  console.log('dialog', name, b.length + '/' + spots.length);
}

async function closeDialog(page) {
  await page.evaluate(() => document.querySelector('#dialog').open && document.querySelector('#dialog').close());
  await page.waitForTimeout(150);
}

// API helper using the logged-in browser session (for setting up state quickly).
async function api(page, method, p, body) {
  return page.evaluate(async ([method, p, body]) => {
    const r = await fetch('/api' + p, { method, headers: { 'Content-Type': 'application/json', 'x-csrf-token': S.user.csrf }, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
    if (!r.ok) throw new Error(p + ' ' + r.status + ' ' + t);
    return j;
  }, [method, p, body]);
}

// Click a dialog's submit button and wait until the dialog closes (server can be slow).
async function submit(page, sel) {
  await page.click(sel);
  await page.waitForFunction(() => !document.querySelector('#dialog').open, null, { timeout: 300000 });
  await page.waitForTimeout(600);
}

async function toast(page) { return page.locator('#toast').textContent(); }

module.exports = { submit, open, login, settle, nav, shot, shotDialog, closeDialog, api, toast, BASE, OUT, W, H, manifest, save };
