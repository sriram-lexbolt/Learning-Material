SECTIONS.push({
  id: 'package', kicker: 'Section 3 · 30 min', title: 'Validation requests (4): PDF package, submit, record, lock',
  sub: 'What the export contains, table selection, the hand-over, recording the approval, and what "locked" means.',
  lead: 'The output side of a request. The package is what AL asked for in the meeting ("finally take the template out and print it"). Recording homologation is how an approved change becomes the starting point for the next one.',
  words: [['[[PDF package]]', 'the ZIP: every selected form re-printed with your values, plus schedules and linked reports.'], ['Continuation sheet', 'an extra page the app generates for Tables 8, 9, 10 and 12, listing reports, CEA and changes.'], ['[[Recorded variant]]', 'the locked vehicle created by recording homologation.'], ['[[Extension]] / [[Family variant]]', 'E01… supersedes the parent; F01… sits alongside it.']],
  screens: [
    {
      id: 'tab', shot: 'req_package', title: 'The PDF package tab',
      how: 'Request page → `PDF package`.',
      intro: 'Left: which forms will be produced and from what source. Right: what the ZIP contains, and the approval box.',
      spots: [
        { id: 'scope', label: '`Vehicle scope`', what: 'Same window as in the header (scope decides applicability, which feeds the regulatory review in the package).' },
        { id: 'tables', label: '`Edit table selection`', what: 'Choose which AIS-007 tables are in the package (next screen).', who: 'eng' },
        { id: 'hint', label: 'Yellow note', what: '*"This is an engineering draft…"*: signatures, current amendments and agency acceptance are still needed. Missing sources are flagged in the manifest.' },
        { id: 'form', label: '`FORM` / `CONTENT`', what: 'Table number and title. Under the title: `Full source form retained` (the vehicle\'s own PDF re-printed with your values) or, for Tables 8/9/10/12, `Automatic identified continuation sheet included`.' },
        { id: 'status', label: '`SOURCE STATUS`', what: '`Available` (green, the vehicle has its own PDF) with its edition (e.g. `AL supplied Rev.01 / AIS-007 Rev.5`); `2014 reference` (amber, the public 2014 layout is used); `Source required` (red, no form at all: listed as missing, never invented). Plus `Newer installed form: …` and `Upgrade to installed edition` when a reviewer installed a newer form (Section 6).' },
        { id: 'sched', label: 'Table 8 row', what: 'The schedules (8 component reports, 9 vehicle reports, 10 CEA, 12 changes) get generated continuation sheets.' },
        { id: 'combined', label: '`Combined PDF`', what: 'One PDF of all forms and schedules (the dossier), no separate report files.', who: 'all' },
        { id: 'zip', label: '`Download complete package`', what: 'The full ZIP (same as `Export PDF package` in the header). Pending edits are saved first; takes a few seconds; file name `Ashok_Leyland_Pilot_<id>_R<revision>.zip`.', who: 'all' },
        { id: 'receive', label: '`What you will receive`', what: 'All applicable forms (unchanged ones too) · Table 8 component schedule · Table 9 vehicle/system reports with reuse reasons · Table 10 CEA parameters and justification · Table 12 parameter-by-parameter changes · linked report PDFs · regulatory amendments and actions · file hashes, revision warnings and assessment trace.' },
        { id: 'record', label: '`Record received homologation`', what: 'Under *Keep the approval trail intact*. Records the certificate the agency issued and locks the request.', who: 'rev', warn: 'Greyed for engineers and on locked requests.' }
      ]
    },
    {
      id: 'tables', shot: 'req_tables_dialog', title: 'Select applicable tables',
      intro: 'All 59 registered AIS-007 table families, each with `Reference / installed form` or `Source required`. Tick what belongs to this vehicle\'s package.',
      spots: [{ id: 'first', label: 'A table choice', what: 'Ticking a table with no vehicle PDF adds the 2014 reference layout (if one exists) as a source; a `Source required` table is listed in the manifest as missing.' }, { id: 'save', label: '`Save table selection →`', what: 'Saves (new revision). The count in the header (`11 selected tables`) changes.' }]
    },
    {
      id: 'contents', shot: 'pkg_cover', title: 'Inside the ZIP (real Bada Dost export)',
      intro: 'What came out of the Bada Dost 5.13 request. Files in the ZIP:',
      spots: [],
      after: [
        '<table class="t"><tr><th>File</th><th>What it is</th></tr><tr><td>`00_Dossier_cover.pdf`</td><td>Cover: request, base, revision, changes summary, draft warning (this picture).</td></tr><tr><td>`01_Derived_value_review.pdf`</td><td>Every derived value needing a formula (the 11 overall ratios still flagged).</td></tr><tr><td>`02_N1_Regulatory_Review.pdf`</td><td>Every test row with its status and reason.</td></tr><tr><td>`Table_2.pdf … Table_11.pdf`</td><td>Each AL form re-printed with the new values in the original layout.</td></tr><tr><td>`Table_8/9/10/12.pdf` + `_continuation.pdf`</td><td>Blank schedule form + generated continuation sheets (reports, reuse reasons, CEA, changes).</td></tr><tr><td>`Complete_AIS007_Dossier.pdf`</td><td>Everything above in one PDF (= `Combined PDF`).</td></tr><tr><td>`evidence/…pdf`</td><td>Linked report PDFs (none for Bada Dost today; 75 in the Demo 1 export).</td></tr><tr><td>`manifest.json`, `assessment.json`, `regulatory_assessment.json`</td><td>Fingerprints of every file and the full machine-readable assessment.</td></tr></table>',
        'Next screens show the pages where 5.13 landed.'
      ]
    },
    { id: 'pdf-t7', shot: 'pkg_table7', title: 'Table 7 in the package: 5.13 printed', intro: 'Table 7 (brief specifications) page 1, re-printed by the app in AL\'s own layout with the new rear axle ratio.', spots: [] },
    { id: 'pdf-t3', shot: 'pkg_table3_p3', title: 'Table 3 page 3: final drive and gear table', intro: 'Clause B4.6.2 / B4.6.4 now show 5.13, and the 1st-gear overall ratio (RSB) shows 23.70 from the calculation rule. The other overall ratios keep their old numbers until formulas are approved.', spots: [] },
    { id: 'pdf-t12', shot: 'pkg_table12', title: 'Table 12 continuation: the change list', intro: 'Generated by the app: clause / parameter · existing · proposed · tables / reason. Here: `Rear axle ratio 4.56 → 5.13` and `1st · Overall Ratio / RSB 21.53 → 23.70` (derived by rule). This is the "Table 12 is the format" AL mentioned; they still owe us their own Table 12 PDF to compare.', spots: [] },
    { id: 'pdf-derived', shot: 'pkg_derived', title: 'Derived value review page', intro: 'Lists each overall ratio still flagged ("Final-drive ratio changed. Source overall-ratio values need a reviewed formula; supplier-specific gear / reduction factors must be confirmed.").', spots: [] },
    {
      id: 'submit', shot: 'req_submit_dialog', title: 'Submit for engineering review',
      how: '`Tests & evidence` → `Submit for review →`.',
      intro: 'The engineer\'s hand-over to a reviewer.',
      spots: [{ id: 'note', label: '`Review note`', what: 'Min. 10 characters: changes, evidence gaps, proposed route.' }, { id: 'ok', label: '`Submit for review →`', what: 'Status becomes `In engineering review`.' }],
      after: 'Submitting doesn\'t lock anything, notify anyone or check completeness. The request stays editable by everyone. Tell the reviewer yourself; the app sends no emails.'
    },
    { id: 'inreview', shot: 'req_in_review', title: 'In engineering review', intro: 'The grey tag under the title changed.', spots: [{ id: 'meta', label: '`In engineering review`', what: 'Dashboard shows `In review` (blue). There is no "send back" button; the reviewer and engineer simply keep working on it.' }] },
    {
      id: 'record', shot: 'req_record_dialog', title: 'Record received homologation',
      how: '`PDF package` → `Record received homologation` (reviewer).',
      intro: '*"Record an approval already received from the agency. This action does not issue a certificate."*',
      spots: [
        { id: 'cert', label: '`Certificate / extension / family reference`', what: 'The real number, with E/F suffix, e.g. `12345678E01`. Min. 5 characters. Must be unique in the workspace (*"Certificate reference is already recorded…"*).' },
        { id: 'ref', label: '`Certificate document / controlled archive reference`', what: 'Where the signed certificate is kept (DMS path, archive number). Min. 10 characters.' },
        { id: 'note', label: '`Approval and configuration review note`', what: 'Confirm the scope and exact configuration approved. Min. 10 characters.' },
        { id: 'ok', label: '`Record & lock configuration →`', what: 'Creates a new **recorded vehicle** (copy of the request\'s values, sources, tables, rules, register and scope), marks the request `Homologation recorded`, and locks it.', warn: 'Refused while any value has a source conflict or a derived value isn\'t calculated, or if someone saved in between ("Request changed. Reload before recording approval.").' }
      ]
    },
    {
      id: 'locked', shot: 'req_locked', title: 'A recorded (locked) request',
      intro: 'After recording: green tag, greyed buttons, an orange explanation.',
      spots: [
        { id: 'pill', label: '`Homologation recorded`', what: 'Final state.' },
        { id: 'scope', label: 'Greyed `Vehicle scope`', what: 'Hover: *"Approved request is locked. Create a linked request."* Also greyed: `Confirm reviewed entries`, `Submit for review`, `Record received homologation`; value boxes are read-only; `Delete` is gone.' },
        { id: 'locked', label: '`This configuration is approved and locked.`', what: 'Its certificate covers exactly these values, so nothing may change here.' },
        { id: 'linked', label: '`Create linked request`', what: 'Opens the new-request window with the recorded vehicle pre-selected as base.', who: 'eng' },
        { id: 'record', label: 'Record button greyed', what: 'Can\'t record twice.' }
      ],
      after: 'Still available on a locked request: viewing, `History`, `AI overview`, `Export PDF package`.'
    },
    { id: 'linked', shot: 'req_linked_dialog', title: 'The next change starts here', intro: 'Base already set to the recorded vehicle (`… · Recorded`).', spots: [{ id: 'base', label: 'Pre-filled base', what: 'Because this was an **extension**, it is also the comparison point for any later request started from the original base.' }] },
    { id: 'variant', shot: 'veh_new_variant', title: 'The recorded variant in the Vehicle library', intro: 'The loop closes: base → change → package → approval → new base.', spots: [{ id: 'card', label: 'New vehicle card', what: '`Homologation recorded`, certificate `TEST-DEMO-001E01`, `Create variant →`. Its reports (once uploaded and accepted) become reusable evidence.' }] },
    { id: 'delete', shot: 'req_deleted_toast', title: 'Deleting a request (admin)', intro: 'Header `Delete` → browser confirm *"Permanently delete the request "…"? This cannot be undone. The activity log keeps a record."* → back to the list with a black message.', spots: [{ id: 'toast', label: '`Deleted request "…"`', what: 'Only unrecorded requests; cancel a running AI review first.' }] }
  ],
  explain: {
    simple: 'The package is the paperwork, printed for you. Recording the approval freezes the truck exactly as approved and turns it into the new starting point.',
    precise: 'The ZIP is generated from source-layout PDFs with values written into captured cell geometry, plus generated continuation schedules and a hash manifest. Recording creates an immutable vehicle object (parent = base, route = request route), sets the request to `approved` and blocks all mutations; `latest()` will follow it if the route is extension.',
    together: 'AL types 5.13 once, downloads the ZIP, and gets Tables 2–12 back in their own layout with 5.13 in three cells and a Table 12 change list. When ARAI issues 12345678E01, a reviewer records it and the next request starts from that E01 configuration.'
  },
  takeaways: ['Package = all forms in the vehicle\'s own layout + generated schedules + linked reports + fingerprints.', 'Submit is a label; Record is the lock.', 'Recording needs no conflicts and all derived values calculated.', 'Extensions supersede; families don\'t.'],
  say: '"The export is a traceable engineering draft: every form re-rendered in source layout, schedules generated, every file hashed in the manifest. Signatures and agency acceptance stay outside the tool."',
  tasks: ['Download the package of a Demo N1 request after changing a value and find your value in Table 7.', 'Open `01_Derived_value_review.pdf` from a Bada Dost export.', 'Record homologation on a `TEST –` Demo N1 request and use `Create linked request`.'],
  teach: 'This is where AL will lean in. Open the exported Table 7 and Table 12 side by side with their original PDF.',
  quiz: [
    { q: 'An engineer submitted a request. Can it still be edited?', opts: ['No, it is locked', 'Yes, only recording homologation locks it', 'Only by the reviewer'], a: 1, why: '`mutable()` only refuses approved requests.' },
    { q: 'Which route makes the new vehicle the comparison point for later requests?', opts: ['Family variant', 'Extension', 'Both'], a: 1, why: '`latest()` follows extension children only.' }
  ]
});
