import httpx
from .base import EmailProvider


class ResendProvider(EmailProvider):
    name = "resend"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    def send(self, *, to: str, subject: str, html: str, from_: str) -> None:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"from": from_, "to": [to], "subject": subject, "html": html},
            timeout=10,
        )
        if not response.is_success:
            raise Exception(f"Resend {response.status_code}: {response.text}")
        response.raise_for_status()
