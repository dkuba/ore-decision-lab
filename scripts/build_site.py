"""Create GitHub Pages-ready static dist. No Python runtime on GitHub Pages."""
from pathlib import Path
import shutil
import json
import hashlib

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
for src, dest in [
    (ROOT / "public" / "index.html", DIST / "index.html"),
    (ROOT / "public" / "styles.css", DIST / "styles.css"),
    (ROOT / "public" / "site_config.json", DIST / "site_config.json"),
    (ROOT / "public" / "data", DIST / "data"),
    (ROOT / "public" / "protocols", DIST / "protocols"),
    (ROOT / "public" / "docs", DIST / "docs"),
]:
    if src.is_dir():
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
    elif src.is_file():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    else:
        raise SystemExit(f"Missing: {src}")
files = []
for item in sorted(DIST.rglob("*")):
    if item.is_file() and item.name != "build-manifest.json":
        files.append({"path": str(item.relative_to(DIST)), "sha256": hashlib.sha256(item.read_bytes()).hexdigest(), "bytes": item.stat().st_size})
(DIST / "build-manifest.json").write_text(json.dumps({"kind": "odl-static-assets", "files": files}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"GitHub Pages artifact: {DIST}, {len(files)} verified static files")
