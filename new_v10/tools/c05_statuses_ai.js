// Every status's review window, reviewer actions on rows, batch confirm, and the AI (simulated provider).
const L = require('./lib');
const fs = require('fs'), path = require('path');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');

async function openReq(page, id) { await L.nav(page, 'request/' + id); await page.waitForSelector('#request-body'); await page.waitForTimeout(600); }
async function tests(page) { await page.click('.request-tabs [data-tab=review]'); await page.waitForTimeout(500); await page.fill('#test-search', ''); await page.selectOption('#test-filter', 'all'); await page.waitForTimeout(300); }
async function reviewOf(page, testId) { await page.click(`#test-rows [data-action=test-details][data-id="${testId}"]`); await page.waitForTimeout(400); }
async function search(page, q) { await page.fill('#test-search', q); await page.waitForTimeout(300); }
const reviewSpots = [
  { id: 'status', sel: '#dialog .dialog-content > .pill' }, { id: 'reason', sel: '#dialog .dialog-content > p', nth: 0 },
  { id: 'linked', sel: '#dialog .hint.neutral' }, { id: 'regchange', sel: '#dialog .dialog-content > .hint:not(.neutral)' },
  { id: 'needed', sel: '#dialog h3:has-text("Information needed")' }, { id: 'params', sel: '#dialog h3:has-text("Test-relevant parameters")' },
  { id: 'changed', sel: '#dialog .detail-list .pill:has-text("Changed")' }, { id: 'evidence', sel: '#dialog h3:has-text("Evidence comparison")' },
  { id: 'basis', sel: '#dialog h3:has-text("Regulatory basis")' }, { id: 'accept', sel: '#dialog h3:has-text("Acceptance and evidence")' },
  { id: 'source', sel: '#dialog h3:has-text("Source and criteria")' }, { id: 'confirm', sel: '#dialog [data-action=register-test]' },
  { id: 'decision', sel: '#dialog [data-action=decision]' }, { id: 'ai', sel: '#dialog [data-action=ai-test]' }];
const find = (page, fn) => page.evaluate(`(${fn})(S.assessment.tests, S.current)`);

