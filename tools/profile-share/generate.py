#!/usr/bin/env python3
"""Generate per-profile share pages (p/<uid>/index.html).

Chat apps build link previews from the static HTML they fetch: they never
run JS, so profile.html?u=<uid> previews as a bare generic card for every
profile. These share pages carry that person's own Open Graph tags (name,
pitch, avatar) and redirect humans to the real profile with JS only — no
meta refresh, so crawlers read the tags instead of following the redirect.

Source of truth: the publicProfiles collection (public read). Run by the
hourly Actions workflow, and by hand for the initial pages:

    python3 tools/profile-share/generate.py

Writes only files whose content changed, and removes share pages for
profiles that no longer exist. The Firestore API key is the public web
key, read from scripts/firebase-init.js — never a secret.
"""
import html
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "p"
PROJECT = "cameras-decoded"
SITE = "https://camerasdecoded.com"
DEFAULT_IMAGE = f"{SITE}/og-image.jpg"
UID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def read_api_key():
    init = (ROOT / "scripts" / "firebase-init.js").read_text()
    m = re.search(r'apiKey:\s*"([^"]+)"', init)
    if not m:
        raise SystemExit("apiKey not found in scripts/firebase-init.js")
    return m.group(1)


def list_public_profiles(api_key):
    """All publicProfiles docs via the Firestore REST API (public read)."""
    docs = []
    url = (
        f"https://firestore.googleapis.com/v1/projects/{PROJECT}"
        f"/databases/(default)/documents/publicProfiles?pageSize=100&key={api_key}"
    )
    while url:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.load(resp)
        docs.extend(data.get("documents", []))
        token = data.get("nextPageToken")
        url = url.split("&pageToken=")[0] + f"&pageToken={token}" if token else None
    return docs


def str_field(fields, name):
    v = fields.get(name, {})
    return v.get("stringValue", "") or ""


def int_field(fields, name):
    v = fields.get(name, {})
    try:
        return int(v.get("integerValue", 0))
    except (TypeError, ValueError):
        return 0


def card_for(uid, fields):
    """Open Graph values for one profile. Every field is optional."""
    name = str_field(fields, "displayName").strip()
    username = str_field(fields, "username").strip()
    bio = str_field(fields, "bio").strip()
    avatar = str_field(fields, "avatarUrl").strip()
    badges = int_field(fields, "badgeCount")
    streak = int_field(fields, "streakDays")

    title_name = name or (f"@{username}" if username else "Cameras Decoded operator")
    title = f"{title_name} — Cameras Decoded"
    if username and name:
        title = f"{name} (@{username}) — Cameras Decoded"

    if bio:
        desc = bio if len(bio) <= 200 else bio[:197].rstrip() + "…"
    else:
        proof = []
        if badges:
            proof.append(f"{badges} badge{'s' if badges != 1 else ''}")
        if streak:
            proof.append(f"{streak}-day streak")
        if proof:
            desc = " · ".join(proof) + " on Cameras Decoded — judged blind, proven nightly."
        else:
            desc = "Photographer on Cameras Decoded — judged blind, proven nightly."

    return {
        "uid": uid,
        "title": title,
        "description": desc,
        "image": avatar or DEFAULT_IMAGE,
        "image_alt": f"{title_name}'s profile photo" if avatar else "Cameras Decoded",
        "name": title_name,
    }


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:image" content="{image}" />
  <meta property="og:image:alt" content="{image_alt}" />
  <meta property="og:url" content="{url}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="{image}" />
  <script>
    // Humans go straight to the live profile (query string forwarded, so
    // badge replay links keep working). Crawlers never run this, so they
    // read the Open Graph tags above instead. No meta refresh on purpose:
    // some crawlers follow one and would land on the tag-less profile page.
    (function () {{
      var q = location.search ? location.search.replace(/^\\?/, "&") : "";
      location.replace("/profile.html?u={uid}" + q + location.hash);
    }})();
  </script>
  <style>
    body {{ background: #040406; color: #e8e8e8; font-family: system-ui, sans-serif;
           display: flex; min-height: 100vh; margin: 0; align-items: center;
           justify-content: center; text-align: center; }}
    a {{ color: #8deb00; }}
  </style>
</head>
<body>
  <p>Opening {name}&rsquo;s profile&hellip; <a href="/profile.html?u={uid}">Tap here if nothing happens.</a></p>
</body>
</html>
"""

INDEX_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex" />
  <title>Cameras Decoded</title>
  <script>location.replace("/");</script>
</head>
<body>
  <p><a href="/">Cameras Decoded</a></p>
</body>
</html>
"""


def render(card):
    esc = lambda s: html.escape(s, quote=True)
    return PAGE.format(
        title=esc(card["title"]),
        description=esc(card["description"]),
        image=esc(card["image"]),
        image_alt=esc(card["image_alt"]),
        url=f"{SITE}/p/{card['uid']}",
        uid=card["uid"],
        name=esc(card["name"]),
    )


def write_if_changed(path, content):
    if path.exists() and path.read_text() == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return True


def main():
    docs = list_public_profiles(read_api_key())
    live_uids = set()
    written = 0
    for doc in docs:
        uid = doc["name"].rsplit("/", 1)[-1]
        if not UID_RE.match(uid):
            print(f"skip odd uid: {uid!r}", file=sys.stderr)
            continue
        live_uids.add(uid)
        card = card_for(uid, doc.get("fields", {}))
        if write_if_changed(OUT_DIR / uid / "index.html", render(card)):
            written += 1
            print(f"wrote p/{uid}/index.html ({card['title']})")

    if write_if_changed(OUT_DIR / "index.html", INDEX_PAGE):
        written += 1
        print("wrote p/index.html")

    removed = 0
    if OUT_DIR.exists():
        for child in OUT_DIR.iterdir():
            if child.is_dir() and child.name not in live_uids:
                shutil.rmtree(child)
                removed += 1
                print(f"removed p/{child.name}/ (profile gone)")

    print(f"{len(live_uids)} profiles, {written} written, {removed} removed")


if __name__ == "__main__":
    main()
