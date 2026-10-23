#!/usr/bin/env python3
"""Arena round repair — one-off fix for the Oct 2026 lane incident.

Background: the round opener (and other legacy writers) wrote daily round
docs with lane='daily', but the arena closer only advances/closes rounds
whose lane is 'challenge' or 'mission'. Rounds labeled 'daily' were
invisible to the closer: they never advanced, never closed, and never
crowned a winner, while the closer runs reported success.

This script repairs every arenaRounds doc still carrying the legacy label:

  * Current rounds (c-2026-10-21 and later): lane -> 'challenge', and
    votingAt/closesAt recomputed from opensAt using the closer's own
    convention (votingAt = opensAt + 19h = 7 PM Chicago, closesAt =
    opensAt + 23h = 11 PM Chicago). The closer then closes and crowns
    them normally on its next run.
  * Stale rounds (dated before c-2026-10-21 — pre-launch leftovers that
    sat open unnoticed): lane -> 'challenge' AND state -> 'closed' with
    no winner, in the same write, so the closer never picks them up and
    no week-old winner announcements or broadcasts are emitted.

It also prints a Monday-readiness report for the weekly mission lane:
how many unused briefs sit in arenaBriefQueue and the state of every
mission round doc. Read-only; missions themselves are never modified.

Reads:
  SERVICE_ACCOUNT_JSON — repo secret (Firebase service account JSON)

Idempotent: a second run finds no lane='daily' docs and writes nothing.
Exit 0 on success, 1 on misconfiguration or Firestore errors.
"""

import json
import os
import re
import sys
from datetime import date, timedelta

import firebase_admin
from firebase_admin import credentials, firestore

# Rounds dated before this are stale leftovers -> quiet-close, never crown.
STALE_BEFORE = date(2026, 10, 21)

ROUND_ID_DATE = re.compile(r"^c-(\d{4})-(\d{2})-(\d{2})$")


def round_date(doc_id):
    m = ROUND_ID_DATE.match(doc_id)
    if not m:
        return None
    return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))


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

    rounds = db.collection("arenaRounds")

    # --- repair every legacy-labeled round -------------------------------
    legacy = rounds.where("lane", "==", "daily").get()
    if not legacy:
        print("No lane='daily' rounds found — nothing to repair.")
    for doc in legacy:
        data = doc.to_dict() or {}
        rdate = round_date(doc.id)
        if rdate is not None and rdate < STALE_BEFORE:
            doc.reference.update(
                {
                    "lane": "challenge",
                    "state": "closed",
                    "winnerEntryId": None,
                    "winnerUid": None,
                    "repairedAt": firestore.SERVER_TIMESTAMP,
                    "repairNote": (
                        "quiet-closed by arena-round-repair: stale legacy "
                        "round (lane='daily'), no crown, no broadcast"
                    ),
                }
            )
            print(f"{doc.id}: lane daily->challenge, state -> closed (stale, quiet)")
            continue

        update = {
            "lane": "challenge",
            "repairedAt": firestore.SERVER_TIMESTAMP,
            "repairNote": "lane daily->challenge by arena-round-repair",
        }
        opens_at = data.get("opensAt")
        if opens_at is not None:
            update["votingAt"] = opens_at + timedelta(hours=19)
            update["closesAt"] = opens_at + timedelta(hours=23)
        doc.reference.update(update)
        print(
            f"{doc.id}: lane daily->challenge"
            + (
                f", votingAt -> {update['votingAt']}, closesAt -> {update['closesAt']}"
                if "votingAt" in update
                else " (no opensAt — times untouched)"
            )
        )

    # --- Monday readiness: mission brief queue + mission rounds ----------
    print("--- Monday readiness (mission lane) ---")
    try:
        unused = db.collection("arenaBriefQueue").where("used", "==", False).get()
        print(f"arenaBriefQueue: {len(unused)} unused brief(s)")
        for doc in unused[:3]:
            d = doc.to_dict() or {}
            print(f"  next unused: {doc.id} — {str(d.get('title'))[:60]}")
    except Exception as e:  # report, never fail the repair on the readout
        print(f"arenaBriefQueue: could not read ({e})")

    all_rounds = rounds.get()
    missions = [d for d in all_rounds if d.id.startswith("m-")]
    if missions:
        for doc in missions:
            d = doc.to_dict() or {}
            print(
                f"mission round {doc.id}: lane={d.get('lane')} "
                f"state={d.get('state')} closesAt={d.get('closesAt')}"
            )
    else:
        print("mission rounds: none present")

    live = [
        d
        for d in all_rounds
        if (d.to_dict() or {}).get("state") in ("open", "voting")
    ]
    print(f"--- live rounds after repair: {len(live)} ---")
    for doc in live:
        d = doc.to_dict() or {}
        print(
            f"  {doc.id}: lane={d.get('lane')} state={d.get('state')} "
            f"votingAt={d.get('votingAt')} closesAt={d.get('closesAt')}"
        )

    print("arena round repair complete")


if __name__ == "__main__":
    main()
