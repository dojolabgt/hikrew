import logging
import time
from app.config import settings
from app.queue import wait_for_event
from app.generator import generate_quotation_pdf, generate_brief_pdf
from app.uploader import upload_pdfs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger(__name__)


def _slugify(name: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "file"


def process_deal_won(job: dict) -> None:
    pdfs: dict[str, bytes] = {}

    # 1) Quotation PDF
    quotation = job.get("quotation")
    if quotation:
        log.info("Generating quotation PDF for deal '%s'", job.get("dealName"))
        pdfs["quotation.pdf"] = generate_quotation_pdf(job)

    # 2) Brief PDFs
    for brief in job.get("briefs") or []:
        brief_name = brief.get("name", "brief")
        filename = f"brief-{_slugify(brief_name)}.pdf"
        log.info("Generating brief PDF: %s", filename)
        pdfs[filename] = generate_brief_pdf(brief, job)

    if not pdfs:
        log.info("No PDFs to generate for project '%s'", job.get("projectName"))
        return

    # 3) Upload to Drive
    uploaded = upload_pdfs(job, pdfs)
    log.info(
        "Uploaded %d PDF(s) for project '%s': %s",
        len(uploaded),
        job.get("projectName"),
        list(uploaded.keys()),
    )


def main() -> None:
    log.info(
        "PDF worker ready. Queue='%s'",
        settings.pdf_jobs_queue,
    )

    _retry_delay = 1
    while True:
        try:
            event = wait_for_event()
            _retry_delay = 1  # reset on success
            event_type = event.get("type")

            if event_type == "deal_won":
                process_deal_won(event)
            else:
                log.warning("Unknown event type '%s' — skipping", event_type)

        except KeyError as exc:
            log.error("Malformed event — missing key %s", exc)
        except Exception as exc:
            log.exception("Unexpected error processing event: %s", exc)
            time.sleep(_retry_delay)
            _retry_delay = min(_retry_delay * 2, 60)


if __name__ == "__main__":
    main()
