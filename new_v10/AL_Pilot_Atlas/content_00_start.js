window.SECTIONS = [];
window.INTRO = `This atlas walks every screen of the Ashok Leyland Pilot (v5.1.2), from **Validation requests** to **Workspace settings**. Each screen is a real screenshot taken from a practice copy of the exact server code, with a numbered marker on every button, tag, column and option. Click a number to see what it is, what happens when you press it, who is allowed to press it, and why it exists in real homologation work. You already know homologation, CMVR/AIS, COP and extensions from the Lexbolt Academy, so this atlas is about **the app**: how it turns those ideas into clicks.`;

window.CORE_DIAGRAM = `<div class="box"><b>The one picture everything hangs on</b>
<div class="flow"><span>🚚 <b>Vehicle</b><br><em>Vehicle library</em></span>→<span>📝 <b>Validation request</b><br><em>copy of the vehicle</em></span>→<span>✏️ <b>Edit values</b><br><em>autosave, linked cells</em></span>→<span>🧪 <b>Every test sorted</b><br><em>reuse · review · inputs · edition · missing</em></span>→<span>📦 <b>PDF package</b><br><em>all forms + schedules</em></span>→<span>🏛️ <b>Agency approves</b><br><em>outside the app</em></span>→<span>🔒 <b>Record homologation</b><br><em>request locks → new vehicle</em></span></div>
<div class="flow"><span>📄 <b>Evidence library</b>: reports belong to one vehicle + one test; reviewer accepts; reused when the setup matches</span><span>📐 <b>AIS-007 templates</b>: which blank forms exist</span><span>⚖️ <b>Regulatory updates</b>: a rule change → flags every affected vehicle × test</span><span>⚙️ <b>Settings</b>: AI, the 123-row register, accounts</span></div>
<p style="margin:6px 0 0"><b>The rule behind it all:</b> the app <b>sorts and explains</b>; <b>people decide</b>. Engineers prepare, reviewers accept and record, admins manage accounts. The AI only explains; it can't change a status.</p></div>`;

