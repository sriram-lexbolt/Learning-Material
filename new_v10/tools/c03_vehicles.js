// Vehicle library: cards, vehicle pages, add base, import PDFs, record existing homologation, delete.
const L = require('./lib');
const path = require('path');
const APP = 'D:/mine/jags/server/AL_Validation_Workspace_v5.1.2_2026-10-12/AL_Validation_Workspace';
const PDFS = ['development/Table 02_Ver.01.pdf', 'development/Table 03_Ver.01.pdf', 'development/Table 05_Ver.01.pdf', 'development/Table 07_Ver.01.pdf',
  'development/Table 4E_Ver.01.pdf', 'holdout/Table 06_Ver.01.pdf', 'holdout/Table 11_Ver.01.pdf'].map(p => path.join(APP, 'pdfs', p));

const vehicleSpots = [
  { id: 'title', sel: '.pagehead h1' }, { id: 'sub', sel: '.pagehead .sub' }, { id: 'delete', sel: '.pagehead [data-action=delete-record]' },
  { id: 'import', sel: '.pagehead [data-action=import-base]' }, { id: 'create', sel: '.pagehead [data-action=new-request]' },
  { id: 'pill', sel: '.sectionhead .pill' }, { id: 'keys', sel: '.key-list' }, { id: 'forms', sel: '.editor-layout .detail-list' },
  { id: 'form1', sel: '.editor-layout .detail-list li', nth: 0 }, { id: 'recordbase', sel: '[data-action=record-base]' },
  { id: 'history', sel: '.history-list' }, { id: 'hitem', sel: '.history-item', nth: 0 }];

(async () => {
  const { browser, page } = await L.open('admin');
  await L.nav(page, 'vehicles');
  await L.shot(page, 'veh_library_seed', [
    { id: 'add', sel: '[data-action=new-vehicle]' }, { id: 'bada', sel: '.vehicle-card', nth: 0 }, { id: 'full', sel: '.vehicle-card', nth: 1 },
    { id: 'tyre', sel: '.vehicle-card', nth: 2 }, { id: 'lib', sel: '.vehicle-card', nth: 3 }, { id: 'demo', sel: '.vehicle-card', nth: 4 }]);

  for (const [id, name] of [['al_bada_dost', 'veh_bada'], ['demo_full_2026_base', 'veh_demo_full'], ['demo_full_2026_matched_variant', 'veh_demo_tyre'], ['demo_full_2026_table_library', 'veh_demo_library']]) {
    await L.nav(page, 'vehicle/' + id);
    await L.shot(page, name, vehicleSpots, { maxHeight: 2400 });
  }

  // Add a base vehicle.
  await L.nav(page, 'vehicles');
  await page.click('[data-action=new-vehicle]');
  await page.fill('#form-name', 'TEST – Bada Dost import');
  await L.shotDialog(page, 'veh_add_dialog', [
    { id: 'name', sel: '#form-name' }, { id: 'cat', sel: '#form-category' }, { id: 'pt', sel: '#form-powertrain' }, { id: 'ok', sel: '#new-vehicle-form [type=submit]' }]);
  await page.click('#new-vehicle-form [type=submit]');
  await page.waitForSelector('.pagehead [data-action=import-base]'); await page.waitForTimeout(800);
  await L.shot(page, 'veh_new_page', vehicleSpots, { maxHeight: 2400 });

  // Import the 7 AL PDFs.
  await page.click('.pagehead [data-action=import-base]');
  await page.setInputFiles('#base-files', PDFS);
  await L.shotDialog(page, 'veh_import_dialog', [{ id: 'files', sel: '#base-files' }, { id: 'ok', sel: '#base-import-form [type=submit]' }]);
  await page.click('#base-import-form [type=submit]');
  await page.waitForFunction(() => /Base tables captured/.test(document.querySelector('#toast').textContent), null, { timeout: 600000 });
  await page.waitForTimeout(800);
  await L.shot(page, 'veh_imported', vehicleSpots, { maxHeight: 2400 });

  // Record existing homologation (reviewer action on a base).
  await page.click('[data-action=record-base]');
  await page.fill('#form-certificate', 'TEST-12345678');
  await page.fill('#form-certificate_reference', 'Practice archive / imported base certificate');
  await page.fill('#form-note', 'Practice only: recording an existing approval for the imported base.');
  await L.shotDialog(page, 'veh_record_dialog', [{ id: 'cert', sel: '#form-certificate' }, { id: 'ok', sel: '#homologation-form [type=submit]' }]);
  await page.click('#homologation-form [type=submit]');
  await page.waitForFunction(() => /locked/.test(document.querySelector('#toast').textContent));
  await page.waitForTimeout(800);
  await L.shot(page, 'veh_recorded', vehicleSpots, { maxHeight: 2400 });

  // A throwaway draft vehicle to show Delete vehicle.
  await L.nav(page, 'vehicles');
  await page.click('[data-action=new-vehicle]');
  await page.fill('#form-name', 'TEST – vehicle to delete');
  await page.click('#new-vehicle-form [type=submit]');
  await page.waitForSelector('.pagehead [data-action=delete-record]'); await page.waitForTimeout(600);
  await L.shot(page, 'veh_delete_button', [{ id: 'delete', sel: '.pagehead [data-action=delete-record]' }], { maxHeight: 900 });
  await page.click('.pagehead [data-action=delete-record]');
  await page.waitForFunction(() => /Deleted vehicle/.test(document.querySelector('#toast').textContent));
  console.log('toast:', await L.toast(page));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
