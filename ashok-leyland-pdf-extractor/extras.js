/* Page atlas, Defense room, Cheat sheet, and the Code reader's notes. */
(function () {
const SX = window.SX;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const J = () => window.SXJ;
const ORDER = ['smp', 't02', 't03', 't4e', 't05', 't07', 't06', 't11'].filter(d => !SX.withheld || (SX.available || []).some(id => id.startsWith(d + '-')));
const pid = (d, n) => `${d}-${String(n).padStart(2, '0')}`;

/* ======================= Code reader notes ======================= */
window.CODE_NOTES = {
  engine: [
    {id: 'regexes', find: 'CODE = re.compile', title: 'Two regexes: field codes and references', note: 'CODE recognises printed clause ids such as A1.6, "D 22.14.4 I." or 1.2.1. It needs at least one ".number", so plain numbers like 2026 are not codes. REFERENCE finds "Refer Annexure T7 – C", "Enclosure 4K" and so on; since v1.1 the identifier must contain a digit or be a single capital letter. Try CODE in {{lab:regex}}.'},
    {id: 'clean', find: 'def clean(value', title: 'clean(): trim each line, keep the line breaks', note: 'Multi-line cells keep their "\\n". Only leading/trailing spaces per line go. That is why values like "Diesel\\n(Maximum 7% bio-diesel blend)" survive exactly.'},
    {id: 'field_code', find: 'def field_code(text', title: 'field_code(): normalise a printed code', note: 'fullmatch on the cleaned text, then remove all whitespace and trailing dots: "B 2.3.4" → "B2.3.4", "1.2.1." → "1.2.1". Returns None for anything else. Pinned by test_normalize_printed_clause_ids.'},
    {id: 'table_data', find: 'def _table_data(table', title: '_table_data(): one pdfplumber table → JSON', note: 'Keeps two views: rows (the grid, None where a merged neighbour covers the position) and cells (one entry per real cell with row_span / column_span from counting grid lines inside its box). See {{st:cells}}.'},
    {id: 'active', find: 'def _active_cells(table', title: '_active_cells(): which cells cross this row?', note: 'Takes the top of the row\'s own cells + 0.05 pt and keeps every cell whose box spans that line, left to right. This is how merged values reach every row they cover. See {{st:owners}} and {{lab:merge}}.'},
    {id: 'footer', find: 'def _is_footer(cells', title: '_is_footer() / _is_title()', note: 'Footer = ("manufacturer:" or "document no") plus ("test agency" or "signature, name"). v1.1 added "document no" because Table 07 prints "Manufacturer:" outside its signature box. Title = "Table N of AIS". Both are plain text tests.'},
    {id: 'value', find: 'def _value(cell', title: '_value(): one value with provenance', note: 'text verbatim, column/row labels, page, bbox, inherited_from_merged_cell (owner row ≠ this row) and source_cell (table id, row, column). Every value in the output is made here.'},
    {id: 'interpret', find: 'def _interpret_table(table', title: '_interpret_table(): rows → records', note: 'The heart of the engine. 1) active cells per row, 2) footer table? skip it, 3) find code rows, 4) vote value_x, 5) walk rows: footer → stop, title/empty → skip, no own code → continuation, else record.'},
    {id: 'valuex', find: 'boundaries = []', title: 'The value_x vote', note: 'Right edge of the description on each code row is one vote; Counter.most_common picks the boundary. A mode, not a mean, so a few odd rows can\'t move it. See {{st:boundary}} and {{lab:boundary}}.'},
    {id: 'continuation', find: 'if coded and (not code_cell or code_cell["row"] != row_index):', title: 'Continuation rows', note: 'In a coded table, a row whose first non-empty cell is not its own code belongs to the previous record. Its own cell texts go to continuation_rows. If the code cell is merged from above and the description box is shared, the row\'s values are added with a row label (CC / FSD / HSD).'},
    {id: 'spacers', find: 'def _is_spacer(cell', title: '_is_spacer(): thin slivers (v1.1)', note: 'A cell is a sliver if it is 6 pt wide or less, or empty and narrower than 12 pt. v1.0 only had the 6 pt rule, so a 7 pt empty sliver became a fake blank answer in Table 06 E28.4 and E29.4. Real blank answers are 70+ pt wide and stay. See {{st:records}}.'},
    {id: 'labelrow', find: 'def _looks_like_heading(text', title: 'Heading rows and heading fields (v1.1)', note: '_looks_like_heading() accepts words ("Blower", "Provided Category - 5") and rejects measurements, part numbers, NA/Yes and XXXX masks. _is_label_row() also needs one of the next rows\' answers to sit exactly under the headings. See {{st:labels}}.'},
    {id: 'section', find: 'is_section = bool(code and', title: 'Section vs field, and heading scope', note: 'Section = code ends .0 OR no value text. Headings are cleared at a .0 code (unless the heading row sits directly above it) and when a heading\'s clause family ends. Keyword sections (WB / GVW / variant / gear / ratio) still set headings, as in v1.0 ({{st:labels}}).'},
    {id: 'header', find: 'def _header(cell', title: '_header(): label by overlap > 0.8', note: 'Overlap width ÷ the wider of header and cell must exceed 0.8. See {{lab:overlap}}.'},
    {id: 'hierarchy', find: 'def _hierarchy(records', title: '_hierarchy(): parents from code prefixes', note: 'Longest prefix first, each as-is and with ".0". Uncoded records attach to the last section; since v1.1 an uncoded section after another uncoded section is its sibling (Table 07 no longer nests 28 deep). Then references are extracted. See {{st:tree}} and {{lab:tree}}.'},
    {id: 'textfields', find: 'def _text_fields(text', title: '_text_fields(): text fallback', note: 'Only on pages with no ruled content table but ≥ 40 characters. Lines starting with a code become records with no values, and the page gets a warning.'},
    {id: 'extract_pdf', find: 'def extract_pdf(path', title: 'extract_pdf(): the public entry point', note: 'Opens the PDF (any failure → ExtractionError with a friendly message), checks 1–200 pages, then per page: raw text, tables, interpretation, warnings, images, progress callback. After all pages: hierarchy, document block, status.'},
    {id: 'warnings', find: 'requires_ocr = len(raw_text.strip()) < 40', title: 'Page warnings', note: 'Fewer than 40 characters → requires_ocr. Images → located, not transcribed. Any warning makes extraction.status "needs_review".'},
    {id: 'docblock', find: 'table_match = re.search', title: 'Document block from page 1 text', note: 'Table number, part, title and date by regex. SHA-256 of the file bytes identifies the exact input.'},
  ],
  app: [
    {id: 'limits', find: 'MAX_FILE_BYTES = 25', title: 'Limits and shared state', note: 'Size limits, 10 files, 12 jobs, 60-minute retention. JOBS is an in-memory dict guarded by an RLock (re-entrant, because helpers that take the lock call each other).'},
    {id: 'removedir', find: 'def _remove_job_dir(path', title: 'Safe deletion', note: 'Only deletes a folder directly inside the upload store with a 32-character name (a uuid hex). A defensive check so a bug can never rm -rf somewhere else.'},
    {id: 'lifespan', find: 'async def lifespan(application', title: 'Start-up and shutdown', note: 'Creates the store, clears folders left by a previous process, starts the single-worker ThreadPoolExecutor. On shutdown, waits and cancels queued work.'},
    {id: 'health', find: 'def health():', title: '/api/health', note: 'Reports limits and "ocr_enabled": false, so the UI and tests can see what this build does.'},
    {id: 'runjob', find: 'def _run_job(job_id', title: '_run_job(): the worker', note: 'Documents one by one. A progress callback updates pages_done. ExtractionError gives its own message; any other exception is logged and turned into a generic message (no stack traces to the user). The job is "complete" if any document succeeded.'},
    {id: 'upload', find: 'async def upload(files', title: 'POST /api/jobs', note: 'Validate count → reserve a job (429 if 12 exist) → stream each file in 64 KB chunks with size limits → check %PDF- in the first 1 KB → queue. Any exception removes the job and its folder: no half-created state.'},
    {id: 'zip', find: 'def download_zip(job_id', title: 'Batch ZIP', note: 'NN_name.json per successful document (NN = upload position) plus errors.json for failures. Duplicate filenames are safe because of the NN prefix.'},
    {id: 'page', find: 'def page_image(job_id', title: 'Page previews', note: 'Rendered on demand with pypdfium2 at ~1600 px wide, cached as PNG, and serialised with RENDER_LOCK.'},
  ],
  evaluate: [
    {id: 'normalized', find: 'def normalized(value)', title: 'Comparison rule', note: 'Unicode NFC + collapse whitespace. Nothing else is forgiven: case, units, punctuation, order and blanks must match.'},
    {id: 'find', find: 'def find_field(result, spec)', title: 'Locating the field', note: 'By page + field code (+ optional description text and occurrence). Table-cell checks locate a row by its first cell text instead.'},
    {id: 'freeze', find: 'frozen = json.loads', title: 'The freeze guard and --regression', note: 'Without arguments it refuses to run if engine.py\'s SHA-256 differs from the v1.0 freeze, or if a holdout PDF changed. With --regression it re-checks the same documents with a newer parser and writes a separate report that says it is not unseen accuracy. See {{st:proof}}.'},
    {id: 'summary', find: 'report["summary"] = {', title: 'Summary numbers', note: 'Value checks and label checks are counted separately. "sampled_value_accuracy_percent" is named to say exactly what it is.'},
  ],
  test_extraction: [
    {id: 'known', find: '@pytest.mark.parametrize("code,values"', title: 'Known values (9 tests)', note: 'Hand-checked Table 02 values, including placeholders (NA, --) and a multi-line value.'},
    {id: 'merged', find: 'def test_merged_variants_and_subrows', title: 'Merged variants', note: 'Pins all six B1.1 values with row and column labels, and that the HSD pair is inherited.'},
    {id: 'points', find: 'def test_values_point_to_real_cells', title: 'Provenance holds everywhere', note: 'For every value in Table 03: the source cell exists, has the same text and the same bbox. Every parent_id exists.'},
    {id: 'blank', find: 'def test_no_text_is_flagged', title: 'Honest about scans', note: 'A blank page → requires_ocr_pages [1], needs_review, no fields.'},
  ],
  test_v1_1: [
    {id: 'footer', find: 'def test_signature_box_without_manufacturer_is_footer', title: 'Footer without "Manufacturer:"', note: 'Table 07 must produce no "Document No" / "Page 1 of 6" records.'},
    {id: 'siblings', find: 'def test_uncoded_sections_are_siblings', title: 'Sibling sections', note: 'Engine and Vehicle data share a parent; Table 07 stays at most 3 levels deep.'},
    {id: 'headings', find: 'def test_heading_row_labels_its_clause_family', title: 'Heading scope', note: 'Table 05 tank headings label D7.5.x and stop before D7.6.'},
    {id: 'regression', find: 'def test_regression_blank_spacer_is_not_a_value', title: 'Regression on the former holdout', note: 'Tables 06 and 11 were the v1.0 holdout; these checks keep the fixes in place. They are not an unseen measurement.'},
  ],
  test_app: [
    {id: 'flow', find: 'def test_upload_review_download_and_clear', title: 'Happy path', note: 'Upload → 202 → poll → 31 fields → JSON download equals the result → PNG preview → 404s → delete → store empty.'},
    {id: 'partial', find: 'def test_batch_duplicates_and_partial_failure', title: 'Partial failure', note: 'Two copies of the same file plus a broken one: complete, complete, failed; the ZIP has 01_same.json, 02_same.json, errors.json.'},
    {id: 'reject', find: 'def test_reject_invalid_uploads_without_leaving_files', title: 'Rejections leave nothing behind', note: '.txt, fake PDF, empty file, 11 files → 400; too big → 413; no jobs and no folders remain.'},
  ],
};

/* ======================= Page atlas ======================= */
function atlas(app, parts) {
  if (parts[0]) return atlasPage(app, parts[0]);
  const filt = J().store.get('atlasDoc', '');
  const total = ORDER.reduce((a, d) => a + SX.docs[d].pages.length, 0);
  app.innerHTML = `<div class="page" style="max-width:1300px"><h1>Page atlas</h1><p class="lead">${SX.withheld ? 'This shared copy includes only the practice form; the real Ashok Leyland pages are left out.' : `All ${total} pages of the ${ORDER.length} PDFs, with what the frozen extractor reported for each.`} <b>Traced</b> pages open with the full engine overlay; the others show the page and its extracted fields.</p>
    <div class="labnav" id="af"><a href="#" data-d="" class="${filt ? '' : 'on'}">All</a>${ORDER.map(d => `<a href="#" data-d="${d}" class="${filt === d ? 'on' : ''}">${J().DOCNAME[d]} · ${SX.docs[d].set === 'holdout' ? 'holdout' : SX.docs[d].set === 'sample' ? 'practice' : 'dev'}</a>`).join('')}</div><div class="atlas"></div></div>`;
  const draw = d => {
    app.querySelector('.atlas').innerHTML = ORDER.filter(x => !d || x === d).map(doc => SX.docs[doc].pages.map(p => {
      const id = pid(doc, p.n), traced = !!SX.specimens[id];
      return `<div class="pcard"><img src="pages/${id}.jpg" alt="${esc(J().pageLabel(id))}" data-lightbox="${id}" loading="lazy"><div class="body"><a href="#/atlas/${id}"><b>${esc(J().pageLabel(id))}</b></a>
        <div class="badges"><span class="badge">${p.fields} fields</span><span class="badge">${p.tables.filter(t => t === 'content').length} content table${p.tables.filter(t => t === 'content').length === 1 ? '' : 's'}</span>${p.images ? `<span class="badge w">${p.images} image</span>` : ''}${p.warnings.length ? `<span class="badge w">${p.warnings.length} warning</span>` : ''}${traced ? '<span class="badge s">traced</span>' : ''}${SX.docs[doc].set === 'holdout' ? '<span class="badge">holdout</span>' : ''}</div>
        <span class="small">${p.first ? `<code>${esc(p.first)}</code> → <code>${esc(p.last)}</code>` : 'no printed codes'}</span>${p.sections.length ? `<span class="small">${p.sections.slice(0, 3).map(esc).join('<br>')}</span>` : ''}</div></div>`;
    }).join('')).join('');
  };
  app.querySelector('#af').addEventListener('click', e => { const a = e.target.closest('[data-d]'); if (!a) return; e.preventDefault(); J().store.set('atlasDoc', a.dataset.d); app.querySelectorAll('#af a').forEach(x => x.classList.toggle('on', x === a)); draw(a.dataset.d); });
  draw(filt);
}
function atlasPage(app, id) {
  const [doc, nS] = id.split('-'), n = Number(nS), D = SX.docs[doc];
  if (!D || !D.pages[n - 1]) { location.hash = '#/atlas'; return; }
  const p = D.pages[n - 1], fs = (SX.fields[doc] || []).filter(f => f.page === n), traced = !!SX.specimens[id];
  const prev = n > 1 ? pid(doc, n - 1) : null, next = n < D.pages.length ? pid(doc, n + 1) : null;
  app.innerHTML = `<div class="page" style="max-width:1400px"><p class="small"><a href="#/atlas">← Page atlas</a> · ${prev ? `<a href="#/atlas/${prev}">‹ previous page</a>` : ''} ${next ? ` · <a href="#/atlas/${next}">next page ›</a>` : ''}</p>
    <h1>${esc(J().pageLabel(id))} <span class="muted" style="font-size:16px">of ${D.pages.length} · ${esc(D.file)} · ${D.set}</span></h1>
    <div class="badges" style="margin-bottom:10px"><span class="badge">${p.fields} records</span><span class="badge">${p.chars} characters</span><span class="badge">tables: ${p.tables.join(', ') || 'none'}</span>${p.warnings.map(w => `<span class="badge w">${esc(w)}</span>`).join('')}</div>
    <div class="station" style="min-height:0"><div class="stage"></div><div class="side"><div class="card"><h3 style="margin-top:0">Extracted on this page</h3>${fs.length ? `<table class="t"><tr><th>code</th><th>description</th><th>values</th></tr>${fs.map(f => `<tr><td><code>${esc(f.code || '—')}</code>${f.kind === 'section' ? ' §' : ''}</td><td>${esc(f.desc.split('\n')[0].slice(0, 70))}</td><td>${f.values.map(v => `<span class="val${v.inh ? ' inh' : ''}${v.t ? '' : ' blank'}">${v.rowl ? `<b>${esc(v.rowl)}</b> ` : ''}${v.col ? `<b>${esc(v.col)}</b> ` : ''}${v.t ? esc(v.t.split('\n')[0].slice(0, 40)) : 'empty'}${v.inh ? ' ↩' : ''}</span>`).join(' ')}${f.cont.length ? ` <span class="small">+${f.cont.length} continuation row(s)</span>` : ''}</td></tr>`).join('')}</table>` : '<p class="muted">No field records on this page. Its text is still in raw_text.</p>'}</div></div></div></div>`;
  if (traced) { const pv = J().PageView(app.querySelector('.stage')); pv.set({spec: id, layers: ['roles']}); }
  else app.querySelector('.stage').innerHTML = `<img src="pages/${id}.jpg" alt="" style="width:100%;background:#fff;border-radius:8px;cursor:zoom-in" data-lightbox="${id}"><p class="small">Not traced: shown as an image. The ${SX.specimens ? Object.keys(SX.specimens).length : 0} traced pages carry the full engine overlay.</p>`;
}

/* ======================= Defense room ======================= */
const ROOMS = {
  client: {who: 'Client · homologation lead, Ashok Leyland', icon: '🏭', qs: [
    {q: 'Can I trust these numbers enough to put them in a submission?', c: [
      ['Yes. It\'s 97.3% accurate, so it\'s safe to submit directly.', 0, '97.3% is a sampled score on 74 hand-picked checks, not a guarantee for your next document. Overclaiming here is the fastest way to lose a client\'s trust.'],
      ['Every value is copied verbatim and points to its exact cell, so your team can check any value against the page in one click. The tool speeds up review; sign-off stays with your engineers.', 2, 'Strong. It sells what the tool actually guarantees (faithful copy + provenance) and keeps the human decision where it belongs.'],
      ['It was checked by AI, so it should be fine.', 0, 'There is no AI in the extraction path, and "should be fine" is not evidence.']]},
    {q: 'A supplier sends a scanned PDF. What happens?', c: [
      ['The tool flags the pages as requiring OCR and marks the document needs_review. It never guesses. OCR as a clearly marked fallback is on the roadmap.', 2, 'Exactly the behaviour, plus a credible next step.'],
      ['It reads it like any other PDF.', 0, 'False. A scanned page has no characters; the engine reports that instead of reading it.'],
      ['It will crash, so don\'t upload scans.', 0, 'It handles it gracefully, and a test (test_no_text_is_flagged) proves it.']]},
    {q: 'Why does Table 07 show "Model A8" as a Type / Description?', c: [
      ['That box is printed as one merged cell covering both rows, so the value is shared. It is flagged inherited and points to the Variant(s) cell, so a reviewer can catch it.', 2, 'Clear, honest, and shows the safety net (inherited flag + source_cell).'],
      ['It\'s a bug we haven\'t looked at.', 0, 'You have looked at it, and it is explainable. Saying "unknown bug" undersells the design.'],
      ['The form is wrong.', 1, 'Partly fair: the layout is ambiguous. But blaming the form without explaining the flag misses the point.']]},
    {q: 'Does our data leave this computer?', c: [
      ['No. It runs on 127.0.0.1 with no API keys or cloud calls. Uploads are temporary: removed after 60 minutes idle, on "New batch", or at restart.', 2, 'Precise and checkable.'],
      ['Only to the AI service for checking.', 0, 'There is no such service.'],
      ['I think it\'s local.', 1, 'Correct but uncertain. You know this one for sure: say it with the details.']]},
    {q: 'Can it give us numbers, like 4750 as an integer, for our database?', c: [
      ['Yes, as a separate downstream step. The extractor keeps the text exactly as declared ("10 degs", "170 Nm @ 1600 – 2400 rpm"), and a conversion layer with explicit, tested rules can sit on top.', 2, 'Keeps the faithful layer intact and offers the value.'],
      ['Sure, we\'ll change the extractor to convert everything.', 0, 'That mixes copying with interpreting and loses units and placeholders.'],
      ['No, that\'s impossible.', 0, 'It is very possible, just not the extractor\'s job.']]},
  ]},
  lead: {who: 'Tech lead', icon: '🧑‍💻', qs: [
    {q: 'Why not just send the PDF to an LLM and ask for JSON?', c: [
      ['These are native-text exports. Geometry gives exact characters and exact cell provenance, deterministically, on a CPU at zero per-page cost. An LLM can paraphrase, drop placeholders or guess merged cells, and you can\'t easily prove where a value came from.', 2, 'Concrete trade-offs, not dogma.'],
      ['LLMs are bad at tables.', 0, 'Too absolute, and easy to challenge.'],
      ['We didn\'t have API keys.', 0, 'Makes the design sound accidental.']]},
    {q: 'How exactly do you handle merged cells?', c: [
      ['For each grid row I take the row\'s top line plus 0.05 pt and collect every cell crossing it. Merged cells from above are included, flagged inherited_from_merged_cell, and source_cell points to the owning row.', 2, 'Mechanism + provenance. Exactly what a lead wants.'],
      ['pdfplumber handles them.', 0, 'pdfplumber gives the cells; interpreting them per row is your code.'],
      ['We copy the previous row\'s values.', 0, 'That is ffill without evidence: it would create false sharing.']]},
    {q: '97.3%: over what?', c: [
      ['72 of 74 hand-picked value checks on two holdout PDFs, scored once after freezing the parser by hash. It is a purposive sample, so not a population estimate. Labels are separate: 0/2.', 2, 'Every qualifier in one breath.'],
      ['Over all the fields.', 0, 'False: about 1,000 values exist and 74 were checked.'],
      ['Over the test suite.', 0, 'pytest is 20/20 on development data; the 97.3% is the holdout.']]},
    {q: 'What stops someone from quietly tuning on the holdout?', c: [
      ['The freeze: engine.py\'s SHA-256 is stored before scoring, and evaluate.py refuses to run if it changed. Holdout PDF hashes are checked too. The first-page triage leak is disclosed.', 2, 'Verifiable, and honest about the one leak.'],
      ['Trust.', 0, 'The whole point of the hash is not to need trust.'],
      ['We only ran it once.', 1, 'True, but the hash is what makes it checkable.']]},
    {q: 'Two users upload at once. What happens?', c: [
      ['Both get 202; jobs queue on one worker thread; shared state is under an RLock; at 12 jobs new uploads get 429. Fine for a desktop tool. A shared deployment needs a DB, a durable queue and auth.', 2, 'Knows the current behaviour and its limit.'],
      ['It crashes.', 0, 'It does not; the lock and queue handle it.'],
      ['It scales automatically.', 0, 'One worker, in-memory jobs: it does not.']]},
    {q: 'Thresholds like 6 pt and 0.8 look like magic numbers.', c: [
      ['They were tuned on development PDFs and are documented. The 6 pt sliver cut-off caused the E28.4 holdout failure in v1.0, so v1.1 also drops empty slivers under 12 pt. The new rules still need a fresh unseen set before I quote a number.', 2, 'Owns the weakness, shows the fix and is honest about what is not yet measured.'],
      ['They work, so it\'s fine.', 0, 'The holdout shows one does not always work.'],
      ['pdfplumber defaults.', 0, 'They are the engine\'s own constants.']]},
  ]},
  interview: {who: 'Interviewer', icon: '🎤', qs: [
    {q: 'Walk me through the project in a minute.', c: [
      ['SpecExtract turns AIS-007 type-approval PDFs into JSON where every value points to its source cell. It rebuilds tables from ruling lines, keys records on printed clause codes, handles merged cells with an inherited flag, and flags what it can\'t read. Evaluated on two unseen PDFs after a hash freeze: 72/74 sampled checks; known gaps are spacer cells and variant labels.', 2, 'Problem → method → evidence → limits. Ideal.'],
      ['It\'s a PDF parser using pdfplumber and FastAPI.', 0, 'Tools are not the story. Say what problem it solves and how you know it works.'],
      ['It uses AI to read PDFs.', 0, 'Inaccurate.']]},
    {q: 'What was the hardest part?', c: [
      ['Merged cells. Treating covered positions as empty creates false blanks; copying blindly creates false sharing. Using row-crossing geometry with an inherited flag solved both and stays auditable.', 2, 'Specific, with the two failure modes named.'],
      ['Setting up FastAPI.', 0, 'Not a convincing "hard" problem.'],
      ['Everything was easy.', 0, 'Signals shallow understanding.']]},
    {q: 'What would you do differently?', c: [
      ['Layout-based header detection instead of keywords, a relative spacer filter, sibling-level sections for uncoded forms, and a new unseen set for v1.1. Plus a DB-backed queue for multi-user use.', 2, 'Each item ties to a measured or observed failure.'],
      ['Rewrite it with an LLM.', 0, 'Throws away the properties that make it trustworthy.'],
      ['Nothing.', 0, 'Every project has a next version.']]},
    {q: 'How do you know your evaluation isn\'t leaky?', c: [
      ['Document-level split, parser hash frozen before scoring, expected values written before the run, and the one known leak (first-page triage) disclosed in the manifest.', 2, 'Complete and candid.'],
      ['We used a test set.', 1, 'Necessary but not sufficient. Explain why it is clean.'],
      ['Leakage only matters for ML.', 0, 'It matters for any tuned system, rules included.']]},
  ]},
};
function defense(app, parts) {
  const room = ROOMS[parts[0]] ? parts[0] : null;
  const scores = J().store.get('defense', {});
  if (!room) {
    app.innerHTML = `<div class="page"><h1>Defense room</h1><p class="lead">Practice the conversations you will actually have. Each person asks hard questions; pick the answer you'd give and get feedback. Aim for the answer that is precise, honest about limits, and checkable.</p>
      <div class="grid3">${Object.entries(ROOMS).map(([k, r]) => { const s = scores[k] || {}; const best = Object.values(s).filter(v => v === 2).length; return `<a class="box" href="#/defense/${k}" style="text-decoration:none;color:inherit"><h3>${r.icon} ${esc(r.who)}</h3><p class="small">${r.qs.length} questions · best answers so far: ${best}/${r.qs.length}</p><div class="bar"><span style="width:${100 * best / r.qs.length}%"></span></div></a>`; }).join('')}</div></div>`;
    return;
  }
  const R = ROOMS[room]; let i = 0;
  app.innerHTML = `<div class="page"><p class="small"><a href="#/defense">← Defense room</a></p><h1>${R.icon} ${esc(R.who)}</h1><div class="chat"></div></div>`;
  const chat = app.querySelector('.chat');
  const ask = () => {
    if (i >= R.qs.length) {
      const s = J().store.get('defense', {})[room] || {}, best = Object.values(s).filter(v => v === 2).length;
      chat.insertAdjacentHTML('beforeend', `<div class="bubble them"><b>${esc(R.who)}</b>Thanks, that's all from me.</div><div class="out">Best answers: <b>${best}/${R.qs.length}</b>. ${best === R.qs.length ? '<span class="ok">Ready for this room.</span>' : 'Run it again; the questions stay the same, the goal is fluency.'} <a href="#/defense">Pick another room →</a></div>`);
      return;
    }
    const Q = R.qs[i], order = Q.c.map((c, k) => k).sort(() => Math.random() - .5);
    chat.insertAdjacentHTML('beforeend', `<div class="bubble them"><b>${esc(R.who)} · ${i + 1}/${R.qs.length}</b>${esc(Q.q)}</div><div class="choices">${order.map(k => `<button data-k="${k}">${esc(Q.c[k][0])}</button>`).join('')}</div>`);
    const box = chat.lastElementChild;
    box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const c = Q.c[Number(b.dataset.k)];
      box.outerHTML = `<div class="bubble me">${esc(c[0])}</div><div class="out"><span class="${c[1] === 2 ? 'ok' : 'bad'}">${c[1] === 2 ? '✔ Best answer.' : c[1] === 1 ? '◐ Partly.' : '✖ Risky.'}</span> ${esc(c[2])}${c[1] < 2 ? `<div class="small" style="margin-top:6px">Stronger: “${esc(Q.c.find(x => x[2] && x[1] === 2)[0])}”</div>` : ''}</div>`;
      const s = J().store.get('defense', {}); s[room] = s[room] || {}; s[room][i] = Math.max(s[room][i] || 0, c[1]); J().store.set('defense', s);
      i++; setTimeout(ask, 350);
      window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
    }));
  };
  ask();
}

