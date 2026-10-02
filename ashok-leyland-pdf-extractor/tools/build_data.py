"""Build data.js for the SpecExtract Journey app from the REAL engine.

Run from the project root:  .venv\\Scripts\\python.exe specextract_journey\\tools\\build_data.py

It re-runs extractor/engine.py on the supplied PDFs and records a decision trace
for selected "specimen" pages. The tracer mirrors engine._interpret_table step by
step; at the end every record it produced is compared with the engine's own
records, so the app never shows a trace that disagrees with the real parser.
Nothing in the project is modified.
"""
from __future__ import annotations

from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pdfplumber  # noqa: E402
from extractor import engine  # noqa: E402
from extractor.engine import (PENDING, _active_cells, _header, _hierarchy, _is_footer, _is_label_row,  # noqa: E402
                              _is_spacer, _is_title, _table_data, _value, _value_cells, field_code)

DOCS = [
    ("smp", "sample", "practice_form.pdf"),
    ("t02", "development", "Table 02_Ver.01.pdf"),
    ("t03", "development", "Table 03_Ver.01.pdf"),
    ("t05", "development", "Table 05_Ver.01.pdf"),
    ("t07", "development", "Table 07_Ver.01.pdf"),
    ("t4e", "development", "Table 4E_Ver.01.pdf"),
    ("t06", "holdout", "Table 06_Ver.01.pdf"),
    ("t11", "holdout", "Table 11_Ver.01.pdf"),
]
# (doc, page) pages whose full decision trace is shipped to the app.
SPECIMENS = {("smp", 1), ("t02", 1), ("t03", 1), ("t06", 4), ("t06", 9), ("t07", 1), ("t4e", 1), ("t11", 2), ("t07", 6)}


