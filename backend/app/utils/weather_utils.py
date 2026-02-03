from __future__ import annotations

import re


def candidate_locations(location: str) -> list[tuple[str, str | None]]:
    trimmed = location.strip()
    candidates: list[tuple[str, str | None]] = [(trimmed, None)]
    if "," in trimmed:
        candidates.append((trimmed.split(",")[0].strip(), None))
    match = re.match(r"^(.*?),\s*([A-Za-z]{2})$", trimmed)
    if match:
        candidates.append((match.group(1).strip(), "US"))
    return candidates


def units_params(units: str) -> dict[str, str]:
    if units == "imperial":
        return {
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
        }
    return {"temperature_unit": "celsius", "wind_speed_unit": "kmh", "precipitation_unit": "mm"}

