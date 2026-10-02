# Ashok Leyland PDF extractor: the journey of a PDF

An interactive course that teaches how the [Jags AL Data Extracter](https://github.com/sriram-lexbolt/Ashok-Leyland-SimpleExtracter) turns Ashok Leyland AIS-007 specification PDFs into traceable JSON. It starts from zero (what a PDF really contains) and ends with how the parser was evaluated, where it still fails, and how to explain it to a client, a tech lead or an interviewer.

It covers parser version **1.1.0**.

## Open it

Double-click `index.html`. It runs offline in any modern browser; there is nothing to install. Progress is saved in the browser.

## How it works

The course follows one PDF through the extractor, station by station. Each station shows a page on the left, with switchable overlays (words, ruling lines, cells, row roles, the value boundary) and an inspector that explains the extractor's decision for any row you click. The lesson is on the right, in short steps.

From station 5 onward every rule is first shown on a small **practice form** (`sample/practice_form.pdf`): a made-up one-page form in the AIS style, with one example of each rule and borders on round coordinates, so each step can be followed by eye. Click-through visuals replay what the extractor actually did on that form, step by step.

| Station | Topic |
|---|---|
| 0 | Start: what the extractor does, the whole pipeline in one line |
| 1 | The paperwork: AIS-007 forms, clause codes, variants, placeholders |
| 2 | Inside a PDF: characters, lines and coordinates; no tables exist |
| 3 | The front door: upload, queue, review, download |
| 4 | Lines become cells; merged cells and thin spacer columns |
| 5 | Who owns this row? The ruler laid across each row; borrowed values |
| 6 | Where do the answers start? Each coded row votes; row labels |
| 7 | Rows become records: the code pattern, the five questions per row, sections, continuation rows, spacer slivers |
| 8 | Names for answer columns: heading rows, the 80% overlap rule, scope |
| 9 | The family tree from clause codes; references to annexures |
| 10 | Warnings and the JSON file |
| 11 | Proving it works: development vs holdout, the freeze, 72/74 (v1.0), regression checks (v1.1) |
| 12 | Where it still breaks, and how to fix things without fooling yourself |
| 13 | Own it: explaining it at three depths, extending it, production roadmap |

Every station starts with the words it uses, defined in plain language, and ends with a checkpoint: two explanations (new programmer, experienced programmer), one passage that ties them together, key takeaways and a short quiz.

Also included:

| Section | What it is |
|---|---|
| Lab bench | Hands-on labs running the extractor's real rules: the code pattern, the row ruler, the value boundary, heading overlap, the family tree, the upload queue, the accuracy numbers |
| Code reader | The extractor's source with a plain-English note on every function |
| Page atlas | Every page with what the extractor reported for it |
| Defense room | Practice conversations with a client, a tech lead and an interviewer |
| Glossary | Every term, with hover definitions throughout the course |
| Cheat sheet | Key numbers, one-line answers and flashcards |

## What this shared copy leaves out

The real Ashok Leyland PDFs are client documents, so this copy contains only the practice form's page and data. Lessons and labs that use a real page show a "not included in the shared copy" panel; the accuracy lab shows which checks passed without their values. The code shown in the Code reader is the same as in the extractor repository.

## Build the full version locally

With access to the PDFs and the extractor repository:

1. Copy this folder into the extractor repository as `specextract_journey/`.
2. Put the PDFs in `pdfs/development/` and `pdfs/holdout/` (see `dataset_manifest.json`) and install the extractor's requirements.
3. From the repository root, run:
   ```powershell
   .\.venv\Scripts\python.exe specextract_journey\tools\make_sample.py
   .\.venv\Scripts\python.exe specextract_journey\tools\build_data.py
   ```
   `build_data.py` re-runs the extractor on every PDF and on the practice form, records a step-by-step trace and stops if the trace differs from the extractor's own output in any record. It also renders the practice form's page image; the real page images go in `pages/` as `t02-01.jpg`, `t03-01.jpg` and so on (1200 px wide).
4. Check the result with `node specextract_journey\tools\verify.cjs`. It confirms that the JavaScript copies of the rules used by the labs give the same answers as the extractor, and that every link, term and code reference in the lessons resolves.
5. To make another shareable copy: `.\.venv\Scripts\python.exe specextract_journey\tools\make_public.py <target folder>`.

## Files

| File | Contents |
|---|---|
| `index.html`, `style.css`, `core.js` | The app: page viewer, lesson player, router, quizzes, progress |
| `journey.js`, `journey2.js` | Stations 0–4 and 5–13 |
| `viz.js` | The click-through visuals |
| `labs.js` | The labs and the JavaScript copies of the extractor's rules |
| `extras.js` | Page atlas, defense room, cheat sheet, code notes |
| `glossary.js` | Glossary |
| `data.js`, `sources.js` | Extractor output and traces (practice form only here); the extractor's source files |
| `sample/practice_form.pdf`, `pages/smp-01.jpg` | The practice form and its page image |
| `tools/` | `make_sample.py`, `build_data.py`, `verify.cjs`, `make_public.py` |
