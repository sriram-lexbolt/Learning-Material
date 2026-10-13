const DETAIL_SPOTS = (x = {}) => [
  { id: 'status', label: 'Status tag', what: x.status || '`provided` (amber), `approved` (green), `rejected` (amber) or `withdrawn` (red).' },
  { id: 'scope', label: 'Scope sentence', what: 'What was tested, as typed by the uploader.' },
  { id: 'keys', label: '`Test edition` · `Result / validity`', what: 'Edition text (compared character by character) · `pass` / `fail` / `unknown` · `No expiry stated` or the valid-until date.' },
  { id: 'coverage', label: '`Recorded coverage`', what: 'Every mapped parameter of the tested vehicle, frozen at upload: `parameter_id` and value (e.g. `rear_axle_ratio` `scalar:5.13`; "scalar" = a single number, "text:" = words). This is what a new request must match.' },
  { id: 'cea', label: '`Accepted CEA`', what: 'Only after a CEA is recorded: the worst-case basis and the source.' },
  { id: 'open', label: '`Open report PDF ↗`', what: 'Opens the stored file. If the file\'s fingerprint no longer matches, the app refuses ("Report file is missing or its hash changed.").' },
  { id: 'review', label: '`Accept / reject report` (or `Withdraw / review` when approved)', what: 'Opens `Review report coverage`.', who: 'rev' },
  { id: 'ceabtn', label: '`Record CEA coverage`', what: 'Only on approved reports.', who: 'rev' },
  { id: 'delete', label: '`Delete report`', what: 'Only on reports that are not approved (withdraw first).', who: 'adm' }
];

