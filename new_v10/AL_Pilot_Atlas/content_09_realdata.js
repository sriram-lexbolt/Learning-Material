SECTIONS.push({
  id: 'realdata', kicker: 'Section 9 · playbook', title: 'When AL\'s real files arrive',
  sub: 'The order to load real data so reuse works, and what to check at each step.',
  lead: 'No new screens: this is the order of operations, using everything above, for the day AL sends real certificates, reports, Table 12 and more PDFs. Do it on a practice copy first, then on the live site.',
  screens: [],
  body: [
    '<h2>Step by step</h2><ol>' +
    '<li><b>Accounts.</b> Create named AL accounts (engineers + at least one reviewer). {{go:settings/accounts|Settings → Manage accounts}}.</li>' +
    '<li><b>Decide the base.</b> Bada Dost i9 is already loaded as a supplied base from AL\'s 7 PDFs. If AL sends <b>newer or additional base PDFs</b> (e.g. Tables 8, 9, 10, 12), create a new base (`Add a base vehicle`) and `Import base tables` with all PDFs at once ({{go:vehicles/import|Section 4}}). You can also re-import into the supplied Bada Dost itself (any vehicle that isn\'t recorded shows `Import base tables`); each imported table **replaces** that table\'s values, so prefer a new base if you want to keep the original for comparison.</li>' +
    '<li><b>Check the capture.</b> Open the base, search key values (rear axle ratio, GVW, tyre size) and open `Source & mapping details` → page links to compare with the PDF. Look for red `Source conflict` tags (they block recording).</li>' +
    '<li><b>Record the existing approval.</b> Get the ARAI certificate number for exactly this configuration (8-digit base, or the latest E/F number) and, as reviewer, `Record existing homologation`. <b>Without this, none of AL\'s reports on this truck can be accepted.</b></li>' +
    '<li><b>History (E01, F01…).</b> The app has no "import history" button. Each earlier extension/family that AL wants as an evidence source must exist as a recorded vehicle: create a request from the base with the right route (`Extension` for E, `Additional family variant` for F), enter its changed values, and record its certificate. Extensions then become the comparison point automatically; families sit alongside.</li>' +
    '<li><b>Upload reports.</b> For each real test report: `Add a test report` on the vehicle that was actually tested, the matching test row, the agency reference, the <b>exact</b> edition text, `Passing result`, expiry or no expiry, the PDF ({{go:evidence/add|Section 5}}). One agency PDF covering several tests → upload once per test row.</li>' +
    '<li><b>Accept reports</b> (reviewer), checking coverage values against the report.</li>' +
    '<li><b>Confirm editions</b> on requests: use the same edition text as the reports. Mismatched text is the #1 reason reuse fails (see the ABS lesson in {{go:actions/confirm-error|Section 2b}}).</li>' +
    '<li><b>Calculation rules</b> for derived values AL uses (overall ratios). Ask AL for the formula first; note the 21.53 vs 21.07 discrepancy.</li>' +
    '<li><b>Now make the change</b> (e.g. 5.13) in a new request and watch which real reports survive.</li></ol>',
    '<div class="callout warn"><b class="k">What the app does not do (say it before AL asks)</b><ul><li>It doesn\'t read test results or limits out of report PDFs; coverage comes from the tested vehicle\'s values.</li><li>It doesn\'t keep "4.56 and 5.13 both on the base" (AL\'s wish): each approved variant is a separate recorded vehicle, and reuse searches all of them.</li><li>It doesn\'t issue certificates, send emails, or watch government websites.</li><li>Its test register is an N1 screening aid, not a certified legal matrix.</li><li>Table 12 is generated in the app\'s own continuation format; AL\'s Table 12 PDF hasn\'t been received yet.</li></ul></div>',
    '<div class="callout"><b class="k">Edition text: agree a convention with AL</b>Because editions are compared character by character, agree once how editions are written (e.g. `IS 11852 (Part 3):2019`, never `IS11852-3/2019`) and use it on every report and confirmation.</div>'
  ],
  takeaways: ['Record the base certificate before uploading reports.', 'Same edition text everywhere.', 'History = recorded vehicles, created through requests.'],
  say: '"Onboarding is: capture, verify, record the existing certificate, then attach each report to the tested configuration with a controlled edition string."'
});

