// Second half of the request captures (after the slow-save fix).
const L = require('./lib');
const fs = require('fs'), path = require('path');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');
async function setValue(page, id, v) {
  await page.fill(`[data-param="${id}"]`, v);
  await page.waitForFunction(() => /All changes saved/.test(document.querySelector('#save-status')?.textContent || ''), null, { timeout: 300000 });
  await page.waitForTimeout(400);
}
(async () => {
  const { browser, page } = await L.open('admin');
  const bada = await page.evaluate(async () => { const d = await (await fetch('/api/pilot/bootstrap')).json(); return d.requests.filter(r => r.name === 'TEST – Bada Dost rear axle 5.13').sort((a, b) => b.updated_at - a.updated_at)[0].id; });
  await L.nav(page, 'request/' + bada); await page.waitForSelector('#request-body'); await page.waitForTimeout(800);
  await L.shot(page, 'req_in_review', [{ id: 'meta', sel: '.request-meta .pill' }], { maxHeight: 900 });
  await page.fill('#field-search', 'Overall Ratio'); await page.waitForTimeout(600);
  await L.shot(page, 'req_calc_result', [
    { id: 'row', sel: '[data-row="t3_p3_p3-t1_r25_c6"]' }, { id: 'tag', sel: '[data-row="t3_p3_p3-t1_r25_c6"] .pill' },
    { id: 'input', sel: '[data-param="t3_p3_p3-t1_r25_c6"]' }, { id: 'count', sel: '.impact-number' }], { maxHeight: 1700 });
  const calc = await page.evaluate(() => { const f = S.current.fields.find(f => f.id === 't3_p3_p3-t1_r25_c6'); return { value: f.value, derived: f.derived, changes: S.assessment.changes.map(c => [c.label, c.before, c.after, c.tables, c.occurrence_count]) }; });
  fs.writeFileSync(path.join(SAMPLES, 'bada_calc.json'), JSON.stringify(calc, null, 1));

  // Demo N1 request to record and lock.
  await L.nav(page, 'requests');
  await page.click('.pagehead [data-action=new-request]');
  await page.fill('#form-name', 'TEST – Demo N1 axle 5.13 (to approve)');
  await page.selectOption('#form-base_id', 'demo_n1_base');
  await page.fill('#form-description', 'Rear axle ratio 4.56 to 5.13.');
  await page.click('#new-request-form button[type=submit]');
  await page.waitForSelector('#request-body'); await page.waitForTimeout(700);
  await setValue(page, 'rear_axle_ratio', '5.13');
  await page.click('.request-tabs [data-tab=package]'); await page.waitForTimeout(400);
  await page.click('[data-action=record-homologation]');
  await page.fill('#form-certificate', 'TEST-DEMO-001E01');
  await page.fill('#form-certificate_reference', 'Practice archive / certificate scan 001');
  await page.fill('#form-note', 'Practice approval: rear axle ratio 5.13 configuration as submitted.');
  await L.shotDialog(page, 'req_record_dialog', [
    { id: 'cert', sel: '#form-certificate' }, { id: 'ref', sel: '#form-certificate_reference' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#homologation-form [type=submit]' }]);
  await L.submit(page, '#homologation-form [type=submit]');
  await L.shot(page, 'req_locked', [
    { id: 'pill', sel: '.request-meta .pill' }, { id: 'scope', sel: '.request-head [data-action=regulatory-profile]' },
    { id: 'locked', sel: '.locked-hint' }, { id: 'linked', sel: '.locked-hint [data-action=new-request]' },
    { id: 'record', sel: '[data-action=record-homologation]' }], { maxHeight: 1400 });
  await page.click('.locked-hint [data-action=new-request]');
  await page.fill('#form-name', 'TEST – linked change after approval');
  await L.shotDialog(page, 'req_linked_dialog', [{ id: 'base', sel: '#form-base_id' }]);
  await L.closeDialog(page);
  await L.nav(page, 'vehicles');
  await L.shot(page, 'veh_new_variant', [{ id: 'card', sel: '.vehicle-card:has-text("TEST – Demo N1 axle 5.13")' }]);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
