SECTIONS.push({
  id: 'vehicles', kicker: 'Section 4 · 25 min', title: 'Vehicle library',
  sub: 'Vehicle cards and pages, approval history, adding a base, importing AIS-007 PDFs, recording an existing approval, deleting.',
  lead: 'Every truck the workspace knows: supplied bases, recorded variants, and demo vehicles. This is where AL\'s PDFs come in **once**, and where an approval that already exists on paper gets recorded so the truck\'s reports become reusable.',
  words: [['[[Supplied base]]', 'data from PDFs, no recorded approval.'], ['Recorded / homologated vehicle', 'has a certificate; locked; can supply evidence.'], ['Not homologated', 'a base you created or imported that has no approval yet (state "draft" in the code).'], ['Approval history', 'the family: the base and every vehicle recorded from it.']],
  body: ['<div class="callout"><b class="k">Vehicles in the practice copy</b><table class="t"><tr><th>Vehicle</th><th>State</th><th>Params / PDFs</th><th>Why it\'s there</th></tr><tr><td>Bada Dost i9 · supplied base</td><td>Supplied</td><td>3,221 / 7</td><td>AL\'s real PDFs (Tables 2, 3, 4E, 5, 6, 7, 11).</td></tr><tr><td>Demo N1 - complete technical base</td><td>Recorded `DEMO-NOT-REAL-BASE`</td><td>1,716 / 12</td><td>Full fictional truck with 75 accepted reports.</td></tr><tr><td>Demo N1 - recorded tyre variant</td><td>Recorded, **family** `…MATCHED_VARIANT`</td><td>1,716 / 12</td><td>Same truck, other tyres, its own 75 reports.</td></tr><tr><td>Demo - all 59 table families</td><td>Supplied</td><td>7,837 / 59</td><td>Reference specimen of every table family; never recorded.</td></tr><tr><td>Demo N1 · approved reference</td><td>Recorded `DEMO-BASE-001`</td><td>17 / 0</td><td>The app\'s tiny built-in demo with 3 reports.</td></tr></table></div>'],
  screens: [
    {
      id: 'library', shot: 'veh_library_seed', title: 'The Vehicle library',
      intro: 'One card per vehicle, oldest first. Grey hint: *"The seven AL PDFs belong to one Bada Dost base. Its certificate is not recorded. Synthetic demonstrations are kept separate from customer evidence."*',
      spots: [
        { id: 'add', label: '`Add a base vehicle`', what: 'Create a new empty base, then import its PDFs (screens 6–8).', who: 'eng' },
        { id: 'bada', label: 'Bada Dost card', what: '`Supplied / draft` (amber) · `Certificate not recorded` · *Specifications retained with their source references* · `N1 · diesel` · `3221 parameters` · `7 forms`.' },
        { id: 'full', label: 'Complete demo base', what: '`Synthetic demo` (blue) · certificate `DEMO-NOT-REAL-BASE` · *Isolated evidence-reuse scenario · not an AL approval*.' },
        { id: 'tyre', label: 'Tyre variant', what: 'Recorded as a **family** variant of the complete base.' },
        { id: 'lib', label: '59-table library', what: 'A specimen showing every form type; supplied, so never an evidence source.' },
        { id: 'demo', label: 'Demo N1 · approved reference', what: 'The 17-value demo used in the old guide.' }
      ],
      after: 'Each card: `View configuration` (open the page) and `Create variant →` (new request with this base pre-selected). Recorded vehicles from your own requests also appear here (e.g. `TEST – Demo N1 axle 5.13 (to approve)`).'
    },
    {
      id: 'bada', shot: 'veh_bada', title: 'A supplied vehicle page (Bada Dost)',
      how: 'Card → `View configuration`.',
      intro: 'Left: source configuration and the PDFs. Right: approval history.',
      spots: [
        { id: 'title', label: 'Name', what: 'Can\'t be renamed.' },
        { id: 'sub', label: '`N1 / diesel · 3221 captured parameters`', what: 'Category / fuel · how many values were captured from its PDFs (including empty cells).' },
        { id: 'import', label: '`Import base tables`', what: 'Only on vehicles that are not recorded. Re-importing a table **replaces** that table\'s values.', who: 'eng' },
        { id: 'create', label: '`Create validation request`', what: 'New request with this vehicle as base.', who: 'eng' },
        { id: 'pill', label: '`Certificate not recorded`', what: 'With the sentence *"Use this supplied configuration to create requests. Evidence cannot be reused until its homologation is recorded."*' },
        { id: 'keys', label: '`Certificate / extension` · `Last approved comparison`', what: 'The certificate (`Not recorded`) and which vehicle requests from here are compared against (newest recorded extension, or itself).' },
        { id: 'forms', label: '`Base PDF forms`', what: 'One line per source PDF.' },
        { id: 'form1', label: 'e.g. `Table 3 · Table 03_Ver.01.pdf`', what: 'Click the file name to open the original PDF. Grey line: edition (`AL supplied Rev.01 / AIS-007 Rev.5`) · page count · first 12 characters of its SHA-256 fingerprint.' },
        { id: 'recordbase', label: '`Record existing homologation`', what: 'Record an approval this truck **already has** on paper (screen 9). Reviewer only.', who: 'rev' },
        { id: 'history', label: '`Approval history`', what: 'Every member of the family, oldest first, with `Recorded` / `Supplied` tag, certificate, date and route, and `View →`.' },
        { id: 'hitem', label: 'History item', what: 'Here only Bada Dost itself.' }
      ],
      teach: 'The most important pilot step is on this page: once AL gives the real Bada Dost certificate number, a reviewer presses `Record existing homologation`. Only after that can AL\'s real test reports on Bada Dost be accepted and reused.'
    },
    { id: 'demo-full', shot: 'veh_demo_full', title: 'A recorded vehicle page (complete demo base)', intro: 'Recorded vehicles are locked: no Import button, no Record button. *"This configuration is locked. Create a request to propose a change."*', spots: [{ id: 'title', label: 'Name', what: '' }, { id: 'create', label: '`Create validation request`', what: 'The only way to change it.' }, { id: 'pill', label: '`Synthetic demo` / `Homologation recorded`', what: 'Demo vehicles show blue `Synthetic demo` even when recorded.' }, { id: 'keys', label: 'Certificate', what: '`DEMO-NOT-REAL-BASE`.' }, { id: 'forms', label: '12 source forms', what: 'Includes `SYNTHETIC demo data sheet - official source required` for tables with no official layout (4E, 27).' }, { id: 'history', label: 'Approval history', what: 'The base **and** the tyre variant (family): same family, so they share this list.' }] },
    { id: 'demo-tyre', shot: 'veh_demo_tyre', title: 'A family variant page', intro: 'The tyre variant. Its route is `family`, so it doesn\'t become the comparison point for requests started from the base, but its reports are still found by Demo 2.', spots: [{ id: 'keys', label: '`Last approved comparison`', what: 'Itself.' }, { id: 'history', label: 'Approval history', what: 'Same family list.' }] },
    { id: 'library59', shot: 'veh_demo_library', title: 'The 59-table reference library', intro: 'Every registered AIS-007 table family filled with demo data: 27 on official 2014 reference layouts and 32 as clearly labelled demo data sheets where no official template exists. Useful to show AL what each table looks like; it is supplied (never recorded), so it can\'t lend evidence.', spots: [{ id: 'forms', label: '59 forms', what: 'Scroll the list.' }, { id: 'import', label: '`Import base tables`', what: 'Available because it isn\'t recorded.' }] },
    {
      id: 'add', shot: 'veh_add_dialog', title: 'Add a base vehicle',
      how: '`Vehicle library` → `Add a base vehicle`.',
      intro: '*"Import the base specifications once. All future variants inherit this configuration."*',
      spots: [
        { id: 'name', label: '`Vehicle name`', what: 'e.g. `Bada Dost i9 – base (real)`.' },
        { id: 'cat', label: '`Vehicle category`', what: 'N1, N2, N3, M1, M2, M3, L1, L2, L5, L7, O, Tractor, CEV. Decides the default forms. The test register is verified for **N1 only**; other categories show a warning and rows need a category-specific matrix.' },
        { id: 'pt', label: '`Powertrain`', what: 'DIESEL, PETROL, CNG, LPG, BEV, HEV. Decides forms (4E for N1/M1 combustion, 13 for electric, 20 CNG, 21 LPG…) and which tests apply (electric-only, spark-ignition-only…).' },
        { id: 'ok', label: '`Create base vehicle →`', what: 'Creates the vehicle with the **blank 2014 reference forms** for its category and fuel, then opens it.' }
      ]
    },
    { id: 'new', shot: 'veh_new_page', title: 'A new, empty base', intro: 'Before import: thousands of captured parameters, all empty. They are the empty boxes of the blank 2014 forms.', spots: [{ id: 'sub', label: 'Parameter count', what: 'Blank template cells.' }, { id: 'delete', label: '`Delete vehicle`', what: 'Admin, only for vehicles that are not supplied/recorded and not used by any request, vehicle or report (it lists what to delete first).', who: 'adm' }, { id: 'import', label: '`Import base tables`', what: 'Next screen.' }, { id: 'forms', label: 'Forms', what: '`2014 reference` sources.' }, { id: 'recordbase', label: '`Record existing homologation`', what: 'Possible but pointless before import.' }] },
    {
      id: 'import', shot: 'veh_import_dialog', title: 'Import base AIS-007 PDFs',
      intro: 'Select all the vehicle\'s table PDFs at once (here AL\'s 7 files).',
      spots: [{ id: 'files', label: '`Base AIS-007 PDFs`', what: 'Multiple PDFs, each ≤ 25 MB and ≤ 200 pages. The table number is read from each PDF; an unknown table is refused (*"AIS-007 table number could not be identified. Install a controlled form first."*).' }, { id: 'ok', label: '`Import selected tables →`', what: 'Imports one file at a time (10–20 s for 7 files). Done when the black message says `Base tables captured for … Source references retained.`' }],
      after: 'Each imported table **replaces** the same table (blank template or older import); tables not supplied stay as blank templates. Imported sources are labelled `Uploaded base specification · review required`.'
    },
    { id: 'imported', shot: 'veh_imported', title: 'After importing AL\'s 7 PDFs', intro: 'The imported copy now holds 3,898 parameters across 10 forms (7 AL PDFs + blank Tables 8, 9, 10). Compare: the seeded Bada Dost has 3,221 (no blank schedule forms).', spots: [{ id: 'sub', label: 'Parameter count', what: '' }, { id: 'forms', label: 'Forms list', what: 'AL files with `Uploaded base specification · review required`.' }, { id: 'recordbase', label: '`Record existing homologation`', what: 'Now meaningful.' }] },
    { id: 'record', shot: 'veh_record_dialog', title: 'Record existing homologation (on a base)', intro: 'Same window as on a request, but it marks **this vehicle** as recorded instead of creating a new one.', spots: [{ id: 'cert', label: 'Certificate', what: 'The real ARAI number, e.g. the 8-digit base `12345678`, or the latest `…E03` / `…F02` that this exact data represents.' }, { id: 'ok', label: '`Record & lock configuration →`', what: 'Refused if there are no values or any source conflict.' }], warn: '' },
    { id: 'recorded', shot: 'veh_recorded', title: 'The base after recording', intro: 'Green `Homologation recorded`, certificate shown, Import button gone, locked. From now on, accepted reports on this vehicle can be reused.', spots: [{ id: 'pill', label: 'Recorded', what: '' }, { id: 'keys', label: 'Certificate', what: '`TEST-12345678`.' }, { id: 'history', label: 'History', what: 'Shows it as `Recorded`.' }] },
    { id: 'delete', shot: 'veh_delete_button', title: 'Delete vehicle (admin)', intro: 'Red `Delete vehicle` → browser confirm → *"Deleted vehicle "…""*. Refused with *"Delete what uses this vehicle first: …"* when anything depends on it.', spots: [{ id: 'delete', label: '`Delete vehicle`', what: 'Admin; not for supplied or recorded vehicles.', who: 'adm' }] }
  ],
  explain: {
    simple: 'The library is the garage. A truck comes in once from its PDFs. If it is already approved on paper, a reviewer writes the certificate number down, and from then on it is locked and its test reports can be used for other trucks.',
    precise: 'Vehicles: `supplied` (seeded AL), `draft` (created/imported), `homologated` (recorded). Import extracts each PDF, identifies its table, replaces that table\'s occurrences and merges parameters. Record-base sets state homologated in place; record-request creates a child vehicle.',
    together: 'For the pilot: import the real Bada Dost (already done as the supplied base), get the actual certificate from AL, record it, then upload the real reports. That one recording step is what turns "0 reusable" into real reuse.'
  },
  takeaways: ['Reports on a vehicle without recorded homologation can never be accepted.', 'Import once; re-import replaces a table.', 'Recorded = locked; change it through a request.', 'Family and extension variants share one approval history.'],
  say: '"Evidence eligibility hinges on the source vehicle\'s recorded homologation, so step one of onboarding is recording AL\'s existing certificate on the base."',
  tasks: ['Open each demo vehicle and compare their Approval history.', 'Add `TEST – my import`, import the 7 AL PDFs, note the parameter count.', 'As reviewer, record a fake certificate on it, then try `Import base tables` again (gone).', 'As admin, delete a fresh empty test vehicle.'],
  quiz: [
    { q: 'Why can\'t AL\'s reports on the supplied Bada Dost be accepted today?', opts: ['They are synthetic', 'The vehicle has no recorded homologation', 'The PDFs are too big'], a: 1, why: '`Record source-vehicle homologation before accepting its reusable evidence.`' },
    { q: 'You re-import Table 7 on an imported base. What happens to its old Table 7 values?', opts: ['Kept alongside', 'Replaced by the new file\'s values', 'Merged by the AI'], a: 1, why: 'Import replaces that table\'s source and occurrences.' }
  ]
});
