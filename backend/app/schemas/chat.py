from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system", "tool"]
    content: str = ""
    name: str | None = None
    tool_call_id: str | None = Field(default=None, alias="toolCallId")


class ChatSettings(BaseModel):
    units: Literal["metric", "imperial"] = "metric"


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    settings: ChatSettings = Field(default_factory=ChatSettings)