/* ======================= Cheat sheet ======================= */
const CARDS = [
  ['What is value_x?', 'The most common right edge of the description cell on code rows: a per-table vote. Cells left of it are row labels, right of it values.'],
  ['How does a merged value reach a row?', '_active_cells(): every cell crossing the row\'s top line + 0.05 pt. Borrowed values get inherited_from_merged_cell = true and source_cell → owner row.'],
  ['When is a record a section?', 'Its code ends in .0, or none of its value cells has text.'],
  ['Where do column headings come from?', 'Keyword sections (WB, GVW, variant, gear, ratio), and since v1.1 heading rows without a code and heading fields. Words only; scoped to their clause family.'],
  ['When does a value get a column_label?', 'Overlap with a header ÷ the wider width > 0.8.'],
  ['How is a parent found?', 'Longest code prefix first, each as-is and with ".0", among records already seen. Uncoded records → last section.'],
  ['What is a continuation row?', 'In a coded table, a row with no code of its own. Its cells are stored under the previous record.'],
  ['Which cells are dropped?', 'Slivers: 6 pt wide or less, or empty and under 12 pt (v1.1). v1.0 kept a 7 pt empty sliver in E28.4.'],
  ['When is a page requires_ocr?', 'Fewer than 40 characters of text.'],
  ['When is status needs_review?', 'When any page has a warning: no content table, OCR needed, or images.'],
  ['What is the freeze?', 'SHA-256 of engine.py stored before scoring the holdout. evaluate.py refuses to run if it changed.'],
  ['What does 72/74 mean?', 'Sampled, purposive value checks on 2 unseen PDFs (Tables 06, 11). Labels 0/2 separately. Not whole-document accuracy.'],
  ['The two v1.0 holdout failures?', 'E28.4 and E29.4 on Table 06 p.9: an extra "" from a 7.0 pt sliver. Fixed in v1.1 (regression 74/74, not a new unseen score).'],
  ['Why no OCR?', 'The PDFs are native-text Word exports: exact characters, no recognition errors. Scans are flagged, not guessed.'],
  ['Why one worker thread?', 'Parsing is CPU/memory heavy; one worker keeps a laptop responsive. State is in memory under an RLock.'],
  ['Upload failure vs extraction failure?', 'Validation errors (400/413/429) reject the whole batch and delete its folder. Extraction errors fail one document; the others succeed, and errors.json lists it.'],
];
function cheat(app) {
  const s = SX.holdout.summary;
  app.innerHTML = `<div class="page"><h1>Cheat sheet <button class="ghost" onclick="window.print()" style="font-size:13px;vertical-align:middle">🖨 print</button></h1>
   <div class="say" style="font-size:16px">"SpecExtract turns AIS-007 specification PDFs into JSON where every value points to its source cell. It rebuilds tables from ruling lines, uses printed clause codes as keys, flags merged values as inherited, and reports what it can't read. On two unseen PDFs, after freezing the parser by hash, it passed ${s.value_checks_passed}/${s.value_checks_total} sampled checks."</div>
   <h2>Numbers</h2><div class="tiles">${[['7 PDFs · 64 pages', '5 dev (50 p) + 2 holdout (14 p)'], ['2,121', 'records extracted (v1.1)'], ['28/28', 'pytest'], [`${s.value_checks_passed}/${s.value_checks_total}`, `v1.0 on unseen PDFs (${s.sampled_value_accuracy_percent}%)`], [`${s.variant_label_checks_passed}/${s.variant_label_checks_total}`, 'v1.0 label checks'], ['74/74 · 2/2', 'v1.1 regression (not unseen)'], ['≈ 90.7–99.3%', 'Wilson 95%, if it were random'], ['25 / 100 MB', 'per file / per batch'], ['10 · 12 · 200', 'files · jobs · pages'], ['6 / 12 pt · 0.8 · 0.05 pt', 'sliver · overlap · ruler offset'], ['40 chars', 'below → requires_ocr'], ['60 min', 'retention when idle'], ['1.0.0', 'parser version (frozen)']].map(t => `<div class="tile"><b>${t[0]}</b><small>${t[1]}</small></div>`).join('')}</div>
   <h2>The pipeline</h2><div class="flow"><span>PDF bytes</span><em>→</em><span>chars + lines</span><em>→</em><span>find_tables → cells</span><em>→</em><span>active cells</span><em>→</em><span>value_x vote</span><em>→</em><span>row → record</span><em>→</em><span>headers / labels</span><em>→</em><span>hierarchy + refs</span><em>→</em><span>JSON + flags</span></div>
   <h2>If they ask… say…</h2><table class="t">${[
     ['Is it accurate?', '72/74 sampled checks on unseen PDFs, frozen by hash. Every value points to its cell for review.'],
     ['Why not an LLM?', 'Native text → exact, deterministic, traceable, free on CPU. OCR/VLM is a marked fallback for scans.'],
     ['Merged cells?', 'Row-crossing geometry + inherited flag + source_cell.'],
     ['Scanned PDFs?', 'Flagged requires_ocr, status needs_review. Nothing guessed.'],
     ['Known failures?', 'v1.1 fixed the measured ones. Still: forms without codes (Table 07, 11), layout vs meaning, misprints, unlinked references.'],
     ['Data privacy?', '127.0.0.1, no cloud, temp files expire after 60 min.'],
     ['Next version?', 'A new unseen set to measure v1.1, value_x for uncoded forms, linked references, DB queue.'],
   ].map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</table>
   <h2>Flashcards <span class="small muted">click to flip · <a href="#" id="shuf">shuffle</a></span></h2><div class="grid3" id="cards"></div></div>`;
  const draw = list => {
    app.querySelector('#cards').innerHTML = list.map(c => `<div class="flash" tabindex="0"><div class="in"><div class="f">${esc(c[0])}</div><div class="b">${esc(c[1])}</div></div></div>`).join('');
    app.querySelectorAll('.flash').forEach(f => { const t = () => f.classList.toggle('flip'); f.addEventListener('click', t); f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } }); });
  };
  app.querySelector('#shuf').addEventListener('click', e => { e.preventDefault(); draw(CARDS.slice().sort(() => Math.random() - .5)); });
  draw(CARDS);
}

window.PAGES = {atlas, defense, cheat};
})();
