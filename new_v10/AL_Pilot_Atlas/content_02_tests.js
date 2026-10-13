// Reusable hotspot notes for the test review window.
const REVIEW_SPOTS = (extra = {}) => [
  { id: 'status', label: 'Status tag', what: extra.status || 'The row\'s status (see the Tag decoder).' },
  { id: 'reason', label: 'Reason sentence', what: extra.reason || 'The app\'s one-sentence reason, from its rules. It is the most important line in the window.' },
  { id: 'linked', label: '`Automatically linked: <report>`', what: 'Only when reused: the report (click to open its PDF), the tested vehicle and its certificate, the edition, and the match kind: `exact_configuration` or `accepted_cea`.' },
  { id: 'regchange', label: 'Orange regulatory box', what: 'Only when an active rule change touches this test: reference · phase, what changed, required edition, effective date, source link, and `Open action plan` (opens the update).' },
  { id: 'needed', label: '`Information needed`', what: 'Only for `Inputs needed`: the exact missing inputs, e.g. "Rear axle ratio (value or referenced annex required)" or "(conflicting sources)".' },
  { id: 'params', label: '`Test-relevant parameters`', what: 'Every [[Mapped parameters|mapped parameter]] with its current value (`Not recorded` if empty). On the complete demo truck service braking maps 100+ values, so this list is long; scroll.' },
  { id: 'changed', label: '`Changed` (orange)', what: 'Marks the mapped values that differ from the comparison vehicle.' },
  { id: 'evidence', label: '`Evidence comparison across recorded vehicles`', what: 'Every report for this test, **from any vehicle**, tagged `Eligible` or `Not eligible` with every reason. This is the full reuse check made visible. Typical reasons: `Source vehicle has no recorded homologation` · `Demo evidence is isolated from customer vehicles` · `Report has not been accepted or was withdrawn` · `Passing result not established` · `Report bytes missing or hash mismatch` · `Expired or validity unconfirmed` · `Target test edition and applicability need confirmation` · `Test edition does not match` · `Vehicle category outside report scope` · `N test parameter(s) outside recorded coverage` · `Incomplete test inputs / unresolved source references` · `Target has fewer parameters than the recorded test scope` · regulatory reasons.' },
  { id: 'basis', label: '`Regulatory basis`', what: 'Three lines: the law (e.g. `CMVR Rule 96`) · scope level (`vehicle` or `component…`) and notification status (`review_required` = the catalogue isn\'t certain of the current edition/clause) · the AIS-007 tables this test touches. Then the applicability sentence (why the row applies or not).' },
  { id: 'accept', label: '`Acceptance and evidence`', what: 'What a report must show to count. The app stores **no pass/fail limits** ("No universal pass threshold is seeded"); the checklist names the conditions: verified file fingerprint, recorded source approval + certificate, pass + reviewer acceptance, same category / edition / route / complete parameters / supplier scope, validity and CEA when values differ.' },
  { id: 'source', label: '`Source and criteria`', what: 'The reference document the catalogue used, with `Official reference ↗`, and the clause locator (often "to be confirmed").' },
  { id: 'confirm', label: '`Confirm edition & applicability`', what: 'Record the exact edition for this row, or exclude it with a basis. Same as one row of `Confirm reviewed entries`.', who: 'rev' },
  { id: 'decision', label: '`Record engineering decision`', what: 'Force `Engineering / CEA review required`, `New verification / retest required`, or clear a previous decision.', who: 'rev' },
  { id: 'ai', label: '`AI overview of this test`', what: 'Queues an AI explanation of just this row (its own queue, can run alongside a whole-request review). Becomes `Read AI overview of this test` when ready.', who: 'eng' }
];