def trace_table(table: dict, records: list, context: dict) -> dict:
    """Mirror of engine._interpret_table (parser 1.1.0) that also records what happened per row."""
    t = {"id": table["id"], "rows": [], "value_x": None, "boundaries": [], "votes": [], "role": table["role"]}
    rows = [_active_cells(table, r) for r in range(table["row_count"])]
    key = lambda c: f'{c["row"]},{c["column"]}'
    if rows and _is_footer(rows[0]):
        table["role"] = t["role"] = "footer"
        t["verdict"] = "footer table: the first row is the signature block, so the whole table is skipped"
        return t
    code_rows = []
    for r, cells in enumerate(rows):
        nonempty = [c for c in cells if c["text"]]
        if nonempty and field_code(nonempty[0]["text"]):
            code_rows.append((r, nonempty[0], cells))
    coded = bool(code_rows)
    boundaries = []
    for r, code_cell, cells in code_rows:
        after = [c for c in cells if c["bbox"][0] >= code_cell["bbox"][2] - .1]
        desc = next((c for c in after if c["text"]), None)
        if desc and desc["bbox"][2] < table["bbox"][2] - 5:
            boundaries.append(round(desc["bbox"][2], 1))
            t["votes"].append({"row": r, "cell": key(desc), "x": round(desc["bbox"][2], 1)})
    value_x = Counter(boundaries).most_common(1)[0][0] if boundaries else None
    t.update(coded=coded, value_x=value_x, boundaries=sorted(Counter(boundaries).items()))
    headers: list = []
    headers_row = None
    headers_scope = None
    last_row = None
    previous = context.get("previous") if coded else None

    def next_values(index, count=3):
        following = [r for r in rows[index + 1:] if any(c["text"] for c in r)][:count]
        return [_value_cells(r, value_x) for r in following] if value_x is not None else []

    for row_index, cells in enumerate(rows):
        step = {"row": row_index, "active": [key(c) for c in cells]}
        t["rows"].append(step)
        if _is_footer(cells):
            step["kind"] = "footer-stop"
            break
        if _is_title(cells):
            step["kind"] = "title"
            continue
        nonempty = [c for c in cells if c["text"]]
        if not nonempty:
            step["kind"] = "empty"
            continue
        prev_row, last_row = last_row, row_index
        code_cell = nonempty[0] if field_code(nonempty[0]["text"]) else None
        if coded and (not code_cell or code_cell["row"] != row_index):
            step["kind"] = "continuation"
            step["why"] = "no code cell in this row" if not code_cell else "code cell belongs to an earlier row (merged)"
            if value_x is not None:
                own_values = _value_cells([c for c in cells if c["row"] == row_index], value_x)
                if _is_label_row(own_values, next_values(row_index)):
                    headers, headers_row, headers_scope = own_values, row_index, PENDING
                    step["heading_row"] = [c["text"] for c in own_values]
            if previous:
                own = [c for c in cells if c["row"] == row_index and c["text"]]
                previous["continuation_rows"].append({
                    "source_page": table["source_page"], "table_id": table["id"],
                    "row": row_index, "cells": [c["text"] for c in own],
                })
                step["attached_to"] = previous["id"]
                desc_box = context.get("description_bbox")
                if code_cell and desc_box and any(c["bbox"] == desc_box for c in cells):
                    right = _value_cells(cells, value_x) if value_x is not None else []
                    row_label = " / ".join(c["text"] for c in own if desc_box[2] - .2 <= c["bbox"][0] < (value_x or 0) - .2) or None
                    previous["values"].extend(_value(c, table, row_index, _header(c, headers), row_label) for c in right)
                    step["expanded"] = {"row_label": row_label, "values": [key(c) for c in right],
                                        "header_keys": [key(h) for h in headers]}
            continue
        if code_cell:
            code = field_code(code_cell["text"])
            after = [c for c in cells if c["bbox"][0] >= code_cell["bbox"][2] - .1]
            description = next((c for c in after if c["text"]), None)
            if description is None:
                step["kind"] = "code-without-description"
                continue
        else:
            code = None
            description = nonempty[0]
        right = [c for c in cells if c["bbox"][0] >= description["bbox"][2] - .1]
        spacers = [key(c) for c in right if _is_spacer(c)]
        right = [c for c in right if not _is_spacer(c)]
        if coded and value_x is not None:
            row_labels = [c for c in right if c["bbox"][0] < value_x - .2]
            right = [c for c in right if c["bbox"][0] >= value_x - .2]
        else:
            row_labels = []
        row_label = " / ".join(c["text"] for c in row_labels if c["text"]) or None
        is_section = bool(code and code.endswith(".0")) or not any(c["text"] for c in right)
        section_reason = ("code ends in .0" if code and code.endswith(".0") else
                          "no text in any value cell") if is_section else None
        if code and code.endswith(".0") and not (headers_row is not None and headers_row == prev_row):
            if headers:
                step["headers_reset"] = True
            headers, headers_row, headers_scope = [], None, None
        if headers_scope is PENDING and code:
            headers_scope = code[:-2] if code.endswith(".0") else code.rsplit(".", 1)[0]
            step["scope_set"] = headers_scope
        if headers_scope and headers_scope is not PENDING and not (code == headers_scope or (code or "").startswith(headers_scope + ".")):
            headers, headers_row, headers_scope = [], None, None
            step["headers_reset"] = True
        if is_section and len(right) > 1 and any(re.search(r"\b(?:WB|GVW|variant|gear|ratio)\b", c["text"], re.I) for c in right):
            headers, headers_row, headers_scope = right, row_index, None
            step["headers_set"] = [c["text"] for c in right]
            step["headers_why"] = "keyword"
        header_keys = [] if is_section else [key(h) for h in headers]
        record = {
            "id": f"f{len(records) + 1:05d}", "field_id": code,
            "parent_id": None, "level": len(code.split(".")) if code else 1,
            "kind": "section" if is_section else "field", "description": description["text"],
            "values": [_value(c, table, row_index, None if is_section else _header(c, headers), row_label) for c in right],
            "source_page": table["source_page"], "table_id": table["id"], "row": row_index,
            "continuation_rows": [], "references": [],
        }
        records.append(record)
        if code and value_x is not None and not headers and not is_section and _is_label_row(right, next_values(row_index, 1)):
            headers, headers_row, headers_scope = right, row_index, code
            step["headers_set"] = [c["text"] for c in right]
            step["headers_why"] = "heading field"
        previous = record
        context.update(previous=record, description_bbox=description["bbox"])
        step.update(kind="record", record=record["id"], code_cell=key(code_cell) if code_cell else None,
                    code_raw=code_cell["text"] if code_cell else None, code=code,
                    description=key(description), values=[key(c) for c in right],
                    row_labels=[key(c) for c in row_labels], narrow_dropped=spacers,
                    record_kind=record["kind"], section_reason=section_reason, header_keys=header_keys)
    return t


def compact_table(table: dict) -> dict:
    return {"id": table["id"], "bbox": table["bbox"], "role": table["role"],
            "row_count": table["row_count"], "column_count": table["column_count"],
            "cells": [[c["row"], c["column"], c["row_span"], c["column_span"], c["text"], c["bbox"]] for c in table["cells"]]}


