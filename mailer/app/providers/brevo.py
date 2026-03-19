import re
import httpx
from .base import EmailProvider

_FROM_RE = re.compile(r"^(.+?)\s*<(.+?)>\s*$")


def _parse_from(from_: str) -> tuple[str, str]:
    """Split 'Name <email>' into (name, email). Falls back to ('', from_)."""
    match = _FROM_RE.match(from_)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return "", from_


class BrevoProvider(EmailProvider):
    name = "brevo"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    def send(self, *, to: str, subject: str, html: str, from_: str) -> None:
        sender_name, sender_email = _parse_from(from_)
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={"api-key": self.api_key, "Content-Type": "application/json"},
            json={
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": to}],
                "subject": subject,
                "htmlContent": html,
            },
            timeout=10,
        )
        response.raise_for_status()
