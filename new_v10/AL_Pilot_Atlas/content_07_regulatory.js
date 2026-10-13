SECTIONS.push({
  id: 'regulatory', kicker: 'Section 7 · 45 min', title: 'Regulatory updates',
  sub: 'Recording a rule change, activation, impact rows, assigning and tracking, where the flags appear, and resolving.',
  lead: 'When a rule changes, the app finds **every vehicle and request** it touches, test by test, and makes old-edition evidence stop counting until someone confirms the new edition. It never watches government sites; a person records each change and a reviewer activates it.',
  words: [
    ['[[Regulatory update]]', 'one recorded rule change.'],
    ['Publication status', '`Draft · watch only`, `Reference / policy statement · watch only` (never applied), or `Final notified · pending reviewer activation` (can be activated).'],
    ['[[Phase]]', 'per vehicle × test: `effective`, `upcoming` or `scope review`.'],
    ['[[Impact row]]', 'one vehicle/request × one test, with a to-do list and a status.'],
    ['Advisory', 'an already-approved vehicle: its certificate stays valid; check future production or the next extension.']
  ],
  body: [
    '<div class="callout"><b class="k">The flow</b><div class="flow"><span>Engineer: `Record an update` → <b>Awaiting source review</b> (changes nothing)</span>→<span>Reviewer: `Activate reviewed final source` → <b>active</b></span>→<span>every matching vehicle/request × test gets an impact row; test rows go to `Edition review` with a `Regulatory change` tag</span>→<span>set scope, confirm new edition, fill required values, get new evidence</span>→<span>Reviewer: `Track action` → <b>Resolve</b></span></div></div>',
    '<div class="callout"><b class="k">How the phase is decided (code: <code>regulatory_updates.match</code>)</b><ol><li>Not active, test not selected, category or fuel not ticked → not affected.</li><li>Update for new (or existing) models only, and the request\'s route is the other one → not affected. Route unknown → <b>scope review</b>.</li><li>Planned manufacture date set: before the effective date → <b>upcoming</b> (old gates stay; planning only); otherwise → <b>effective</b> (unless step 2 left it unknown).</li><li>No manufacture date → <b>scope review</b> (if today is past the effective date) or upcoming (if not yet).</li></ol>Try it in the {{go:regulatory|Phase lab}}.</div><div data-widget="phase"></div>'
  ],
  screens: [
    {
      id: 'desk', shot: 'reg_empty', title: 'The change desk (empty)',
      intro: '*"From a changed requirement to a clear vehicle-by-vehicle action plan."*',
      spots: [
        { id: 'record', label: '`Record an update`', what: 'Opens the 3-part form. Any role.', who: 'eng' },
        { id: 'hero', label: 'Banner', what: 'Three stages: `01 Source review`, `02 Impact & actions`, `03 Evidence verification`.' },
        { id: 'flow', label: 'Stages', what: 'Decoration.' },
        { id: 'summary', label: '`N actions requiring attention`', what: 'Open impact rows across all updates · active updates · your unread notifications.' },
        { id: 'metrics', label: '`Source records` · `Active changes` · `Open actions` · `Unread`', what: 'All updates ever recorded · active ones · impact rows not resolved · new to **you**.' },
        { id: 'search', label: 'Search', what: 'Matches title, reference and change text.' },
        { id: 'filter', label: 'Filter', what: '`All updates`, `Awaiting source review`, `Active`, `Withdrawn`.' },
        { id: 'empty', label: 'Empty state + `Record first update`', what: '' },
        { id: 'foot', label: 'Footnote', what: '*"In-app alerts follow controlled source intake. Public websites are not polled automatically. Draft publications never change evidence gates."* No emails are sent either.' }
      ]
    },
    {
      id: 'record', shot: 'reg_record_dialog', title: 'Record a regulatory update (all three parts)',
      intro: 'One source, the tests it affects, and what engineers must do. Saving does **not** activate it.',
      spots: [
        { id: 's1', label: '`1 · Source and amendment`', what: 'Where the change comes from.' },
        { id: 'title', label: '`Update title`', what: 'Human-readable name.' },
        { id: 'ref', label: '`Notification / amendment reference`', what: 'The official notice number (min. 5).' },
        { id: 'url', label: '`Source URL`', what: 'HTTPS link to the official document, no credentials.' },
        { id: 'loc', label: '`Clause / annex / page locator`', what: 'Where in the document.' },
        { id: 'pub', label: '`Publication status`', what: 'Only `Final notified · pending reviewer activation` can ever be activated; drafts and reference statements are watch-only.' },
        { id: 'ed', label: '`Exact updated edition / register reference`', what: 'The new edition. Requests must confirm **this exact text**, and new reports must carry it.' },
        { id: 'sup', label: '`Supersedes an active update`', what: '`None · separate amendment` or an active update to replace. A replacement must keep the same tests, categories, fuels and model route, and can\'t move the date earlier. Two active updates with different editions on the same scope are refused unless one supersedes the other.' },
        { id: 's2', label: '`2 · Scope and implementation`', what: 'Which vehicles, from when.' },
        { id: 'date', label: '`Effective date`', what: 'Compared with each request\'s planned manufacture date.' },
        { id: 'route', label: '`Model route`', what: '`All models`, `New models only`, `Existing models only`.' },
        { id: 'cats', label: 'Categories', what: 'N1 ticked by default.' },
        { id: 'fuels', label: 'Fuels', what: 'All six ticked by default.' },
        { id: 'tsearch', label: 'Test search', what: 'Type part of a test or system name to narrow the list.' },
        { id: 'selshown', label: '`Select shown tests`', what: 'Ticks every test currently visible.' },
        { id: 'tlist', label: 'Test list', what: 'All 123 rows; tick the affected ones.' },
        { id: 's3', label: '`3 · Engineering change summary`', what: '' },
        { id: 'changes', label: '`Changes and required engineering work`', what: 'What changed in plain words.' },
        { id: 'params', label: '`New or changed parameter labels`', what: 'Optional, one per line: values engineers must now record. Each becomes a **required input** of the selected tests once active.' },
        { id: 'check', label: '`Wording check`', what: 'Appears within a second (since 5.1.2). Here: `horn make` → green `12 / 16 configurations` (matches `Horn make and part number` and `Horn make / part / approval / position`); `Horn manufacturer` → red `No match`.', warn: 'Matching is **exact words, any capitals**, inside a field\'s label or section context. No synonyms. Bada Dost is one of the 4 non-matches for "horn make": its Table 6 horn field is just `Make`. Search an affected truck\'s `Edit specifications` first and copy its wording.' },
        { id: 'note', label: '`Source review / intake note`', what: 'Provenance and assumptions for the reviewer.' },
        { id: 'save', label: '`Save for source review →`', what: 'Saves as `Awaiting source review`. Nothing is flagged yet.' }
      ]
    },
    { id: 'draft', shot: 'reg_draft_card', title: 'A saved draft card', intro: 'One card per update, newest first.', spots: [{ id: 'card', label: 'Card', what: '' }, { id: 'ref', label: 'Reference', what: '' }, { id: 'state', label: '`Awaiting source review`', what: '+ `Unread` (orange) when new to you.' }, { id: 'meta', label: 'Edition · Effective date · `N configurations` · `N open actions`', what: '0 / 0 until active.' }, { id: 'footer', label: 'Categories · model route · publication', what: '' }, { id: 'btn', label: '`Review source →` / `View impact & actions →`', what: 'Opens the detail window. Clicking the title does the same.' }, { id: 'metrics', label: 'Counters', what: 'Source records 1, nothing active.' }] },
    { id: 'draft-detail', shot: 'reg_draft_detail', title: 'Detail of a draft', intro: 'The reviewer\'s view before activation.', spots: [{ id: 'status', label: 'State · publication · open actions', what: '' }, { id: 'keys', label: '`Required edition` · `Implementation date`', what: '' }, { id: 'what', label: '`What changed`', what: '' }, { id: 'trail', label: '`Source and review trail`', what: 'Link, locator, intake note.' }, { id: 'params', label: '`Parameters to capture or verify`', what: '' }, { id: 'read', label: '`Mark notification read`', what: 'Clears **your** unread flag only.' }, { id: 'activate', label: '`Activate reviewed final source`', what: 'Reviewer; enabled only for final notified.', who: 'rev' }, { id: 'hint', label: 'Grey note', what: 'Drafts are watch items; record a separate final record when the notification is issued.' }] },
    { id: 'activate', shot: 'reg_activate_dialog', title: 'Activate reviewed source', intro: 'The four-eyes step: a reviewer confirms the source before the fleet is flagged.', spots: [{ id: 'note', label: '`Reviewer source, scope and implementation basis`', what: 'Min. 20 characters.' }, { id: 'ok', label: '`Activate & flag affected vehicles →`', what: 'Scans every vehicle and request (and any created later).' }] },
    { id: 'active', shot: 'reg_active_desk', title: 'After activation', intro: 'The desk, menu and bell all update.', spots: [{ id: 'bell', label: 'Bell count', what: 'Your unread updates.' }, { id: 'navcount', label: 'Menu badge', what: 'Same number next to `Regulatory updates`.' }, { id: 'summary', label: 'Actions requiring attention', what: '16 here: 16 vehicle/request × test blocks.' }, { id: 'metrics', label: 'Counters', what: '' }, { id: 'card', label: 'Card: `active`', what: '`16 configurations` (distinct vehicles/requests) · `16 open actions`.' }, { id: 'unread', label: '`Unread`', what: '' }] },
    {
      id: 'impact', shot: 'reg_active_detail', title: 'Impact by configuration and official test',
      intro: 'The action plan. One block per vehicle/request × affected test.',
      spots: [
        { id: 'status', label: 'Header tags', what: '`active` · publication · `N open actions`.' },
        { id: 'activation', label: '`Activation basis`', what: 'The reviewer\'s note.' },
        { id: 'read', label: '`Mark notification read`', what: 'Per person; does not close anything.' },
        { id: 'withdraw', label: '`Withdraw active update`', what: 'Reviewer; stops applying it, keeps history.', who: 'rev' },
        { id: 'assign', label: '`Assign selected actions`', what: 'Tick blocks first.', who: 'eng' },
        { id: 'impact', label: 'One block', what: 'Name (+ `Synthetic`) · `system · test` · status tag (`Action needed`, `in progress`, `resolved`).' },
        { id: 'check', label: 'Tick box', what: 'Selects the block for `Assign selected actions`.' },
        { id: 'tags', label: 'Phase and flags', what: '`effective` / `upcoming` / `scope review` · `Recorded approval · advisory` (approved vehicle) · `Past implementation date` (effective date passed, not resolved) · `Configuration changed · reopened`.' },
        { id: 'todo', label: 'Numbered to-do list', what: 'Generated: e.g. "Confirm manufacture date and model route…", "Review applicability and confirm edition TEST-HORN-2026.", "Capture or verify parameter: horn make.", "Review accepted reports… commission a test only when coverage is insufficient." Approved vehicles start with "Assess impact on continued production / the next extension…".' },
        { id: 'matches', label: 'Required-label matches', what: '`Filled` (green: field found and has a value) · `Value needed` (amber: found, empty) · `No matching field` (red).' },
        { id: 'open', label: '`Open configuration →`', what: 'Opens that request or vehicle.' },
        { id: 'linked', label: '`Create linked validation request`', what: 'Only on vehicles: start a new request from it to handle the change.' },
        { id: 'track', label: '`Track action`', what: 'Set status, owner and notes for this block.' },
        { id: 'history', label: '`Event history (N)`', what: 'Created, activated, read, assigned, actions… with dates.' }
      ],
      after: 'In this run: 16 blocks. The 4 seeded Demo requests and the complete demo vehicles were `effective` (their scope already has a manufacture date); Bada Dost and the small Demo N1 items were `scope review` (no date or route). All were `Past implementation date` (effective 1 Jan 2026).'
    },
    { id: 'assign', shot: 'reg_assign_dialog', title: 'Assign selected actions', intro: 'Gives several blocks an owner at once.', spots: [{ id: 'owner', label: '`Action owner`', what: 'A person or team.' }, { id: 'note', label: '`Assignment and next steps`', what: 'Min. 15.' }, { id: 'ok', label: '`Assign & start work →`', what: 'Blocks become `in progress`.' }] },
    { id: 'track', shot: 'reg_track_dialog', title: 'Track regulatory action', intro: 'Per block.', spots: [{ id: 'status', label: '`Action status`', what: '`In progress · flags remain`. `Resolve · updated evidence / exclusion required` appears **only** for a reviewer, on an editable request (not a vehicle, not approved), in phase `effective`.' }, { id: 'owner', label: '`Action owner`', what: '' }, { id: 'note', label: '`Work completed / next action and verification basis`', what: 'Min. 15.' }] },
    { id: 'banner', shot: 'reg_banner_requests', title: 'Where the flags show up: dashboard', intro: 'Orange banner `N regulatory actions need review` with `Review changes →`, and an orange `N regulatory actions` tag under each affected request (vehicle cards too).', spots: [{ id: 'banner', label: 'Banner', what: '' }, { id: 'flag', label: 'Row tag', what: '' }] },
    { id: 'row', shot: 'reg_request_row', title: 'Where the flags show up: the test row', intro: 'In the request: the banner (for this configuration) and the horn row with `Regulatory change` + `Edition review`.', spots: [{ id: 'banner', label: 'Request banner', what: '' }, { id: 'row', label: 'Horn row', what: 'Reason names what is missing, e.g. *"Regulatory update TEST-NOTIFICATION-2026 · TEST-HORN-2026: confirm edition TEST-HORN-2026 in Confirm reviewed entries."* (scope already set here, so only the edition part remains).' }, { id: 'regpill', label: '`Regulatory change`', what: '' }] },
    { id: 'row-window', shot: 'review_regulatory', title: 'Review window with a rule change', intro: 'The orange box sits under the status.', spots: [{ id: 'status', label: '`Edition review`', what: '' }, { id: 'reg', label: 'Rule-change box', what: '`reference · phase`, changes, `Required edition` · `Effective`, locator, `Source reference ↗`.' }, { id: 'plan', label: '`Open action plan`', what: 'Opens the update.' }] },
    { id: 'after-confirm', shot: 'reg_after_confirm_row', title: 'After confirming TEST-HORN-2026', intro: 'A reviewer confirmed the new edition on the horn row. The old horn report (edition `SYNTHETIC-DEMO-N1-2026-v1`) no longer counts ("Regulatory update: evidence uses a superseded or different edition"), so the row moved to the next blocker: **`Evidence missing`**. (If the required label had been empty it would be `Inputs needed`; if a horn value had changed, `Engineering review`.)', spots: [{ id: 'row', label: 'Horn row', what: '' }] },
    { id: 'reuse', shot: 'reg_reuse_row', title: 'New report under the new edition → reused', intro: 'A horn report `TEST-HORN-2026-R1` with edition `TEST-HORN-2026` was added on the complete demo base and accepted. The row is green again with the new report linked.', spots: [{ id: 'row', label: 'Horn row', what: '`Evidence reused`.' }] },
    { id: 'resolve', shot: 'reg_resolve_dialog', title: 'Resolve the action', intro: 'Now `Resolve` is offered and accepted.', spots: [{ id: 'status', label: '`Resolve · updated evidence / exclusion required`', what: 'Refused unless the row is `Evidence reused` or `Not applicable` **and** the edition was confirmed after activation (*"Confirm the updated edition and provide eligible evidence or a reviewed exclusion before resolving."*).' }, { id: 'note', label: 'Work completed', what: '' }, { id: 'ok', label: '`Save action →`', what: '' }], after: 'A resolved block **reopens automatically** if that request\'s values, scope or register change later (tag `Configuration changed · reopened`).' },
    { id: 'resolved', shot: 'reg_resolved_detail', title: 'A resolved block', intro: 'Faded block, green `resolved`, open actions down by one.', spots: [{ id: 'resolved', label: 'Resolved block', what: '' }, { id: 'status', label: 'Open actions', what: '' }] },
    { id: 'withdraw', shot: 'reg_withdraw_dialog', title: 'Withdraw regulatory update', intro: 'Reviewer. Stops applying the update; history is retained.', spots: [{ id: 'note', label: 'Basis', what: 'Min. 20.' }, { id: 'ok', label: '`Withdraw & retain audit history →`', what: '' }] },
    { id: 'watch', shot: 'reg_watch_detail', title: 'A watch-only draft can\'t be activated', intro: '`TEST – draft lighting proposal (watch only)`, publication Draft.', spots: [{ id: 'activate', label: 'Greyed `Activate reviewed final source`', what: 'Record a new update when the final notification is out.' }, { id: 'hint', label: 'Note', what: '' }] },
    { id: 'two', shot: 'reg_two_updates', title: 'The desk with two updates', intro: 'Use the filter to separate active work from watch items.', spots: [{ id: 'filter', label: 'Filter', what: '' }, { id: 'cardA', label: 'Active, 15 open', what: '' }, { id: 'cardB', label: 'Draft, 0 configurations', what: '' }] }
  ],
  explain: {
    simple: 'When a rule changes, someone writes it down, a senior person checks it and switches it on, and the app puts a sticky note on every affected truck and test. Old test reports stop counting until the team confirms the new version and gets fresh proof.',
    precise: 'Active updates override the row status to edition_review while phase ≠ upcoming and (phase = scope_review or the request\'s confirmation edition ≠ update edition or was confirmed before activation). `effective_test` appends required labels to the test pattern and required inputs; `evidence_reasons` rejects reports whose edition ≠ the update edition. Actions are keyed by configuration hash, so changes reopen them.',
    together: 'Horn example: activate TEST-HORN-2026 → 16 blocks; on the practice request confirm the edition → Evidence missing; upload and accept a TEST-HORN-2026 report → reused; reviewer resolves. On Bada Dost the same update would also show "No matching field" for "horn make".'
  },
  takeaways: ['Only a reviewer-activated **final notified** update changes anything.', 'Read ≠ done; resolve needs reuse or exclusion plus a post-activation edition confirmation.', 'Set Vehicle scope first, or rows stay in scope review.', 'Required labels match exact words.'],
  say: '"Regulatory change is controlled intake with reviewer activation; impact is computed per configuration and test, gates old-edition evidence, and actions reopen when the configuration changes."',
  tasks: ['Record a watch-only draft and confirm activation is impossible.', 'Record and activate a final update on one test, then follow one request from Edition review to resolved.', 'Type two candidate labels and read the Wording check.'],
  teach: 'Show AL the impact list first (the "nothing is missed" value), then one request\'s journey to resolved. Mention that it doesn\'t monitor websites or send emails.',
  quiz: [
    { q: 'A request has no manufacture date. A final update (all models) is active and its date has passed. Phase?', opts: ['effective', 'scope review', 'upcoming'], a: 1, why: 'Without a manufacture date the phase is scope review once the date has passed.' },
    { q: 'You marked the notification read. The action is…', opts: ['Resolved', 'Still open', 'Deleted'], a: 1, why: 'Read only clears your unread flag.' }
  ]
});
