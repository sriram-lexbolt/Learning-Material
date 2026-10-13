// Workspace settings (admin) + what reviewer / engineer see differently.
const L = require('./lib');
const fs = require('fs'), path = require('path');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');
const ids = JSON.parse(fs.readFileSync(path.join(SAMPLES, 'statuses.json'), 'utf8'));

(async () => {
  let { browser, page } = await L.open('admin');
  await L.nav(page, 'settings');
  await L.shot(page, 'set_admin', [
    { id: 'ai', sel: '.cards section', nth: 0 }, { id: 'aipill', sel: '.cards section .pill', nth: 0 }, { id: 'reg', sel: '.cards section', nth: 1 },
    { id: 'coverage', sel: '[data-action=regulatory-register]' }, { id: 'seed', sel: 'a[href="/api/pilot/regulatory-seed"]' },
    { id: 'workflow', sel: '.cards section h2:has-text("Engineering workflow")' }, { id: 'acct', sel: '.cards section', nth: 2 },
    { id: 'manage', sel: '[data-action=manage-users]' }, { id: 'unlock', sel: '[data-action=unlock]' }]);
  await page.click('[data-action=regulatory-register]');
  await L.shotDialog(page, 'set_coverage', [
    { id: 'claim', sel: '#dialog .dialog-content > p', nth: 0 }, { id: 'gaps', sel: '#dialog h3:has-text("Controlled review")' },
    { id: 'refs', sel: '#dialog h3:has-text("Official references")' }, { id: 'watch', sel: '#dialog h3:has-text("Watchlist")' }]);
  const cat = await page.evaluate(() => S.data.regulatory_catalog);
  fs.writeFileSync(path.join(SAMPLES, 'catalog_summary.json'), JSON.stringify({ version: cat.version, rows: cat.india_rows, conditional: cat.conditional_rows, claim: cat.coverage_claim, gaps: cat.coverage_gaps, watch: cat.watchlist, sources: cat.sources.map(s => [s.title, s.status, s.retrieved_on]) }, null, 1));
  await L.closeDialog(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('a[href="/api/pilot/regulatory-seed"]')]);
  await dl.saveAs(path.join(SAMPLES, 'Ashok_Leyland_N1_Regulatory_Seed.json'));
  await page.click('[data-action=manage-users]'); await page.waitForTimeout(500);
  await L.shotDialog(page, 'set_accounts', [
    { id: 'list', sel: '#dialog .detail-list' }, { id: 'reset', sel: '[data-action=reset-user]', nth: 0 }, { id: 'name', sel: '#form-name' },
    { id: 'email', sel: '#form-email' }, { id: 'role', sel: '#form-role' }, { id: 'pw', sel: '#form-password' }, { id: 'ok', sel: '#user-form [type=submit]' }]);
  await page.click('[data-action=reset-user] >> nth=0'); await page.waitForTimeout(300);
  await L.shotDialog(page, 'set_reset', [{ id: 'pw', sel: '#form-password' }, { id: 'ok', sel: '#reset-user-form [type=submit]' }]);
  await L.closeDialog(page);
  await page.click('[data-action=unlock]'); await page.waitForTimeout(500);
  console.log('unlock toast:', await L.toast(page));
  await L.shot(page, 'set_unlock_toast', [{ id: 'toast', sel: '#toast' }], { maxHeight: 900 });
  await browser.close();

  for (const role of ['reviewer', 'engineer']) {
    ({ browser, page } = await L.open(role));
    await L.nav(page, 'settings');
    await L.shot(page, `set_${role}`, [{ id: 'acct', sel: '.cards section', nth: 2 }, { id: 'user', sel: '.sidebar .user' }]);
    await L.nav(page, 'request/' + ids.practice); await page.waitForSelector('#request-body');
    await L.shot(page, `role_${role}_request`, [{ id: 'actions', sel: '.request-head .actions' }, { id: 'calc', sel: '.editor-heading .actions' }, { id: 'user', sel: '.sidebar .user' }], { maxHeight: 1100 });
    await page.click('.request-tabs [data-tab=review]'); await page.waitForTimeout(400);
    await page.click('#test-rows [data-action=test-details] >> nth=0'); await page.waitForTimeout(400);
    await L.shotDialog(page, `role_${role}_review_buttons`, [{ id: 'buttons', sel: '#dialog .dialog-content > .actions' }]);
    await L.closeDialog(page);
    await L.shot(page, `role_${role}_tests_toolbar`, [{ id: 'toolbar', sel: '#request-body .toolbar' }], { maxHeight: 900 });
    await page.click('.request-tabs [data-tab=package]'); await page.waitForTimeout(400);
    await L.shot(page, `role_${role}_package`, [{ id: 'record', sel: '[data-action=record-homologation]' }], { maxHeight: 1300 });
    await L.nav(page, 'reports');
    const rid = await page.evaluate(() => S.data.reports.find(r => r.status === 'approved').id);
    await page.click(`[data-action=report-details][data-id="${rid}"]`); await page.waitForTimeout(400);
    await L.shotDialog(page, `role_${role}_report`, [{ id: 'buttons', sel: '#dialog .actions' }]);
    await L.closeDialog(page);
    await L.nav(page, 'templates');
    await L.shot(page, `role_${role}_templates`, [{ id: 'install', sel: '[data-action=install-template]' }], { maxHeight: 900 });
    await L.nav(page, 'updates');
    const B = await page.evaluate(() => S.data.regulatory_updates.updates.find(u => u.state === 'draft')?.id);
    if (B) { await page.click(`.reg-card-footer [data-id="${B}"]`); await page.waitForTimeout(400); await L.shotDialog(page, `role_${role}_update`, [{ id: 'actions', sel: '#dialog .actions', nth: 0 }]); await L.closeDialog(page); }
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
