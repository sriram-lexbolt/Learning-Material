// Login + dashboard (empty) + vehicle library, before anything is created.
const L = require('./lib');
(async () => {
  const { browser, page } = await L.open(null);
  await page.goto(L.BASE + '/'); await page.waitForSelector('#login-form'); await L.settle(page, 800);
  await L.shot(page, 'login', [
    { id: 'email', sel: '#email' }, { id: 'password', sel: '#password' },
    { id: 'signin', sel: '#login-form button[type=submit]' }, { id: 'version', sel: '.login-foot' }]);
  await L.login(page, 'admin');
  await L.nav(page, 'requests');
  await L.shot(page, 'dash_empty', [
    { id: 'nav', sel: '.nav' }, { id: 'user', sel: '.sidebar .user' }, { id: 'guide', sel: '.sidebar-bottom a', nth: 0 },
    { id: 'advanced', sel: '.sidebar-bottom a', nth: 1 }, { id: 'logout', sel: '[data-action=logout]' },
    { id: 'bell', sel: '.notification-button' }, { id: 'new', sel: '.pagehead [data-action=new-request]' },
    { id: 'stats', sel: '.stats' }, { id: 'intro', sel: '.intro-card' }, { id: 'tabs', sel: '.toolbar .tabs' },
    { id: 'refresh', sel: '[data-action=refresh]' }, { id: 'empty', sel: '.panel .empty' },
    { id: 'cards', sel: '.cards' }, { id: 'library', sel: '.sectionhead [data-view=vehicles]' }]);
  await L.nav(page, 'vehicles');
  await L.shot(page, 'veh_library', [
    { id: 'add', sel: '[data-action=new-vehicle]' }, { id: 'hint', sel: '.hint' },
    { id: 'pill', sel: '.vehicle-card .pill', nth: 0 }, { id: 'cert', sel: '.vehicle-card p', nth: 0 },
    { id: 'meta', sel: '.vehicle-meta', nth: 0 }, { id: 'view', sel: '.vehicle-card [data-action=open-vehicle]', nth: 0 },
    { id: 'variant', sel: '.vehicle-card [data-action=new-request]', nth: 0 }, { id: 'demo', sel: '.vehicle-card', nth: 1 }]);
  await browser.close();
})();
