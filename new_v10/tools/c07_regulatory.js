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
  await L.shot(page, 'reg_empty', [
    { id: 'record', sel: '.pagehead [data-action=reg-update-new]' }, { id: 'hero', sel: '.reg-hero' }, { id: 'flow', sel: '.reg-flow' },
    { id: 'summary', sel: '.reg-hero-summary' }, { id: 'metrics', sel: '.reg-metrics' }, { id: 'search', sel: '#reg-update-search' },
    { id: 'filter', sel: '#reg-update-filter' }, { id: 'empty', sel: '.reg-list .empty' }, { id: 'foot', sel: '.reg-footnote' }]);

  // Record the main update, with a wording check on two candidate labels.
  await fillUpdate(page, {
    title: 'TEST – audible warning amendment', reference: 'TEST-NOTIFICATION-2026', url: 'https://example.test/test-amendment.pdf',
    locator: 'Annex 1, clause 2', publication: 'final_notified', edition: 'TEST-HORN-2026', date: '2026-01-01',
    test: 'Audible warning installation', changes: 'Practice amendment: horn installation must now be verified against edition TEST-HORN-2026; record the horn make on the form.',
    note: 'Practice intake: fictional notification created for training.', params: 'horn make\nHorn manufacturer' });
  await page.waitForFunction(() => /Wording check/.test(document.querySelector('#reg-param-check')?.textContent || ''), null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await L.shotDialog(page, 'reg_record_dialog', [
    { id: 's1', sel: '.reg-form-section h3', nth: 0 }, { id: 'title', sel: '#form-title' }, { id: 'ref', sel: '#form-reference' },
    { id: 'url', sel: '#form-source_url' }, { id: 'loc', sel: '#form-source_locator' }, { id: 'pub', sel: '#form-publication' },
    { id: 'ed', sel: '#form-edition' }, { id: 'sup', sel: '#form-supersedes' }, { id: 's2', sel: '.reg-form-section h3', nth: 1 },
    { id: 'date', sel: '#form-effective_date' }, { id: 'route', sel: '#form-model_route' }, { id: 'cats', sel: '.reg-check-grid', nth: 0 },
    { id: 'fuels', sel: '.reg-check-grid', nth: 1 }, { id: 'tsearch', sel: '#reg-test-search' }, { id: 'selshown', sel: '[data-action=reg-update-select-tests]' },
    { id: 'tlist', sel: '.reg-test-select' }, { id: 's3', sel: '.reg-form-section h3', nth: 2 }, { id: 'changes', sel: '#form-changes' },
    { id: 'params', sel: '#form-required_parameters' }, { id: 'check', sel: '#reg-param-check' }, { id: 'note', sel: '#form-note' },
    { id: 'save', sel: '#reg-update-create [type=submit]' }]);
  const wording = await page.textContent('#reg-param-check');
  fs.writeFileSync(path.join(SAMPLES, 'wording_check.txt'), wording);
  await page.fill('#form-required_parameters', 'horn make');
  await page.click('#reg-update-create [type=submit]');
  await toastIs(page, /Regulatory change record saved/); await page.waitForTimeout(500);
  await L.shot(page, 'reg_draft_card', [
    { id: 'card', sel: '.reg-card', nth: 0 }, { id: 'ref', sel: '.reg-card .eyebrow', nth: 0 }, { id: 'state', sel: '.reg-card .pill', nth: 0 },
    { id: 'meta', sel: '.reg-card-meta', nth: 0 }, { id: 'footer', sel: '.reg-card-footer span', nth: 0 }, { id: 'btn', sel: '.reg-card-footer button', nth: 0 }, { id: 'metrics', sel: '.reg-metrics' }], { maxHeight: 1500 });
  const A = await updId(page, 'TEST – audible warning amendment');
  await page.click(`.reg-card-footer [data-id="${A}"]`); await page.waitForTimeout(400);
  await L.shotDialog(page, 'reg_draft_detail', [
    { id: 'status', sel: '.reg-detail-status' }, { id: 'keys', sel: '#dialog .key-list' }, { id: 'what', sel: '#dialog h3:has-text("What changed")' },
    { id: 'trail', sel: '#dialog h3:has-text("Source and review trail")' }, { id: 'params', sel: '#dialog h3:has-text("Parameters to capture")' },
    { id: 'read', sel: '[data-action=reg-update-ack]' }, { id: 'activate', sel: '[data-transition=activate]' }, { id: 'hint', sel: '#dialog .hint.neutral' }]);
  await page.click('[data-transition=activate]'); await page.waitForTimeout(300);
  await page.fill('#form-note', 'Reviewed the practice notification, edition TEST-HORN-2026, horn installation scope and the 1 Jan 2026 date.');
  await L.shotDialog(page, 'reg_activate_dialog', [{ id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#reg-update-transition [type=submit]' }]);
  await page.click('#reg-update-transition [type=submit]');
  await toastIs(page, /Regulatory change record saved/); await page.waitForTimeout(600);
  await L.shot(page, 'reg_active_desk', [
    { id: 'bell', sel: '.notification-button' }, { id: 'navcount', sel: '#update-count' }, { id: 'summary', sel: '.reg-hero-summary' },
    { id: 'metrics', sel: '.reg-metrics' }, { id: 'card', sel: '.reg-card', nth: 0 }, { id: 'unread', sel: '.reg-card .pill:has-text("Unread")', nth: 0 }], { maxHeight: 1500 });

  await page.click(`.reg-card-footer [data-id="${A}"]`); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('#dialog details').open = true);
  await L.shotDialog(page, 'reg_active_detail', [
    { id: 'status', sel: '.reg-detail-status' }, { id: 'activation', sel: '#dialog p:has-text("Activation basis")' }, { id: 'read', sel: '[data-action=reg-update-ack]' },
    { id: 'withdraw', sel: '[data-transition=withdraw]' }, { id: 'assign', sel: '[data-action=reg-update-assign]' }, { id: 'impact', sel: '.reg-impact', nth: 0 },
    { id: 'check', sel: '.reg-impact input[type=checkbox]', nth: 0 }, { id: 'tags', sel: '.reg-impact-meta', nth: 0 }, { id: 'todo', sel: '.reg-action-list', nth: 0 },
    { id: 'matches', sel: '.reg-param-matches', nth: 0 }, { id: 'open', sel: '.reg-impact [data-action=open-request], .reg-impact [data-action=open-vehicle]', nth: 0 },
    { id: 'linked', sel: '.reg-impact [data-action=new-request]', nth: 0 }, { id: 'track', sel: '[data-action=reg-update-task]', nth: 0 }, { id: 'history', sel: '#dialog details' }]);
  const impacts = await page.evaluate(id => S.data.regulatory_updates.updates.find(u => u.id === id).impacts.map(r => ({ name: r.target_name, kind: r.target_kind, phase: r.phase, historical: r.historical, overdue: r.overdue, matches: r.parameter_matches })), A);
  fs.writeFileSync(path.join(SAMPLES, 'impacts.json'), JSON.stringify(impacts, null, 1));

  // Assign the practice request's action.
  const idx = await page.evaluate(([id, pid]) => S.data.regulatory_updates.updates.find(u => u.id === id).impacts.findIndex(r => r.target_id === pid), [A, ids.practice]);
  await page.check(`[data-impact-index="${idx}"]`);
  await page.click('[data-action=reg-update-assign]'); await page.waitForTimeout(300);
  await page.fill('#form-owner', 'Electrical systems engineering');
  await page.fill('#form-note', 'Confirm edition TEST-HORN-2026, check horn make on the form, then get the horn report for the new edition.');
  await L.shotDialog(page, 'reg_assign_dialog', [{ id: 'owner', sel: '#form-owner' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#reg-update-assign [type=submit]' }]);
  await page.click('#reg-update-assign [type=submit]'); await toastIs(page, /saved/); await page.waitForTimeout(500);
  await page.click(`.reg-card-footer [data-id="${A}"]`); await page.waitForTimeout(400);
  await page.click(`[data-action=reg-update-task][data-row="${idx}"]`); await page.waitForTimeout(300);
  await L.shotDialog(page, 'reg_track_dialog', [{ id: 'status', sel: '#form-status' }, { id: 'owner', sel: '#form-owner' }, { id: 'note', sel: '#form-note' }]);
  await L.closeDialog(page);
  await page.click(`.reg-card-footer [data-id="${A}"]`); await page.waitForTimeout(400);
  await page.click('[data-action=reg-update-ack]'); await toastIs(page, /marked read/); await L.closeDialog(page);

  // Where the flags appear.
  await L.nav(page, 'requests');
  await L.shot(page, 'reg_banner_requests', [{ id: 'banner', sel: '.reg-banner' }, { id: 'flag', sel: 'tbody .pill.orange', nth: 0 }], { maxHeight: 1500 });
  await L.nav(page, 'request/' + ids.practice); await page.waitForSelector('#request-body');
  await page.click('.request-tabs [data-tab=review]'); await page.waitForTimeout(400);
  await page.fill('#test-search', 'Audible warning installation'); await page.waitForTimeout(300);
  await L.shot(page, 'reg_request_row', [{ id: 'banner', sel: '.reg-banner' }, { id: 'row', sel: '#test-rows tr', nth: 0 }, { id: 'regpill', sel: '#test-rows .pill:has-text("Regulatory change")', nth: 0 }], { maxHeight: 1300 });
  const horn = await page.evaluate(() => S.assessment.tests.find(t => /Audible warning installation/.test(t.title)).id);
  await page.click(`#test-rows [data-action=test-details][data-id="${horn}"]`); await page.waitForTimeout(400);
  await L.shotDialog(page, 'review_regulatory', [{ id: 'status', sel: '#dialog .dialog-content > .pill' }, { id: 'reg', sel: '#dialog .dialog-content > .hint', nth: 0 }, { id: 'plan', sel: '[data-action=reg-update-detail]' }]);
  const reasonBefore = await page.evaluate(id => S.assessment.tests.find(t => t.id === id).reason, horn);

  // Confirm the new edition for this row.
  await page.click('#dialog [data-action=register-test]'); await page.waitForTimeout(300);
  await page.fill('#form-edition', 'TEST-HORN-2026');
  await page.fill('#form-note', 'Practice: confirmed edition TEST-HORN-2026 applies from 1 Jan 2026 to this configuration.');
  await page.click('#register-form [type=submit]');
  await page.waitForFunction(() => !document.querySelector('#dialog').open); await page.waitForTimeout(500);
  await page.fill('#test-search', 'Audible warning installation'); await page.waitForTimeout(300);
  const afterConfirm = await page.evaluate(id => { const t = S.assessment.tests.find(t => t.id === id); return [t.status, t.reason]; }, horn);
  await L.shot(page, 'reg_after_confirm_row', [{ id: 'row', sel: '#test-rows tr', nth: 0 }], { maxHeight: 1100 });

  // New horn report on the complete demo base under the new edition, accepted by the reviewer.
  await L.nav(page, 'reports');
  await page.click('[data-action=add-report]');
  await page.selectOption('#form-vehicle_id', 'demo_full_2026_base'); await page.selectOption('#form-test_id', horn);
  await page.fill('#form-reference', 'TEST-HORN-2026-R1'); await page.fill('#form-edition', 'TEST-HORN-2026');
  await page.fill('#form-scope', 'Horn installation / sound level re-test under TEST-HORN-2026 (practice file).');
  await page.selectOption('#form-result', 'pass'); await page.check('input[name=no_expiry]'); await page.setInputFiles('#report-file', PDF);
  await page.click('#report-form [type=submit]'); await toastIs(page, /Report added/);
  const rid = await page.evaluate(() => S.data.reports.find(r => r.reference === 'TEST-HORN-2026-R1').id);
  await page.click(`[data-action=report-details][data-id="${rid}"]`); await page.click('#dialog [data-action=review-report]');
  await page.fill('#form-note', 'Checked the re-test report: edition TEST-HORN-2026, pass, same horn make.'); await page.check('input[name=reconfirm_coverage]');
  await page.click('#report-review-form [type=submit]'); await toastIs(page, /Evidence review recorded/);
  await L.nav(page, 'request/' + ids.practice); await page.waitForSelector('#request-body');
  await page.click('.request-tabs [data-tab=review]'); await page.waitForTimeout(400);
  await page.fill('#test-search', 'Audible warning installation'); await page.waitForTimeout(300);
  const afterReport = await page.evaluate(id => { const t = S.assessment.tests.find(t => t.id === id); return [t.status, t.reason]; }, horn);
  await L.shot(page, 'reg_reuse_row', [{ id: 'row', sel: '#test-rows tr', nth: 0 }], { maxHeight: 1100 });

  // Resolve the action.
  await L.nav(page, 'updates');
  await page.click(`.reg-card-footer [data-id="${A}"]`); await page.waitForTimeout(400);
  const idx2 = await page.evaluate(([id, pid]) => S.data.regulatory_updates.updates.find(u => u.id === id).impacts.findIndex(r => r.target_id === pid), [A, ids.practice]);
  await page.click(`[data-action=reg-update-task][data-row="${idx2}"]`); await page.waitForTimeout(300);
  const statusOpts = await page.$$eval('#form-status option', os => os.map(o => o.textContent));
  await page.selectOption('#form-status', 'resolved');
  await page.fill('#form-note', 'Edition confirmed; TEST-HORN-2026-R1 accepted and linked automatically.');
  await L.shotDialog(page, 'reg_resolve_dialog', [{ id: 'status', sel: '#form-status' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#reg-update-task [type=submit]' }]);
  await page.click('#reg-update-task [type=submit]'); await toastIs(page, /saved/); await page.waitForTimeout(500);
  await page.click(`.reg-card-footer [data-id="${A}"]`); await page.waitForTimeout(400);
  await page.evaluate(() => { const r = document.querySelector('.reg-impact.resolved'); if (r) r.scrollIntoView(); });
  await L.shotDialog(page, 'reg_resolved_detail', [{ id: 'resolved', sel: '.reg-impact.resolved', nth: 0 }, { id: 'status', sel: '.reg-detail-status' }]);
  await page.click('[data-transition=withdraw]'); await page.waitForTimeout(300);
  await L.shotDialog(page, 'reg_withdraw_dialog', [{ id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#reg-update-transition [type=submit]' }]);
  await L.closeDialog(page);

  // A watch-only draft: it can never be activated.
  await fillUpdate(page, {
    title: 'TEST – draft lighting proposal (watch only)', reference: 'TEST-DRAFT-LIGHTING', url: 'https://example.test/draft-lighting.pdf',
    locator: 'Draft for comments, clause 5', publication: 'draft', edition: 'TEST-LIGHT-DRAFT-1', date: '2027-04-01',
    test: 'Lighting', changes: 'Practice draft: proposed lighting installation changes, watch only.', note: 'Practice: draft notification for comments.' });
  await page.click('#reg-update-create [type=submit]'); await toastIs(page, /saved/); await page.waitForTimeout(500);
  const B = await updId(page, 'TEST – draft lighting proposal (watch only)');
  await page.click(`.reg-card-footer [data-id="${B}"]`); await page.waitForTimeout(400);
  await L.shotDialog(page, 'reg_watch_detail', [{ id: 'activate', sel: '[data-transition=activate]' }, { id: 'hint', sel: '#dialog .hint.neutral' }]);
  await L.closeDialog(page);
  await L.shot(page, 'reg_two_updates', [{ id: 'filter', sel: '#reg-update-filter' }, { id: 'cardA', sel: '.reg-card', nth: 1 }, { id: 'cardB', sel: '.reg-card', nth: 0 }], { maxHeight: 1800 });

  fs.writeFileSync(path.join(SAMPLES, 'regulatory_story.json'), JSON.stringify({ reasonBefore, afterConfirm, afterReport, statusOpts, impacts: impacts.length }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
