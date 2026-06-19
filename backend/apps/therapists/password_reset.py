import json
from email.utils import parseaddr
from urllib import error as urllib_error
from urllib import request as urllib_request
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ImproperlyConfigured
from django.utils import html
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import TherapistProfile


def build_password_reset_url(therapist: TherapistProfile) -> str:
    query = urlencode(
        {
            "therapist_reset_uid": urlsafe_base64_encode(force_bytes(therapist.user.pk)),
            "therapist_reset_token": default_token_generator.make_token(therapist.user),
        }
    )
    return f"{settings.FRONTEND_BASE_URL}/?{query}"


def build_password_reset_email_html(*, therapist: TherapistProfile, reset_url: str) -> str:
    safe_name = html.escape(therapist.name)
    safe_url = html.escape(reset_url)
    timeout_minutes = max(1, settings.PASSWORD_RESET_TIMEOUT // 60)
    return f"""<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f2f6f1;font-family:Arial,sans-serif;color:#23483d;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dce8df;padding:32px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6f8f82;">The Wellness Hub</p>
      <h1 style="margin:0 0 18px;font-size:28px;line-height:34px;color:#23483d;">Reset your therapist portal password</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:25px;color:#4c695f;">Hello {safe_name},</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:25px;color:#4c695f;">Use the secure link below to choose a new password. This link expires in {timeout_minutes} minutes and can only be used once.</p>
      <a href="{safe_url}" style="display:inline-block;background:#4e7c68;color:#ffffff;text-decoration:none;padding:14px 22px;font-weight:700;">Reset password</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:22px;color:#70827b;">If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  </body>
</html>"""


def send_therapist_password_reset_email(therapist: TherapistProfile) -> None:
    if not settings.BREVO_API_KEY:
        raise ImproperlyConfigured("BREVO_API_KEY is required to send therapist password reset emails.")

    sender_name, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
    if not sender_email:
        raise ImproperlyConfigured("DEFAULT_FROM_EMAIL must contain a valid Brevo-verified sender email.")

    reset_url = build_password_reset_url(therapist)
    subject = "Reset your therapist portal password | The Wellness Hub"
    timeout_minutes = max(1, settings.PASSWORD_RESET_TIMEOUT // 60)
    text_content = "\n".join(
        [
            f"Hello {therapist.name},",
            "",
            "Use this secure link to reset your therapist portal password:",
            reset_url,
            "",
            f"This link expires in {timeout_minutes} minutes and can only be used once.",
            "If you did not request this change, you can ignore this email.",
        ]
    )
    payload = {
        "sender": {"name": sender_name or "The Wellness Hub", "email": sender_email},
        "to": [{"name": therapist.name, "email": therapist.email}],
        "subject": subject,
        "textContent": text_content,
        "htmlContent": build_password_reset_email_html(therapist=therapist, reset_url=reset_url),
        "headers": {"X-Auto-Response-Suppress": "All"},
    }
    brevo_request = urllib_request.Request(
        settings.BREVO_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(brevo_request, timeout=settings.BREVO_API_TIMEOUT) as response:
            if response.status not in {200, 201, 202}:
                raise OSError("Brevo did not accept the password reset email.")
    except (OSError, urllib_error.HTTPError, urllib_error.URLError) as exc:
        raise OSError("Brevo could not deliver the password reset email.") from exc
