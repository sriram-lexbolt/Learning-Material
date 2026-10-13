// Evidence library: list, details, add report, accept, duplicate, withdraw dialog, CEA, CEA reuse, wrong-vehicle reject, delete.
const L = require('./lib');
const fs = require('fs'), path = require('path');
const APP = 'D:/mine/jags/server/AL_Validation_Workspace_v5.1.2_2026-10-12/AL_Validation_Workspace';
const PDF = path.join(APP, 'samples', 'synthetic-evidence.pdf');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');

async function details(page, ref) {
  const id = await page.evaluate(ref => S.data.reports.find(r => r.reference === ref).id, ref);
  await page.click(`[data-action=report-details][data-id="${id}"]`); await page.waitForTimeout(400);
  return id;
}
const detailSpots = [
  { id: 'status', sel: '#dialog .dialog-content > .pill' }, { id: 'scope', sel: '#dialog .dialog-content > p', nth: 0 },
  { id: 'keys', sel: '#dialog .key-list' }, { id: 'coverage', sel: '#dialog h3:has-text("Recorded coverage")' },
  { id: 'cea', sel: '#dialog h3:has-text("Accepted CEA")' }, { id: 'open', sel: '#dialog a.btn' },
  { id: 'review', sel: '#dialog [data-action=review-report]' }, { id: 'ceabtn', sel: '#dialog [data-action=cea-report]' },
  { id: 'delete', sel: '#dialog [data-action=delete-record]' }];

async function addReport(page, o) {
  await L.nav(page, 'reports');
  await page.click('[data-action=add-report]');
  await page.selectOption('#form-vehicle_id', o.vehicle);
  await page.selectOption('#form-test_id', o.test);
  await page.fill('#form-reference', o.ref);
  await page.fill('#form-edition', o.edition);
  await page.fill('#form-scope', o.scope);
  await page.selectOption('#form-result', o.result || 'pass');
  await page.check('input[name=no_expiry]');
  await page.setInputFiles('#report-file', PDF);
}

