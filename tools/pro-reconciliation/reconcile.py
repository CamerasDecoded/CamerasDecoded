#!/usr/bin/env python3
"""
Pro subscription reconciliation for Cameras Decoded.

Compares active Stripe subscriptions against Firestore `users` tier flags and
reports mismatches:

  CANCELLED BUT STILL PRO — tier == 'pro' in Firestore but no active Stripe
      subscription. These users cancelled (or their payment failed) but keep
      Pro access. Revenue leakage.

  PAYING BUT NOT PRO — active Stripe subscription but tier != 'pro' in
      Firestore. These users paid but were never activated (e.g. the
      signed-out-after-redirect bug). They deserve Pro access.

Matching is done on email (lowercased): Stripe customer email <-> users.email.

Env vars (required):
  STRIPE_SECRET_KEY   — Stripe secret key (repo secret)
  SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret)

Env vars (optional):
  RECONCILIATION_REPORT_PATH — where to write the markdown report
      (default: /tmp/pro-reconciliation/REPORT.md)

Exit code: 0 always (the report is the deliverable). The workflow step
parses the report and raises a ::warning:: annotation when mismatches exist.
"""

import json
import os
import sys
from datetime import datetime, timezone


REPORT_PATH = os.environ.get(
    "RECONCILIATION_REPORT_PATH", "/tmp/pro-reconciliation/REPORT.md"
)


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(2)


def get_stripe_active_emails():
    """Return {email_lower: (customer_id, [subscription_ids])} for active subs."""
    import stripe

    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        fail("STRIPE_SECRET_KEY env var is not set")
    stripe.api_key = key

    active = {}
    # auto_paging_iter handles pagination transparently.
    subs = stripe.Subscription.list(status="active", limit=100, expand=["data.customer"])
    count = 0
    for sub in subs.auto_paging_iter():
        count += 1
        customer = sub.customer
        email = None
        customer_id = None
        if isinstance(customer, dict):
            email = customer.get("email")
            customer_id = customer.get("id")
        elif customer:
            customer_id = str(customer)
        if email:
            key_email = email.strip().lower()
            entry = active.setdefault(key_email, {"customer_id": customer_id, "subs": []})
            entry["subs"].append(sub.id)
    print(f"Stripe: {count} active subscriptions, {len(active)} unique customer emails")
    return active


def get_firestore_pro_users():
    """Return {email_lower: (uid, tier, email)} for users with tier == 'pro'."""
    import firebase_admin
    from firebase_admin import credentials, firestore

    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if not sa_json:
        fail("SERVICE_ACCOUNT_JSON env var is not set")
    try:
        sa_dict = json.loads(sa_json)
    except json.JSONDecodeError:
        fail("SERVICE_ACCOUNT_JSON is not valid JSON")

    cred = credentials.Certificate(sa_dict)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass  # already initialized (shouldn't happen in a fresh process)

    db = firestore.client()
    pro_users = {}
    total = 0
    for doc in db.collection("users").where("tier", "==", "pro").stream():
        total += 1
        data = doc.to_dict() or {}
        email = (data.get("email") or "").strip().lower()
        if email:
            pro_users[email] = {
                "uid": doc.id,
                "email": data.get("email"),
                "displayName": data.get("displayName"),
            }
    print(f"Firestore: {total} users with tier == 'pro' ({len(pro_users)} with email)")
    return pro_users


def build_report(stripe_active, pro_users):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = []
    lines.append("# Pro Subscription Reconciliation")
    lines.append("")
    lines.append(f"Generated: {now}")
    lines.append("")
    lines.append(f"- Active Stripe subscriptions (unique emails): {len(stripe_active)}")
    lines.append(f"- Firestore users with tier == 'pro' (with email): {len(pro_users)}")
    lines.append("")

    cancelled_but_pro = sorted(set(pro_users) - set(stripe_active))
    paying_but_not_pro = sorted(set(stripe_active) - set(pro_users))

    lines.append("## CANCELLED BUT STILL PRO")
    lines.append("")
    if cancelled_but_pro:
        lines.append(
            f"{len(cancelled_but_pro)} user(s) have Pro in Firestore but no active "
            "Stripe subscription. They cancelled (or payment failed) but keep Pro access."
        )
        lines.append("")
        for email in cancelled_but_pro:
            u = pro_users[email]
            name = f" ({u['displayName']})" if u.get("displayName") else ""
            lines.append(f"- [CANCELLED] {u.get('email') or email}{name} — uid `{u['uid']}`")
    else:
        lines.append("None. All Firestore Pro users have an active Stripe subscription.")
    lines.append("")

    lines.append("## PAYING BUT NOT PRO")
    lines.append("")
    if paying_but_not_pro:
        lines.append(
            f"{len(paying_but_not_pro)} email(s) have an active Stripe subscription "
            "but no Pro tier in Firestore. These buyers paid but were never activated."
        )
        lines.append("")
        for email in paying_but_not_pro:
            s = stripe_active[email]
            lines.append(
                f"- [UNACTIVATED] {email} — customer `{s['customer_id']}`, "
                f"sub(s) `{', '.join(s['subs'])}`"
            )
    else:
        lines.append("None. Every active Stripe subscriber has Pro in Firestore.")
    lines.append("")

    return "\n".join(lines), len(cancelled_but_pro), len(paying_but_not_pro)


def main():
    stripe_active = get_stripe_active_emails()
    pro_users = get_firestore_pro_users()
    report, n_cancelled, n_unactivated = build_report(stripe_active, pro_users)

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        f.write(report)
    print(f"Report written to {REPORT_PATH}")

    # Machine-readable summary for the workflow step.
    print(f"::notice::Reconciliation: {n_cancelled} cancelled-but-pro, "
          f"{n_unactivated} paying-but-not-pro")

    # Also print the report to stdout for the Actions log.
    print()
    print(report)


if __name__ == "__main__":
    main()
