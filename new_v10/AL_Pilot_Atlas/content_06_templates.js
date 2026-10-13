SECTIONS.push({
  id: 'templates', kicker: 'Section 6 · 15 min', title: 'AIS-007 templates',
  sub: 'The registry of blank forms, installing a newer reviewed form, and moving a request onto it.',
  lead: 'The app can only print a form it has the layout of, and it never invents one. This page shows which of the 59 AIS-007 table families it has, and lets a reviewer install a newer official version, which matters when a rule change adds a field (e.g. a horn sound level) that the old form doesn\'t have.',
  words: [['[[Template]]', 'a blank form layout with captured cell geometry.'], ['Reference captured', 'the app holds ARAI\'s complete 2014 public copy of this table.'], ['Reviewed installed form', 'a newer form a reviewer uploaded, with edition, source URL and review note.'], ['Upgrade', 'move one table of one editable request onto the newest installed form, keeping values.']],
  screens: [
    {
      id: 'list', shot: 'tpl_list', title: 'The template registry',
      intro: 'Four counters, an honesty note, and one row per table family.',
      spots: [
        { id: 'install', label: '`Install a reviewed form`', what: 'Upload a newer official form (next screen). Greyed for engineers.', who: 'rev' },
        { id: 's1', label: '`Registered table families` 59', what: 'Every table family the app knows (incl. other categories and special vehicles).' },
        { id: 's2', label: '`Public reference forms` 27', what: 'Families with ARAI\'s complete 2014 reference layout.' },
        { id: 's3', label: '`Reviewed installed forms`', what: 'How many families have a reviewer-installed newer form (0 on a fresh system).' },
        { id: 's4', label: '`Supplied AL forms` 7', what: 'A fixed label for the 7 Bada Dost PDFs (it doesn\'t count imports).' },
        { id: 'hint', label: 'Honesty note', what: 'ARAI\'s download page wasn\'t reachable during retrieval; the 2014 full publication and the amendment overview (amendments 1–12) are kept; later separate forms must be installed under control. *"their fields are not fabricated."*' },
        { id: 'row', label: 'A row: `TABLE` · `DESCRIPTION` · `INSTALLED EDITION` · `AVAILABILITY`', what: 'Table id, title, edition in use (+ fingerprint), and availability.' },
        { id: 'avail', label: '`Reference captured` (amber)', what: 'The 2014 layout is available. `Reviewed form` (green) = a newer installed form is in use.' },
        { id: 'missing', label: '`Source required`', what: 'No official copy in the app: the package lists it as missing.' }
      ],
      stats: ''
    },
    {
      id: 'install', shot: 'tpl_install_dialog', title: 'Install a reviewed AIS-007 form',
      intro: '*"Add a source version without replacing snapshots already used in requests."* Existing requests keep their current form until someone upgrades them.',
      spots: [
        { id: 'table', label: '`AIS-007 table`', what: 'Which family (default 4E). If the PDF says a different table number, the install is refused.' },
        { id: 'ed', label: '`Exact edition and amendments`', what: 'e.g. `AIS-007 Rev.5 Amd 14, Table 6` (min. 3).' },
        { id: 'url', label: '`Official source URL`', what: 'Must start with https:// (pre-filled with ARAI\'s AIS downloads page).' },
        { id: 'note', label: '`Template review note`', what: 'Clause numbering, applicability, amendment coverage, layout checked (min. 15).' },
        { id: 'file', label: '`Template PDF`', what: 'The blank official form.' },
        { id: 'ok', label: '`Install reviewed version →`', what: 'Captures the layout. *"Reviewed template version installed. Existing snapshots retained."*' }
      ]
    },
    { id: 'installed', shot: 'tpl_installed', title: 'After installing', intro: 'Practice install of the public 2014 Table 2 (just to learn the flow).', spots: [{ id: 's3', label: 'Counter now 1', what: '' }, { id: 'row', label: 'Table 2: `Reviewed form`', what: 'Edition = what you typed.' }] },
    { id: 'upgrade-btn', shot: 'tpl_upgrade_button', title: 'A request that can be upgraded', how: 'Open an editable request containing that table → `PDF package`.', intro: 'The Table 2 row shows the newer form.', spots: [{ id: 'row', label: '`Newer installed form: <edition>`', what: 'Blue tag; only on editable requests whose Table 2 source isn\'t the installed one.' }, { id: 'btn', label: '`Upgrade to installed edition`', what: 'Reviewer only.', who: 'rev' }] },
    { id: 'upgrade', shot: 'tpl_upgrade_dialog', title: 'Upgrade Table N to the installed edition', intro: 'The window states exactly what will happen.', spots: [{ id: 'list', label: 'The four rules', what: 'Same clause on both forms → value kept and printed. New clause → added empty (fill in Edit specifications). Clause not on the new form → value **kept** but marked `Not on new form` and no longer printed; only empty cells are removed. Base vehicle and approved configurations never change.' }, { id: 'note', label: '`Upgrade review note`', what: 'Why (min. 10).' }, { id: 'ok', label: '`Upgrade table →`', what: '10–15 s on a big truck.' }] },
    { id: 'upgrade-done', shot: 'tpl_upgrade_done', title: 'Upgrade result (nothing to carry)', intro: 'On the complete demo truck the result was *"Table 2 upgraded: 0 new fields added."*: its Table 2 was already on the 2014 layout, so every clause matched.', spots: [{ id: 'toast', label: 'Result message', what: 'Counts of added / kept-but-not-printed / removed.' }, { id: 'row', label: 'Table 2 row', what: 'Now on the installed edition; the blue tag is gone.' }] },
    { id: 'upgrade-bada', shot: 'v9_upgrade_done', title: 'Upgrade on Bada Dost (from the v5.1.2 tests)', intro: 'From the earlier v5.1.2 test run (new_v9 guide): upgrading Bada Dost\'s AL Table 2 to the public 2014 Table 2 gave *"Table 2 upgraded: 0 new fields added, 22 filled values kept but not on the new form (marked "Not on new form"), 4 empty cells removed."*', spots: [] },
    { id: 'not-on-form', shot: 'v9_not_on_new_form', title: 'The "Not on new Table 2 form" tag', intro: 'In `Edit specifications`, each carried-over value shows an amber `Not on new Table 2 form` tag: the value is still stored (and still compared), but it is no longer printed in the PDF.', spots: [] }
  ],
  explain: { simple: 'This is the shelf of blank forms. If the government publishes a new version of a form, a reviewer puts it on the shelf, and requests that need it are moved onto it without losing what was typed.', precise: 'Templates are versioned captures (geometry + clause map). Upgrading swaps the table\'s source in one request: same field id (same clause) keeps value and gets new occurrences; new ids are appended empty; old-only filled fields get `carried_over` and no occurrences; old-only empty fields are dropped.', together: 'When a rule change asks for "sound level" and Bada Dost\'s Table 6 has no such clause, the fix is: install the newer Table 6, upgrade the request, fill the new empty field. Never edit PDFs by hand.' },
  takeaways: ['The app never invents a form or a field.', 'Installing doesn\'t change existing requests; upgrading does, one table at a time.', 'Upgrade keeps every filled value.'],
  say: '"Form versions are controlled: installing a reviewed edition is non-destructive, and per-request upgrades preserve captured values by clause."',
  tasks: ['As reviewer, install `Table_2_2014.pdf` as a practice edition.', 'Upgrade Table 2 on a TEST request and read the message.'],
  quiz: [{ q: 'A rule change needs a field that doesn\'t exist on Bada Dost\'s form. Fix?', opts: ['Type it into the PDF', 'Install the newer reviewed form, upgrade the request\'s table, fill the new field', 'Ask the AI'], a: 1, why: 'That is the designed route (Step 17b.5 of the v9 guide).' }]
});
