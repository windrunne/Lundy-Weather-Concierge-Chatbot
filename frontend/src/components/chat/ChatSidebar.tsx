import type { ChatSettings } from "../../types/chat";

type ChatSidebarProps = {
  isStreaming: boolean;
  settings: ChatSettings;
  onUnitsChange: (units: ChatSettings["units"]) => void;
};

const ChatSidebar = ({ isStreaming, settings, onUnitsChange }: ChatSidebarProps) => {
  return (
    <aside className="space-y-6">
      <div className="glass rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Smart planner</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Make the most of your day</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-200">
          <li>• Compare two cities to decide where to travel.</li>
          <li>• Ask for best outdoor time windows.</li>
          <li>• Request packing recommendations.</li>
        </ul>
      </div>
      <div className="glass rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Units</p>
        <div className="mt-3 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          <button
            className={`rounded-full flex-1 px-4 py-1 transition ${
              settings.units === "metric" ? "bg-white/20 text-white" : "text-slate-300"
            }`}
            onClick={() => onUnitsChange("metric")}
          >
            Metric
          </button>
          <button
            className={`rounded-full flex-1 px-4 py-1 transition ${
              settings.units === "imperial" ? "bg-white/20 text-white" : "text-slate-300"
            }`}
            onClick={() => onUnitsChange("imperial")}
          >
            Imperial
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Affects temperature, wind, and precipitation units.
        </p>
      </div>
      <div className="glass rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-200">Stream</span>
          <span
            className={`rounded-full px-3 py-1 text-xs transition ${
              isStreaming ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-slate-300"
            }`}
          >
            {isStreaming ? "Live" : "Idle"}
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Responses stream in real time for a more natural conversation.
        </p>
      </div>
    </aside>
  );
};

export default ChatSidebar;

