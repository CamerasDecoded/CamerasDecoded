#!/usr/bin/env python3
"""Regenerate tonight.json from the live Arena round (Firestore REST, stdlib only).

Reads the round doc for today's Chicago date, splits its brief line
("<Challenge name> — <brief>") and writes tonight.json at the repo root.
Fails loudly (non-zero exit, no file written) when the round is missing,
closed, or unreadable — a stale file is worse than a failed run, because
agents check tonight.json's `date` field before quoting it.

Run from the repo root: python3 tools/tonight-json/generate.py
"""

import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

REPO = Path(__file__).resolve().parent.parent.parent
SITE = "https://camerasdecoded.com"
# Standing Arena rhythm (Chicago wall-clock times; the zone label handles DST).
ENTRIES_CLOSE = "19:00 America/Chicago"
VOTING_OPENS = "19:00 America/Chicago"
VOTING_CLOSES = "23:00 America/Chicago"
WINNER_NAMED = "~23:00 America/Chicago, crown lands ~23:30"


def get_api_key():
    text = (REPO / "scripts" / "firebase-init.js").read_text()
    m = re.search(r'apiKey:\s*"([^"]+)"', text)
    if not m:
        raise SystemExit("Could not find apiKey in scripts/firebase-init.js")
    return m.group(1)


def fetch_round(round_id, key):
    url = (
        "https://firestore.googleapis.com/v1/projects/cameras-decoded"
        f"/databases/(default)/documents/arenaRounds/{round_id}?key={key}"
    )
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Round {round_id} read failed: HTTP {e.code}")
    except Exception as e:
        raise SystemExit(f"Round {round_id} read failed: {e}")


def main():
    today = datetime.now(ZoneInfo("America/Chicago")).strftime("%Y-%m-%d")
    round_id = f"c-{today}"
    key = get_api_key()
    doc = fetch_round(round_id, key)
    fields = doc.get("fields", {})
    state = fields.get("state", {}).get("stringValue")
    if state not in ("open", "voting"):
        raise SystemExit(f"Round {round_id} is in state {state!r}; refusing to publish it")
    full = (
        fields.get("brief", {}).get("stringValue")
        or fields.get("text", {}).get("stringValue")
        or fields.get("title", {}).get("stringValue")
        or ""
    )
    if not full:
        raise SystemExit(f"Round {round_id} has no brief/title text")
    if " — " in full:
        name, brief = full.split(" — ", 1)
    else:
        name, brief = full, ""
    out = {
        "brief": brief.strip(),
        "challenge": name.strip(),
        "date": today,
        "enterUrl": f"{SITE}/missions.html",
        "entriesClose": ENTRIES_CLOSE,
        "roundId": round_id,
        "votingCloses": VOTING_CLOSES,
        "votingOpens": VOTING_OPENS,
        "winnerNamed": WINNER_NAMED,
    }
    (REPO / "tonight.json").write_text(json.dumps(out, sort_keys=True) + "\n")
    print(f"Wrote tonight.json for {today}: {out['challenge']} ({round_id}, state {state})")


if __name__ == "__main__":
    main()