SECTIONS.push({
  id: 'evidence', kicker: 'Section 5 · 35 min', title: 'Evidence library',
  sub: 'Every test report: list, details, adding, accepting, rejecting, withdrawing, CEA ranges, duplicates and deleting.',
  lead: 'Test reports are attached **once** to the exact vehicle that was tested and to **one** test row. A reviewer must accept them. From then on, any request whose test-relevant values match is linked to them automatically. This section walks the whole life of a report on the practice copy.',
  words: [['[[Coverage]]', 'the tested vehicle\'s mapped values, frozen into the report at upload.'], ['[[provided]] → [[approved]]', 'uploaded → accepted by a reviewer; only approved reports are reused.'], ['[[CEA]]', 'a min–max range per numeric parameter, with a source and a worst-case basis.'], ['[[SHA-256]]', 'the file fingerprint, re-checked at every assessment.']],
  body: ['<div data-widget="reuse"></div>', '<div class="callout"><b class="k">The life of a report</b><div class="flow"><span>Engineer: `Add a test report` → <b>provided</b></span>→<span>Reviewer: `Accept` → <b>approved</b> (or `Reject` → <b>rejected</b>)</span>→<span>optional: reviewer `Record CEA coverage`</span>→<span>auto-linked in every matching request</span>→<span>optional: `Withdraw` → <b>withdrawn</b> (reuse stops everywhere)</span></div></div>'],
  screens: [
    {
      id: 'list', shot: 'ev_list', title: 'The Evidence library list',
      intro: 'Newest report first (since 5.1.1). 153 reports in the practice copy: 3 from the small Demo N1, 150 from the Full Demo Seed.',
      spots: [
        { id: 'add', label: '`Add a test report`', what: 'Upload a report (screen 3).', who: 'eng' },
        { id: 'hint', label: 'Grey hint', what: '*"Reports are matched by the complete test-relevant parameter set, edition, category and validity. Withdrawn, failed or synthetic-only evidence cannot support a customer vehicle."*' },
        { id: 'ref', label: '`REPORT REFERENCE`', what: 'The report number + `Synthetic fixture ·` for demo reports + `File SHA` (first 12 characters).' },
        { id: 'src', label: '`SOURCE CONFIGURATION`', what: 'The tested vehicle + `N captured coverage parameters`.' },
        { id: 'test', label: '`TEST / EDITION`', what: 'The test row and the edition text.' },
        { id: 'added', label: '`ADDED`', what: 'Upload date.' },
        { id: 'status', label: '`STATUS`', what: '`provided`, `approved`, `rejected`, `withdrawn`.' },
        { id: 'details', label: '`Details →`', what: 'Opens the report window.' }
      ],
      after: 'There is no search or filter on this page. Use the browser\'s find (Ctrl+F) for a reference.'
    },
    { id: 'details-seed', shot: 'ev_details_seed_cea', title: 'Report details (a seeded report with a CEA)', intro: '`DEMO-BASE-EMC-EMISSIONS`, an accepted demo report that also carries a demo CEA range (used by the Demo 3 scenario).', spots: DETAIL_SPOTS() },
    {
      id: 'add', shot: 'ev_add_dialog_empty', title: 'Add a test report: every field',
      intro: '*"Attach once to the exact tested vehicle configuration. A reviewer must accept its coverage."*',
      spots: [
        { id: 'veh', label: '`Tested vehicle configuration`', what: 'Starts empty: `Choose the vehicle that was actually tested…`. Recorded vehicles are listed first. **The report\'s coverage is copied from this vehicle\'s current values.** It can\'t be changed later.', warn: 'Pick the vehicle that was physically tested. A report on a supplied / not-homologated vehicle can be uploaded but never accepted.' },
        { id: 'hint', label: 'Small hint', what: '*"Only reports on a vehicle with recorded homologation can be accepted for reuse."*' },
        { id: 'test', label: '`Official test / screening work item`', what: 'All 123 India rows as `standard · title` (e.g. `CMVR 96; applicable IS 11852 / IS 15986 route · Service braking performance`). One report = one row. If one agency PDF covers several tests, upload it once per test.' },
        { id: 'ref', label: '`Report reference`', what: 'The agency\'s report number (3–180 characters). The same reference can\'t be added twice for the same test while the first is provided or approved (capitals ignored).' },
        { id: 'ed', label: '`Test edition / notified register reference`', what: 'The edition the test was done under, exactly as it must be confirmed on requests (3–180 characters). Spaces at both ends are trimmed.' },
        { id: 'scope', label: '`Tested configuration and scope`', what: 'Variants, suppliers, applicability (10–4,000 characters).' },
        { id: 'result', label: '`Report result`', what: '`Result needs review` (default), `Passing result`, `Failed result`.', warn: 'Leave it on "Result needs review" and the reviewer **can\'t accept** it (*"A passing result and complete test parameters are required…"*). Choose `Passing result` for a pass.' },
        { id: 'valid', label: '`Valid until`', what: 'Expiry date if the report states one. Expired reports stop being reused automatically.' },
        { id: 'noexp', label: '`No expiry is stated in this report`', what: 'Tick if there is no end date. Exactly one of the two is required.' },
        { id: 'file', label: '`Test report PDF`', what: 'Readable, unencrypted PDF, 1–200 pages, ≤ 25 MB.' },
        { id: 'ok', label: '`Add report for review →`', what: 'Stores it as `provided`. Message: *"Report added for reviewer acceptance."*' }
      ]
    },
    { id: 'add-filled', shot: 'ev_add_dialog_filled', title: 'Filled in: TEST-BRAKE-01', intro: 'Service braking report for the recorded practice vehicle `TEST – Demo N1 axle 5.13 (to approve)` (axle 5.13), edition `SYNTHETIC functional register 1`, passing, no expiry.', spots: [{ id: 'veh', label: 'Recorded practice vehicle', what: 'Created by recording homologation in Section 3.' }, { id: 'result', label: '`Passing result`', what: '' }, { id: 'ok', label: 'Add', what: '' }] },
    { id: 'provided', shot: 'ev_provided', title: 'New report: provided', intro: 'Top of the list, status `provided`. Not reused anywhere yet.', spots: [{ id: 'row', label: 'The new row', what: '' }, { id: 'status', label: '`provided`', what: 'Waiting for a reviewer.' }] },
    { id: 'details-provided', shot: 'ev_details_provided', title: 'Details of a provided report', intro: '*"Review has not been recorded."* The coverage list shows `rear_axle_ratio scalar:5.13` among the mapped values.', spots: DETAIL_SPOTS({ status: '`provided`.' }) },
    {
      id: 'review', shot: 'ev_review_dialog', title: 'Review report coverage (accept / reject / withdraw)',
      intro: 'The subtitle names the report, the vehicle and the date added, so you always know which report you\'re judging.',
      spots: [
        { id: 'sub', label: 'Subtitle', what: '`TEST-BRAKE-01 · <vehicle> · added <date>`.' },
        { id: 'action', label: '`Review action`', what: 'Three choices:', options: ['`Accept passing report and full configuration coverage` → approved.', '`Withdraw accepted evidence` → withdrawn (for an approved report).', '`Reject report / coverage` → rejected.'] },
        { id: 'note', label: '`Coverage review rationale`', what: 'What you checked: file, values, edition, variants, supplier scope, validity (min. 10 characters).' },
        { id: 'reconfirm', label: '`I checked the report against the complete current parameter mapping…`', what: 'Needed only when the app\'s mapping changed since upload, or the vehicle\'s mapped values differ from the recorded coverage. Ticking re-captures coverage from the vehicle **and clears old CEA ranges**. Without it you get *"The parameter mapping changed. Reconfirm complete report coverage…"*.' },
        { id: 'ok', label: '`Record evidence review →`', what: 'Saves. *"Evidence review recorded. Reuse is recalculated on the next assessment."*' }
      ],
      after: 'Accepting is refused when: the vehicle has no recorded homologation, the result isn\'t pass, or the vehicle has missing inputs for this test.'
    },
    { id: 'approved', shot: 'ev_details_approved', title: 'Approved report', intro: 'Green `approved`, the review note shown, and the reviewer buttons now say `Withdraw / review` and `Record CEA coverage`. No `Delete` (approved reports can\'t be deleted).', spots: DETAIL_SPOTS({ status: '`approved`.' }) },
    { id: 'withdraw', shot: 'ev_withdraw_dialog', title: 'Withdraw / review an approved report', intro: 'Same window; the action defaults to `Withdraw accepted evidence`.', spots: [{ id: 'action', label: 'Default: withdraw', what: 'Withdrawing stops reuse everywhere at the next assessment and marks cached AI overviews out of date. Use it when a report turns out wrong, expired or superseded.' }] },
    { id: 'duplicate', shot: 'ev_duplicate_error', title: 'Duplicate reference refused', intro: 'Adding `test-brake-01` again for the same test.', spots: [{ id: 'error', label: 'Red message', what: '*"Report test-brake-01 is already recorded for this test (… status approved). Reject or withdraw that report first, or use the report\'s own distinct reference."* Rejected/withdrawn reports don\'t block a new one, so correcting mistakes still works.' }] },
    {
      id: 'cea', shot: 'ev_cea_dialog', title: 'Record accepted CEA coverage',
      how: 'Approved report → `Details` → `Record CEA coverage`.',
      intro: '*"Use only ranges justified by the applicable standard and agency-accepted criteria."*',
      spots: [
        { id: 'limits', label: '`Parameter limits (JSON object)`', what: 'Per parameter id: `{"rear_axle_ratio": {"min": 4.5, "max": 5.2}}`. Only parameters in the report\'s coverage, only finite numbers, min ≤ max. Get the ids from the `Recorded coverage` list.', warn: 'JSON must be exact: double quotes, no trailing comma. A typo makes the form fail.' },
        { id: 'ed', label: '`CEA edition`', what: 'Pre-filled with the report\'s edition and must equal it.' },
        { id: 'src', label: '`Official clause / accepted CEA document reference`', what: 'Where the range comes from (min. 10 characters).' },
        { id: 'basis', label: '`Worst-case justification / extension logic`', what: 'Why the tested setup covers the range (min. 15 characters).' },
        { id: 'note', label: '`Reviewer note`', what: 'Min. 10 characters.' },
        { id: 'ok', label: '`Accept controlled CEA coverage →`', what: 'Saves. Replaces any earlier ranges on this report.' }
      ]
    },
    { id: 'cea-details', shot: 'ev_details_cea', title: 'Report with an accepted CEA', intro: 'An `Accepted CEA` block appears with the basis and the source.', spots: DETAIL_SPOTS() },
    { id: 'cea-reuse', shot: 'ev_cea_reuse_row', title: 'The CEA in action', intro: 'A new request from the original Demo N1 with axle ratio **4.80**. Service braking shows `Evidence reused` with `TEST-BRAKE-01` linked: 4.80 is inside 4.5–5.2. (Review window: {{go:tests/cea|Section 2, CEA screen}}.)', spots: [{ id: 'row', label: 'Service braking row', what: '`Evidence reused`, reason "inside a reviewer-accepted CEA range".' }, { id: 'pill', label: 'Linked report', what: '`TEST-BRAKE-01 · TEST – Demo N1 axle 5.13 (to approve)`.' }] },
    { id: 'accept-error', shot: 'ev_accept_error', title: 'Accepting a report on the wrong vehicle', intro: 'A horn report was attached to the supplied Bada Dost by mistake.', spots: [{ id: 'error', label: 'Red message', what: '`Record source-vehicle homologation before accepting its reusable evidence.` Fix: reject it ("wrong vehicle") and add it again on the right vehicle, or record the vehicle\'s homologation first if it really is the tested one.' }] },
    { id: 'rejected', shot: 'ev_rejected', title: 'Rejected', intro: 'Status `rejected`. It no longer blocks the same reference.', spots: [{ id: 'status', label: '`rejected`', what: '' }] },
    { id: 'rejected-details', shot: 'ev_details_rejected', title: 'Delete a non-approved report (admin)', intro: '`Delete report` → browser confirm → *"Deleted report "TEST-HORN-WRONG""*. The file is removed; the activity log keeps a record.', spots: DETAIL_SPOTS({ status: '`rejected`.' }) }
  ],
  explain: {
    simple: 'A report is proof for one test on one exact truck. Once a senior engineer accepts it, any future truck that is identical in everything that test cares about gets that proof for free, and a CEA range lets "nearly identical" count too.',
    precise: 'At upload, `covered_parameters` = the vehicle\'s mapped values for that test (rule version pilot-test-coverage-4.0). Accept requires a homologated source, pass, and no input gaps; it re-captures coverage if the mapping changed (with reconfirm). Reuse checks equality per parameter or `min ≤ float(value) ≤ max` for accepted CEA bounds with matching edition.',
    together: 'We uploaded TEST-BRAKE-01 on the recorded 5.13 vehicle, accepted it, added a 4.5–5.2 CEA, and a fresh 4.80 request reused it immediately, while the old 4.56 demo report stayed "Not eligible". That is the whole evidence economy of the app in four clicks.'
  },
  takeaways: ['Attach to the vehicle actually tested; coverage is copied from it at upload.', 'Choose `Passing result`, or the report can\'t be accepted.', 'Only reports on recorded vehicles can be accepted.', 'CEA = JSON ranges + source + worst-case basis, same edition.'],
  say: '"Reports carry a frozen coverage snapshot of the tested configuration; reuse is an exact match on that snapshot or inside a reviewer-accepted CEA envelope, under the same confirmed edition."',
  tasks: ['Upload a report on `Demo N1 · approved reference` for the horn test with result "Result needs review", try to accept it, read the error, reject it.', 'Accept a correct one, add a CEA, and prove reuse with a new request.', 'Withdraw it and watch the request row lose its link.'],
  teach: 'For AL, the key message: "Upload each real report once. The app finds it for every future variant that matches." Then show Demo 2 (cross-vehicle) as proof.',
  quiz: [
    { q: 'Coverage of a report comes from…', opts: ['The PDF text', 'The tested vehicle\'s values at upload', 'The AI'], a: 1, why: 'The app doesn\'t read numbers out of the report PDF; it copies the vehicle\'s mapped values.' },
    { q: 'A CEA edition must equal…', opts: ['The current year', 'The report\'s edition (and the request\'s confirmed edition for reuse)', 'Anything'], a: 1, why: 'Both checks exist in the code.' }
  ]
});
