import json
import redis as redis_lib
from app.config import settings

_client = redis_lib.Redis.from_url(settings.redis_url, decode_responses=True)


def wait_for_event() -> dict:
    """Block until a PDF job is available (BRPOP, timeout=0 means forever).
    Returns the parsed JSON event dict.
    """
    result = _client.brpop(settings.pdf_jobs_queue, timeout=0)
    _, raw = result  # (queue_name, value)
    return json.loads(raw)
