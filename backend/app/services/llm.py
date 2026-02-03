from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator

from openai import APIError, APITimeoutError, RateLimitError

from app.core.config import settings
from app.schemas.chat import ChatMessage, ChatSettings
from app.services.llm_client import create_openai_client
from app.services.llm_prompts import build_system_prompt
from app.services.llm_tools import run_tool, tool_definitions
from app.services.weather import WeatherError

logger = logging.getLogger(__name__)


def _to_openai_messages(messages: list[ChatMessage], settings_obj: ChatSettings) -> list[dict]:
    formatted = [{"role": "system", "content": build_system_prompt(settings_obj)}]
    for message in messages:
        payload: dict = {"role": message.role, "content": message.content}
        if message.name:
            payload["name"] = message.name
        if message.tool_call_id:
            payload["tool_call_id"] = message.tool_call_id
        formatted.append(payload)
    return formatted


async def stream_chat(
    messages: list[ChatMessage], settings_obj: ChatSettings
) -> AsyncGenerator[dict, None]:
    if not settings.openai_api_key:
        yield {"type": "error", "message": "OpenAI API key is missing. Set OPENAI_API_KEY."}
        return

    yield {"type": "status", "message": "Analyzing your request..."}

    client = create_openai_client()

    base_messages = _to_openai_messages(messages, settings_obj)
    tool_defs = tool_definitions()

    tool_calls: dict[int, dict] = {}
    finish_reason = None

    try:
        stream = await client.chat.completions.create(
            model=settings.openai_model,
            messages=base_messages,
            tools=tool_defs,
            tool_choice="auto",
            temperature=0.3,
            stream=True,
            timeout=settings.http_timeout_seconds,
        )
    except RateLimitError as e:
        logger.error(f"OpenAI rate limit error: {e}")
        yield {
            "type": "error",
            "message": "Rate limit exceeded. Please wait a moment and try again.",
        }
        return
    except APITimeoutError as e:
        logger.error(f"OpenAI timeout error: {e}")
        yield {
            "type": "error",
            "message": "Request timeout. The service is taking too long to respond. Please try again.",
        }
        return
    except APIError as e:
        logger.error(f"OpenAI API error: {e}")
        status_code = getattr(e, "status_code", None)
        if status_code == 401:
            yield {
                "type": "error",
                "message": "Authentication failed. Please check your API key configuration.",
            }
        elif status_code == 429:
            yield {
                "type": "error",
                "message": "Rate limit exceeded. Please wait a moment and try again.",
            }
        else:
            yield {
                "type": "error",
                "message": f"API error: {str(e)}. Please try again later.",
            }
        return
    except Exception as e:
        logger.error(f"Unexpected error creating OpenAI stream: {e}", exc_info=True)
        yield {
            "type": "error",
            "message": "An unexpected error occurred. Please try again later.",
        }
        return

    try:
        async for chunk in stream:
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            finish_reason = choice.finish_reason or finish_reason
            delta = choice.delta
            if delta.content:
                yield {"type": "token", "value": delta.content}
            if delta.tool_calls:
                for call in delta.tool_calls:
                    entry = tool_calls.setdefault(call.index, {"id": None, "name": "", "arguments": ""})
                    if call.id:
                        entry["id"] = call.id
                    if call.function and call.function.name:
                        entry["name"] = call.function.name
                    if call.function and call.function.arguments:
                        entry["arguments"] += call.function.arguments
    except Exception as e:
        logger.error(f"Error processing stream: {e}", exc_info=True)
        yield {
            "type": "error",
            "message": "Error processing response stream. Please try again.",
        }
        return

    if tool_calls and finish_reason == "tool_calls":
        yield {"type": "status", "message": "Gathering live weather data..."}
        assistant_tool_message = {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": call["id"],
                    "type": "function",
                    "function": {"name": call["name"], "arguments": call["arguments"]},
                }
                for call in tool_calls.values()
            ],
        }

        tool_messages = []
        for call in tool_calls.values():
            try:
                result = await run_tool(call["name"], call["arguments"], settings_obj)
                yield {"type": "status", "message": "Summarizing insights..."}
                yield {"type": "tool", "name": call["name"], "payload": result}
                tool_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call["id"],
                        "content": json.dumps(result),
                    }
                )
            except WeatherError as exc:
                logger.warning(f"Weather error: {exc}")
                error_payload = {"error": True, "message": str(exc)}
                yield {"type": "tool", "name": call["name"], "payload": error_payload}
                tool_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call["id"],
                        "content": json.dumps(error_payload),
                    }
                )
            except Exception as e:
                logger.error(f"Unexpected tool error: {e}", exc_info=True)
                error_payload = {"error": True, "message": "An unexpected error occurred while fetching weather data."}
                yield {"type": "tool", "name": call["name"], "payload": error_payload}
                tool_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call["id"],
                        "content": json.dumps(error_payload),
                    }
                )

        try:
            follow_stream = await client.chat.completions.create(
                model=settings.openai_model,
                messages=base_messages + [assistant_tool_message] + tool_messages,
                tools=tool_defs,
                tool_choice="none",
                temperature=0.3,
                stream=True,
                timeout=settings.http_timeout_seconds,
            )
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit error in follow stream: {e}")
            yield {
                "type": "error",
                "message": "Rate limit exceeded. Please wait a moment and try again.",
            }
            return
        except APITimeoutError as e:
            logger.error(f"OpenAI timeout error in follow stream: {e}")
            yield {
                "type": "error",
                "message": "Request timeout. The service is taking too long to respond. Please try again.",
            }
            return
        except APIError as e:
            logger.error(f"OpenAI API error in follow stream: {e}")
            yield {
                "type": "error",
                "message": f"API error: {str(e)}. Please try again later.",
            }
            return
        except Exception as e:
            logger.error(f"Unexpected error creating follow stream: {e}", exc_info=True)
            yield {
                "type": "error",
                "message": "An unexpected error occurred. Please try again later.",
            }
            return

        try:
            async for chunk in follow_stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    yield {"type": "token", "value": delta.content}
        except Exception as e:
            logger.error(f"Error processing follow stream: {e}", exc_info=True)
            yield {
                "type": "error",
                "message": "Error processing response stream. Please try again.",
            }
            return

    yield {"type": "done"}