SECTIONS.push({
  id: 'start', kicker: 'Section 0 · 10 min', title: 'Start here: sign in and the dashboard',
  sub: 'Login, the left menu, the four counters, the request list.',
  lead: 'What you see before you do anything: the sign-in page, the menu with the six areas this atlas covers, and the dashboard (the `Validation requests` page). Short on purpose.',
  words: [
    ['[[Validation request]]', 'one change job on one vehicle. The dashboard *is* the list of these.'],
    ['[[Supplied base]] vs recorded vehicle', 'a supplied base has data but no recorded approval (Bada Dost today). A recorded vehicle has a certificate and is locked.'],
    ['[[Synthetic]]', 'made-up demo data. Anything with "Demo" or "Synthetic" in the name is practice material, never AL evidence.'],
    ['Role', 'what your account may do: [[engineer]], [[reviewer]] or [[admin]]. Shown under your name, bottom-left.']
  ],
  body: [
    'The six menu items map to the six things a homologation team handles: **change jobs** (Validation requests), **trucks** (Vehicle library), **test reports** (Evidence library), **blank forms** (AIS-007 templates), **rule changes** (Regulatory updates) and **setup** (Workspace settings). The rest of this atlas takes them in that order.',
    '<div class="callout"><b class="k">Practice data in these screenshots</b>The practice copy has the app\'s own seed (the real **Bada Dost i9 · supplied base** from AL\'s 7 PDFs, plus the tiny **Demo N1 · approved reference**) and the **Full Demo Seed** (two complete synthetic N1 vehicles with 150 fictional reports, a 59-table reference library and four ready-made requests, `Demo 1` to `Demo 4`). Names starting with `TEST –` were made while taking these screenshots.</div>'
  ],
  screens: [
    {
      id: 'login', shot: 'login', title: 'Sign-in page',
      intro: 'The first page. Accounts are created by an admin; there is no self-registration and no "forgot password" link.',
      spots: [
        { id: 'email', label: '`Email address`', what: 'Your work email, exactly as the admin typed it (capitals don\'t matter; it is stored in lower case).', who: 'all' },
        { id: 'password', label: '`Password`', what: 'At least 12 characters, set by the admin and changeable only by an admin (`Reset password`).', warn: 'After **8 wrong passwords** that email is locked for **15 minutes**. An admin can lift it early with `Release login lockouts` (Workspace settings).', who: 'all' },
        { id: 'signin', label: '`Sign in →`', what: 'Checks the password and opens the dashboard. A wrong password shows a red message above the button.', who: 'all' },
        { id: 'version', label: '`Version 5.1.2 · Secure session access`', what: 'The version actually running on the server (read live from `/health`). Quote it in every bug report.', why: 'Before 5.1.1 this said "Version 5.0" even on 5.1, which confused testers.' }
      ],
      teach: 'Tell AL: one account per person. Every action is stored with the person\'s name, so sharing a login destroys the approval trail an auditor would ask for.'
    },
    {
      id: 'dash-empty', shot: 'dash_empty', title: 'Dashboard on a fresh install',
      intro: 'This is what a brand-new workspace looks like (no requests yet). It is also the cleanest view of the menu and the frame around every page.',
      spots: [
        { id: 'nav', label: 'Left menu: the six areas', what: '`Validation requests` (this page), `Vehicle library`, `Evidence library`, `AIS-007 templates`, `Regulatory updates` (a red number appears here when you have unread rule changes), `Workspace settings`.', who: 'all' },
        { id: 'bell', label: 'Shield button (top right)', what: 'Your number of **unread** regulatory notifications. Clicking it opens Regulatory updates. "Unread" is per person.', who: 'all' },
        { id: 'new', label: '`New validation request`', what: 'Starts a change job.', press: 'Opens the `Create a validation request` window ({{go:requests/new|Section 1, screen 2}}).', who: 'all' },
        { id: 'stats', label: 'The four counters', what: '`Active requests` = requests not yet recorded (drafts + in review). `Vehicle configurations` = every vehicle in the library, demo included. `Recorded approvals` = **non-demo** vehicles with a recorded homologation (*"demo excluded"*). `Accepted evidence` = **non-demo** reports with status approved.', why: 'The two right-hand counters ignore demo data on purpose, so a manager never mistakes practice data for real approvals. With only demo data loaded, both stay at 0.' },
        { id: 'intro', label: 'The dark banner (1 Choose a base · 2 Edit the changes · 3 Review & export)', what: 'Decoration that states the three-step idea. Not clickable.' },
        { id: 'tabs', label: '`All requests` · `Drafts` · `In review` · `Recorded`', what: 'Filters the list below by workflow state: Draft, In engineering review, Homologation recorded.', who: 'all' },
        { id: 'refresh', label: '`Refresh`', what: 'Re-reads the list from the server (useful when a colleague just created something). The rest of the app refreshes on navigation.', who: 'all' },
        { id: 'empty', label: 'Empty state + `Create a validation request`', what: 'Shown only when there are no requests; the button does the same as `New validation request`.' },
        { id: 'cards', label: '`Start from a vehicle` cards', what: 'The first three vehicles of the library. Each card shows a status tag, certificate (or `Certificate not recorded`), category · fuel, number of parameters and number of source PDFs. `View configuration` opens the vehicle; `Create variant →` opens the new-request window with this vehicle pre-selected.' },
        { id: 'library', label: '`View vehicle library →`', what: 'Same as clicking `Vehicle library` in the menu.' },
        { id: 'guide', label: '`Workflow & operating guide ↗`', what: 'Opens the built-in static guide page in a new tab (written by the developer; shorter than this atlas).' },
        { id: 'advanced', label: '`Advanced extraction workspace ↗`', what: 'The old pre-5.0 screens. Out of scope: new work never goes there.' },
        { id: 'user', label: 'Your name · role · version', what: 'Initials, name, **role** (`admin`, `reviewer`, `engineer`) and `v5.1.2`. If a button is missing or greyed for you, check the role here first.' },
        { id: 'logout', label: 'Sign-out arrow', what: 'Saves anything still pending, ends the session and returns to `Welcome back`.' }
      ]
    },
    {
      id: 'dash-list', shot: 'dash_list', title: 'Dashboard with requests',
      intro: 'The same page once requests exist. The table is sorted by **last updated**, newest first.',
      spots: [
        { id: 'stats', label: 'Counters with data', what: 'Here: active requests (the four seeded demos + practice ones), 5+ vehicle configurations, and still `0` recorded approvals / accepted evidence, because everything except Bada Dost is demo and Bada Dost has no approval.' },
        { id: 'tabs', label: 'Workflow filter', what: 'Click `Drafts` to hide finished work; `Recorded` shows approved (locked) requests.' },
        { id: 'name', label: 'Request name (link)', what: 'Opens the request. Under it: open regulatory actions (orange tag, if any), category · fuel, `Revision N` (goes up on every save), and `Synthetic demo` for demo-based requests.' },
        { id: 'base', label: '`BASE CONFIGURATION`', what: 'The vehicle the request was copied from, and the approval route (`extension request`, `family request`, `new request`).' },
        { id: 'workflow', label: '`WORKFLOW`', what: '`Draft` (grey) → `In review` (blue) → `Homologation recorded` (green).' },
        { id: 'updated', label: '`LAST UPDATED`', what: 'Date of the last change of any kind.' },
        { id: 'arrow', label: '→ button', what: 'Same as clicking the name.' },
        { id: 'row', label: 'One row = one change job', what: 'Read a row left to right: *what* (name) · *from which truck* (base) · *where it is* (workflow) · *when* (date).' },
        { id: 'cards', label: 'Vehicle cards', what: 'Shortcut to start a new request from one of the first three vehicles.' }
      ],
      after: 'Some rows may carry an orange `N regulatory actions` tag and an orange banner `… regulatory actions need review` above the counters. Both come from active rule changes (Section 5).'
    }
  ],
  takeaways: ['The dashboard **is** the list of validation requests.', '`Recorded approvals` and `Accepted evidence` ignore demo data, so 0 is correct until real AL data is in.', 'Role (bottom-left) explains every missing or greyed button.'],
  say: '"The two right-hand counters only count customer data, so the demo seed never inflates our approval or evidence numbers."',
  quiz: [
    { q: 'The workspace has 150 accepted demo reports. What does `Accepted evidence` show?', opts: ['150', '0', '153'], a: 1, why: 'It counts approved reports that are **not** synthetic. All demo reports are synthetic.' },
    { q: 'A colleague can\'t see `Confirm reviewed entries`. First thing to check?', opts: ['Their browser', 'Their role under their name (bottom-left)', 'The app version'], a: 1, why: 'That button only exists for reviewer and admin.' }
  ]
});
