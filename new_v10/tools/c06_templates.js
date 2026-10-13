// AIS-007 templates: registry, install a reviewed form, then upgrade a request's table to it.
const L = require('./lib');
const fs = require('fs'), path = require('path');
const SAMPLES = path.resolve(__dirname, '..', 'AL_Pilot_Atlas', 'samples');
const T2 = 'D:/mine/jags/server/Table_2_2014.pdf';

(async () => {
  const { browser, page } = await L.open('admin');
  await L.nav(page, 'templates');
  await L.shot(page, 'tpl_list', [
    { id: 'install', sel: '[data-action=install-template]' }, { id: 'stats', sel: '.stats' }, { id: 's1', sel: '.stat', nth: 0 }, { id: 's2', sel: '.stat', nth: 1 },
    { id: 's3', sel: '.stat', nth: 2 }, { id: 's4', sel: '.stat', nth: 3 }, { id: 'hint', sel: '.hint' },
    { id: 'row', sel: 'tbody tr', nth: 0 }, { id: 'avail', sel: 'tbody td:nth-child(4)', nth: 0 }, { id: 'missing', sel: 'tbody tr:has-text("Source required")', nth: 0 }], { maxHeight: 2600 });
  const rows = await page.evaluate(() => S.data.templates.tables.map(t => ({ id: t.id, title: t.title, edition: t.edition, pdf: !!t.pdf, status: t.status })));
  fs.writeFileSync(path.join(SAMPLES, 'templates.json'), JSON.stringify(rows, null, 1));

  const already = await page.evaluate(() => !!S.data.templates.tables.find(t => t.id === '2').installed_id);
  if (!already) {
  await page.click('[data-action=install-template]');
  await page.selectOption('#form-table', '2');
  await page.fill('#form-edition', 'TEST – AIS-007 Table 2 practice install (2014 public copy)');
  await page.fill('#form-note', 'Practice install of the public 2014 Table 2 to learn the upgrade flow. Not a current amendment.');
  await page.setInputFiles('#form-file', T2);
  await L.shotDialog(page, 'tpl_install_dialog', [
    { id: 'table', sel: '#form-table' }, { id: 'ed', sel: '#form-edition' }, { id: 'url', sel: '#form-source_url' },
    { id: 'note', sel: '#form-note' }, { id: 'file', sel: '#form-file' }, { id: 'ok', sel: '#template-form [type=submit]' }]);
  await page.click('#template-form [type=submit]');
  await page.waitForFunction(() => /template version installed/.test(document.querySelector('#toast').textContent), null, { timeout: 300000 });
  await page.waitForTimeout(500);
  await L.shot(page, 'tpl_installed', [{ id: 's3', sel: '.stat', nth: 2 }, { id: 'row', sel: 'tbody tr:has-text("Reviewed form")', nth: 0 }], { maxHeight: 1300 });
  }

  // Upgrade Table 2 on the practice request made from the complete demo base.
  const ids = JSON.parse(fs.readFileSync(path.join(SAMPLES, 'statuses.json'), 'utf8'));
  await L.nav(page, 'request/' + ids.practice); await page.waitForSelector('#request-body');
  await page.click('.request-tabs [data-tab=package]'); await page.waitForTimeout(500);
  await L.shot(page, 'tpl_upgrade_button', [{ id: 'row', sel: '#request-body tbody tr:has-text("Newer installed form")' }, { id: 'btn', sel: '[data-action=upgrade-table]' }], { maxHeight: 1500 });
  await page.click('[data-action=upgrade-table]');
  await page.fill('#form-note', 'Practice: move Table 2 to the installed reviewed form to see what is kept, added and removed.');
  await L.shotDialog(page, 'tpl_upgrade_dialog', [{ id: 'list', sel: '#dialog .detail-list' }, { id: 'note', sel: '#form-note' }, { id: 'ok', sel: '#upgrade-table-form [type=submit]' }]);
  await page.click('#upgrade-table-form [type=submit]');
  await page.waitForFunction(() => /upgraded/.test(document.querySelector('#toast').textContent), null, { timeout: 300000 });
  const msg = await L.toast(page); console.log('upgrade toast:', msg);
  await L.shot(page, 'tpl_upgrade_done', [{ id: 'toast', sel: '#toast' }, { id: 'row', sel: '#request-body tbody tr:has-text("Table 2")', nth: 0 }], { maxHeight: 1500 });
  fs.writeFileSync(path.join(SAMPLES, 'upgrade_toast.txt'), msg);
  await page.click('.request-tabs [data-tab=specifications]'); await page.waitForTimeout(500);
  await page.selectOption('#table-filter', 'all');
  const carried = await page.evaluate(() => S.current.fields.find(f => f.carried_over)?.label);
  if (carried) { await page.fill('#field-search', carried); await page.waitForTimeout(500); }
  await L.shot(page, 'tpl_not_on_new_form', [{ id: 'tag', sel: '.field-tags .pill:has-text("Not on new")', nth: 0 }], { maxHeight: 1400 });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
