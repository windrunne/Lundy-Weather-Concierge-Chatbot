import json
import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.llm import stream_chat

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")

    if len(request.messages) > 100:
        raise HTTPException(status_code=400, detail="Too many messages. Maximum 100 messages allowed.")

    for msg in request.messages:
        if not msg.content or len(msg.content.strip()) == 0:
            raise HTTPException(status_code=400, detail="Message content cannot be empty")
        if len(msg.content) > 2000:
            raise HTTPException(status_code=400, detail="Message content too long. Maximum 2000 characters allowed.")

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for event in stream_chat(request.messages, request.settings):
                try:
                    yield f"data: {json.dumps(event)}\n\n"
                except (TypeError, ValueError) as e:
                    logger.error(f"Failed to serialize event: {e}", exc_info=True)
                    error_event = {
                        "type": "error",
                        "message": "Failed to process response. Please try again.",
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    break
        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            error_event = {
                "type": "error",
                "message": f"An error occurred: {str(e)}",
            }
            try:
                yield f"data: {json.dumps(error_event)}\n\n"
            except Exception:
                logger.error("Failed to send error event", exc_info=True)
        finally:
            yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