SECTIONS.push({
  id: 'tests', kicker: 'Section 2 · 45 min', title: 'Validation requests (2): Tests & evidence',
  sub: 'The status of every official test, the review window, and how to read each status.',
  lead: 'The heart of the app. For each of the 92 test rows that apply to an N1 diesel truck, the app decides one status and explains why. Learn to read one row and one review window, then each status in turn, using the four Demo requests that were built to show each case.',
  words: [
    ['Test row / work item', 'one official test or screening topic from the [[Regulatory seed]] (123 India rows; 92 apply to N1 diesel).'],
    ['[[Mapped parameters]]', 'the values a test depends on, found by keyword. `1 changed / 14 mapped` = 14 values matter, 1 changed.'],
    ['[[Coverage]]', 'the exact values of the tested vehicle, frozen in the report.'],
    ['[[Register confirmation]]', 'a reviewer saying "edition X applies to this request for this test".'],
    ['[[Eligible]]', 'a report passes every reuse check for this request.'],
    ['[[CEA]]', 'an accepted range that lets a report cover small differences.']
  ],
  body: [
    '<div class="callout"><b class="k">How the app picks a status: first match wins</b>The order matters. It explains surprises like "I changed the axle ratio but the braking row says Inputs needed, not Engineering review".<ol><li><b>Not applicable</b>: scope fact = No, reviewer exclusion, or not yet in force on the planned build date.</li><li><b>Retest recorded</b>: a reviewer decision says retest.</li><li><b>Engineering review</b>: a reviewer decision says review, **or** an N1 request declares GVW above 3,500 kg.</li><li><b>Edition review</b>: a scope fact this row depends on is unknown.</li><li><b>Evidence reused</b>: at least one report is eligible.</li><li><b>Inputs needed</b>: a required input is missing, unresolved or conflicting.</li><li><b>Edition review</b>: no reviewer confirmation of edition/applicability for the current seed.</li><li><b>Engineering review</b>: a mapped value changed and nothing covers it.</li><li><b>Evidence missing</b>: everything else.</li></ol>Then, on top: if an **active rule change** applies (and isn\'t upcoming) and scope or the new edition isn\'t confirmed, the row is forced to <b>Edition review</b> with a sentence naming what is left. Try it in the {{go:tests|Status ladder lab}} below. Code: `pilot_assessment.assess()`.</div><div data-widget="ladder"></div>',
    '<div class="callout pro"><b class="k">Why Bada Dost shows zero reuse today</b>On the real truck: 62 rows `Inputs needed`, 26 `Edition review`, 4 `Not applicable`, 0 reused. No real AL reports are recorded, Bada Dost has no recorded homologation (so its reports could never be accepted), and many required inputs are blank on the 7 supplied forms. That is the honest starting state of the pilot, not a bug.</div>'
  ],
  screens: [
    {
      id: 'tab', shot: 'req_tests_bada', title: 'The Tests & evidence tab',
      how: 'Request page → `Tests & evidence`. Shown here on the real Bada Dost request after the 5.13 edit.',
      intro: 'Three summary tags, a toolbar, a grey reminder, then one row per test.',
      spots: [
        { id: 'stats', label: '`N changed parameters` · `N automatically linked reports` · `N rows need review`', what: 'Orange: changed values. Green: rows reusing a report. Amber: rows that are neither reused nor not applicable (the "blockers").' },
        { id: 'search', label: '`Search a test, standard or system…`', what: 'Filters by test title, standard text (e.g. `IS 11852`, `CMVR 96`) or system (e.g. `Braking`). Clicking a system in the impact panel fills this for you.', warn: 'The search text **stays** when you open another request (app quirk). If a list looks oddly short, clear this box.' },
        { id: 'filter', label: '`Filter test status`', what: 'Options: `All test rows`, `Evidence reused`, `Engineering review`, `Inputs needed`, `Evidence missing`, `Edition review`, `Retest recorded`. (`Not applicable` has no filter entry; use All + search.)' },
        { id: 'confirm', label: '`Confirm reviewed entries`', what: 'Batch-confirm editions for the rows **currently shown** (filter/search first). Reviewer/admin only; hidden for engineers; greyed when locked.', who: 'rev' },
        { id: 'submit', label: '`Submit for review →`', what: 'Hand the request to a reviewer (Section 3). Greyed when locked.', who: 'eng' },
        { id: 'hint', label: 'Grey reminder', what: '*"A changed value does not automatically require a new test…"* The screening register is an aid; notified applicability needs human review.' },
        { id: 'col1', label: '`OFFICIAL TEST / SCREENING WORK ITEM`', what: 'Test name (bold), an orange `Regulatory change` tag if a rule change touches it, then grey: standard / law · system.' },
        { id: 'col2', label: '`IMPACT`', what: 'Status tag, then `N changed / N mapped parameters`.' },
        { id: 'col3', label: '`EVIDENCE & DECISION`', what: 'The reason sentence, plus a link pill to the reused report (`reference · vehicle`) when there is one.' },
        { id: 'row', label: 'A row', what: 'One test. Read: name → status → reason.' },
        { id: 'reviewbtn', label: '`Review →`', what: 'Opens the review window for this row (next screens).', who: 'all' }
      ]
    },
    {
      id: 'demo1', shot: 'tests_demo1', title: 'Demo 1: a complete truck, everything reused',
      how: 'Open `Demo 1 - full specification and base evidence` → `Tests & evidence`.',
      intro: 'What a healthy approved truck looks like: no changes, every applicable test linked to an accepted report: 75 reused, 17 not applicable, 0 blockers.',
      spots: [
        { id: 'stats', label: '`0 changed` · `75 automatically linked` · `0 rows need review`', what: 'The target state for real AL trucks once their reports are in.' },
        { id: 'row', label: 'A reused row', what: '`Evidence reused` + `0 changed / N mapped parameters`.' },
        { id: 'pill', label: 'Report pill', what: '`DEMO-BASE-… · Demo N1 - complete technical base`. Click to open the report PDF.' }
      ]
    },
    { id: 'reuse', shot: 'review_reuse', title: 'Review window: Evidence reused (exact)', intro: 'Service braking on Demo 1. Every mapped value equals the report\'s recorded coverage.', spots: REVIEW_SPOTS({ status: '`Evidence reused` (green).', reason: '*"Complete test configuration matches accepted report coverage. Evidence is linked automatically."*' }) },
    {
      id: 'cross', shot: 'review_reuse_other_vehicle', title: 'Evidence from another recorded vehicle (Demo 2)',
      how: 'Open `Demo 2 - evidence from another recorded variant` → `Tests & evidence` → `Review →` on service braking.',
      intro: 'Demo 2 changes the tyres (5 values) on the complete base. Its own base reports no longer fit some tests, but the **recorded tyre variant** was tested with exactly these tyres, so the app links that vehicle\'s report instead: 33 links come from the other vehicle.',
      spots: REVIEW_SPOTS({ status: '`Evidence reused`.', reason: 'Same sentence. The difference is in the linked box: the report belongs to `Demo N1 - recorded tyre variant`, with its own certificate.' }),
      after: 'This is the strongest selling point for AL: proof is matched by **configuration**, not by family tree. Any recorded vehicle with the identical setup can lend its report. Table 9 of the package names the source vehicle and certificate.'
    },
    {
      id: 'cea', shot: 'review_reuse_cea', title: 'Reuse through a CEA range',
      how: 'Built in Section 4: report `TEST-BRAKE-01` (tested at 5.13) got a CEA range 4.5–5.2; a new Demo N1 request at 4.80 now reuses it.',
      intro: 'A changed value can still reuse a report if a reviewer recorded a range for it.',
      spots: [
        { id: 'status', label: '`Evidence reused`', what: 'Even though 4.80 ≠ 5.13.' },
        { id: 'linked', label: 'Linked box, match `accepted_cea`', what: 'The reason reads *"All changed parameters are inside a reviewer-accepted CEA range. Evidence is linked automatically."*' },
        { id: 'evidence', label: 'Comparison list', what: 'The original `DEMO-in-brake-service` (tested at 4.56, no range) is `Not eligible`: *"1 test parameter(s) outside recorded coverage"*. `TEST-BRAKE-01` is `Eligible`.' }
      ],
      after: 'A CEA only counts if: the report is accepted, the range was recorded by a reviewer with a source and a basis, the CEA edition equals the request\'s confirmed edition, and the value is a plain number inside [min, max]. The seeded Demo 3 request shows the same with a headlamp-height change 550 → 600 mm under a fictional 500–650 mm range (12 links).'
    },
    {
      id: 'eng', shot: 'tests_demo4_eng', title: 'Demo 4: Engineering review rows',
      how: 'Open `Demo 4 - new engine power requiring review` → `Tests & evidence` → filter `Engineering review`.',
      intro: 'Demo 4 raises engine power 59 → 65 kW (3 changed values). 19 rows that depend on power lose their exact match: `Engineering review`. 55 unaffected rows still reuse their reports.',
      spots: [
        { id: 'filter', label: 'Filter = `Engineering review`', what: 'Only those rows.' },
        { id: 'row', label: 'A row', what: '`N changed / N mapped` > 0 and the reason *"Test-relevant values changed and no accepted evidence covers the proposed configuration. Check the applicable CEA / worst-case criteria; a new test is not presumed from a field change alone."*' }
      ]
    },
    { id: 'eng-window', shot: 'review_engineering', title: 'Review window: Engineering review', intro: 'The comparison list shows why the base report no longer fits: the changed values are outside its recorded coverage.', spots: REVIEW_SPOTS({ status: '`Engineering review` (orange).', reason: '"Test-relevant values changed and no accepted evidence covers…". A person must decide: CEA / worst case covers it, or a new test.' }) },
    {
      id: 'retest', shot: 'review_retest', title: 'Review window: Retest recorded',
      intro: 'In Demo 4 a reviewer recorded a retest for the Type I emissions row. The reason sentence **is** the reviewer\'s note.',
      spots: REVIEW_SPOTS({ status: '`Retest recorded` (red).', reason: 'The reviewer\'s decision note.' }),
      after: 'Decisions are tied to the exact configuration. Edit any value, save scope or add a calculation rule, and every decision on the request is cleared automatically.'
    },
    { id: 'na', shot: 'review_not_applicable', title: 'Review window: Not applicable', intro: 'Excluded rows still open, so you can check the exclusion reason (here from the seeded scope / reviewer confirmation).', spots: REVIEW_SPOTS({ status: '`Not applicable` (grey).', reason: 'Why it\'s excluded: a scope fact set to No, a reviewer\'s justified exclusion, or "before the published implementation date".' }) },
    { id: 'edition', shot: 'tests_edition_review', title: 'Edition review rows', how: 'A practice request from the complete demo base, after saving Vehicle scope (which clears conditional confirmations).', intro: 'Rows the reviewer must (re)confirm.', spots: [{ id: 'filter', label: 'Filter = `Edition review`', what: 'Typical reasons: "Confirm applicability, notified edition and test route for the current regulatory seed." or "Confirm <scope fact>. Unknown fitment / scope is retained for review." or a regulatory-update sentence.' }, { id: 'row', label: 'A row', what: 'Blue tag. Not a verdict: a stop sign before reuse.' }, { id: 'confirm', label: '`Confirm reviewed entries`', what: 'Batch-confirm exactly these rows.', who: 'rev' }] },
    { id: 'edition-window', shot: 'review_edition', title: 'Review window: Edition review', intro: 'The reviewer buttons at the bottom are the way out of this status.', spots: REVIEW_SPOTS({ status: '`Edition review` (blue).', reason: 'Names exactly what is unconfirmed.' }) },
    { id: 'inputs', shot: 'review_inputs_needed', title: 'Review window: Inputs needed (real Bada Dost)', intro: 'A Bada Dost row after the 5.13 edit. Missing inputs are checked **before** "values changed", so even braking shows Inputs needed here.', spots: [...REVIEW_SPOTS({ status: '`Inputs needed` (amber).', reason: '*"Resolve test inputs and referenced source annexes before concluding whether a new test is needed."*' }), { id: 'buttons', label: 'Buttons', what: 'As admin: `Confirm edition & applicability`, `Record engineering decision`, `AI overview of this test`.' }], after: 'Fix: read `Information needed`, search those words in `Edit specifications` (tick `Include empty fields`), fill them. A value counts as **unresolved** if it is empty, `-` or `--`, has a source conflict, is a derived value not yet calculated (the 12 flagged overall ratios!), or contains the words refer / annexure / enclosure / appendix (e.g. "Refer Annexure 3"). So on Bada Dost the axle change itself creates input gaps for braking and powertrain rows until the overall-ratio formulas are approved.' }
  ],
  explain: {
    simple: 'For each official test the app asks: does an approved report for exactly this truck already exist? If yes, reuse it. If no, it tells you what\'s stopping it: missing data, an unconfirmed rule version, or a changed value someone must judge.',
    precise: '`assess()` evaluates 92 applicable rows with a fixed precedence (scope → decision → classification → scope-unknown → eligible evidence → input gaps → register confirmation → changed mapped params → missing), then overlays active regulatory updates. Eligibility (`compare_report`) is an AND of ~15 checks: source homologated, synthetic isolation, accepted, pass, file hash, validity, confirmed edition equal to report edition, category, mapping version, every mapped value equal or inside an accepted CEA, no input gaps, no fewer parameters than the report covered.',
    together: 'On Demo N1, 4.56 → 5.13 drops the two brake reports (coverage 4.56) but keeps the horn report (it doesn\'t map the axle ratio). On the real Bada Dost nothing is reused yet because no AL report exists. Once AL\'s reports are uploaded on a recorded Bada Dost, the same edit will show exactly which reports survive.'
  },
  takeaways: ['First match wins: Inputs needed outranks Engineering review.', 'Reuse = one accepted report on a recorded vehicle whose recorded values equal yours (or sit in a CEA range), under the same confirmed edition.', 'Evidence can come from any recorded vehicle with the same setup (Demo 2).', 'Decisions vanish when values change, on purpose.'],
  say: '"Reuse is configuration-matched, not family-matched: any homologated variant whose recorded test parameters equal ours can lend its report, provided the edition we confirmed equals the report\'s edition."',
  tasks: ['Open Demo 1, filter `Evidence reused`, open one Review window and find the linked report.', 'Open Demo 2 and find a row whose report comes from the tyre variant.', 'Open Demo 4, filter `Retest recorded`, read the reason.', 'On Bada Dost, open an `Inputs needed` braking row and list its missing inputs.'],
  teach: ['Teach statuses with Demo 1 → 2 → 3 → 4 in order: all reused → reused from another vehicle → reused through a range → review / retest. Then show Bada Dost as "where you are today".', 'Use the ladder lab to answer "why does it say X?" questions live.'],
  quiz: [
    { q: 'A braking row on Bada Dost shows `Inputs needed` after the axle change. Why not `Engineering review`?', opts: ['The axle ratio isn\'t mapped to braking', 'Missing inputs are checked before changed values', 'Bada Dost is synthetic'], a: 1, why: 'Precedence: input gaps come before "values changed".' },
    { q: 'Which report can be reused for a customer vehicle?', opts: ['Accepted report on Demo N1', 'Accepted report on a recorded customer vehicle, same edition, same values', 'Provided report on a recorded customer vehicle'], a: 1, why: 'Demo evidence is isolated; provided reports are not trusted.' },
    { q: 'A reviewer recorded "retest" on a row, then the engineer changes the tyre size. The row…', opts: ['stays Retest recorded', 'loses the decision and is re-sorted', 'becomes Not applicable'], a: 1, why: 'Decisions are bound to the configuration fingerprint and cleared on edit.' }
  ]
});