(async () => {
  const { browser, page } = await L.open('admin');
  await L.nav(page, 'reports');
  await L.shot(page, 'ev_list', [
    { id: 'add', sel: '[data-action=add-report]' }, { id: 'hint', sel: '.hint' }, { id: 'ref', sel: 'tbody td:nth-child(1)', nth: 0 },
    { id: 'src', sel: 'tbody td:nth-child(2)', nth: 0 }, { id: 'test', sel: 'tbody td:nth-child(3)', nth: 0 }, { id: 'added', sel: 'tbody td:nth-child(4)', nth: 0 },
    { id: 'status', sel: 'tbody td:nth-child(5)', nth: 0 }, { id: 'details', sel: 'tbody [data-action=report-details]', nth: 0 }], { maxHeight: 1500 });

  // A seeded report that carries a CEA range (Demo 3 scenario).
  const ceaRef = await page.evaluate(() => S.data.reports.find(r => r.cea_basis)?.reference);
  console.log('seeded CEA report', ceaRef);
  if (ceaRef) { await details(page, ceaRef); await L.shotDialog(page, 'ev_details_seed_cea', detailSpots); await L.closeDialog(page); }

  // Add report dialog (empty), then the real loop on the approved practice request's vehicle.
  await page.click('[data-action=add-report]');
  await L.shotDialog(page, 'ev_add_dialog_empty', [
    { id: 'veh', sel: '#form-vehicle_id' }, { id: 'hint', sel: '#report-form .form-hint' }, { id: 'test', sel: '#form-test_id' },
    { id: 'ref', sel: '#form-reference' }, { id: 'ed', sel: '#form-edition' }, { id: 'scope', sel: '#form-scope' }, { id: 'result', sel: '#form-result' },
    { id: 'valid', sel: '#form-valid_until' }, { id: 'noexp', sel: 'label:has(input[name=no_expiry])' }, { id: 'file', sel: '#report-file' }, { id: 'ok', sel: '#report-form [type=submit]' }]);
  const opts = await page.evaluate(() => ({ vehicles: [...document.querySelectorAll('#form-vehicle_id option')].map(o => o.textContent), tests: [...document.querySelectorAll('#form-test_id option')].map(o => o.textContent), results: [...document.querySelectorAll('#form-result option')].map(o => o.textContent) }));
  fs.writeFileSync(path.join(SAMPLES, 'dropdowns_add_report.json'), JSON.stringify(opts, null, 1));
  await L.closeDialog(page);

  const approved = await page.evaluate(() => S.data.vehicles.find(v => v.name === 'TEST – Demo N1 axle 5.13 (to approve)').id);
  await addReport(page, { vehicle: approved, test: 'in-brake-service', ref: 'TEST-BRAKE-01', edition: 'SYNTHETIC functional register 1', scope: 'Service braking test of the 5.13 axle configuration (practice file).' });
  await L.shotDialog(page, 'ev_add_dialog_filled', [{ id: 'veh', sel: '#form-vehicle_id' }, { id: 'result', sel: '#form-result' }, { id: 'ok', sel: '#report-form [type=submit]' }]);
  await page.click('#report-form [type=submit]');
  await page.waitForFunction(() => /Report added/.test(document.querySelector('#toast').textContent)); await page.waitForTimeout(500);
  await L.shot(page, 'ev_provided', [{ id: 'row', sel: 'tbody tr', nth: 0 }, { id: 'status', sel: 'tbody td:nth-child(5)', nth: 0 }], { maxHeight: 900 });
  await details(page, 'TEST-BRAKE-01');
  await L.shotDialog(page, 'ev_details_provided', detailSpots);
  await page.click('#dialog [data-action=review-report]'); await page.waitForTimeout(300);
  await page.fill('#form-note', 'Checked report file, tested configuration (5.13 axle), edition and passing result.');
  await page.check('input[name=reconfirm_coverage]');
  await L.shotDialog(page, 'ev_review_dialog', [
    { id: 'sub', sel: '#dialog .dialog-head p' }, { id: 'action', sel: '#form-action' }, { id: 'note', sel: '#form-note' },
    { id: 'reconfirm', sel: 'label:has(input[name=reconfirm_coverage])' }, { id: 'ok', sel: '#report-review-form [type=submit]' }]);
  await page.click('#report-review-form [type=submit]');
  await page.waitForFunction(() => /Evidence review recorded/.test(document.querySelector('#toast').textContent)); await page.waitForTimeout(500);
  await details(page, 'TEST-BRAKE-01');
  await L.shotDialog(page, 'ev_details_approved', detailSpots);
  await page.click('#dialog [data-action=review-report]'); await page.waitForTimeout(300);
  await L.shotDialog(page, 'ev_withdraw_dialog', [{ id: 'action', sel: '#form-action' }]);
  await L.closeDialog(page);

  // Duplicate reference is refused.
  await addReport(page, { vehicle: approved, test: 'in-brake-service', ref: 'test-brake-01', edition: 'SYNTHETIC functional register 1', scope: 'Duplicate attempt with the same reference in small letters.' });
  await page.click('#report-form [type=submit]'); await page.waitForTimeout(1200);
  await L.shotDialog(page, 'ev_duplicate_error', [{ id: 'error', sel: '#form-error' }]);
  await L.closeDialog(page);

  // CEA range on the accepted report.
  await L.nav(page, 'reports');
  await details(page, 'TEST-BRAKE-01');
  await page.click('#dialog [data-action=cea-report]'); await page.waitForTimeout(300);
  await page.fill('#form-limits', JSON.stringify({ rear_axle_ratio: { min: 4.5, max: 5.2 } }, null, 2));
  await page.fill('#form-cea_source', 'Practice CEA note / agency-accepted extension criteria (fictional)');
  await page.fill('#form-cea_basis', 'Practice worst case: braking at the highest ratio tested covers 4.5 to 5.2 (fictional range for training).');
  await page.fill('#form-note', 'Practice CEA acceptance for training only.');
  await L.shotDialog(page, 'ev_cea_dialog', [
    { id: 'limits', sel: '#form-limits' }, { id: 'ed', sel: '#form-cea_edition' }, { id: 'src', sel: '#form-cea_source' },
    { id: 'basis', sel: '#form-cea_basis' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#cea-form [type=submit]' }]);
  await page.click('#cea-form [type=submit]');
  await page.waitForFunction(() => /CEA coverage recorded/.test(document.querySelector('#toast').textContent)); await page.waitForTimeout(400);
  await details(page, 'TEST-BRAKE-01');
  await L.shotDialog(page, 'ev_details_cea', detailSpots);
  await L.closeDialog(page);

  // New request from the original Demo N1 at 4.80: service braking now reuses TEST-BRAKE-01 through the CEA range.
  await L.nav(page, 'requests');
  await page.click('.pagehead [data-action=new-request]');
  await page.fill('#form-name', 'TEST – Demo N1 axle 4.80 (CEA reuse)');
  await page.selectOption('#form-base_id', 'demo_n1_base');
  await page.click('#new-request-form button[type=submit]');
  await page.waitForSelector('#request-body'); await page.waitForTimeout(700);
  await page.fill('[data-param="rear_axle_ratio"]', '4.80');
  await page.waitForFunction(() => /All changes saved/.test(document.querySelector('#save-status')?.textContent || ''));
  await page.waitForTimeout(500);
  await page.click('.request-tabs [data-tab=review]'); await page.waitForTimeout(400);
  await page.fill('#test-search', 'Service braking'); await page.waitForTimeout(300);
  await L.shot(page, 'ev_cea_reuse_row', [{ id: 'row', sel: '#test-rows tr', nth: 0 }, { id: 'pill', sel: '#test-rows .report-pill', nth: 0 }], { maxHeight: 1100 });
  await page.click('#test-rows [data-action=test-details] >> nth=0');
  await L.shotDialog(page, 'review_reuse_cea', [
    { id: 'status', sel: '#dialog .dialog-content > .pill' }, { id: 'linked', sel: '#dialog .hint.neutral' },
    { id: 'evidence', sel: '#dialog h3:has-text("Evidence comparison")' }]);
  await L.closeDialog(page);

  // Wrong vehicle: report on the supplied Bada Dost cannot be accepted -> reject -> delete.
  await addReport(page, { vehicle: 'al_bada_dost', test: 'in-horn-installation', ref: 'TEST-HORN-WRONG', edition: 'IS 15796', scope: 'Horn report attached to the supplied base by mistake (practice).' });
  await page.click('#report-form [type=submit]');
  await page.waitForFunction(() => /Report added/.test(document.querySelector('#toast').textContent)); await page.waitForTimeout(400);
  await details(page, 'TEST-HORN-WRONG');
  await page.click('#dialog [data-action=review-report]'); await page.waitForTimeout(300);
  await page.fill('#form-note', 'Trying to accept a report on a vehicle without recorded homologation.');
  await page.click('#report-review-form [type=submit]'); await page.waitForTimeout(1200);
  await L.shotDialog(page, 'ev_accept_error', [{ id: 'error', sel: '#form-error' }]);
  await page.selectOption('#form-action', 'reject');
  await page.fill('#form-note', 'Rejected: attached to the wrong vehicle (supplied base, no certificate).');
  await page.click('#report-review-form [type=submit]');
  await page.waitForFunction(() => /Evidence review recorded/.test(document.querySelector('#toast').textContent)); await page.waitForTimeout(400);
  await L.shot(page, 'ev_rejected', [{ id: 'status', sel: 'tbody td:nth-child(5)', nth: 0 }], { maxHeight: 900 });
  await details(page, 'TEST-HORN-WRONG');
  await L.shotDialog(page, 'ev_details_rejected', detailSpots);
  await page.click('#dialog [data-action=delete-record]');
  await page.waitForFunction(() => /Deleted report/.test(document.querySelector('#toast').textContent));
  console.log('toast:', await L.toast(page));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
