export type Role = "user" | "assistant" | "system" | "tool";

export type ChatSettings = {
  units: "metric" | "imperial";
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  weather?: WeatherPayload[];
};

export type StreamEvent =
  | { type: "token"; value: string }
  | { type: "tool"; name: string; payload: WeatherToolPayload }
  | { type: "status"; message: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type WeatherPayload = {
  location: {
    name?: string;
    country?: string;
    admin1?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  current: Record<string, unknown>;
  hourly: Record<string, unknown>;
  daily: Record<string, unknown>;
  units: {
    temperature: string;
    wind_speed: string;
    precipitation: string;
  };
};

export type ToolError = {
  error: true;
  message: string;
};

export type WeatherToolPayload =
  | WeatherPayload
  | { results: WeatherPayload[] }
  | ToolError;

