import logging
import time
from app.config import settings
from app.queue import wait_for_event
from app.renderer import render
from app.providers.base import EmailProvider
from app.providers.resend import ResendProvider
from app.providers.brevo import BrevoProvider

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger(__name__)

_PROVIDER_FACTORIES = {
    "resend": lambda: ResendProvider(settings.resend_api_key),
    "brevo": lambda: BrevoProvider(settings.brevo_api_key),
}


def _build_providers() -> list[EmailProvider]:
    providers = []
    for name in settings.mail_providers.split(","):
        name = name.strip()
        factory = _PROVIDER_FACTORIES.get(name)
        if factory:
            providers.append(factory())
        else:
            log.warning("Unknown provider '%s' — skipping", name)
    if not providers:
        raise RuntimeError("No valid email providers configured in MAIL_PROVIDERS")
    return providers


def _send_with_fallback(
    providers: list[EmailProvider], *, to: str, subject: str, html: str, from_: str
) -> None:
    for provider in providers:
        try:
            provider.send(to=to, subject=subject, html=html, from_=from_)
            log.info("Sent via %s → %s", provider.name, to)
            return
        except Exception as exc:
            log.warning("Provider %s failed: %s — trying next", provider.name, exc)
    log.error("All providers failed for email to %s", to)


def main() -> None:
    providers = _build_providers()
    log.info(
        "Mailer worker ready. Queue='%s' | Providers=%s",
        settings.redis_queue_name,
        [p.name for p in providers],
    )

    _retry_delay = 1
    while True:
        try:
            event = wait_for_event()
            _retry_delay = 1  # reset on success
            template = event["template"]
            to = event["to"]
            subject = event["subject"]
            data = event.get("data", {})

            from_ = event.get("from") or settings.mail_from
            html = render(template, data)
            _send_with_fallback(providers, to=to, subject=subject, html=html, from_=from_)

        except KeyError as exc:
            log.error("Malformed event — missing key %s", exc)
        except Exception as exc:
            log.exception("Unexpected error processing event: %s", exc)
            time.sleep(_retry_delay)
            _retry_delay = min(_retry_delay * 2, 60)


if __name__ == "__main__":
    main()
