"""Shared helpers: paths, config, and the review record contract."""

import json
import re
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / "config.json").read_text())


def _load_dotenv() -> None:
    """Read KEY=VALUE pairs from a local .env for development runs.

    .env is gitignored — never commit it. In Actions the values come from repository
    secrets instead, and anything already in the environment wins over the file.
    """
    import os
    path = ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


_load_dotenv()

DATA = ROOT / "data"
REVIEWS_PATH = DATA / "reviews.json"
DERIVED = DATA / "derived"
SNAPSHOTS = DATA / "snapshots"

# Fields every stored review must carry. See docs/SCHEMA.md.
REQUIRED_FIELDS = (
    "id", "source", "date", "rating", "author", "author_location",
    "title", "text", "themes", "sentiment", "responded", "response_text",
)


def today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def load_reviews() -> dict:
    if REVIEWS_PATH.exists():
        return json.loads(REVIEWS_PATH.read_text())
    return {
        "schema_version": "1.0",
        "entity": CONFIG["entity"]["name"],
        "address": CONFIG["entity"]["address"],
        "last_updated": today(),
        "reviews": [],
    }


def save_reviews(doc: dict) -> None:
    doc["last_updated"] = today()
    doc["reviews"].sort(key=lambda r: (r.get("date") or "", r.get("id") or ""), reverse=True)
    write_json(REVIEWS_PATH, doc)


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def slugify(value: str, maxlen: int = 24) -> str:
    """Lowercase ASCII slug. Used only to build stable review ids."""
    value = unicodedata.normalize("NFKD", value or "")
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "", value).lower()
    return (value or "anon")[:maxlen]


def make_id(source: str, date_str: str, author: str) -> str:
    return f"{source}-{(date_str or 'undated')[:10]}-{slugify(author)}"


def parse_date(value) -> str | None:
    """Best-effort normalisation to YYYY-MM-DD. Returns None rather than guessing."""
    if not value:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(value / 1000 if value > 1e11 else value,
                                          tz=timezone.utc).date().isoformat()
        except (ValueError, OSError, OverflowError):
            return None
    s = str(value).strip()
    if not s:
        return None
    # ISO 8601, with or without time and zone
    m = re.match(r"^(\d{4}-\d{2}-\d{2})", s)
    if m:
        return m.group(1)
    for fmt in ("%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    # "Aug 2026" style — month precision only
    m = re.match(r"^([A-Za-z]{3,9})\s+(\d{4})$", s)
    if m:
        for fmt in ("%B %Y", "%b %Y"):
            try:
                return datetime.strptime(s, fmt).date().replace(day=1).isoformat()
            except ValueError:
                continue
    return None


def days_ago(date_str: str, reference: date | None = None) -> int | None:
    d = parse_date(date_str)
    if not d:
        return None
    ref = reference or datetime.now(timezone.utc).date()
    return (ref - date.fromisoformat(d)).days


def blank_record(**kwargs) -> dict:
    """A record with every required field present. Unknown means None, never a guess."""
    record = {
        "id": None, "source": None, "date": None, "visit_period": None,
        "rating": None, "recommends": None, "tone": None,
        "author": None, "author_location": None,
        "trip_type": None, "title": None, "text": "", "text_complete": True,
        "themes": [], "sentiment": None, "unmatched": None,
        "responded": False, "response_text": None,
        "url": None, "collected_at": today(),
    }
    record.update(kwargs)
    return record