(async () => {
  const { browser, page } = await L.open('admin');
  const out = {};

  // Demo 1: exact reuse + not applicable.
  await openReq(page, 'demo_full_2026_request_baseline'); await tests(page);
  await L.shot(page, 'tests_demo1', [{ id: 'stats', sel: '.review-stats' }, { id: 'row', sel: '#test-rows tr', nth: 0 }, { id: 'pill', sel: '#test-rows .report-pill', nth: 0 }], { maxHeight: 1400 });
  const reuse = await find(page, ts => ts.find(t => t.status === 'reuse' && /Service braking/.test(t.title)).id);
  await reviewOf(page, reuse); await L.shotDialog(page, 'review_reuse', reviewSpots); await L.closeDialog(page);
  const na = await find(page, ts => ts.find(t => t.status === 'not_applicable'));
  out.not_applicable = { title: na.title, reason: na.reason };
  await search(page, na.title);
  await L.shot(page, 'tests_not_applicable_row', [{ id: 'row', sel: '#test-rows tr', nth: 0 }], { maxHeight: 1000 });
  await reviewOf(page, na.id); await L.shotDialog(page, 'review_not_applicable', reviewSpots); await L.closeDialog(page);

  // Demo 2: evidence from another recorded vehicle.
  await openReq(page, 'demo_full_2026_request_matching'); await tests(page);
  const other = await find(page, (ts, r) => ts.find(t => t.evidence && t.evidence.vehicle_id !== r.base_id));
  out.cross_vehicle = { title: other.title, vehicle: other.evidence.vehicle, certificate: other.evidence.certificate };
  await search(page, other.title);
  await L.shot(page, 'tests_cross_vehicle_row', [{ id: 'row', sel: '#test-rows tr', nth: 0 }, { id: 'pill', sel: '#test-rows .report-pill', nth: 0 }], { maxHeight: 1000 });
  await reviewOf(page, other.id); await L.shotDialog(page, 'review_reuse_other_vehicle', reviewSpots); await L.closeDialog(page);

  // Demo 3: seeded CEA reuse.
  await openReq(page, 'demo_full_2026_request_cea'); await tests(page);
  const cea = await find(page, ts => ts.find(t => t.evidence && t.evidence.match === 'accepted_cea'));
  if (cea) { await search(page, cea.title); await reviewOf(page, cea.id); await L.shotDialog(page, 'review_reuse_seed_cea', reviewSpots); await L.closeDialog(page); out.cea = cea.title; }

  // Demo 4: engineering review + retest.
  await openReq(page, 'demo_full_2026_request_retest');
  await L.shot(page, 'demo4_edit', [{ id: 'impact', sel: '.impact-box' }, { id: 'changed', sel: '.field-row.changed', nth: 0 }], { maxHeight: 1600 });
  await tests(page);
  await page.selectOption('#test-filter', 'engineering_review'); await page.waitForTimeout(300);
  await L.shot(page, 'tests_demo4_eng', [{ id: 'filter', sel: '#test-filter' }, { id: 'row', sel: '#test-rows tr', nth: 0 }], { maxHeight: 1800 });
  const eng = await find(page, ts => ts.find(t => t.status === 'engineering_review' && t.candidates.length).id);
  await reviewOf(page, eng); await L.shotDialog(page, 'review_engineering', reviewSpots); await L.closeDialog(page);
  await page.selectOption('#test-filter', 'retest'); await page.waitForTimeout(300);
  const rt = await find(page, ts => ts.find(t => t.status === 'retest').id);
  await L.shot(page, 'tests_demo4_retest', [{ id: 'row', sel: '#test-rows tr', nth: 0 }], { maxHeight: 1000 });
  await reviewOf(page, rt); await L.shotDialog(page, 'review_retest', reviewSpots); await L.closeDialog(page);

  // AI on Demo 4: whole request (runs in batches) and one test.
  await page.click('.request-tabs [data-tab=specifications]'); await page.waitForTimeout(400);
  await page.click('.ai-box [data-action=ai]');
  await page.waitForFunction(() => /tests reviewed/.test(document.querySelector('.ai-box')?.textContent || ''), null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  await L.shot(page, 'ai_running', [{ id: 'header', sel: '#request-ai-status' }, { id: 'box', sel: '.ai-box' }, { id: 'progress', sel: '.ai-box [data-action=ai-job]' }], { maxHeight: 1400 });
  await page.click('.ai-box [data-action=ai-job]');
  await L.shotDialog(page, 'ai_progress_dialog', [{ id: 'cancel', sel: '#dialog [data-action=ai-cancel]' }]);
  await L.closeDialog(page);
  await page.waitForFunction(() => /Ready/.test(document.querySelector('#request-ai-status')?.textContent || ''), null, { timeout: 300000 });
  await page.waitForTimeout(800);
  await L.shot(page, 'ai_ready', [{ id: 'header', sel: '#request-ai-status' }, { id: 'box', sel: '.ai-box' }, { id: 'read', sel: '[data-action=ai-details]' }, { id: 'refresh', sel: '.ai-box [data-action=ai]' }], { maxHeight: 1400 });
  await page.click('[data-action=ai-details]'); await page.waitForTimeout(400);
  await page.evaluate(() => { const d = [...document.querySelectorAll('#dialog details.ai-section')]; const sys = d.find(x => /Braking|Powertrain|Emission/.test(x.querySelector('summary').textContent) && !/Part/.test(x.querySelector('summary').textContent)); if (sys) sys.open = true; });
  await L.shotDialog(page, 'ai_details', [
    { id: 'parts', sel: '#dialog details.ai-section', nth: 0 }, { id: 'ready', sel: '#dialog .dialog-content > .pill' },
    { id: 'blockers', sel: '#dialog h3:has-text("Blockers")' }, { id: 'systems', sel: '#dialog h3:has-text("Vehicle systems")' },
    { id: 'test', sel: '#dialog .ai-test', nth: 0 }, { id: 'foot', sel: '#dialog .dialog-content > .hint.neutral' }]);
  await L.closeDialog(page);
  await tests(page); await page.selectOption('#test-filter', 'engineering_review'); await page.waitForTimeout(300);
  await reviewOf(page, eng);
  await page.click('#dialog [data-action=ai-test]');
  await page.waitForFunction(() => /Read AI overview of this test/.test(document.querySelector('#dialog [data-action=ai-test]')?.textContent || ''), null, { timeout: 120000 });
  await L.shotDialog(page, 'ai_test_ready_button', [{ id: 'ai', sel: '#dialog [data-action=ai-test]' }]);
  await page.click('#dialog [data-action=ai-test]'); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll('#dialog details.ai-section').forEach(d => d.open = true));
  await L.shotDialog(page, 'ai_test_answer', [{ id: 'test', sel: '#dialog .ai-test', nth: 0 }]);
  await L.closeDialog(page);

  // Edition review + reviewer actions on a fresh practice request from the complete demo base.
  await L.nav(page, 'requests');
  await page.click('.pagehead [data-action=new-request]');
  await page.fill('#form-name', 'TEST – Demo complete: scope & reviewer actions');
  await page.selectOption('#form-base_id', 'demo_full_2026_base');
  await page.click('#new-request-form button[type=submit]');
  await page.waitForSelector('#request-body'); await page.waitForTimeout(700);
  const practice = await page.evaluate(() => S.current.id);
  const before = await page.evaluate(() => S.assessment.counts);
  await page.click('.request-head [data-action=regulatory-profile]');
  await page.selectOption('#form-transport_vehicle', 'no');
  await page.selectOption('#form-abs', 'yes');
  await page.fill('#form-manufacture_date', '2026-12-01');
  await page.selectOption('#form-model_route', 'existing');
  await page.fill('#form-note', 'Practice scope facts: goods vehicle, not a transport vehicle; ABS fitted; existing model; build from Dec 2026.');
  await L.shotDialog(page, 'req_scope_filled', [{ id: 'first', sel: '#form-transport_vehicle' }, { id: 'abs', sel: '#form-abs' }, { id: 'date', sel: '#form-manufacture_date' }, { id: 'route', sel: '#form-model_route' }, { id: 'note', sel: '#form-note' }]);
  await page.click('#regulatory-profile-form [type=submit]');
  await page.waitForFunction(() => /Vehicle scope saved/.test(document.querySelector('#toast').textContent)); await page.waitForTimeout(600);
  const after = await page.evaluate(() => S.assessment.counts);
  out.scope_counts = { before, after };
  await tests(page);
  await page.selectOption('#test-filter', 'edition_review'); await page.waitForTimeout(300);
  await L.shot(page, 'tests_edition_review', [{ id: 'filter', sel: '#test-filter' }, { id: 'row', sel: '#test-rows tr', nth: 0 }, { id: 'confirm', sel: '[data-action=register-batch]' }], { maxHeight: 1800 });
  const ed = await find(page, ts => ts.find(t => t.status === 'edition_review').id);
  out.edition_review = await find(page, ts => ts.filter(t => t.status === 'edition_review').map(t => [t.title, t.reason]));
  await reviewOf(page, ed); await L.shotDialog(page, 'review_edition', reviewSpots);
  await page.click('#dialog [data-action=register-test]'); await page.waitForTimeout(300);
  await L.shotDialog(page, 'req_register_test_dialog', [{ id: 'ed', sel: '#form-edition' }, { id: 'app', sel: '#form-applicable' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#register-form [type=submit]' }]);
  await L.closeDialog(page);

  // Batch confirm: one deliberate error, then a proper confirmation.
  await page.click('[data-action=register-batch]'); await page.waitForTimeout(400);
  await L.shotDialog(page, 'req_batch_dialog', [
    { id: 'tick', sel: '[data-selected]', nth: 0 }, { id: 'item', sel: '#register-batch-form tbody td:nth-child(2)', nth: 0 },
    { id: 'ed', sel: '[data-edition]', nth: 0 }, { id: 'app', sel: '[data-applicable]', nth: 0 }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#register-batch-form [type=submit]' }]);
  await page.check('[data-selected] >> nth=0'); await page.fill('[data-edition] >> nth=0', '');
  await page.fill('#form-note', 'Checked against the notified source.');
  await page.click('#register-batch-form [type=submit]'); await page.waitForTimeout(600);
  await L.shotDialog(page, 'req_batch_error', [{ id: 'error', sel: '#form-error' }, { id: 'note', sel: '#form-note' }]);
  await page.fill('[data-edition] >> nth=0', 'SYNTHETIC functional register 1');
  await page.click('#register-batch-form [type=submit]');
  await page.waitForFunction(() => !document.querySelector('#dialog').open, null, { timeout: 120000 }); await page.waitForTimeout(500);
  out.after_batch = await page.evaluate(() => S.assessment.counts);

  // Record engineering decision: retest on a reused row, then clear it.
  await page.selectOption('#test-filter', 'all'); await search(page, 'Service braking');
  const sb = await find(page, ts => ts.find(t => /Service braking/.test(t.title)).id);
  await reviewOf(page, sb);
  await page.click('#dialog [data-action=decision]'); await page.waitForTimeout(300);
  await page.selectOption('#form-action', 'retest');
  await page.fill('#form-note', 'Practice: brake lining supplier change planned; commission a new service braking test.');
  await L.shotDialog(page, 'req_decision_dialog', [{ id: 'action', sel: '#form-action' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#decision-form [type=submit]' }]);
  await page.click('#decision-form [type=submit]');
  await page.waitForFunction(() => !document.querySelector('#dialog').open); await page.waitForTimeout(500);
  await search(page, 'Service braking');
  await L.shot(page, 'tests_after_decision', [{ id: 'row', sel: '#test-rows tr', nth: 0 }], { maxHeight: 1000 });

  // A request to delete (admin).
  await L.nav(page, 'requests');
  await page.click('.pagehead [data-action=new-request]');
  await page.fill('#form-name', 'TEST – request to delete');
  await page.selectOption('#form-base_id', 'demo_n1_base');
  await page.click('#new-request-form button[type=submit]');
  await page.waitForSelector('.request-head [data-action=delete-record]'); await page.waitForTimeout(500);
  await page.click('.request-head [data-action=delete-record]');
  await page.waitForFunction(() => /Deleted request/.test(document.querySelector('#toast').textContent));
  await page.waitForTimeout(400);
  await L.shot(page, 'req_deleted_toast', [{ id: 'toast', sel: '#toast' }], { maxHeight: 900 });

  out.practice = practice;
  fs.writeFileSync(path.join(SAMPLES, 'statuses.json'), JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
