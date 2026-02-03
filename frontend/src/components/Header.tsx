import { TiWeatherCloudy } from "react-icons/ti";

const Header = () => {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/20 text-2xl shadow-glow">
          <TiWeatherCloudy className="text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Weather Concierge</h1>
        </div>
      </div>
      <div className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
          Live forecasts + smart summaries
        </span>
      </div>
    </header>
  );
};

export default Header;