def slim_field(f: dict) -> dict:
    return {"id": f["id"], "code": f["field_id"], "parent": f["parent_id"], "level": f["level"], "kind": f["kind"],
            "desc": f["description"], "page": f["source_page"], "table": f["table_id"], "row": f["row"],
            "values": [{"t": v["text"], "col": v["column_label"], "rowl": v["row_label"], "inh": v["inherited_from_merged_cell"],
                        "cell": [v["source_cell"]["table_id"], v["source_cell"]["row"], v["source_cell"]["column"]]} for v in f["values"]],
            "cont": [c["cells"] for c in f["continuation_rows"]], "refs": f["references"]}


def run_doc(doc_id: str, folder: str, name: str):
    path = OUT / "sample" / name if folder == "sample" else ROOT / "pdfs" / folder / name
    real = engine.extract_pdf(path)
    records, context, specimen, pages = [], {}, {}, []
    with pdfplumber.open(path) as pdf:
        for number, page in enumerate(pdf.pages, 1):
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
            tables = [_table_data(t, number, i) for i, t in enumerate(page.find_tables(), 1)]
            traces = [trace_table(t, records, context) for t in tables]
            content = [t for t in tables if t["role"] == "content"]
            if not content and len(text.strip()) >= 40:
                engine._text_fields(text, number, records)
            if (doc_id, number) in SPECIMENS:
                words = page.extract_words(x_tolerance=2, y_tolerance=3)
                specimen[number] = {
                    "size": [round(page.width, 2), round(page.height, 2)],
                    "tables": [compact_table(t) for t in tables], "traces": traces,
                    "edges": {"h": len([e for e in page.edges if e["orientation"] == "h"]),
                              "v": len([e for e in page.edges if e["orientation"] == "v"])},
                    "chars": len(page.chars), "words": [[w["text"], round(w["x0"], 1), round(w["top"], 1), round(w["x1"], 1), round(w["bottom"], 1)] for w in words],
                    "lines": [[round(v, 1) for v in (e["x0"], e["top"], e["x1"], e["bottom"])] for e in page.edges],
                    "images": [[round(v, 1) for v in (im["x0"], im["top"], im["x1"], im["bottom"])] for im in page.images],
                    "raw_text": text,
                }
            page.close()
    _hierarchy(records)
    # Faithfulness check: the trace must reproduce the engine's records exactly.
    def sig(f):
        return (f["field_id"], f["description"], f["kind"], f["parent_id"], f["level"], f["source_page"],
                [(v["text"], v["column_label"], v["row_label"], v["inherited_from_merged_cell"], v["source_cell"]) for v in f["values"]],
                [c["cells"] for c in f["continuation_rows"]], f["references"])
    mine, theirs = [sig(f) for f in records], [sig(f) for f in real["fields"]]
    assert mine == theirs, f"trace diverged from engine for {name}"
    page_summary = []
    for p in real["pages"]:
        n = p["page_number"]
        fs = [f for f in real["fields"] if f["source_page"] == n]
        codes = [f["field_id"] for f in fs if f["field_id"]]
        page_summary.append({"n": n, "size": [p["width"], p["height"]], "fields": len(fs), "first": codes[0] if codes else None, "last": codes[-1] if codes else None,
                             "tables": [t["role"] for t in p["tables"]], "images": len(p["images"]), "chars": len(p["raw_text"].strip()),
                             "warnings": p["warnings"],
                             "sections": [f"{f['field_id']} {f['description'].splitlines()[0][:48]}" for f in fs
                                          if f["kind"] == "section" and f["field_id"] and f["field_id"].endswith(".0")][:10]})
    return real, specimen, page_summary


