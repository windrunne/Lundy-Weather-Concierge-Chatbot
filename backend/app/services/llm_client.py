from openai import AsyncOpenAI

from app.core.config import settings


def create_openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=settings.http_timeout_seconds,
    )

