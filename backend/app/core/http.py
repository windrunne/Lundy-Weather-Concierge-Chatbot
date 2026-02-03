import httpx

from app.core.config import settings


def create_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=settings.http_timeout_seconds)

