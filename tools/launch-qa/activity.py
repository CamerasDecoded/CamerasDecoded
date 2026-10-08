#!/usr/bin/env python3
"""
Launch QA activity script for Cameras Decoded.

Simulates realistic daily activity for the 4 launch accounts to catch
site issues before real users encounter them.

Credentials: read from LAUNCH_ACCOUNTS_JSON env var (JSON array of
{"username": ..., "email": ..., "password": ...}). The cron worker
fetches these from Secure Vault (custom.launch-accounts) at runtime.
NEVER log passwords.

Usage:
    LAUNCH_ACCOUNTS_JSON='[...]' python3 activity.py

Output:
    Appends timestamped findings to ~/workspace/launch-qa/ISSUES.md
"""

import json
import os
import socket
import sys
import time
import traceback
from datetime import datetime, timezone

SITE = "https://camerasdecoded.com"
REPORT = os.environ.get("QA_REPORT_PATH", os.path.expanduser("~/workspace/launch-qa/ISSUES.md"))
STATE_DIR = "/tmp/launch-qa-state"

# Per-account action plans (slightly different to vary coverage)
PLANS = {
    "maya.shoots": ["dashboard", "field_manual", "arcade_flashcards"],
    "lightchaser_jo": ["dashboard", "arena_daily", "leaderboard"],
    "aperture.ann": ["arcade", "dashboard", "arena_daily_vote"],
    "shutterbug_mike": ["leaderboard", "arena_daily", "dashboard"],
}


def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def append_report(lines):
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    if not os.path.exists(REPORT):
        with open(REPORT, "w") as f:
            f.write("# Launch QA Issue Report\n\n")
            f.write("Accumulating findings from automated daily activity runs ")
            f.write("by the 4 launch accounts. Issues are reported, not fixed.\n\n")
    with open(REPORT, "a") as f:
        f.write("\n".join(lines) + "\n")


class IssueCollector:
    def __init__(self):
        self.issues = []  # (severity, account, page, description)

    def add(self, severity, account, page, description):
        # Never allow passwords into the report
        for secret_word in ("password", "passwd", "pwd"):
            if secret_word in description.lower():
                description = "[REDACTED - contained credential-like text]"
                break
        self.issues.append((severity, account, page, description))
        log(f"ISSUE [{severity}] {account} @ {page}: {description[:120]}")


def _proxy_ipv4_host(hostname, port):
    """Return a working IPv4 literal for the proxy, or None.

    Prefer the hostname's own A record; otherwise probe the known egress
    endpoint (override via PROXY_IPV4_FALLBACK, comma-separated).
    NOTE (2026-10-07): the tunnel failures seen from background workers are
    caused by the egress proxy's identity-based policy denial
    (HTTP 403 "background_preparation_unavailable"), not by IPv4-vs-IPv6.
    This helper is kept as defense-in-depth for environments where the
    proxy hostname has no usable A record.
    """
    try:
        infos = socket.getaddrinfo(hostname, port, socket.AF_INET, socket.SOCK_STREAM)
        if infos:
            return infos[0][4][0]
    except OSError:
        pass
    for cand in os.environ.get("PROXY_IPV4_FALLBACK", "198.19.0.1").split(","):
        cand = cand.strip()
        if not cand:
            continue
        try:
            s = socket.create_connection((cand, port), timeout=5)
            s.close()
            return cand
        except OSError:
            continue
    return None


def get_proxy():
    """Build Playwright proxy config from env (Chromium doesn't read them).

    Playwright wants credentials as separate fields, not embedded in the URL.
    Prefers a literal IPv4 proxy address (verified working endpoint) over the
    hostname, which here resolves IPv6-only. See _proxy_ipv4_host note about
    the egress proxy's background-worker policy denial (2026-10-07).
    """
    from urllib.parse import urlparse
    for key in ("HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"):
        val = os.environ.get(key)
        if not val:
            continue
        p = urlparse(val)
        port = p.port or 3128
        host = _proxy_ipv4_host(p.hostname, port) or p.hostname
        server = f"{p.scheme}://{host}:{port}"
        cfg = {"server": server}
        if p.username:
            cfg["username"] = p.username
        if p.password:
            cfg["password"] = p.password
        return cfg
    return None