window.PRACTICE = [
  '<h1>Your practice copy</h1>',
  'A full copy of the v5.1.2 server code runs on this laptop, with the Full Demo Seed and a **pretend AI** (answers start with "SIMULATED"; no paid key is used). Break anything; you can reset it.',
  '<h2>Start it</h2><ol><li>Double-click `D:\\mine\\jags\\server\\new_v10\\start_practice.cmd`.</li><li>Open <a href="http://127.0.0.1:8090">http://127.0.0.1:8090</a>.</li><li>Sign in: `admin@practice.local`, `reviewer@practice.local` or `engineer@practice.local`, password `Practice-Pass-2026`.</li></ol>',
  '<h2>Reset it to a clean state</h2>Stop the window (Ctrl+C), then double-click `reset_practice.cmd`. It restores `practice_data_clean_snapshot` (Bada Dost + Demo N1 + Full Demo Seed, no TEST items).',
  '<h2>Expect</h2><ul><li>Bada Dost requests take ~20 s per save on this laptop.</li><li>AI runs in seconds with placeholder text.</li><li>Everything else behaves exactly like the live site.</li></ul>',
  '<h2>Suggested missions</h2><ol><li>Reproduce Demo N1 reuse 3 → 1 with axle 5.13.</li><li>Record approval, upload and accept a brake report, add a CEA, reuse at 4.80.</li><li>Record + activate a horn rule change and take one request to resolved.</li><li>Do every task box in every section.</li></ol>'
].join('\n');

window.DEMO = [
  '<h1>Demo script: first AL pilot session (~60 min)</h1>',
  '<p>Goal: AL leaves able to run the "type the change → see tests → get all PDFs" flow themselves, and knows what to send us next. Keep it simple: they found the full UI overwhelming on 6 Oct. Show the **one path** first, details only on request.</p>',
  '<table class="t"><tr><th>Min</th><th>What you do</th><th>What you say</th></tr>' +
  '<tr><td>0–5</td><td>Dashboard; point at the left menu; counters at 0.</td><td>"Six areas; today we use three. The zeros are right: no real approvals or reports are in yet."</td></tr>' +
  '<tr><td>5–15</td><td>New request → base **Bada Dost** → type 5.13 in Rear axle ratio → show `3 linked cells`, `Previously 4.56`, impact panel.</td><td>"This is your flow: pick the base, type only what changes. It updates Table 3 twice and Table 7."</td></tr>' +
  '<tr><td>15–25</td><td>Export PDF package → open Table 7, Table 3 p3, Table 12 continuation, the derived-value page.</td><td>"All your PDFs back in your format. The overall ratios need your formula; tell us which one."</td></tr>' +
  '<tr><td>25–40</td><td>Switch to the demos: Demo 1 (all reused) → Demo 2 (proof from another variant) → Demo 3 (range) → Demo 4 (power change: review + retest).</td><td>"This is what Bada Dost will look like once your certificates and reports are loaded."</td></tr>' +
  '<tr><td>40–50</td><td>Let an AL engineer drive Demo N1: change axle ratio, see 3 → 1 reusable; open the braking Review window.</td><td>"A change doesn\'t mean a new test; a person decides with this evidence in front of them."</td></tr>' +
  '<tr><td>50–60</td><td>The ask list.</td><td>See below.</td></tr></table>',
  '<h2>What to ask AL for</h2><ol><li>The Bada Dost **certificate number(s)** with full history (base, E.., F..), and which values each one changed.</li><li>The **test reports** (PDF) with agency reference, edition and validity, per test.</li><li>Their **Table 12** format PDF and the other forms they promised (8, 9, 10…).</li><li>The **overall ratio formula** (21.53 vs 4.62 × 4.56 = 21.07).</li><li>Who will be reviewer(s); named users.</li><li>How they write editions (agree one convention).</li></ol>',
  '<h2>Likely questions and honest answers</h2><table class="t"><tr><th>AL asks</th><th>Answer</th></tr>' +
  '<tr><td>"Can it tell us if a test is needed?"</td><td>It sorts: reuse / review / missing inputs / unconfirmed edition / missing evidence. "Review" means an engineer decides with the evidence shown. It never says "retest" by itself.</td></tr>' +
  '<tr><td>"Why does Bada Dost show nothing reused?"</td><td>No real reports and no recorded certificate yet. That\'s the next step.</td></tr>' +
  '<tr><td>"Will the base keep both 4.56 and 5.13?"</td><td>Each approved variant is stored as its own locked vehicle with its certificate; reuse searches all of them. The base isn\'t overwritten.</td></tr>' +
  '<tr><td>"Does it compare with the latest extension?"</td><td>Yes. New requests compare against the newest recorded **extension** of the chosen base; families don\'t replace it.</td></tr>' +
  '<tr><td>"Can it watch for rule changes?"</td><td>No automatic monitoring; a person records the notification and a reviewer activates it. Then every affected truck is flagged.</td></tr>' +
  '<tr><td>"Is the AI deciding?"</td><td>No. It explains; the app rejects any AI answer that changes a status.</td></tr>' +
  '<tr><td>"It\'s slow on Bada Dost."</td><td>It re-checks all 92 tests against all reports on each save; on big trucks wait for "All changes saved".</td></tr></table>',
  '<h2>Don\'t say</h2><ul><li>"It approves" or "it tells you you\'ll pass".</li><li>"It covers all current law" (the coverage window says it doesn\'t).</li><li>"The demo reports are real".</li></ul>'
].join('\n');
