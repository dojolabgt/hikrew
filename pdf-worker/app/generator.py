"""PDF generation using WeasyPrint + Jinja2 templates."""
import io
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
import pathlib

_TEMPLATES_DIR = pathlib.Path(__file__).parent / "templates"
_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _render_html(template_name: str, context: dict) -> str:
    tmpl = _env.get_template(template_name)
    return tmpl.render(**context)


def generate_quotation_pdf(job: dict) -> bytes:
    """Generate a quotation PDF from the deal_won job payload."""
    quotation = job.get("quotation") or {}
    context = {
        "deal_name": job.get("dealName", ""),
        "client_name": job.get("clientName", ""),
        "project_name": job.get("projectName", ""),
        "option_name": quotation.get("optionName", ""),
        "currency": quotation.get("currency", "USD"),
        "currency_symbol": quotation.get("currencySymbol", "$"),
        "total": quotation.get("total", 0),
        "items": quotation.get("items", []),
        "terms": quotation.get("terms", ""),
    }
    html = _render_html("quotation.html", context)
    buf = io.BytesIO()
    HTML(string=html).write_pdf(buf)
    return buf.getvalue()


def generate_brief_pdf(brief: dict, job: dict) -> bytes:
    """Generate a single brief PDF."""
    schema = brief.get("schema") or []
    responses = brief.get("responses") or {}

    # Build a flat list of {label, value} for the template
    fields = []
    for field in schema:
        fid = field.get("id", "")
        label = field.get("label", fid)
        raw_value = responses.get(fid, "")
        if isinstance(raw_value, list):
            value = ", ".join(str(v) for v in raw_value)
        else:
            value = str(raw_value) if raw_value is not None else ""
        fields.append({"label": label, "value": value})

    context = {
        "brief_name": brief.get("name", "Brief"),
        "project_name": job.get("projectName", ""),
        "client_name": job.get("clientName", ""),
        "fields": fields,
    }
    html = _render_html("brief.html", context)
    buf = io.BytesIO()
    HTML(string=html).write_pdf(buf)
    return buf.getvalue()