def launch_browser(pw):
    kwargs = dict(headless=True,
        args=["--no-sandbox", "--disable-dev-shm-usage",
              "--disable-blink-features=AutomationControlled",
              # This sandbox's Chromium build does not load the system CA store,
              # so even valid public certs fail with ERR_CERT_AUTHORITY_INVALID
              # (site cert verified fine via curl, 2026-10-07). Acceptable for a
              # QA harness hitting our own known site; not for general browsing.
              "--ignore-certificate-errors"],
    )
    # Use sandbox Chromium if available, else Playwright's default
    import os as _os
    _chrome = "/opt/meta-chromium/chrome"
    if _os.path.exists(_chrome):
        kwargs["executable_path"] = _chrome
    proxy = get_proxy()
    if proxy:
        kwargs["proxy"] = proxy
    return pw.chromium.launch(**kwargs)


def make_listeners(page, collector, account, page_name):
    def on_console(msg):
        if msg.type == "error":
            text = msg.text[:300]
            # Ignore known-benign sandbox noise
            if "firebase is not defined" in text:
                return
            collector.add("medium", account, page_name,
                          f"Console error: {text}")

    def on_pageerror(exc):
        collector.add("high", account, page_name,
                      f"Uncaught page error: {str(exc)[:300]}")

    def on_response(resp):
        try:
            if resp.status >= 400 and "camerasdecoded.com" in resp.url:
                # Skip favicon 404 noise
                if resp.status == 404 and "favicon" in resp.url:
                    return
                collector.add("medium", account, page_name,
                              f"HTTP {resp.status}: {resp.url[:150]}")
        except Exception:
            pass

    def on_requestfailed(req):
        url = req.url
        if ("camerasdecoded.com" in url or "firestore" in url
                or "firebase" in url):
            collector.add("medium", account, page_name,
                          f"Request failed: {url[:150]}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    page.on("response", on_response)
    page.on("requestfailed", on_requestfailed)


def check_broken_images(page, collector, account, page_name):
    try:
        broken = page.evaluate("""() => {
            const out = [];
            document.querySelectorAll('img').forEach(img => {
                // naturalWidth 0 + complete = broken (or empty src)
                if (img.complete && img.naturalWidth === 0 && img.src) {
                    out.push(img.src.slice(0, 150));
                }
            });
            return out;
        }""")
        for src in broken[:10]:
            # Skip data: URIs and known placeholders
            if src.startswith("data:"):
                continue
            collector.add("low", account, page_name,
                          f"Broken image: {src}")
        if broken:
            log(f"{account} @ {page_name}: {len(broken)} broken images")
    except Exception as e:
        collector.add("low", account, page_name,
                      f"Image check failed: {str(e)[:100]}")


def do_login(page, collector, account):
    email = account["email"]
    page_name = "login"
    try:
        page.goto(f"{SITE}/login.html", wait_until="domcontentloaded",
                  timeout=30000)
        page.wait_for_selector("#email", timeout=15000)
        page.fill("#email", email)
        page.fill("#password", account["password"])
        # Click the login button (not Google)
        btn = page.locator("button").filter(has_text="Log in").first
        if btn.count() == 0:
            btn = page.locator('button[type="submit"]').first
        btn.click()
        # Wait for auth to settle: either redirect or dashboard link
        page.wait_for_timeout(4000)
        # Verify login by checking for authenticated state
        auth_ok = page.evaluate("""() => {
            return !!(window.firebase && firebase.auth &&
                      firebase.auth().currentUser);
        }""")
        if not auth_ok:
            # Try once more after a longer wait (slow cold start)
            page.wait_for_timeout(5000)
            auth_ok = page.evaluate("""() => {
                return !!(window.firebase && firebase.auth &&
                          firebase.auth().currentUser);
            }""")
        if auth_ok:
            log(f"{account['username']}: login OK")
            return True
        collector.add("high", account["username"], page_name,
                      "Login failed: no authenticated Firebase user after submit")
        return False
    except Exception as e:
        collector.add("high", account["username"], page_name,
                      f"Login exception: {str(e)[:200]}")
        return False


def visit(page, collector, account, path, page_name, wait_ms=4000):
    """Navigate to a page, wait, run broken-image check."""
    try:
        page.goto(f"{SITE}{path}", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(wait_ms)
        check_broken_images(page, collector, account["username"], page_name)
        # Basic render sanity: body should have visible content
        has_content = page.evaluate(
            "() => document.body && document.body.innerText.trim().length > 50")
        if not has_content:
            collector.add("medium", account["username"], page_name,
                          "Page rendered with almost no text content")
        return True
    except Exception as e:
        collector.add("high", account["username"], page_name,
                      f"Navigation failed: {str(e)[:200]}")
        return False


def action_dashboard(page, collector, account):
    if not visit(page, collector, account, "/operator-dashboard.html",
                 "dashboard"):
        return
    # Check the Field Manual card shows real lesson counts (not "?")
    try:
        q_marks = page.evaluate("""() => {
            const els = document.querySelectorAll('*');
            let hits = [];
            els.forEach(el => {
                if (el.children.length === 0 && el.textContent &&
                    /Lesson 1 of \\?/.test(el.textContent)) {
                    hits.push(el.textContent.trim().slice(0, 60));
                }
            });
            return hits.slice(0, 3);
        }""")
        for h in q_marks:
            collector.add("medium", account["username"], "dashboard",
                          f"Stale 'Lesson 1 of ?' text visible: {h}")
    except Exception:
        pass


def action_field_manual(page, collector, account):
    visit(page, collector, account, "/field-manual.html", "field-manual")


def action_arcade(page, collector, account):
    if not visit(page, collector, account, "/arcade.html", "arcade",
                 wait_ms=6000):
        return
    # Verify game cards rendered
    try:
        count = page.evaluate(
            "() => document.querySelectorAll('.game-card').length")
        log(f"{account['username']}: arcade shows {count} game cards")
        if count == 0:
            collector.add("high", account["username"], "arcade",
                          "No game cards rendered (empty arcade)")
    except Exception as e:
        collector.add("low", account["username"], "arcade",
                      f"Card count check failed: {str(e)[:100]}")


def action_arcade_flashcards(page, collector, account):
    # Load the flashcards game directly and flip a card
    if not visit(page, collector, account,
                 "/play.html?slot=flashcards", "flashcards", wait_ms=6000):
        return
    try:
        # Wait for the game to mount
        page.wait_for_timeout(3000)
        # Try clicking the first card / flip control
        card = page.locator(".fc-card, .flashcard, [data-card]").first
        if card.count() > 0:
            card.click()
            page.wait_for_timeout(1500)
            log(f"{account['username']}: flipped a flashcard")
        else:
            # Game may use different selectors; check something rendered
            has_game = page.evaluate(
                "() => (document.body.innerText || '').length > 200")
            if not has_game:
                collector.add("medium", account["username"], "flashcards",
                              "Game page loaded but little content rendered")
    except Exception as e:
        collector.add("medium", account["username"], "flashcards",
                      f"Game interaction failed: {str(e)[:200]}")


def action_arena_daily(page, collector, account, try_vote=False):
    if not visit(page, collector, account, "/missions.html", "arena",
                 wait_ms=6000):
        return
    try:
        # Check for practice-mode fallback (means no live round)
        practice = page.evaluate("""() => {
            const t = document.body.innerText || '';
            return /practice mode/i.test(t);
        }""")
        if practice:
            collector.add("high", account["username"], "arena",
                          "Daily lane in PRACTICE MODE — no live round doc "
                          "(arenaRounds/c-<today> missing or closer failed)")
        # Look for vote buttons if requested
        if try_vote:
            vote_btn = page.locator(
                "button").filter(has_text="Vote").first
            if vote_btn.count() > 0 and vote_btn.is_visible():
                vote_btn.click()
                page.wait_for_timeout(2000)
                log(f"{account['username']}: cast a vote in Arena")
            else:
                log(f"{account['username']}: no vote button available")
    except Exception as e:
        collector.add("low", account["username"], "arena",
                      f"Arena check failed: {str(e)[:150]}")


def action_leaderboard(page, collector, account):
    if not visit(page, collector, account, "/leaderboard.html",
                 "leaderboard", wait_ms=6000):
        return
    try:
        # Check podium avatars render (initials or images, not empty)
        empty_podium = page.evaluate("""() => {
            const avs = document.querySelectorAll('.lb-pavatar');
            let empty = 0;
            avs.forEach(a => {
                const isImg = a.tagName === 'IMG' && a.src;
                const hasInitial = a.textContent.trim().length > 0;
                if (!isImg && !hasInitial) empty++;
            });
            return { total: avs.length, empty };
        }""")
        log(f"{account['username']}: leaderboard podium avatars "
            f"{empty_podium['total'] - empty_podium['empty']}/"
            f"{empty_podium['total']} populated")
        if empty_podium["empty"] > 0:
            collector.add("low", account["username"], "leaderboard",
                          f"{empty_podium['empty']} podium avatars empty "
                          "(no photo, no initial fallback)")
    except Exception as e:
        collector.add("low", account["username"], "leaderboard",
                      f"Avatar check failed: {str(e)[:150]}")


ACTIONS = {
    "dashboard": action_dashboard,
    "field_manual": action_field_manual,
    "arcade": action_arcade,
    "arcade_flashcards": action_arcade_flashcards,
    "arena_daily": lambda p, c, a: action_arena_daily(p, c, a, False),
    "arena_daily_vote": lambda p, c, a: action_arena_daily(p, c, a, True),
    "leaderboard": action_leaderboard,
}


def run_account(pw, account, collector):
    username = account["username"]
    log(f"--- Starting {username} ---")
    browser = None
    try:
        browser = launch_browser(pw)
        ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                        "Version/17.0 Mobile/15E148 Safari/604.1"),
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()
        make_listeners(page, collector, username, "session")

        if not do_login(page, collector, account):
            return

        for action_name in PLANS.get(username, ["dashboard"]):
            fn = ACTIONS.get(action_name)
            if not fn:
                continue
            log(f"{username}: action {action_name}")
            try:
                fn(page, collector, account)
            except Exception:
                collector.add("medium", username, action_name,
                              f"Action crashed: {traceback.format_exc()[:300]}")
            page.wait_for_timeout(1500)

        log(f"--- Finished {username} ---")
    except Exception:
        collector.add("high", username, "session",
                      f"Account run crashed: {traceback.format_exc()[:300]}")
    finally:
        if browser:
            browser.close()


def run_public_smoke(pw, collector):
    """Credential-free smoke test: exercises listeners + checks on public pages."""
    log("--- Public smoke test (no login) ---")
    browser = launch_browser(pw)
    try:
        ctx = browser.new_context(viewport={"width": 393, "height": 852})
        page = ctx.new_page()
        make_listeners(page, collector, "smoke", "session")
        for path, name in [("/arcade.html", "arcade"),
                           ("/leaderboard.html", "leaderboard")]:
            try:
                page.goto(f"{SITE}{path}", wait_until="domcontentloaded",
                          timeout=30000)
                page.wait_for_timeout(5000)
                check_broken_images(page, collector, "smoke", name)
                log(f"smoke: {name} loaded OK")
            except Exception as e:
                collector.add("medium", "smoke", name,
                              f"Smoke nav failed: {str(e)[:150]}")
    finally:
        browser.close()


def main():
    from playwright.sync_api import sync_playwright

    smoke_only = "--public-only" in sys.argv

    collector = IssueCollector()
    run_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    with sync_playwright() as pw:
        if smoke_only:
            run_public_smoke(pw, collector)
        else:
            raw = os.environ.get("LAUNCH_ACCOUNTS_JSON", "")
            if not raw:
                print("FATAL: LAUNCH_ACCOUNTS_JSON env var is empty. "
                      "Fetch credentials from Secure Vault (custom.launch-accounts).",
                      file=sys.stderr)
                sys.exit(2)
            try:
                accounts = json.loads(raw)
            except json.JSONDecodeError as e:
                print(f"FATAL: bad LAUNCH_ACCOUNTS_JSON: {e}", file=sys.stderr)
                sys.exit(2)

            # Validate shape without printing secrets
            for a in accounts:
                if not all(k in a for k in ("username", "email", "password")):
                    print("FATAL: account entry missing username/email/password",
                          file=sys.stderr)
                    sys.exit(2)
            log(f"Loaded {len(accounts)} accounts (usernames: "
                f"{', '.join(a['username'] for a in accounts)})")

            for account in accounts:
                try:
                    run_account(pw, account, collector)
                except Exception:
                    collector.add("high", account.get("username", "?"), "session",
                                  f"Top-level failure: {traceback.format_exc()[:200]}")
                time.sleep(2)

    # Write report
    n_accounts = len(accounts) if not smoke_only else 0
    lines = [f"## Run {run_ts}",
             f"Accounts exercised: {n_accounts}"
             + (" (public smoke test, no login)" if smoke_only else ""),
             ""]
    if not collector.issues:
        lines.append("No issues found this run. All pages loaded clean.")
    else:
        # Sort: high first
        order = {"high": 0, "medium": 1, "low": 2}
        for sev, acct, page_name, desc in sorted(
                collector.issues, key=lambda i: order.get(i[0], 3)):
            lines.append(f"- **[{sev.upper()}]** `{acct}` @ `{page_name}`: {desc}")
    lines.append("")
    append_report(lines)

    n_high = sum(1 for i in collector.issues if i[0] == "high")
    log(f"Run complete: {len(collector.issues)} issues "
        f"({n_high} high). Report: {REPORT}")


if __name__ == "__main__":
    main()
