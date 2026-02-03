from __future__ import annotations

import json

from app.schemas.chat import ChatSettings
from app.services.weather import WeatherError, fetch_weather, fetch_weather_batch


def tool_definitions() -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current conditions and 3-day forecast for one or more cities.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City or place name, e.g. 'Seattle' or 'Paris, France'.",
                        },
                        "locations": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of city or place names for comparisons.",
                        },
                        "units": {
                            "type": "string",
                            "enum": ["metric", "imperial"],
                            "description": "Units for temperature and wind speed.",
                        },
                    },
                    "required": [],
                },
            },
        }
    ]


async def run_tool(name: str, arguments: str, settings_obj: ChatSettings) -> dict:
    payload = json.loads(arguments) if arguments else {}
    if name == "get_weather":
        locations = payload.get("locations") or []
        location = payload.get("location", "")
        units = payload.get("units", settings_obj.units)
        if location:
            locations = [location, *locations]
        locations = [item for item in locations if item]
        if not locations:
            raise WeatherError("Please provide a location to look up weather.")
        if len(locations) == 1:
            return await fetch_weather(locations[0], units)
        results = await fetch_weather_batch(locations, units)
        return {"results": results}
    raise WeatherError(f"Unknown tool '{name}'.")

