"""Fire-and-forget webhook notifications. Zero dependencies beyond stdlib."""
import json
import logging
import threading
import urllib.request
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger("nexonotes.webhook")


def fire_webhook(event: str, payload: dict) -> None:
    """POST {event, ...payload, timestamp} to WEBHOOK_URL if configured. Non-blocking."""
    url = settings.webhook_url
    if not url:
        return

    def _send():
        try:
            body = json.dumps(
                {"event": event, "timestamp": datetime.now(timezone.utc).isoformat(), **payload}
            ).encode()
            req = urllib.request.Request(
                url, data=body, headers={"Content-Type": "application/json"}, method="POST"
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception as exc:
            logger.warning(f"[NEXONOTES-WEBHOOK] {event} -> {url} failed: {exc}")

    # ponytail: daemon thread, fire and forget, no queue overhead
    threading.Thread(target=_send, daemon=True).start()
