// Validation requests: list, create, edit, calculation rule, scope, history, package, AI, submit, record, lock, linked.
const L = require('./lib');
const fs = require('fs'), path = require('path');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');
fs.mkdirSync(SAMPLES, { recursive: true });

async function openRequest(page, id) { await L.nav(page, 'request/' + id); await page.waitForSelector('#request-body'); await page.waitForTimeout(600); }
async function tab(page, t) { await page.click(`.request-tabs [data-tab=${t}]`); await page.waitForTimeout(500); }
async function setValue(page, id, v) {
  await page.fill(`[data-param="${id}"]`, v);
  await page.waitForFunction(() => /All changes saved/.test(document.querySelector('#save-status')?.textContent || ''), null, { timeout: 150000 });
  await page.waitForTimeout(400);
}
async function newRequest(page, name, base, route = 'extension', desc = '') {
  await L.nav(page, 'requests');
  await page.click('.pagehead [data-action=new-request]');
  await page.fill('#form-name', name);
  await page.selectOption('#form-base_id', base);
  await page.selectOption('#form-route', route);
  if (desc) await page.fill('#form-description', desc);
  await page.click('#new-request-form button[type=submit]');
  await page.waitForSelector('#request-body'); await page.waitForTimeout(700);
  return page.evaluate(() => S.current.id);
}

