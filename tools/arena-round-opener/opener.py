#!/usr/bin/env python3
"""Arena daily round opener — GitHub Actions version.

Creates tomorrow's daily challenge round doc (arenaRounds/c-YYYY-MM-DD)
the night before, in America/Chicago time, so the Arena never sits in
"practice mode" waiting on a manual round creation.

This is a backstop for the arena-closer's openNextRounds phase: it only
creates the round when the closer hasn't already, and only when the
prompt doc exists (it will not invent prompts — same rule as the closer).

Reads:
  SERVICE_ACCOUNT_JSON — repo secret (Firebase service account JSON)

Writes (only if missing):
  arenaRounds/c-{YYYY-MM-DD} = {
      lane: 'daily', title, brief, text, state: 'open',
      opensAt, votingAt, closesAt, entryCount: 0,
      winnerEntryId: None, winnerUid: None,
      createdAt: serverTimestamp(),
  }

Exit 0 on success or already-exists. Exit 1 on misconfiguration or
Firestore errors. Missing prompt -> logs and exits 0 (nothing to do).
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
except ImportError:  # Python < 3.9 fallback (runner uses 3.11)
    ZoneInfo = None

import firebase_admin
from firebase_admin import credentials, firestore

CHICAGO = "America/Chicago"


def chicago_now():
    if ZoneInfo:
        return datetime.now(ZoneInfo(CHICAGO))
    # Fallback: CDT is UTC-5 (runner has tzdata via system)
    return datetime.now(timezone.utc) - timedelta(hours=5)


def main():
    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if not sa_json:
        print("ERROR: SERVICE_ACCOUNT_JSON env var is missing.", file=sys.stderr)
        sys.exit(1)

    try:
        service_account = json.loads(sa_json)
    except json.JSONDecodeError as e:
        print(f"ERROR: SERVICE_ACCOUNT_JSON is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    cred = credentials.Certificate(service_account)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass  # already initialized (tests)
    db = firestore.client()

    tomorrow = chicago_now().date() + timedelta(days=1)
    date_str = tomorrow.isoformat()  # YYYY-MM-DD
    round_id = f"c-{date_str}"

    # Idempotency: never clobber an existing round (closer may have made it).
    round_ref = db.collection("arenaRounds").document(round_id)
    if round_ref.get().exists:
        print(f"arenaRounds/{round_id} already exists — nothing to do.")
        return

    # Never invent prompts: the prompt doc must exist.
    prompt_ref = db.collection("arenaPrompts").document(date_str)
    prompt_snap = prompt_ref.get()
    if not prompt_snap.exists:
        print(
            f"arenaPrompts/{date_str} is MISSING — round NOT created. "
            "Seed the prompt (seed-arena workflow) and re-run."
        )
        return

    prompt_data = prompt_snap.to_dict() or {}
    text = (prompt_data.get("text") or "").strip()
    if not text:
        print(f"arenaPrompts/{date_str} has empty text — round NOT created.")
        return

    # Timestamps aligned to Chicago midnight, matching the client's
    # ymdChicago() round lookup (PR #404).
    if ZoneInfo:
        tz = ZoneInfo(CHICAGO)
        opens_at = datetime(tomorrow.year, tomorrow.month, tomorrow.day, tzinfo=tz)
    else:
        opens_at = datetime(
            tomorrow.year, tomorrow.month, tomorrow.day, tzinfo=timezone.utc
        ) + timedelta(hours=5)
    voting_at = opens_at + timedelta(hours=18)
    closes_at = opens_at + timedelta(hours=24)

    title = text if len(text) <= 80 else text[:77] + "\u2026"

    round_ref.set(
        {
            "lane": "daily",
            "title": title,
            "brief": text,
            "text": text,
            "state": "open",
            "opensAt": opens_at,
            "votingAt": voting_at,
            "closesAt": closes_at,
            "entryCount": 0,
            "winnerEntryId": None,
            "winnerUid": None,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )
    print(f"Created arenaRounds/{round_id} (state=open, lane=daily).")


if __name__ == "__main__":
    main()
