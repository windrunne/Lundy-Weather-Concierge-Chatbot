import { memo } from "react";

import type { WeatherPayload } from "../types/chat";

type WeatherCardProps = {
  payload: WeatherPayload;
  embedded?: boolean;
};

const WeatherCard = ({ payload, embedded }: WeatherCardProps) => {
  const location = payload.location;
  const current = payload.current as Record<string, number | string>;
  const daily = payload.daily as Record<string, Array<number | string>>;
  const temp = current.temperature_2m ?? "--";
  const feelsLike = current.apparent_temperature ?? "--";
  const humidity = current.relative_humidity_2m ?? "--";
  const wind = current.wind_speed_10m ?? "--";
  const precip = current.precipitation ?? "--";

  const days = Array.isArray(daily.time) ? daily.time : [];
  const highs = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
  const lows = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];

  return (
    <div
      className={`space-y-4 rounded-3xl p-5 ${
        embedded ? "bg-white/5 border border-white/10" : "glass"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Weather pulse</p>
          <h3 className="text-xl font-semibold text-white">
            {location.name}
            {location.admin1 ? `, ${location.admin1}` : ""} {location.country ?? ""}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold text-white">
            {temp}
            {payload.units.temperature}
          </p>
          <p className="text-xs text-slate-300">Feels like {feelsLike}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs text-slate-300">Humidity</p>
          <p className="text-lg font-semibold text-white">{humidity}%</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs text-slate-300">Wind</p>
          <p className="text-lg font-semibold text-white">
            {wind} {payload.units.wind_speed}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs text-slate-300">Precip</p>
          <p className="text-lg font-semibold text-white">
            {precip} {payload.units.precipitation}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs text-slate-300">Timezone</p>
          <p className="text-lg font-semibold text-white truncate">{location.timezone ?? "--"}</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">3-day outlook</p>
        <div className="grid gap-3 md:grid-cols-3">
          {days.slice(0, 3).map((day, index) => (
            <div key={day} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {new Date(day as string).toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {highs[index] ?? "--"}° / {lows[index] ?? "--"}°
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(WeatherCard);

