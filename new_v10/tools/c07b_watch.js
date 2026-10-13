// Regulatory updates: empty desk -> record (with wording check) -> draft -> activate -> impact -> assign -> track
// -> request flags -> confirm new edition -> new report -> reuse -> resolve; plus watch-only draft, filter, withdraw dialog.
const L = require('./lib');
const fs = require('fs'), path = require('path');
const APP = 'D:/mine/jags/server/AL_Validation_Workspace_v5.1.2_2026-10-12/AL_Validation_Workspace';
const PDF = path.join(APP, 'samples', 'synthetic-evidence.pdf');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');
const ids = JSON.parse(fs.readFileSync(path.join(SAMPLES, 'statuses.json'), 'utf8'));
const toastIs = (page, re) => page.waitForFunction(r => new RegExp(r).test(document.querySelector('#toast').textContent), re.source, { timeout: 150000 });
const updId = (page, title) => page.evaluate(t => S.data.regulatory_updates.updates.find(u => u.title === t).id, title);

async function fillUpdate(page, o) {
  await L.nav(page, 'updates');
  await page.click('.pagehead [data-action=reg-update-new]'); await page.waitForTimeout(400);
  await page.fill('#form-title', o.title); await page.fill('#form-reference', o.reference);
  await page.fill('#form-source_url', o.url); await page.fill('#form-source_locator', o.locator);
  await page.selectOption('#form-publication', o.publication); await page.fill('#form-edition', o.edition);
  await page.fill('#form-effective_date', o.date); await page.selectOption('#form-model_route', o.route || 'all');
  await page.fill('#reg-test-search', o.test); await page.waitForTimeout(300);
  await page.click('[data-action=reg-update-select-tests]');
  await page.fill('#form-changes', o.changes); await page.fill('#form-note', o.note);
  if (o.params) await page.fill('#form-required_parameters', o.params);
}

(async () => {
  const { browser, page } = await L.open('admin');
  await L.nav(page, 'updates');
  const A = await updId(page, 'TEST – audible warning amendment');
  // A watch-only draft: it can never be activated.
  await fillUpdate(page, {
    title: 'TEST – draft lighting proposal (watch only)', reference: 'TEST-DRAFT-LIGHTING', url: 'https://example.test/draft-lighting.pdf',
    locator: 'Draft for comments, clause 5', publication: 'draft', edition: 'TEST-LIGHT-DRAFT-1', date: '2027-04-01',
    test: 'Lighting', changes: 'Practice draft: proposed lighting installation changes, watch only.', note: 'Practice: draft notification for comments.' });
  await page.click('#reg-update-create [type=submit]'); await page.waitForTimeout(3000); console.log('form error:', await page.locator('#form-error').textContent().catch(()=>'')); await toastIs(page, /saved/); await page.waitForTimeout(500);
  const B = await updId(page, 'TEST – draft lighting proposal (watch only)');
  await page.click(`.reg-card-footer [data-id="${B}"]`); await page.waitForTimeout(400);
  await L.shotDialog(page, 'reg_watch_detail', [{ id: 'activate', sel: '[data-transition=activate]' }, { id: 'hint', sel: '#dialog .hint.neutral' }]);
  await L.closeDialog(page);
  await L.shot(page, 'reg_two_updates', [{ id: 'filter', sel: '#reg-update-filter' }, { id: 'cardA', sel: '.reg-card', nth: 1 }, { id: 'cardB', sel: '.reg-card', nth: 0 }], { maxHeight: 1800 });

  const st = await page.evaluate(id => { const u = S.data.regulatory_updates.updates.find(u => u.id === id); return { impacts: u.impacts.length, rows: u.impacts.map(r => [r.target_name, r.phase, r.status, r.historical, r.overdue]) }; }, A);
  fs.writeFileSync(path.join(SAMPLES, 'regulatory_story.json'), JSON.stringify(st, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
