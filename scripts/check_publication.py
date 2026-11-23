"""Explicit release gate before anonymous public deployment."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
config = json.loads((ROOT / "public" / "site_config.json").read_text(encoding="utf-8"))
operator = config.get("operator_name", "").strip()
email = config.get("contact_email", "").strip()
if len(operator) < 3:
    raise SystemExit("Publication blocked: set a real operator_name in public/site_config.json")
if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or email.lower().endswith("@example.com"):
    raise SystemExit("Publication blocked: set a working contact_email in public/site_config.json")
print("Publication identity check passed")
