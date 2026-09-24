"""Build the in-site evidence index from the three verified research dossiers."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DOSSIERS = ROOT / "research"
DOMAINS = {"blink": "Blink", "deps": "Dependencies", "cicd": "CI and releases"}


def cells(line: str) -> list[str]:
    return [cell.strip().replace(r"\|", "|") for cell in re.split(r"(?<!\\)\|", line.strip().strip("|"))]


facts: list[dict[str, str]] = []
open_questions: list[dict[str, str]] = []

for slug, domain in DOMAINS.items():
    text = (DOSSIERS / {"blink": "blink-dossier.md", "deps": "deps-dossier.md", "cicd": "cicd-dossier.md"}[slug]).read_text()
    ledger = text.split("## 2. Facts ledger", 1)[1].split("## 3. Code excerpts", 1)[0]
    for line in ledger.splitlines():
        if not line.startswith("|"):
            continue
        row = cells(line)
        if len(row) != 5 or row[0] in {"ID", "---"} or row[0].startswith("---"):
            continue
        id_, claim, source, evidence, confidence = row
        facts.append({"id": id_, "domain": domain, "claim": claim, "source": source,
                      "evidence": evidence, "confidence": confidence})

    open_text = text.split("## 9. Still unverified / open", 1)[1]
    current = None
    for line in open_text.splitlines():
        start = re.match(r"^\d+\.\s+(.*)", line)
        if start:
            current = {"domain": domain, "question": start.group(1).strip()}
            open_questions.append(current)
        elif current and line.strip() and not line.startswith("**"):
            current["question"] += " " + line.strip()

output = {"revision": "f288fed6c601ae22461c9c9d8189004050abfaeb",
          "facts": facts, "openQuestions": open_questions}
(ROOT / "data" / "evidence.json").write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")))
print(f"Wrote {len(facts)} verified-ledger rows and {len(open_questions)} open questions")
