#!/usr/bin/env python3
"""
Blog search index generator for Cameras Decoded.

Scans blog/*.html, extracts title, description, date, section, and full
article text, then writes a JSON search index.

Usage:
    python3 tools/blog-index/generate.py

Output:
    blog/search-index.json

The index is designed for two-tier search:
  - Tier 1 (light): title, excerpt, url, date, section — instant results
  - Tier 2 (full): body text — deeper matching, loaded on demand

New articles just need to follow blog-post-template.html. Re-run this
script (or let the GitHub Action do it) after adding a post.
"""

import json
import re
import sys
from html import unescape
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BLOG_DIR = REPO_ROOT / "blog"
OUTPUT = BLOG_DIR / "search-index.json"


def extract_meta(html: str, attr: str, value: str) -> str:
    """Extract content from <meta property|name="value" content="...">."""
    pattern = rf'<meta\s+(?:property|name)="{re.escape(value)}"\s+content="([^"]*)"'
    m = re.search(pattern, html)
    if m:
        return unescape(m.group(1)).strip()
    # Try reversed attribute order
    pattern = rf'<meta\s+content="([^"]*)"\s+(?:property|name)="{re.escape(value)}"'
    m = re.search(pattern, html)
    return unescape(m.group(1)).strip() if m else ""


def extract_title(html: str) -> str:
    m = re.search(r"<title>(.*?)</title>", html, re.DOTALL)
    if not m:
        return ""
    title = unescape(m.group(1)).strip()
    # Strip the site suffix: "Post Title — Cameras Decoded"
    title = re.sub(r"\s*[—–-]\s*Cameras Decoded\s*$", "", title)
    return title


def extract_body_text(html: str) -> str:
    """Pull text from the <article> element, stripped of tags."""
    m = re.search(r"<article[^>]*>(.*?)</article>", html, re.DOTALL)
    if not m:
        # Fallback: try <main>
        m = re.search(r"<main[^>]*>(.*?)</main>", html, re.DOTALL)
    if not m:
        return ""
    body = m.group(1)
    # Remove script and style blocks
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", body, flags=re.DOTALL)
    # Strip all tags
    body = re.sub(r"<[^>]+>", " ", body)
    # Decode entities, collapse whitespace
    body = unescape(body)
    body = re.sub(r"\s+", " ", body).strip()
    return body


def build_entry(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    slug = path.stem
    title = extract_title(html)
    excerpt = extract_meta(html, "name", "description")
    date = extract_meta(html, "property", "article:published_time")
    section = extract_meta(html, "property", "article:section")
    body = extract_body_text(html)

    return {
        "slug": slug,
        "url": f"/blog/{slug}.html",
        "title": title,
        "excerpt": excerpt,
        "date": date,
        "section": section,
        # Full body text for tier-2 deep search
        "body": body,
    }


def main() -> int:
    if not BLOG_DIR.is_dir():
        print(f"Blog dir not found: {BLOG_DIR}", file=sys.stderr)
        return 1

    entries = []
    for path in sorted(BLOG_DIR.glob("*.html")):
        if path.name == "search-index.json":
            continue
        try:
            entry = build_entry(path)
            if entry["title"] and entry["body"]:
                entries.append(entry)
                print(f"  indexed: {entry['slug']} ({len(entry['body'])} chars)")
            else:
                print(f"  skipped (no title/body): {path.name}", file=sys.stderr)
        except Exception as e:
            print(f"  error on {path.name}: {e}", file=sys.stderr)

    # Newest first
    entries.sort(key=lambda e: e["date"], reverse=True)

    payload = {
        "generated": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
        "count": len(entries),
        "articles": entries,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\nWrote {OUTPUT} — {len(entries)} articles, {size_kb:.1f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
