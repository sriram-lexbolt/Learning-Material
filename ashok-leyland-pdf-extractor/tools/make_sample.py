"""Write the one-page practice form used by the learning app (sample/practice_form.pdf).

The form copies the layout of the AIS tables on purpose, with one example of each rule the
lessons teach, at round coordinates so the numbers are easy to follow:

  columns   code 40-90 | description 90-300 | answers 300-580 (split at 440 for two variants)
  A2.0      heading row with "Short WB | Long WB" (a section that names the columns)
  A2.2      one field over three rows: row names Van / Bus / Mini in a column at 240-300,
            and Bus + Mini share one merged answer cell
  A2.3      one merged answer "Refer Annexure S-1" covering A2.3, A2.3.1 and A2.3.2
  row 14    a heading row with no code: "Diesel | Electric"
  A3.2      an 8 pt wide empty sliver between two answers (a spacer)
  footer    the signature box, as a separate table

No PDF library is needed: the file is written directly with PDF drawing commands.
Run:  python specextract_journey/tools/make_sample.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "sample" / "practice_form.pdf"
W, H = 595.0, 842.0
TOP, ROW = 80.0, 22.0

# (x0, x1, first_row, last_row, text). Row 0 is the title (taller).
CELLS = [
    (40, 580, 0, 0, "Table 99 of AIS-007 (practice copy)\nPART P - PRACTICE SCHOOL BUS"),
    (40, 90, 1, 1, "A1.0"), (90, 300, 1, 1, "Maker details:"), (300, 580, 1, 1, ""),
    (40, 90, 2, 2, "A1.1"), (90, 300, 2, 2, "Maker name"), (300, 580, 2, 2, "Sunrise Motors Ltd"),
    (40, 90, 3, 3, "A1.2"), (90, 300, 3, 3, "Phone"), (300, 580, 3, 3, "NA"),
    (40, 90, 4, 4, "A1.3"), (90, 300, 4, 4, "Fax"), (300, 580, 4, 4, "--"),
    (40, 90, 5, 5, "A2.0"), (90, 300, 5, 5, "Size:"), (300, 440, 5, 5, "Short WB"), (440, 580, 5, 5, "Long WB"),
    (40, 90, 6, 6, "A2.1"), (90, 300, 6, 6, "Length (mm)"), (300, 440, 6, 6, "4200"), (440, 580, 6, 6, "4800"),
    (40, 90, 7, 9, "A2.2"), (90, 240, 7, 9, "Height (mm)"),
    (240, 300, 7, 7, "Van"), (300, 440, 7, 7, "2100"), (440, 580, 7, 7, "2150"),
    (240, 300, 8, 8, "Bus"), (300, 440, 8, 9, "2600"), (440, 580, 8, 9, "2700"),
    (240, 300, 9, 9, "Mini"),
    (40, 90, 10, 10, "A2.3"), (90, 300, 10, 10, "Seats"), (300, 580, 10, 12, "Refer Annexure S-1"),
    (40, 90, 11, 11, "A2.3.1"), (90, 300, 11, 11, "Front seats"),
    (40, 90, 12, 12, "A2.3.2"), (90, 300, 12, 12, "Rear seats"),
    (40, 90, 13, 13, "A3.0"), (90, 300, 13, 13, "Engine:"), (300, 580, 13, 13, ""),
    (40, 90, 14, 14, ""), (90, 300, 14, 14, ""), (300, 440, 14, 14, "Diesel"), (440, 580, 14, 14, "Electric"),
    (40, 90, 15, 15, "A3.1"), (90, 300, 15, 15, "Power"), (300, 440, 15, 15, "90 kW"), (440, 580, 15, 15, "120 kW"),
    (40, 90, 16, 16, "A3.2"), (90, 300, 16, 16, "Fuel tank"), (300, 432, 16, 16, "60 L"), (432, 440, 16, 16, ""), (440, 580, 16, 16, "NA"),
    (40, 90, 17, 17, "A3.3"), (90, 300, 17, 17, "Colour"), (300, 580, 17, 17, "Yellow"),
]
FOOTER_TOP = 760.0
FOOTER = [
    (40, 220, "Manufacturer:\nSignature, Name & Designation"),
    (220, 400, "Document No: PF-01\nDate: 01.10.2026"),
    (400, 580, "Test agency:\nSignature, Name & Designation"),
]


def row_top(r):
    return TOP if r == 0 else TOP + 32 + (r - 1) * ROW


def row_bottom(r):
    return TOP + 32 if r == 0 else row_top(r) + ROW


def esc(text):
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def text_ops(x, top, text, size=9):
    ops = []
    for i, line in enumerate(text.split("\n")):
        y = H - (top + 13 + i * 11)
        ops.append(f"BT /F1 {size} Tf {x:.2f} {y:.2f} Td ({esc(line)}) Tj ET")
    return ops


def content():
    ops = ["0.6 w 0 0 0 RG"]
    for x0, x1, r0, r1, text in CELLS:
        top, bottom = row_top(r0), row_bottom(r1)
        ops.append(f"{x0:.2f} {H - bottom:.2f} {x1 - x0:.2f} {bottom - top:.2f} re S")
        if text:
            ops += text_ops(x0 + 4, top + (3 if r0 == 0 else 1), text, 10 if r0 == 0 else 9)
    for x0, x1, text in FOOTER:
        ops.append(f"{x0:.2f} {H - FOOTER_TOP - 50:.2f} {x1 - x0:.2f} 50 re S")
        ops += text_ops(x0 + 4, FOOTER_TOP + 1, text, 8)
    return "\n".join(ops).encode("cp1252")


def write():
    stream = content()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W:.0f} {H:.0f}] /Contents 4 0 R "
        f"/Resources << /Font << /F1 5 0 R >> >> >>".encode(),
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    out += b"".join(f"{o:010d} 00000 n \n".encode() for o in offsets)
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(out)
    print("wrote", OUT, len(out), "bytes")


if __name__ == "__main__":
    write()
