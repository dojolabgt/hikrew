from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=select_autoescape(["html"]),
)


def render(template_name: str, data: dict) -> str:
    """Render a Jinja2 HTML template with the given context data."""
    template = _env.get_template(f"{template_name}.html")
    return template.render(**data)
