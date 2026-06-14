"""
ToyzGuru Email Proxy Server (Python/Flask)
Sends transactional emails via Zoho SMTP using smtplib.
Runs on port 3001 alongside the static frontend on port 3000.
"""

import smtplib
import ssl
import json
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─── Config ──────────────────────────────────────────────────────────────────
SMTP_HOST = "smtp.zoho.in"
SMTP_PORT = 465
SMTP_USER = "support@toyzguru.in"
SMTP_PASS = "Akash@007"
FROM_NAME = "ToyzGuru"
PORT      = 3001

# ─── App setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger("toyzguru-mail")


def send_via_zoho(to: str, subject: str, html: str, text: str = "") -> dict:
    """Send email via Zoho SMTP SSL (port 465)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to

    if text:
        msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=20) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to], msg.as_bytes())

    return {"success": True}


# ─── Health check ────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ToyzGuru Email Server", "port": PORT})


# ─── POST /send-email ────────────────────────────────────────────────────────
@app.route("/send-email", methods=["POST"])
def send_email():
    data = request.get_json(force=True, silent=True) or {}
    to      = data.get("to", "").strip()
    subject = data.get("subject", "").strip()
    html    = data.get("html", "").strip()
    text    = data.get("text", "")

    if not to or not subject or not html:
        return jsonify({"success": False, "error": "Missing required fields: to, subject, html"}), 400

    try:
        result = send_via_zoho(to, subject, html, text)
        log.info(f"Email sent  →  to={to}  subject='{subject}'")
        return jsonify(result)
    except smtplib.SMTPAuthenticationError as e:
        log.error(f"SMTP Auth failed: {e}")
        return jsonify({"success": False, "error": "SMTP authentication failed. Check Zoho credentials."}), 500
    except smtplib.SMTPRecipientsRefused as e:
        log.error(f"Recipient refused: {e}")
        return jsonify({"success": False, "error": f"Recipient refused: {to}"}), 400
    except Exception as e:
        log.error(f"Email send error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ─── Startup ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print(f"\n[ToyzGuru Email Server] Starting on http://localhost:{PORT}")
    print(f"    SMTP Host : {SMTP_HOST}:{SMTP_PORT} (SSL)")
    print(f"    Sender    : {SMTP_USER}")
    print(f"\n    Endpoints:")
    print(f"    POST  http://localhost:{PORT}/send-email  ->  Send transactional email")
    print(f"    GET   http://localhost:{PORT}/health       ->  Health check\n")
    app.run(host="0.0.0.0", port=PORT, debug=False)
