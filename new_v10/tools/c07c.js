const L = require('./lib');
(async () => {
  const { browser, page } = await L.open('admin');
  await L.nav(page, 'updates');
  const B = await page.evaluate(() => S.data.regulatory_updates.updates.find(u => u.state === 'draft').id);
  await page.click(`.reg-card-footer [data-id="${B}"]`); await page.waitForTimeout(400);
  await L.shotDialog(page, 'reg_watch_detail', [{ id: 'activate', sel: '[data-transition=activate]' }, { id: 'hint', sel: '#dialog .hint.neutral' }]);
  await L.closeDialog(page);
  await L.shot(page, 'reg_two_updates', [{ id: 'filter', sel: '#reg-update-filter' }, { id: 'cardA', sel: '.reg-card', nth: 1 }, { id: 'cardB', sel: '.reg-card', nth: 0 }], { maxHeight: 1800 });
  await browser.close();
})();
