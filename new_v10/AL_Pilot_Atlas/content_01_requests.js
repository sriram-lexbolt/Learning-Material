SECTIONS.push({
  id: 'requests', kicker: 'Section 1 · 40 min', title: 'Validation requests (1): create and edit',
  sub: 'New request window, the request page, editing values, linked cells, calculation rules, history, vehicle scope.',
  lead: 'A validation request is a **copy** of one vehicle that you change. This section covers everything on the request page except the test sorting (Section 2) and the package / approval (Section 3). The worked example is AL\'s own: **rear axle ratio 4.56 → 5.13 on the real Bada Dost**.',
  words: [
    ['[[Base vehicle]]', 'the vehicle the request is copied from. Fixed forever once created.'],
    ['[[Comparison vehicle]]', 'what your edits are measured against. Usually the base; if the base has newer **recorded extensions**, the newest one.'],
    ['[[Parameter]] / [[Occurrence]]', 'one fact (e.g. rear axle ratio) / one PDF cell where it is printed. One parameter can have several occurrences.'],
    ['[[Autosave]]', 'no save button: values save themselves about 0.65 s after you stop typing.'],
    ['[[Revision]]', 'a counter that goes up on every save; it prevents two people silently overwriting each other.'],
    ['[[Calculation rule]]', 'a reviewer-approved formula that keeps one value equal to (A × B) or (A − B).'],
    ['[[Vehicle scope]]', 'yes / no / unknown facts plus manufacture date and new/existing model; they switch conditional tests on and off.']
  ],
  body: [
    '<div class="callout"><b class="k">The life of a request</b><div class="flow"><span>Create (pick base)</span>→<span><b>Draft</b>: edit, scope, review rows</span>→<span>`Submit for review` → <b>In engineering review</b></span>→<span>reviewer `Record received homologation` → <b>Homologation recorded</b> (locked)</span>→<span>a new <b>recorded vehicle</b> appears in the library</span></div>Submitting is only a hand-over label: an in-review request is still fully editable. Only recording homologation locks it.</div>',
    '<div class="callout warn"><b class="k">Speed on the real Bada Dost</b>Every save re-assesses all 92 test rows against every report in the system. With the Full Demo Seed loaded (150 extra reports), opening or saving the Bada Dost request took about 20 seconds on the practice laptop (Demo N1 requests take 1–5 s). On the server it may be faster, but warn AL that "Saving changes…" can take a while on a big truck, and **never close the tab while it says Unsaved changes**: the browser will ask before leaving.</div>'
  ],
  screens: [
    {
      id: 'new', shot: 'req_new_dialog', title: 'The "Create a validation request" window',
      how: '`Validation requests` → orange `New validation request` (top right). Also opens from `Create variant →` on a vehicle card, `Create validation request` on a vehicle page, `Create linked request` on a locked request, and `Create linked validation request` on a regulatory impact row; those pre-fill the base.',
      intro: 'Four fields. Only two matter for the engine: **base** and **route**.',
      spots: [
        { id: 'name', label: '`Request name`', what: 'Free text, for humans only. The app never reads it. Convention for practice: start with `TEST –`.', who: 'eng' },
        { id: 'base', label: '`Base vehicle / recorded variant`', what: 'Starts **empty** (`Choose the vehicle this change starts from…`); you must pick one. Each option ends with its kind:', options: ['`· Supplied`: data from manufacturer PDFs, no approval recorded (Bada Dost).', '`· Recorded`: a vehicle with a recorded homologation (locked, can supply evidence).', '`· Not homologated`: a base you created/imported, no approval yet.', '`· Demo`: synthetic practice vehicle.'], press: 'All values, source PDFs, table list, calculation rules, scope facts and register confirmations of that vehicle are **copied** into the request. If the vehicle has newer **recorded extensions**, the newest one is copied and compared against instead (see the grey hint).', warn: 'It can\'t be changed later. A request on the wrong base must be deleted (admin) or abandoned and recreated. Before 5.1.2 this box silently picked the newest vehicle; now it forces a choice.', who: 'eng' },
        { id: 'route', label: '`Approval route`', what: 'What kind of approval this change will need.', options: ['`Extension / change to an existing configuration` (default): when recorded, the new vehicle **supersedes** its parent as the comparison point for later requests. ARAI suffix E01, E02…', '`Additional family variant`: a sibling. When recorded it does **not** replace the parent as comparison point. ARAI suffix F01, F02…', '`New vehicle approval`: a brand-new type.'], code: 'The route does **not** change which tests are checked or how. It matters after approval: `pilot_repository.latest()` only follows `extension` children when choosing the comparison point for the next request.', who: 'eng' },
        { id: 'desc', label: '`Change description`', what: 'Optional engineering context (e.g. "Rear axle ratio changes from 4.56 to 5.13 to improve gradeability"). Stored with the request.', who: 'eng' },
        { id: 'hint', label: 'Grey hint', what: '*"The latest recorded extension in the selected branch becomes the comparison point. Earlier approved configurations remain available for evidence reuse."* In plain words: you are always compared with the newest approved version, but reports from older approved versions can still be reused if they match.' },
        { id: 'cancel', label: '`Cancel`', what: 'Closes without creating anything.' },
        { id: 'create', label: '`Create & edit configuration →`', what: 'Creates the request (Draft, Revision 1) and opens it. Tables 8, 9, 10 and 12 (the schedules) are always added to the package even if the base didn\'t have them.', who: 'eng' }
      ],
      teach: 'This maps exactly onto AL\'s ask from the 6 Oct meeting: "new request → select Bada Dost → it takes the history → it takes the base". Show them that picking the base is the only real decision here.'
    },
    {
      id: 'page', shot: 'req_page_top', title: 'The request page (Edit specifications tab)',
      intro: 'The real Bada Dost request right after creation. Header on top, three tabs, the value editor on the left, the live impact panel on the right.',
      spots: [
        { id: 'eyebrow', label: '`EXTENSION VALIDATION REQUEST`', what: 'The route you picked (`FAMILY…`, `NEW…`).' },
        { id: 'title', label: 'Request name', what: 'As typed. Can\'t be renamed in the UI.' },
        { id: 'based', label: '`Based on … · Compare against …`', what: '**Check this line every time.** "Based on" = the vehicle values were copied from. "Compare against" = the approved state your changes are measured against (the newest recorded extension in that branch).', warn: 'If it names the wrong truck, the whole request is wrong. Make a new one.' },
        { id: 'meta', label: 'Grey tags: `Draft` · `N1 / diesel` · `Revision 1` · `11 selected tables`', what: 'Status · category / fuel (copied from the base, not editable) · save counter · number of AIS-007 forms in the package (Bada Dost: 2, 3, 4E, 5, 6, 7, 11 from AL + 8, 9, 10, 12 schedules). Demo requests also show `Synthetic demonstration`.' },
        { id: 'delete', label: '`Delete` (red outline)', what: 'Permanently deletes this request after a browser confirmation. Only on requests that are **not** recorded. Refused while a whole-request AI review is running.', who: 'adm' },
        { id: 'scope', label: '`Vehicle scope`', what: 'Opens the scope facts window ({{go:requests/scope|screen 9}}). Greyed out once recorded.', who: 'eng' },
        { id: 'ai', label: '`AI overview`', what: 'Starts or opens the whole-request AI review. The label shows progress (`AI overview · 12/92`) and `· Ready` when done. Details in Section 2.', who: 'eng' },
        { id: 'history', label: '`History`', what: 'Shows the approval family of the base vehicle ({{go:requests/history|screen 8}}). Not an edit log.', who: 'all' },
        { id: 'export', label: '`Export PDF package`', what: 'Downloads the full ZIP (same as `Download complete package` on the PDF package tab). Pending edits are saved first.', who: 'all' },
        { id: 'progress', label: 'Progress line', what: '`Base selected` ✔ → `Edit configuration` → `Review & export`. It only follows the tab you are on; it doesn\'t track completion.' },
        { id: 'tabs', label: 'Tabs', what: '`Edit specifications` (values) · `Tests & evidence` (every test sorted, Section 2) · `PDF package` (output and approval, Section 3).' },
        { id: 'calc', label: '`Calculation rule`', what: 'Add a formula that keeps one value calculated from two others ({{go:requests/calc|screen 5}}).', who: 'rev' },
        { id: 'saved', label: '`✓ All changes saved`', what: 'Save state: `Unsaved changes` (you typed, waiting 0.65 s) → `Saving changes…` → `All changes saved`. On error: `Save failed · retry or reload`.' },
        { id: 'search', label: '`Search a parameter, clause or table…`', what: 'Searches each value\'s **label**, **context** (the section headings above it), its id, and `Table N clause` (e.g. type `B4.6` or `Table 7`). Searches only this truck\'s data, not standards.' },
        { id: 'group', label: '`All systems`', what: 'Filter by vehicle system: Additional specifications, Braking, Dimensions & weights, Electrical, Evidence schedule, General, Identification, Lighting, Occupant protection, Powertrain, Vehicle overall, Vehicle summary, Visibility, Wheels & tyres.' },
        { id: 'table', label: '`All tables`', what: 'Show only values printed in one table (Table 2 … Table 12).' },
        { id: 'changes', label: '`Changes only`', what: 'Show only values that differ from the comparison vehicle ({{go:requests/changes|screen 7}}).' },
        { id: 'empty', label: '`Include empty fields`', what: 'Empty cells are hidden by default (Bada Dost has hundreds). Tick it to fill a blank value, e.g. one a rule change now requires. A search also shows empty matches.' },
        { id: 'row', label: 'A value row', what: 'Label (bold) · clause and section context (grey) · tags (`Table 3`, `Table 7`, `3 linked cells`) · `Source & mapping details` · the value box on the right. Rows are listed 35 at a time; `Show more parameters` adds 40. The rear axle ratio is pinned to the top of the list.' },
        { id: 'impact', label: '`Configuration impact` · `Live comparison`', what: 'Recalculates after every save: number of changes, how many PDF cells will be rewritten, `Tests with reusable evidence`, `Tests needing review / inputs`, then the affected systems. Here 0 / 88: Bada Dost has **no accepted reports**, so nothing can be reused yet; 88 = 92 applicable rows minus 4 not applicable.' },
        { id: 'aibox', label: '`AI overview` box', what: '`Generate AI overview` starts a background review of all tests. Badge: `Available` (server key set), `Live review` (a current overview exists) or `Setup needed`.' },
        { id: 'more', label: '`Show more parameters (N remaining)`', what: 'Loads 40 more rows. Faster: search or filter.' }
      ],
      teach: 'Point at "Compare against" and say: "This line is your safety check. Everything the app tells you is relative to this vehicle."'
    },
    {
      id: 'field', shot: 'req_field_search', title: 'Finding a value and its source',
      how: 'Type `Rear axle ratio` in the search box, then click `Source & mapping details` under the row.',
      intro: 'One parameter, three cells in two PDFs. This is how the app knows where to write your new value back.',
      spots: [
        { id: 'search', label: 'Search box', what: 'Typing filters instantly.' },
        { id: 'label', label: '`Rear axle ratio` · `B4.6.2 · Transmission: / Final Drive …`', what: 'Label, the first clause it was found under, then the section headings it sits in (its "context").' },
        { id: 'tags', label: '`Table 3` `Table 7` `3 linked cells`', what: 'Printed in Tables 3 and 7, in three cells in total.', why: 'AL pointed out in the meeting that 4.56 appears in Table 7 and in Table 3 (B5.3 reduction ratio, B6.2 final drive). One edit here rewrites every linked cell, so the forms can\'t contradict each other.' },
        { id: 'details', label: '`Source & mapping details`', what: 'How the value was captured (mapping kind) and one link per occurrence: `T3 · page 3`, `T7 · page 1`. Alternative supplier columns (e.g. RSB / AVTEC) stay separate values; the app never merges them into one number.' },
        { id: 'links', label: 'Page link (e.g. `T3 · page 3`)', what: 'Opens the original source PDF at that page in a new tab: proof of where the number came from.' },
        { id: 'input', label: 'Value box', what: 'Type the new value. Long or multi-line values get a resizable text area. Values are trimmed of spaces at both ends.', who: 'eng' }
      ]
    },
    {
      id: 'changed', shot: 'req_field_changed', title: 'After changing 4.56 → 5.13',
      intro: 'You typed 5.13 and stopped. The app saved, re-checked all 92 tests, and redrew the impact panel.',
      spots: [
        { id: 'saved', label: '`All changes saved`', what: 'The save went through.' },
        { id: 'input', label: 'New value `5.13`', what: 'The row now has an orange left border (= changed).' },
        { id: 'was', label: '`Previously: 4.56`', what: 'The comparison vehicle\'s value. Type it back and the change disappears.' },
        { id: 'revision', label: '`Revision 2`', what: 'The save counter went up.' },
        { id: 'count', label: '`1 change` (or more)', what: 'Number of parameters that differ from the comparison vehicle.', code: 'Schedule-only values (Tables 8, 9, 10, 12…) are never counted as changes.' },
        { id: 'totals', label: 'Reusable / needing review', what: 'Still 0 / 88 on Bada Dost: there are no accepted reports to lose. On Demo N1 the same edit drops reusable tests from 3 to 1 (the two brake reports stop fitting).' },
        { id: 'systems', label: 'Affected systems', what: 'Up to six systems with `N changed test rows · N supported` and a `Covered` (green) or `Review` (amber) tag. **Click a system name** to jump to Tests & evidence filtered to it.' },
        { id: 'sysrow', label: 'e.g. `Braking · 7 changed test rows · 0 supported`', what: '7 braking rows use the axle ratio; 0 of them still have fitting evidence.' },
        { id: 'viewall', label: '`View all tests & evidence →`', what: 'Switches to the Tests & evidence tab.' }
      ],
      after: [
        '**Hidden consequence on Bada Dost (important for your demo):** changing the rear axle ratio automatically marks every captured **overall ratio** cell as `Calculation review`: **12 cells** on Bada Dost (1st–5th and reverse gear × the RSB and AVTEC supplier columns; e.g. 4th gear overall 4.56 = 1.0 × 4.56). Typing over them does **not** clear the flag. Each needs a reviewer `Calculation rule`, and `Record received homologation` is refused until all are calculated (*"Review and resolve dependent calculations before recording this exact approved configuration."*). The export\'s `01_Derived_value_review.pdf` lists them.',
        '**Data question for AL:** the captured `1st · Overall Ratio / RSB` is 21.53, but 4.62 × 4.56 = 21.07. Either the RSB final drive differs or there is a reduction factor. Ask AL which formula they use before you demo the calculation rule.'
      ],
      teach: 'Let AL type 5.13 themselves, then show the three places it lands (Table 3 twice, Table 7) in the exported PDF. That is the "type only the changed value, get every PDF back" moment they asked for.'
    },
    {
      id: 'calc', shot: 'req_calc_dialog', title: 'Add a controlled calculation (reviewer)',
      how: '`Edit specifications` → `Calculation rule` (top of the value list). Reviewer/admin only, and only on unlocked requests.',
      intro: 'Tells the app: "this value is always input 1 × input 2 (or input 1 − input 2), rounded like this". Only numeric values appear in the lists.',
      spots: [
        { id: 'target', label: '`Calculated target parameter`', what: 'The value that will be calculated (here `1st · Overall Ratio / RSB · 21.53`). It becomes read-only.' },
        { id: 'in1', label: '`First input parameter`', what: 'Here `1st · Gear Ratio / RSB · 4.62`.' },
        { id: 'op', label: '`Operation`', what: '`Multiply the two inputs` or `First input minus second input`. Nothing else (no division, no constants).' },
        { id: 'in2', label: '`Second input parameter`', what: 'Here `Rear axle ratio · 5.13`.' },
        { id: 'prec', label: '`Rounding precision`', what: '`Whole number`, `1 decimal place`, `2 decimal places` (default), `3 decimal places`.' },
        { id: 'note', label: '`Technical basis and reviewer rationale`', what: 'Why this formula is right (min. 10 characters): supplier formula, units, rounding.' },
        { id: 'ok', label: '`Accept rule & calculate →`', what: 'Saves the rule, recalculates immediately, and clears any recorded engineering decisions on this request (values changed).' }
      ],
      after: 'Rules can\'t chain: a target can\'t be an input of another rule (*"Chained formulas need controlled ordering…"*). A new rule for the same target replaces the old one. Rules are copied into requests created later from this vehicle once it is recorded.',
      teach: 'Frame it as AL\'s own question from the meeting: "values derived from 5.13 (overall gear ratios) may also need updating". The app refuses to guess the formula; a reviewer writes it once.'
    },
    {
      id: 'calc-result', shot: 'req_calc_result', title: 'A calculated value',
      intro: 'After the rule: 4.62 × 5.13 = 23.70.',
      spots: [
        { id: 'row', label: 'The target row', what: 'Now shows the calculated value.' },
        { id: 'tag', label: '`Calculated` (blue)', what: 'Kept in step automatically. `Calculation review` (blue) instead means an input is missing or changed and needs review.' },
        { id: 'input', label: 'Greyed value box', what: 'Read-only. Typing is refused (*"This value is calculated by an approved rule. Edit its inputs."*).' },
        { id: 'count', label: 'Change count', what: 'The calculated value is a change too (21.53 → 23.70), so it appears in Table 12 of the package.' }
      ]
    },
    {
      id: 'changes', shot: 'req_changes_only', title: '"Changes only"',
      intro: 'Tick `Changes only` to see exactly what this request changes, which is what will go into Table 12.',
      spots: [
        { id: 'changes', label: '`Changes only` ticked', what: 'Hides every unchanged value.' },
        { id: 'list', label: 'The changed rows', what: 'Each with `Previously: …`. This is the same list the package prints in the Table 12 continuation sheet (existing → proposed).' }
      ]
    },
    {
      id: 'history', shot: 'req_history', title: 'Configuration history',
      how: 'Request header → `History`.',
      intro: 'The family of the base vehicle: the base itself and every vehicle recorded from it, oldest first. It is **not** a log of edits on this request.',
      spots: [
        { id: 'item', label: 'A history item', what: 'Name · certificate (or `Certificate not recorded`) · route · date · tag: `Immutable evidence source` (recorded) or `Supplied / draft`.' },
        { id: 'hint', label: 'Grey hint', what: '*"Earlier approved options remain valid evidence sources. Parameter combinations are matched as recorded; values from different variants are never mixed to construct coverage."* A report must match one real tested vehicle; the app never stitches together values from two vehicles to make a match.' }
      ],
      teach: 'AL asked for "the whole history: base, extensions and families" with E/F numbering. This window plus the Vehicle library\'s `Approval history` is where that lives. Be honest that the app compares against the newest **extension**; it doesn\'t merge 4.56 and 5.13 into one base holding both values (AL\'s "base should have both" wish). Each approved variant is its own vehicle.'
    },
    {
      id: 'scope', shot: 'req_scope_dialog', title: 'Vehicle scope (the conditional facts)',
      how: 'Request header → `Vehicle scope` (or the same button on the PDF package tab).',
      intro: '28 yes / no / unknown questions plus two implementation facts. Each fact switches one or more conditional test rows. **Set it right after your edits, before studying Tests & evidence**, because it changes the list.',
      spots: [
        { id: 'first', label: 'A fact, e.g. `Transport vehicle`', what: 'Three choices for every fact:', options: ['`Unknown / review` (default): the rows it controls stay in `Edition review` ("Confirm …. Unknown fitment / scope is retained for review").', '`Yes / applies`: the rows apply.', '`No / does not apply`: the rows become `Not applicable` ("… is recorded as not applicable / not fitted. This is an engineering scope fact, not an agency exemption.").'], who: 'eng' },
        { id: 'abs', label: '`ABS fitted / applicable`', what: 'Example of a fitment fact. The full list: Transport vehicle · ABS · Temporary spare / run-flat · Windscreen · Cab-strength standard applies · Frontal-impact scope · Side-impact scope · Fog lamps · Additional driving lamps · Head restraints · Interior-fittings scope · Defrost/demist scope · Forward-vision scope · Gas-fuel retrofit · LNG · Hydrogen / fuel-cell · Flex-fuel · SCR fitted · External charging · Multi-stage / body-builder · Trailer coupling · Dangerous goods · Ambulance · Adapted vehicle · Other special-purpose conversion · Location-tracking / emergency button · Heavy / long marking · Heavy-category underrun.', code: 'Some heavy-vehicle facts default to "excluded" for N1 when left unknown (`default_for_n1: false` in the seed), e.g. heavy-category underrun.' },
        { id: 'date', label: '`Planned manufacture date`', what: 'When this version will start being built. Compared with published implementation dates: rows that only start later become `Not applicable` (not yet in force), and regulatory updates become `upcoming` or `effective`.' },
        { id: 'route', label: '`Model implementation route`', what: '`Unknown / review`, `New model`, `Existing model`. Many rules start earlier for new models.' },
        { id: 'note', label: '`Scope fact rationale / source`', what: 'Required (min. 10 characters): where the facts come from.', warn: 'Saving **clears every previous reviewer confirmation on conditional rows** and any engineering decisions on this request, so they must be re-confirmed. That\'s intentional: the facts behind them changed.' },
        { id: 'save', label: '`Save vehicle scope →`', what: 'Saves and recalculates. Toast: *"Vehicle scope saved. Conditional rows and evidence gates recalculated."*' }
      ],
      code: ''
    },
    {
      id: 'scope-filled', shot: 'req_scope_filled', title: 'Scope filled in (example)',
      intro: 'A practice request from the complete demo base: not a transport vehicle, ABS fitted, existing model, built from 1 Dec 2026.',
      spots: [
        { id: 'first', label: '`Transport vehicle` = No', what: 'Transport-vehicle-only rows become Not applicable.' },
        { id: 'abs', label: '`ABS` = Yes', what: 'The ABS braking row applies.' },
        { id: 'date', label: '`2026-12-01`', what: 'Used for the 2027 braking transition and any rule change\'s effective date.' },
        { id: 'route', label: '`Existing model`', what: 'Existing-model dates apply.' },
        { id: 'note', label: 'Rationale', what: 'Stored with the request and shown to reviewers.' }
      ],
      after: ['**What saving did here:** before, the request (copied from the complete demo base) had 75 reused and 17 not applicable. After saving these facts: 61 reused, 20 not applicable, 11 `Edition review`. Three more rows were excluded by the new facts, and the 11 conditional rows lost the base’s reviewer confirmations and must be confirmed again.', 'Scope facts are copied into the recorded vehicle at approval, so the next request from it starts with them filled in.']
    }
  ],
  explain: {
    simple: 'A request is a photocopy of a truck\'s whole file. You change the numbers that change, and the app writes them into every form where they appear and tells you, live, how many tests are affected.',
    precise: 'A request is a deep copy of the base vehicle\'s fields (each with its occurrences), sources, tables, rules, register and scope profile. Every PATCH bumps the revision (optimistic locking), clears engineering decisions, re-runs calculation rules and re-runs `assess()` over the 123-row seed (92 apply to an N1 diesel), comparing values with the comparison vehicle (`latest()` along extension children).',
    together: 'On Bada Dost, typing 5.13 once rewrites Table 3 B4.6.2, B4.6.4 and Table 7, flags the overall ratios for a formula, and moves 7 braking rows into review. That is the "type only the changed value" flow AL asked for, with the bookkeeping their spreadsheets do by hand.'
  },
  takeaways: ['The base choice is permanent; "Compare against" is your safety check.', 'One edit updates every linked cell; `Changes only` = the future Table 12.', 'Changing the axle ratio flags overall ratios; each needs a reviewer calculation rule before approval can be recorded.', 'Set Vehicle scope before reading the test list; saving scope clears conditional confirmations.'],
  say: '"The request is an immutable-base copy. We edit the delta, it propagates to every mapped occurrence, and derived values are blocked until a reviewer approves the formula, so nothing is silently recomputed."',
  tasks: ['Create `TEST – my axle change` from **Demo N1 · approved reference**, change Rear axle ratio to 5.13, and watch reusable tests go 3 → 1.', 'Open `Source & mapping details` on a Bada Dost value and open the PDF page link.', 'Tick `Changes only`, then untick it.', 'Open `Vehicle scope`, set ABS = No, save, and see which row becomes Not applicable.', 'As reviewer: add a calculation rule on a practice request and try to type over the calculated value.'],
  teach: ['Run this section live on **Demo N1** (fast) and show the Bada Dost version only for linked cells and the PDF. Demo N1 shows reuse dropping 3 → 1, which is the "aha".', 'Expect AL to ask "can I change the base later?" (No: create a new request) and "why didn\'t the overall ratios update?" (formula must be approved; show the calculation rule).'],
  quiz: [
    { q: 'You created a request on the wrong base. What do you do?', opts: ['Change the base in the header', 'Create a new request on the right base (admin can delete the wrong one)', 'Edit every value to match the right truck'], a: 1, why: 'The base is copied at creation and can never be changed.' },
    { q: 'You typed 5.13 and the header says `Unsaved changes`. You close the tab. What happens?', opts: ['Nothing is lost', 'The browser warns you first; if you leave anyway the edit is lost', 'It saves on close'], a: 1, why: 'The page asks before unloading while edits are pending.' },
    { q: 'After the axle change, why does `Record received homologation` fail on Bada Dost?', opts: ['Because braking needs a retest', 'Because overall-ratio cells are flagged for calculation review', 'Because Bada Dost is synthetic'], a: 1, why: 'Any field with a derived status other than `calculated` blocks recording.' },
    { q: 'Saving Vehicle scope also…', opts: ['Locks the request', 'Clears confirmations on conditional rows and any engineering decisions', 'Sends the request to review'], a: 1, why: 'The facts behind those confirmations changed, so they must be redone.' }
  ]
});
