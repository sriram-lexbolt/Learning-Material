SECTIONS.push({
  id: 'settings', kicker: 'Section 8 · 20 min', title: 'Workspace settings and roles',
  sub: 'AI status, the regulatory register and its coverage, accounts and lockouts, and what each role sees.',
  lead: 'The control room. Engineers and reviewers see three information panels; only admins get the account buttons. The second half shows the same screens as each role sees them.',
  words: [['[[Regulatory seed]]', 'the 123-row N1 register: `al-n1-regulatory-seed-4.0.0`, 35 conditional rows.'], ['[[engineer]] / [[reviewer]] / [[admin]]', 'the three roles.'], ['Lockout', '8 wrong passwords → that email is blocked for 15 minutes.']],
  screens: [
    {
      id: 'admin', shot: 'set_admin', title: 'Workspace settings (admin)',
      intro: 'Three panels.',
      spots: [
        { id: 'ai', label: '`Live AI overview`', what: 'Where the AI key lives (server only, never in the browser) and what AI does: request, system and individual-test overviews; provider storage disabled; never approves anything.' },
        { id: 'aipill', label: '`Server configured`', what: 'Green when the server has AI_ENABLED, an API key and a model. Otherwise `Server setup required` and every AI button is greyed.' },
        { id: 'reg', label: '`N1 regulatory register`', what: '`123 review rows · al-n1-regulatory-seed-4.0.0`. *"Known-topic inventory with explicit edition and source review."*' },
        { id: 'coverage', label: '`View coverage & sources`', what: 'Opens the coverage window (next screen).', who: 'all' },
        { id: 'seed', label: '`Download seed JSON`', what: 'Downloads `Ashok_Leyland_N1_Regulatory_Seed.json`: every test row with its law, standard, keyword pattern, required inputs, conditions, tables and sources. The answer to "how does it know which values matter?"', who: 'all' },
        { id: 'workflow', label: '`Engineering workflow`', what: 'A summary of the rules: only reviewers record homologation, confirm editions, accept reports, add calculation rules; approved configurations are immutable; withdrawal/expiry invalidates reuse and AI cache; revision checks protect concurrent edits.' },
        { id: 'acct', label: '`Account management`', what: 'Admins: buttons below. Others: *"Your administrator manages workspace accounts and password recovery."*' },
        { id: 'manage', label: '`Manage accounts`', what: 'List, reset passwords, create accounts.', who: 'adm' },
        { id: 'unlock', label: '`Release login lockouts`', what: 'Immediately clears **all** lockouts. Message: *"Login lockouts released by administrator."* (no confirmation).', who: 'adm' }
      ]
    },
    {
      id: 'coverage', shot: 'set_coverage', title: 'N1 regulatory coverage',
      intro: 'The honest limits of the register, in the app\'s own words.',
      spots: [
        { id: 'claim', label: 'Claim', what: '*"Expanded known-topic inventory; not a certified exhaustive list of current notified law."*' },
        { id: 'gaps', label: '`Controlled review still required`', what: 'Five known gaps: **current law** (no consolidated 2026 CMVR retrieved), **BIS full text** (limits not invented), **notifications** (each must be confirmed), **CEA** (identical fields alone don\'t prove a complete test configuration), **current AIS-007 forms** (newer forms must be installed).' },
        { id: 'refs', label: '`Official references`', what: 'The official documents the seed was built from (e.g. AIS-008 (Rev.2):2019), with status, retrieval date and fingerprint.' },
        { id: 'watch', label: '`Watchlist`', what: 'Not applied, only watched: WLTP / future emissions; AIS-198/199/200 lighting consolidation; AEBS / ESC / LDWS / DDAWS / BSIS / MOIS (published scope is M2/M3/N2/N3, not a blanket N1 mandate).' }
      ],
      teach: 'Use this window when AL asks "is your list complete?" The app\'s own answer is no, by design, and it says what\'s missing.'
    },
    { id: 'accounts', shot: 'set_accounts', title: 'Workspace accounts (admin)', intro: 'Every user, plus a form to create one. There are no invitation emails; give the password to the person yourself, securely.', spots: [{ id: 'list', label: 'User list', what: 'Name · email · role.' }, { id: 'reset', label: '`Reset password`', what: 'Next screen.' }, { id: 'name', label: '`Full name`', what: '' }, { id: 'email', label: '`Email address`', what: 'Must be unique.' }, { id: 'role', label: '`Role`', what: '`engineer` (default), `reviewer`, `admin`. Roles can\'t be changed afterwards in the UI; create a new account if needed.' }, { id: 'pw', label: '`Initial password (12+ characters)`', what: '' }, { id: 'ok', label: '`Create account →`', what: '*"Account created."*' }] },
    { id: 'reset', shot: 'set_reset', title: 'Reset account password', intro: '*"Existing sessions for this account will be ended."*', spots: [{ id: 'pw', label: '`New password (12+ characters)`', what: '' }, { id: 'ok', label: '`Reset password →`', what: '*"Password reset and previous sessions ended."*' }] },
    { id: 'unlock', shot: 'set_unlock_toast', title: 'Release login lockouts', intro: 'One click, no confirmation.', spots: [{ id: 'toast', label: 'Message', what: '' }] },
    { id: 'reviewer', shot: 'set_reviewer', title: 'Settings as a reviewer', intro: 'Same panels, no account buttons.', spots: [{ id: 'acct', label: 'Account panel', what: 'Text only.' }, { id: 'user', label: '`reviewer · v5.1.2`', what: '' }] },
    { id: 'eng-request', shot: 'role_engineer_request', title: 'Engineer: request header', intro: 'No `Delete`, no `Calculation rule`. Everything else is the same.', spots: [{ id: 'actions', label: 'Header buttons', what: '`Vehicle scope`, `AI overview`, `History`, `Export PDF package`.' }, { id: 'calc', label: 'Editor heading', what: 'Only the save state; no Calculation rule.' }, { id: 'user', label: '`engineer`', what: '' }] },
    { id: 'eng-review', shot: 'role_engineer_review_buttons', title: 'Engineer: review window buttons', intro: 'Only `AI overview of this test`. No confirm, no decision.', spots: [{ id: 'buttons', label: 'Buttons', what: '' }] },
    { id: 'eng-tests', shot: 'role_engineer_tests_toolbar', title: 'Engineer: Tests toolbar', intro: 'No `Confirm reviewed entries`; `Submit for review` is there.', spots: [{ id: 'toolbar', label: 'Toolbar', what: '' }] },
    { id: 'eng-package', shot: 'role_engineer_package', title: 'Engineer: PDF package', intro: '`Record received homologation` is greyed.', spots: [{ id: 'record', label: 'Greyed button', what: '' }] },
    { id: 'eng-report', shot: 'role_engineer_report', title: 'Engineer: report details', intro: 'Only `Open report PDF ↗`.', spots: [{ id: 'buttons', label: 'Buttons', what: '' }] },
    { id: 'eng-templates', shot: 'role_engineer_templates', title: 'Engineer: templates', intro: '`Install a reviewed form` greyed.', spots: [{ id: 'install', label: 'Greyed', what: '' }] },
    { id: 'eng-update', shot: 'role_engineer_update', title: 'Engineer: a draft update', intro: 'No `Activate reviewed final source`.', spots: [{ id: 'actions', label: 'Buttons', what: '' }] },
    { id: 'rev-request', shot: 'role_reviewer_request', title: 'Reviewer: request header', intro: 'Has `Calculation rule`, `Confirm reviewed entries`, record and decisions, but no `Delete` (admin only).', spots: [{ id: 'actions', label: 'Header', what: '' }, { id: 'calc', label: '`Calculation rule`', what: '' }, { id: 'user', label: '`reviewer`', what: '' }] },
    { id: 'rev-report', shot: 'role_reviewer_report', title: 'Reviewer: report details', intro: '`Withdraw / review` and `Record CEA coverage`; no `Delete report`.', spots: [{ id: 'buttons', label: 'Buttons', what: '' }] }
  ],
  body: ['<h2>Who can press what</h2><table class="t"><tr><th>Action</th><th>Engineer</th><th>Reviewer</th><th>Admin</th></tr><tr><td>Create/edit requests, scope, table selection, submit, export, AI</td><td>✔</td><td>✔</td><td>✔</td></tr><tr><td>Add base vehicle, import PDFs</td><td>✔</td><td>✔</td><td>✔</td></tr><tr><td>Add test report</td><td>✔</td><td>✔</td><td>✔</td></tr><tr><td>Record / assign / track regulatory updates</td><td>✔</td><td>✔</td><td>✔</td></tr><tr><td>Calculation rule, confirm editions, engineering decision</td><td>✖</td><td>✔</td><td>✔</td></tr><tr><td>Accept / reject / withdraw reports, CEA</td><td>✖</td><td>✔</td><td>✔</td></tr><tr><td>Record homologation (request or base)</td><td>✖</td><td>✔</td><td>✔</td></tr><tr><td>Install template, upgrade table</td><td>✖</td><td>✔</td><td>✔</td></tr><tr><td>Activate / withdraw update, resolve action</td><td>✖</td><td>✔</td><td>✔</td></tr><tr><td>Delete unapproved requests / vehicles / reports</td><td>✖</td><td>✖</td><td>✔</td></tr><tr><td>Accounts, password reset, release lockouts</td><td>✖</td><td>✖</td><td>✔</td></tr></table><p>Server-side checks enforce the same rules; a hidden button can\'t be bypassed (*"A reviewer or administrator must approve this action."*).</p>'],
  takeaways: ['Engineers prepare; reviewers accept, confirm, decide and record; admins manage accounts and delete test data.', 'The register says openly that it isn\'t exhaustive.', 'The seed JSON explains every mapped parameter.'],
  say: '"Four-eyes is enforced server-side: engineers can\'t accept their own evidence or record approvals."',
  tasks: ['As admin, create an engineer account and sign in with it in a private window.', 'Download the seed JSON and find the pattern for service braking.'],
  teach: 'For the pilot: create named accounts for AL with the right roles before the session. Suggest at least one AL reviewer.',
  quiz: [{ q: 'Who can delete an unapproved request?', opts: ['Engineer who made it', 'Reviewer', 'Admin only'], a: 2, why: 'Delete is admin-only.' }]
});