def main():
    manifest = json.loads((ROOT / "dataset_manifest.json").read_text(encoding="utf-8"))
    frozen = json.loads((ROOT / "evaluation/frozen_parser.json").read_text(encoding="utf-8"))
    engine_hash = hashlib.sha256((ROOT / "extractor/engine.py").read_bytes()).hexdigest()
    data = {"engine_sha256": engine_hash, "frozen": frozen, "frozen_matches": engine_hash == frozen["engine_sha256"],
            "manifest": manifest, "docs": {}, "specimens": {}, "fields": {}}
    for doc_id, folder, name in DOCS:
        real, specimen, summary = run_doc(doc_id, folder, name)
        data["docs"][doc_id] = {"file": name, "set": folder, "document": real["document"],
                                "extraction": {k: v for k, v in real["extraction"].items() if k != "generated_at"},
                                "pages": summary}
        for n, s in specimen.items():
            data["specimens"][f"{doc_id}-{n:02d}"] = s
        # Full field list for the documents the labs explore in depth.
        if True:  # all documents: used by the tree view, labs and verify.cjs
            data["fields"][doc_id] = [slim_field(f) for f in real["fields"]]
        print(doc_id, "ok", real["extraction"]["field_count"], "fields; specimens", sorted(specimen))
    # Ground truth for the JavaScript port of field_code(): Python's answer for many real cell texts.
    texts = {"D 22.14.4 I.", "B 2.3.4", "1.2.1.", "4x2", "E 25.5.3", "1.1.", "A1.6", "10 degs", "2490 WB", "1.65",
             "16.5±1.0 : 1", "NA", "--", "E28.0", "1.2.1.13.1", "B1.1.1", "A 1.0", "A1", "12", "1.", "B2.3.4.", "Table 2",
             "3, Inline", "1.0 kW", "E 31.10", "a1.6", "A 1 . 6", "AB1.2", "1.2.3.4.5.6.7", "D 21.3.6.8"}
    for sp in data["specimens"].values():
        for t in sp["tables"]:
            for c in t["cells"]:
                if c[4] and len(c[4]) < 40:
                    texts.add(c[4])
    data["regex_cases"] = [[t, field_code(t)] for t in sorted(texts)]
    data["t02_json"] = engine.extract_pdf(ROOT / "pdfs/development/Table 02_Ver.01.pdf")
    data["t02_json"]["extraction"]["generated_at"] = "(set at extraction time)"
    report = json.loads((ROOT / "evaluation/holdout_report.json").read_text(encoding="utf-8"))
    data["holdout"] = {"summary": report["summary"], "method": report["method"], "limitations": report["limitations"],
                       "docs": [{"file": d["filename"], "fields": d["field_count"], "tables": d["table_count"],
                                 "checks": [{"spec": c["expected"], "actual": c["actual"], "passed": c["passed"]} for c in d["checks"]],
                                 "labels": [{"spec": c["expected"], "actual": c["actual"], "passed": c["passed"]} for c in d["variant_label_checks"]]}
                                for d in report["documents"]]}
    regression = json.loads((ROOT / "evaluation/regression_report.json").read_text(encoding="utf-8"))
    data["regression"] = {"summary": regression["summary"], "parser_version": regression["parser_version"]}
    data["parser_version"] = engine.PARSER_VERSION
    # The practice form under the previous parser (1.0.0), for the "what changed" comparison.
    import importlib.util, subprocess, tempfile  # noqa: E401
    old_src = subprocess.run(["git", "show", "685c5b8:extractor/engine.py"], cwd=ROOT, capture_output=True, check=True).stdout
    with tempfile.NamedTemporaryFile("wb", suffix=".py", delete=False) as fh:
        fh.write(old_src)
    spec = importlib.util.spec_from_file_location("engine_v10", fh.name)
    old_engine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(old_engine)
    data["sample_v10"] = [slim_field(f) for f in old_engine.extract_pdf(OUT / "sample" / "practice_form.pdf")["fields"]]
    Path(fh.name).unlink()
    # Page image for the practice form, same width as the other page images.
    import pypdfium2 as pdfium  # noqa: E402
    with pdfium.PdfDocument(str(OUT / "sample" / "practice_form.pdf")) as pdf:
        page = pdf[0]
        image = page.render(scale=1200 / page.get_width()).to_pil().convert("RGB")
        image.save(OUT / "pages" / "smp-01.jpg", quality=88)
        page.close()
    sources = {}
    for key, rel in [("engine", "extractor/engine.py"), ("app", "app.py"), ("evaluate", "evaluate.py"),
                     ("test_extraction", "tests/test_extraction.py"), ("test_v1_1", "tests/test_v1_1.py"), ("test_app", "tests/test_app.py"),
                     ("frontend", "static/app.js"), ("readme", "README.md")]:
        sources[key] = {"path": rel, "text": (ROOT / rel).read_text(encoding="utf-8")}
    (OUT / "data.js").write_text("window.SX = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (OUT / "sources.js").write_text("window.SOURCES = " + json.dumps(sources, ensure_ascii=False) + ";\n", encoding="utf-8")
    print("data.js", round((OUT / "data.js").stat().st_size / 1024), "KB; engine hash matches freeze:", data["frozen_matches"])


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
