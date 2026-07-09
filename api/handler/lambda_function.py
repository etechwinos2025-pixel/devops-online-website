import base64
import csv
import io
import json
import os
import re
from datetime import datetime, timezone
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import boto3
from botocore.exceptions import ClientError
from google.oauth2 import service_account
from googleapiclient.discovery import build

ses = boto3.client("ses", region_name=os.environ.get("AWS_REGION", "us-east-1"))
secrets = boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))

NOTIFY_EMAIL = os.environ["NOTIFY_EMAIL"]
FROM_EMAIL = os.environ["FROM_EMAIL"]
SITE_URL = os.environ.get("SITE_URL", "https://www.training.excelcloudsolutions.com")
CONTACT_PHONE = os.environ.get("CONTACT_PHONE", "(330) 391-3130")
GOOGLE_SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "")
GOOGLE_SECRET_ARN = os.environ.get("GOOGLE_SECRET_ARN", "")
SHEET_RANGE = os.environ.get("SHEET_RANGE", "A:G")
HEADERS = ["Submitted At", "Name", "Email", "Phone", "Program", "Experience", "Message"]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

_google_creds_cache = None


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _parse_body(event):
    raw = event.get("body") or ""
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8", errors="replace")
    return json.loads(raw) if raw else {}


def _valid_email(value):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value or ""))


def _get_google_credentials():
    global _google_creds_cache
    if _google_creds_cache is not None:
        return _google_creds_cache
    if not GOOGLE_SECRET_ARN:
        return None
    try:
        secret_value = secrets.get_secret_value(SecretId=GOOGLE_SECRET_ARN)
        info = json.loads(secret_value["SecretString"])
        _google_creds_cache = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )
        return _google_creds_cache
    except Exception as exc:
        print(f"Google credentials error: {exc}")
        return None


def _append_to_sheet(row):
    if not GOOGLE_SHEET_ID:
        print("GOOGLE_SHEET_ID not configured; skipping sheet append")
        return None

    creds = _get_google_credentials()
    if not creds:
        print("Google Sheets credentials are not configured; skipping sheet append")
        return None

    service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    sheets = service.spreadsheets()

    existing = sheets.values().get(spreadsheetId=GOOGLE_SHEET_ID, range=SHEET_RANGE).execute()
    values = existing.get("values", [])
    if not values:
        header_range = f"{SHEET_RANGE.split('!')[0]}!A1" if "!" in SHEET_RANGE else "A1"
        sheets.values().update(
            spreadsheetId=GOOGLE_SHEET_ID,
            range=header_range,
            valueInputOption="RAW",
            body={"values": [HEADERS]},
        ).execute()

    sheets.values().append(
        spreadsheetId=GOOGLE_SHEET_ID,
        range=SHEET_RANGE,
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body={"values": [row]},
    ).execute()

    updated = sheets.values().get(spreadsheetId=GOOGLE_SHEET_ID, range=SHEET_RANGE).execute()
    return updated.get("values", [])


def _values_to_csv(values):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    for row in values:
        writer.writerow(row)
    return buffer.getvalue().encode("utf-8")


def _send_notification(registration, csv_bytes):
    subject = f"New DevOps training registration — {registration['name']}"
    text_body = (
        "A new student registered on the ExcelCloud DevOps training website.\n\n"
        f"Name: {registration['name']}\n"
        f"Email: {registration['email']}\n"
        f"Phone: {registration['phone'] or 'Not provided'}\n"
        f"Program: {registration['course']}\n"
        f"Experience: {registration['experience']}\n\n"
        f"Message:\n{registration['message'] or 'Not provided'}\n\n"
        "The full registration log is attached as registrations.csv\n"
    )

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = NOTIFY_EMAIL
    if _valid_email(registration["email"]):
        msg["Reply-To"] = registration["email"]
    msg.attach(MIMEText(text_body, "plain", "utf-8"))

    attachment = MIMEApplication(csv_bytes, _subtype="csv")
    attachment.add_header("Content-Disposition", "attachment", filename="registrations.csv")
    msg.attach(attachment)

    result = ses.send_raw_email(
        Source=FROM_EMAIL,
        Destinations=[NOTIFY_EMAIL],
        RawMessage={"Data": msg.as_bytes()},
    )
    print(f"Notification sent MessageId={result.get('MessageId')}")
    return result


def _send_student_confirmation(registration):
    first_name = registration["name"].split()[0] if registration["name"] else "there"
    subject = "We received your DevOps training registration — ExcelCloud"
    text_body = (
        f"Hi {first_name},\n\n"
        "Thank you for registering for ExcelCloud DevOps training!\n\n"
        "We received your registration request:\n"
        f"  Program: {registration['course']}\n"
        f"  Experience level: {registration['experience']}\n\n"
        "Our team will review your request and contact you within 1 business day "
        "with enrollment details, schedule, and payment options.\n\n"
        "If you have questions in the meantime:\n"
        f"  Phone: {CONTACT_PHONE}\n"
        f"  Email: {NOTIFY_EMAIL}\n"
        f"  Website: {SITE_URL}\n\n"
        "We look forward to helping you on your DevOps journey!\n\n"
        "— ExcelCloud DevOps Training Team\n"
    )

    result = ses.send_email(
        Source=FROM_EMAIL,
        Destination={"ToAddresses": [registration["email"]]},
        ReplyToAddresses=[NOTIFY_EMAIL],
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Text": {"Data": text_body, "Charset": "UTF-8"}},
        },
    )
    print(f"Student confirmation sent MessageId={result.get('MessageId')} to={registration['email']}")
    return result


def _handle_register(data):
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()
    course = (data.get("course") or "").strip()
    experience = (data.get("experience") or "Beginner").strip()
    message = (data.get("message") or "").strip()

    if not name or not _valid_email(email) or not course:
        return _response(400, {"error": "Name, valid email, and program selection are required."})

    submitted_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    row = [submitted_at, name, email, phone, course, experience, message]
    registration = {
        "name": name,
        "email": email,
        "phone": phone,
        "course": course,
        "experience": experience,
        "message": message,
    }

    try:
        sheet_values = None
        try:
            sheet_values = _append_to_sheet(row)
        except Exception as exc:
            print(f"Google Sheets append failed (continuing with email): {exc}")

        if sheet_values:
            csv_bytes = _values_to_csv(sheet_values)
        else:
            csv_bytes = _values_to_csv([HEADERS, row])
        _send_notification(registration, csv_bytes)
        try:
            _send_student_confirmation(registration)
        except ClientError as exc:
            err = exc.response.get("Error", {})
            print(f"Student confirmation SES error: {err}")
    except ClientError as exc:
        err = exc.response.get("Error", {})
        print(f"SES error: {err}")
        return _response(500, {"error": "Registration saved but email could not be sent. Please call us directly."})
    except Exception as exc:
        print(f"Registration handler error: {exc}")
        return _response(500, {"error": "Unable to submit registration. Please call (330) 391-3130."})

    return _response(200, {
        "ok": True,
        "message": "Registration submitted successfully. Check your email for confirmation—we'll be in touch soon.",
    })


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod", "")
    path = event.get("rawPath") or event.get("path") or ""

    print(f"Register request method={method} path={path}")

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    if method != "POST":
        return _response(405, {"error": "Method not allowed"})

    if not path.endswith("/register") and not path.endswith("/api/register"):
        return _response(404, {"error": "Not found"})

    try:
        data = _parse_body(event)
        return _handle_register(data)
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON body"})
