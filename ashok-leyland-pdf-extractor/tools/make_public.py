"""Build the shareable copy of the course: the app plus the practice form only.

The full course shows the real Ashok Leyland pages (page images, cell text, extracted values).
Those are client documents, so the shared copy keeps only:
  - the app code, the practice form (PDF, page image, trace, records),
  - for the real documents: counts and pass/fail results, no page images, text or values.
Lessons that use a real page show a "not included in the shared copy" panel.

Run from the extractor project root (needs the full data.js built by build_data.py):
  .venv\\Scripts\\python.exe specextract_journey\\tools\\make_public.py <target folder>
"""
from __future__ import annotations

import json
from pathlib import Path
import re
import shutil
import sys

SRC = Path(__file__).resolve().parents[1]
ROOT = SRC.parent
sys.path.insert(0, str(ROOT))
from extractor.engine import field_code  # noqa: E402

KEEP = ["index.html", "style.css", "core.js", "glossary.js", "journey.js", "journey2.js", "labs.js",
        "extras.js", "viz.js", "sources.js"]
TOOLS = ["build_data.py", "make_sample.py", "verify.cjs", "make_public.py"]
SAMPLE = "smp"
# Client product names to replace in the shared copy, kept in a local file that is never shared:
# tools/private_names.json = [["real name", "placeholder"], ...], longest names first.
_names = Path(__file__).with_name("private_names.json")
NAME_MAP = json.loads(_names.read_text(encoding="utf-8")) if _names.exists() else []


def anonymise(text: str) -> str:
    for old, new in NAME_MAP:
        text = text.replace(old, new)
    return text
# Generic texts for the code-pattern lab (no client data): typical clause ids and non-codes.
REGEX_TEXTS = ["D 22.14.4 I.", "B 2.3.4", "1.2.1.", "4x2", "E 25.5.3", "1.1.", "A1.6", "10 degs", "2490 WB", "1.65",
               "16.5±1.0 : 1", "NA", "--", "E28.0", "1.2.1.13.1", "B1.1.1", "A 1.0", "A1", "12", "1.", "B2.3.4.",
               "Table 2", "3, Inline", "1.0 kW", "E 31.10", "a1.6", "A 1 . 6", "AB1.2", "1.2.3.4.5.6.7", "2026", "0.70"]


def load_data() -> dict:
    text = (SRC / "data.js").read_text(encoding="utf-8")
    return json.loads(text[text.index("=") + 1:].rstrip().rstrip(";"))


def strip(data: dict) -> dict:
    out = {k: data[k] for k in ("engine_sha256", "frozen", "frozen_matches", "manifest", "regression", "parser_version", "sample_v10")}
    out["withheld"] = True
    out["available"] = [k for k in data["specimens"] if k.startswith(SAMPLE + "-")]
    out["specimens"] = {k: v for k, v in data["specimens"].items() if k in out["available"]}
    out["fields"] = {SAMPLE: data["fields"][SAMPLE]}
    out["docs"] = {}
    for d, doc in data["docs"].items():
        if d == SAMPLE:
            out["docs"][d] = doc
            continue
        out["docs"][d] = {
            "file": doc["file"], "set": doc["set"],
            "document": {"filename": doc["document"]["filename"], "page_count": doc["document"]["page_count"]},
            "extraction": {"status": doc["extraction"]["status"], "field_count": doc["extraction"]["field_count"],
                           "table_count": doc["extraction"]["table_count"]},
            "pages": [{"n": p["n"], "size": p["size"], "fields": p["fields"], "tables": p["tables"], "images": p["images"],
                       "chars": p["chars"], "warnings": p["warnings"], "first": None, "last": None, "sections": []}
                      for p in doc["pages"]],
        }
    # Clause codes only (no text) for the "misprint" preset of the tree lab.
    t06 = [f for f in data["fields"].get("t06", []) if f["code"] and re.match(r"^E1[0-4]\.", f["code"])]
    out["code_lists"] = {"misprint": "\n".join(f["code"] + (" §" if f["kind"] == "section" else "") for f in t06)}
    texts = set(REGEX_TEXTS)
    for sp in out["specimens"].values():
        for t in sp["tables"]:
            texts.update(c[4] for c in t["cells"] if c[4] and len(c[4]) < 40)
    out["regex_cases"] = [[t, field_code(t)] for t in sorted(texts)]
    h = data["holdout"]
    out["holdout"] = {"summary": h["summary"], "method": h["method"], "limitations": h["limitations"],
                      "docs": [{"file": d["file"], "fields": d["fields"], "tables": d["tables"],
                                "checks": [{"spec": {"page": c["spec"]["page"], "field_id": c["spec"].get("field_id")}, "actual": None,
                                            "passed": c["passed"], "withheld": True} for c in d["checks"]],
                                "labels": [{"spec": {"page": c["spec"]["page"], "field_id": c["spec"].get("field_id")}, "actual": None,
                                            "passed": c["passed"], "withheld": True} for c in d["labels"]]}
                               for d in h["docs"]]}
    return out


def drop_private_questions(js: str) -> str:
    """Remove defense-room questions marked share: false."""
    while (mark := js.find("share: false")) >= 0:
        start = js.rfind("\n    {q: ", 0, mark) + 1
        end = js.find("\n    {q: ", mark)
        js = js[:start] + js[end + 1:]
    return js


def main(target: Path):
    target.mkdir(parents=True, exist_ok=True)
    for name in KEEP:
        text = (SRC / name).read_text(encoding="utf-8")
        if name == "extras.js":
            text = drop_private_questions(text)
        (target / name).write_text(anonymise(text), encoding="utf-8", newline="\n")
    (target / "data.js").write_text(anonymise("window.SX = " + json.dumps(strip(load_data()), ensure_ascii=False, separators=(",", ":")) + ";\n"),
                                    encoding="utf-8", newline="\n")
    (target / "pages").mkdir(exist_ok=True)
    for img in (SRC / "pages").glob(SAMPLE + "-*.jpg"):
        shutil.copy2(img, target / "pages" / img.name)
    (target / "sample").mkdir(exist_ok=True)
    shutil.copy2(SRC / "sample" / "practice_form.pdf", target / "sample" / "practice_form.pdf")
    (target / "tools").mkdir(exist_ok=True)
    for name in TOOLS:
        shutil.copy2(SRC / "tools" / name, target / "tools" / name)
    print("shared copy written to", target)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(Path(sys.argv[1]))