(async () => {
  const { browser, page } = await L.open('admin');

  // 1. Dashboard with the seeded requests.
  await L.nav(page, 'requests');
  await L.shot(page, 'dash_list', [
    { id: 'stats', sel: '.stats' }, { id: 'tabs', sel: '.toolbar .tabs' }, { id: 'row', sel: 'tbody tr', nth: 0 },
    { id: 'name', sel: 'tbody .table-link', nth: 0 }, { id: 'base', sel: 'tbody td:nth-child(2)', nth: 0 },
    { id: 'workflow', sel: 'tbody td:nth-child(3) .pill', nth: 0 }, { id: 'updated', sel: 'tbody td:nth-child(4)', nth: 0 },
    { id: 'arrow', sel: 'tbody td:nth-child(5) button', nth: 0 }, { id: 'cards', sel: '.cards' }]);

  // 2. New request dialog (empty, then filled).
  await page.click('.pagehead [data-action=new-request]');
  await L.shotDialog(page, 'req_new_dialog', [
    { id: 'name', sel: '#form-name' }, { id: 'base', sel: '#form-base_id' }, { id: 'route', sel: '#form-route' },
    { id: 'desc', sel: '#form-description' }, { id: 'hint', sel: '#new-request-form .hint' },
    { id: 'cancel', sel: '#new-request-form [data-action=close]' }, { id: 'create', sel: '#new-request-form [type=submit]' }]);
  const baseOptions = await page.$$eval('#form-base_id option', os => os.map(o => o.textContent));
  const routeOptions = await page.$$eval('#form-route option', os => os.map(o => o.textContent));
  fs.writeFileSync(path.join(SAMPLES, 'dropdowns_new_request.json'), JSON.stringify({ baseOptions, routeOptions }, null, 1));
  await L.closeDialog(page);

  // 3. Real Bada Dost request.
  const bada = await newRequest(page, 'TEST – Bada Dost rear axle 5.13', 'al_bada_dost', 'extension', 'Rear axle ratio changes from 4.56 to 5.13 (AL example from the 6 Oct meeting).');
  await L.shot(page, 'req_page_top', [
    { id: 'eyebrow', sel: '.request-head .eyebrow' }, { id: 'title', sel: '.request-head h1' }, { id: 'based', sel: '.request-head .sub' },
    { id: 'meta', sel: '.request-meta' }, { id: 'delete', sel: '.request-head [data-action=delete-record]' },
    { id: 'scope', sel: '.request-head [data-action=regulatory-profile]' }, { id: 'ai', sel: '#request-ai-status' },
    { id: 'history', sel: '.request-head [data-action=history]' }, { id: 'export', sel: '.request-head [data-action=download]' },
    { id: 'progress', sel: '.progress' }, { id: 'tabs', sel: '.request-tabs' }, { id: 'calc', sel: '[data-action=calculation-rule]' },
    { id: 'saved', sel: '#save-status' }, { id: 'search', sel: '#field-search' }, { id: 'group', sel: '#group-filter' },
    { id: 'table', sel: '#table-filter' }, { id: 'changes', sel: 'label:has(#changed-filter)' }, { id: 'empty', sel: 'label:has(#empty-filter)' },
    { id: 'row', sel: '.field-row', nth: 0 }, { id: 'impact', sel: '.impact-box' }, { id: 'aibox', sel: '.ai-box' }, { id: 'more', sel: '.field-more' }], { maxHeight: 2600 });
  const groups = await page.$$eval('#group-filter option', os => os.map(o => o.textContent));
  const tables = await page.$$eval('#table-filter option', os => os.map(o => o.textContent));
  fs.writeFileSync(path.join(SAMPLES, 'dropdowns_editor.json'), JSON.stringify({ groups, tables }, null, 1));

  await page.fill('#field-search', 'Rear axle ratio'); await page.waitForTimeout(500);
  await page.click('[data-row="rear_axle_ratio"] summary');
  await L.shot(page, 'req_field_search', [
    { id: 'search', sel: '#field-search' }, { id: 'label', sel: '[data-row="rear_axle_ratio"] .field-label' },
    { id: 'tags', sel: '[data-row="rear_axle_ratio"] .field-tags' }, { id: 'details', sel: '[data-row="rear_axle_ratio"] .field-details' },
    { id: 'links', sel: '[data-row="rear_axle_ratio"] .field-details a', nth: 0 }, { id: 'input', sel: '[data-param="rear_axle_ratio"]' }], { maxHeight: 1500 });
  await setValue(page, 'rear_axle_ratio', '5.13');
  await L.shot(page, 'req_field_changed', [
    { id: 'saved', sel: '#save-status' }, { id: 'input', sel: '[data-param="rear_axle_ratio"]' }, { id: 'was', sel: '[data-row="rear_axle_ratio"] .was' },
    { id: 'revision', sel: '#revision' }, { id: 'count', sel: '.impact-number' }, { id: 'totals', sel: '.impact-totals' },
    { id: 'systems', sel: '.system-list' }, { id: 'sysrow', sel: '.system-row', nth: 0 }, { id: 'viewall', sel: '.system-list [data-action=tab]' }], { maxHeight: 1500 });

  // 4. Calculation rule: 1st overall ratio (RSB) = 1st gear ratio (RSB) × rear axle ratio.
  await page.fill('#field-search', ''); await page.waitForTimeout(300);
  await page.click('[data-action=calculation-rule]');
  await L.shotDialog(page, 'req_calc_dialog', [
    { id: 'target', sel: '#form-target' }, { id: 'in1', sel: '#form-input1' }, { id: 'op', sel: '#form-operation' },
    { id: 'in2', sel: '#form-input2' }, { id: 'prec', sel: '#form-precision' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#calculation-form [type=submit]' }]);
  await page.selectOption('#form-target', 't3_p3_p3-t1_r25_c6');
  await page.selectOption('#form-input1', 't3_p3_p3-t1_r25_c4');
  await page.selectOption('#form-operation', 'multiply');
  await page.selectOption('#form-input2', 'rear_axle_ratio');
  await page.selectOption('#form-precision', '0.01');
  await page.fill('#form-note', 'Overall ratio = gearbox ratio x final drive ratio (RSB column, 1st gear). Practice rule; confirm formula and rounding with AL.');
  await page.click('#calculation-form [type=submit]'); await page.waitForTimeout(1200);
  await page.fill('#field-search', 'Overall Ratio'); await page.waitForTimeout(500);
  await L.shot(page, 'req_calc_result', [
    { id: 'row', sel: '[data-row="t3_p3_p3-t1_r25_c6"]' }, { id: 'tag', sel: '[data-row="t3_p3_p3-t1_r25_c6"] .pill' },
    { id: 'input', sel: '[data-param="t3_p3_p3-t1_r25_c6"]' }, { id: 'count', sel: '.impact-number' }], { maxHeight: 1700 });
  await page.fill('#field-search', ''); await page.check('#changed-filter'); await page.waitForTimeout(500);
  await L.shot(page, 'req_changes_only', [{ id: 'changes', sel: 'label:has(#changed-filter)' }, { id: 'list', sel: '#field-list' }], { maxHeight: 1500 });
  await page.uncheck('#changed-filter');

  // 5. History, vehicle scope.
  await page.click('.request-head [data-action=history]');
  await L.shotDialog(page, 'req_history', [{ id: 'item', sel: '.history-item', nth: 0 }, { id: 'hint', sel: '#dialog .hint' }]);
  await L.closeDialog(page);
  await page.click('.request-head [data-action=regulatory-profile]');
  await L.shotDialog(page, 'req_scope_dialog', [
    { id: 'first', sel: '#form-transport_vehicle' }, { id: 'abs', sel: '#form-abs' }, { id: 'date', sel: '#form-manufacture_date' },
    { id: 'route', sel: '#form-model_route' }, { id: 'note', sel: '#form-note' }, { id: 'save', sel: '#regulatory-profile-form [type=submit]' }]);
  await L.closeDialog(page);

  // 6. Tests & evidence on the real truck.
  await tab(page, 'review');
  await L.shot(page, 'req_tests_bada', [
    { id: 'stats', sel: '.review-stats' }, { id: 'search', sel: '#test-search' }, { id: 'filter', sel: '#test-filter' },
    { id: 'confirm', sel: '[data-action=register-batch]' }, { id: 'submit', sel: '[data-action=submit-review]' }, { id: 'hint', sel: '#request-body .hint' },
    { id: 'col1', sel: '.review-table th', nth: 0 }, { id: 'col2', sel: '.review-table th', nth: 1 }, { id: 'col3', sel: '.review-table th', nth: 2 },
    { id: 'row', sel: '#test-rows tr', nth: 0 }, { id: 'reviewbtn', sel: '#test-rows [data-action=test-details]', nth: 0 }], { maxHeight: 2200 });
  const counts = await page.evaluate(() => S.assessment.counts);
  fs.writeFileSync(path.join(SAMPLES, 'bada_counts.json'), JSON.stringify(counts, null, 1));
  await page.selectOption('#test-filter', 'input_gap'); await page.waitForTimeout(300);
  await page.click('#test-rows [data-action=test-details] >> nth=0');
  await L.shotDialog(page, 'review_inputs_needed', [
    { id: 'status', sel: '#dialog .dialog-content > .pill' }, { id: 'needed', sel: '#dialog h3:has-text("Information needed")' },
    { id: 'params', sel: '#dialog h3:has-text("Test-relevant parameters")' }, { id: 'evidence', sel: '#dialog h3:has-text("Evidence comparison")' },
    { id: 'basis', sel: '#dialog h3:has-text("Regulatory basis")' }, { id: 'accept', sel: '#dialog h3:has-text("Acceptance and evidence")' },
    { id: 'source', sel: '#dialog h3:has-text("Source and criteria")' }, { id: 'buttons', sel: '#dialog .dialog-content > .actions' }]);
  await L.closeDialog(page);

  // 7. PDF package + table selection + downloads.
  await tab(page, 'package');
  await L.shot(page, 'req_package', [
    { id: 'scope', sel: '#request-body [data-action=regulatory-profile]' }, { id: 'tables', sel: '[data-action=choose-tables]' },
    { id: 'hint', sel: '#request-body .hint' }, { id: 'form', sel: '#request-body tbody tr', nth: 0 },
    { id: 'status', sel: '#request-body tbody td:nth-child(3)', nth: 0 }, { id: 'sched', sel: '#request-body tbody tr:has-text("Table 8")' },
    { id: 'combined', sel: '[data-format=pdf]' }, { id: 'zip', sel: '#request-body [data-format=zip]' },
    { id: 'receive', sel: '#request-body aside .impact-box' }, { id: 'record', sel: '[data-action=record-homologation]' }], { maxHeight: 2400 });
  await page.click('[data-action=choose-tables]');
  await L.shotDialog(page, 'req_tables_dialog', [{ id: 'first', sel: '.table-choice', nth: 0 }, { id: 'save', sel: '#tables-form [type=submit]' }]);
  await L.closeDialog(page);
  for (const [fmt, sel] of [['zip', '#request-body [data-format=zip]'], ['pdf', '[data-format=pdf]']]) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 180000 }), page.click(sel)]);
    await dl.saveAs(path.join(SAMPLES, 'bada_axle_513_package.' + fmt));
    console.log('downloaded', fmt);
  }

  // 8. Submit for review, then record homologation, then locked view and linked request.
  await tab(page, 'review');
  await page.click('[data-action=submit-review]');
  await page.fill('#form-note', 'Rear axle ratio 4.56 -> 5.13. Braking rows need engineering review; no real AL reports recorded yet.');
  await L.shotDialog(page, 'req_submit_dialog', [{ id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#submit-form [type=submit]' }]);
  await page.click('#submit-form [type=submit]'); await page.waitForTimeout(1000);
  await L.shot(page, 'req_in_review', [{ id: 'meta', sel: '.request-meta .pill' }], { maxHeight: 900 });

  // A small Demo N1 request to record and lock (keeps the real Bada Dost request editable).
  const demo = await newRequest(page, 'TEST – Demo N1 axle 5.13 (to approve)', 'demo_n1_base', 'extension', 'Rear axle ratio 4.56 to 5.13.');
  await setValue(page, 'rear_axle_ratio', '5.13');
  await tab(page, 'package');
  await page.click('[data-action=record-homologation]');
  await page.fill('#form-certificate', 'TEST-DEMO-001E01');
  await page.fill('#form-certificate_reference', 'Practice archive / certificate scan 001');
  await page.fill('#form-note', 'Practice approval: rear axle ratio 5.13 configuration as submitted.');
  await L.shotDialog(page, 'req_record_dialog', [
    { id: 'cert', sel: '#form-certificate' }, { id: 'ref', sel: '#form-certificate_reference' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#homologation-form [type=submit]' }]);
  await page.click('#homologation-form [type=submit]'); await page.waitForTimeout(1500);
  await L.shot(page, 'req_locked', [
    { id: 'pill', sel: '.request-meta .pill' }, { id: 'scope', sel: '.request-head [data-action=regulatory-profile]' },
    { id: 'locked', sel: '.locked-hint' }, { id: 'linked', sel: '.locked-hint [data-action=new-request]' },
    { id: 'record', sel: '[data-action=record-homologation]' }], { maxHeight: 1400 });
  await page.click('.locked-hint [data-action=new-request]');
  await page.fill('#form-name', 'TEST – linked change after approval');
  await L.shotDialog(page, 'req_linked_dialog', [{ id: 'base', sel: '#form-base_id' }]);
  await L.closeDialog(page);

  fs.writeFileSync(path.join(SAMPLES, 'ids.json'), JSON.stringify({ bada, demo }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
