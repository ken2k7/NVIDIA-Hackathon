"""Loads the synthetic district dataset from disk and validates it.

Keeping all file-reading in one place means the API layer never touches the
filesystem directly — it just calls load_district() and gets a validated object.
"""

import json
from functools import lru_cache
from pathlib import Path

from app.models.schemas import District

# This file lives at backend/app/services/dataset.py, so parents[2] is backend/.
DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "district.json"


@lru_cache(maxsize=1)
def load_district() -> District:
    """Read district.json, validate it against the District schema, and return it.

    Cached so the file is read and validated only once per server run.
    Raises pydantic.ValidationError if the JSON doesn't match the schema.
    """
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return District.model_validate(raw)