SECTIONS.push({
  id: 'actions', kicker: 'Section 2b · 30 min', title: 'Validation requests (3): reviewer actions and AI',
  sub: 'Confirm editions (one or many), engineering decisions, and the AI overview.',
  lead: 'The buttons that move rows out of review, and the AI that explains them. Confirming and deciding are reviewer-only; the AI is available to everyone but never changes anything.',
  words: [['[[Edition]]', 'compared character by character with the report\'s edition. `IS 15796` ≠ `IS 15796:2011`.'], ['[[Engineering decision]]', 'a reviewer override on one row, cleared when values change.'], ['[[AI job]]', 'a background AI review, batches of 4 tests.']],
  screens: [
    {
      id: 'confirm-one', shot: 'req_register_test_dialog', title: 'Confirm test applicability (one row)',
      how: '`Review →` on any row → `Confirm edition & applicability`.',
      intro: 'Records, for this request only, which edition applies to this test and whether it applies at all.',
      spots: [
        { id: 'ed', label: '`Exact notified test edition / register reference`', what: 'At least 3 characters, e.g. `IS 11852 (Part 3):2019`. Pre-filled with any previous confirmation. For reuse it must equal the report\'s `Test edition` **exactly**.' },
        { id: 'app', label: '`Applicability`', what: '`Applicable to this configuration` or `Not applicable · justified exclusion` (row becomes Not applicable with your note as reason).' },
        { id: 'note', label: '`Review basis / implementation date / agency route`', what: 'Min. 10 characters: the source you checked.' },
        { id: 'ok', label: '`Confirm register entry →`', what: 'Saves; the row is re-sorted immediately.' }
      ]
    },
    {
      id: 'confirm-many', shot: 'req_batch_dialog', title: 'Confirm reviewed register entries (many rows)',
      how: '`Tests & evidence` → set filter/search → `Confirm reviewed entries`. The window lists exactly the rows currently shown.',
      intro: 'The fast way to clear `Edition review` rows: tick, check the edition, choose applicability, one shared note.',
      spots: [
        { id: 'tick', label: '`REVIEWED` tick box', what: 'Only ticked rows are saved; unticked rows stay as they are.' },
        { id: 'item', label: '`WORK ITEM`', what: 'Test and its standard.' },
        { id: 'ed', label: '`EXACT EDITION / REFERENCE`', what: 'Pre-filled from any earlier confirmation (on demo vehicles `SYNTHETIC functional register 1`). Min. 3 characters for ticked rows.' },
        { id: 'app', label: '`APPLICABILITY`', what: '`Applicable` or `Excluded with basis`.' },
        { id: 'note', label: '`Register review basis / source / implementation dates`', what: 'One note applied to every ticked row (min. 10 characters).' },
        { id: 'ok', label: '`Confirm selected entries →`', what: 'Saves all ticked rows in one revision.' }
      ]
    },
    { id: 'confirm-error', shot: 'req_batch_error', title: 'When a confirmation is refused', intro: 'Ticked row with an empty edition: the app names the row. Since 5.1.1 every box also shows its minimum ("At least 10 characters"); before, short notes silently failed with "Check the required fields" (a server 422).', spots: [{ id: 'error', label: 'Red message', what: '*"Enter the exact edition (at least 3 characters) for: <test>."*' }, { id: 'note', label: 'Note box', what: 'A note under 10 characters is stopped by the browser before sending.' }], after: '**A real mistake made while capturing these screens (keep it as a lesson):** the row was then confirmed with edition `SYNTHETIC functional register 1` (the edition used by the small Demo N1). But the complete demo truck’s reports say `SYNTHETIC-DEMO-N1-2026-v1`. Result: ABS went from `Evidence reused` to **`Evidence missing`**, and its Review window lists both ABS reports as `Not eligible`: *"Test edition does not match"*. Always copy the edition from the report’s `Details` (Evidence library) or from a row that already reuses it.' },
    {
      id: 'decision', shot: 'req_decision_dialog', title: 'Record engineering decision',
      how: '`Review →` → `Record engineering decision`.',
      intro: 'The reviewer\'s verdict on a row, overriding the automatic status.',
      spots: [
        { id: 'action', label: '`Decision`', what: 'Three choices:', options: ['`Engineering / CEA review required` → row shows `Engineering review` with your note.', '`New verification / retest required` → `Retest recorded`.', '`Clear the previous decision` → back to the automatic status.'] },
        { id: 'note', label: '`Engineering rationale`', what: 'Min. 10 characters; becomes the row\'s reason.' },
        { id: 'ok', label: '`Record decision →`', what: 'Saves, bound to the current configuration.' }
      ],
      after: 'There is no "accept / covered" decision: to make a row green you need eligible evidence (an accepted report or a CEA on one). A decision can only make a row stricter or clear it.'
    },
    { id: 'decision-after', shot: 'tests_after_decision', title: 'The row after a retest decision', intro: 'Service braking was reused; after the decision it shows `Retest recorded` with the reviewer\'s note, even though a matching report exists.', spots: [{ id: 'row', label: 'The row', what: 'Decision outranks evidence.' }] },
    {
      id: 'ai-run', shot: 'ai_running', title: 'AI overview running',
      how: '`Edit specifications` → `Generate AI overview` (right panel) or the header `AI overview` button.',
      intro: 'The whole-request review runs in the background, 4 tests per batch (92 rows = 23 batches). You can keep editing.',
      spots: [
        { id: 'header', label: 'Header `AI overview · 12/92`', what: 'Progress; `· Queued` first, `· Ready` at the end.' },
        { id: 'box', label: 'Progress line', what: '`N / 92 tests reviewed · batch N / 23 · about N min left` (estimate starts at ~30 s/batch, then uses the measured pace).' },
        { id: 'progress', label: '`Progress & cancel`', what: 'Opens the job window.' }
      ],
      after: 'Live timing: about 2–3 minutes on Demo N1, 10–12 minutes on Bada Dost. Practice copy: a pretend AI answers in ~1.5 s per batch with text starting "SIMULATED".'
    },
    { id: 'ai-job', shot: 'ai_progress_dialog', title: 'AI overview progress window', intro: 'Status, errors, and the controls for one AI job.', spots: [{ id: 'cancel', label: '`Cancel review`', what: 'Stops after the current batch; that answer is discarded. If a job ends `partial`, `failed`, `interrupted` or `cancelled`, the button becomes `Retry unfinished batches` (accepted batches are reused). `Read accepted explanations` shows what finished.' }] },
    { id: 'ai-ready', shot: 'ai_ready', title: 'AI overview ready', intro: 'The card shows the first 600 characters of the summary and up to 3 blockers.', spots: [{ id: 'header', label: '`AI overview · Ready`', what: 'Click to open the full overview.' }, { id: 'box', label: 'Badge `Live review`', what: 'A current overview exists for this exact state.' }, { id: 'read', label: '`Read full overview`', what: 'Opens the details.' }, { id: 'refresh', label: '`Refresh overview`', what: 'Runs again (use after changes; the card then says "The configuration or evidence changed. Refresh the overview…").' }] },
    {
      id: 'ai-details', shot: 'ai_details', title: 'Reading the full AI overview',
      intro: 'Grouped answers. The app checks every AI batch and throws it away if it changes a status or the readiness, cites a report that isn\'t linked or a parameter that isn\'t mapped, claims recorded evidence where there is none, skips a test or system, or uses words like "guaranteed", "will pass homologation" or "100% compliant" (code: `pilot_ai.validate`).',
      spots: [
        { id: 'parts', label: '`Part 1`, `Part 2`…', what: 'One summary per batch; click to open/close.' },
        { id: 'ready', label: '`Verification required` / `Evidence ready for review`', what: 'Set by the app (any blocker → verification required), not the AI.' },
        { id: 'blockers', label: '`Blockers and assumptions`', what: 'What stops a decision, and what the AI assumed.' },
        { id: 'systems', label: '`Vehicle systems and test-level review`', what: 'One box per system with priority (low/medium/high) and each test\'s explanation.' },
        { id: 'test', label: 'One test', what: 'Explanation · `Next action:` (a suggestion) · `Basis:` `recorded_evidence`, `engineering_inference` or `unresolved`.' },
        { id: 'foot', label: 'Grey footer', what: 'Prompt version, rows covered, batches, field facts sent (with omitted/truncated counts), and *"This live overview does not record approval."*' }
      ]
    },
    { id: 'ai-test', shot: 'ai_test_answer', title: 'AI overview of one test', intro: 'From a review window: `AI overview of this test` → wait → `Read AI overview of this test`.', spots: [{ id: 'test', label: 'The explanation', what: 'Same structure as one test in the full overview. On the live site, real engineering wording.' }] }
  ],
  takeaways: ['Edition text must match the report character for character.', 'Batch confirm acts on the rows currently filtered.', 'Decisions only make rows stricter (review / retest) or clear them.', 'AI explains, never decides; it runs in the background.'],
  say: '"Edition confirmation is per request and per test, and reuse needs the confirmed edition to equal the report\'s edition. That\'s what stops old-rule evidence slipping through."',
  tasks: ['As reviewer, confirm one Edition review row with a typo in the edition, then find why reuse fails.', 'Record a retest on a reused row, then change any value and watch the decision disappear.', 'Start an AI overview, cancel it, then retry.'],
  teach: 'Demo the AI last and briefly: it impresses but is the least important part. Stress "it can\'t approve anything".',
  quiz: [
    { q: 'Report edition `IS 15796`, confirmed edition `IS 15796 ` (trailing space)…', opts: ['Mismatch', 'Match: spaces at the ends are trimmed on report upload; type the confirmation carefully too', 'Depends on the AI'], a: 1, why: 'Report fields are trimmed (5.1.1). Always copy editions exactly.' },
    { q: 'How do you make an Engineering review row green?', opts: ['Record decision "covered"', 'Provide eligible evidence: an accepted matching report or an accepted CEA range', 'Run the AI'], a: 1, why: 'There is no "covered" decision; green only comes from evidence.' }
  ]
});
