# Lundy Weather Concierge

A fast, streaming conversational weather app with a polished UI. The frontend is built with React + TypeScript + Vite + Tailwind CSS, and the backend uses FastAPI with OpenAI tool-calling and Open‑Meteo for forecasts.

##Live Demo
[https://www.loom.com/share/b0df7b76d1ff4b0a95158f5ee36a4cfb]
## Features

- Streaming chat responses for low-latency UX
- OpenAI tool-calling to fetch real weather data
- Open‑Meteo geocoding + forecast integration
- Unit toggle (metric/imperial) and comparison support
- Modular frontend + backend architecture

---

## Prerequisites

- **Python 3.9+** (recommended 3.11)
- **Node.js 18+**
- **OpenAI API key**

---

## Backend setup (FastAPI)

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Set environment variables (PowerShell):
   ```powershell
   setx OPENAI_API_KEY "your_openai_key"
   setx OPENAI_MODEL "gpt-4o-mini"
   setx OPENAI_BASE_URL ""
   setx ALLOW_ORIGINS "http://localhost:5173"
   setx HTTP_TIMEOUT_SECONDS "10"
   setx FORECAST_DAYS "3"
   setx MAX_LOCATIONS_PER_REQUEST "10"
   ```
   Then restart the terminal so the variables load.

   Optional: create a `.env` file in `backend/` with the same keys.

3. Run the API:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

Backend health check: `http://localhost:8000/health`

---

## Frontend setup (React + Vite)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. (Optional) Set API base URL:
   - Create `.env` in `frontend/`:
     ```
     VITE_API_BASE_URL=http://localhost:8000
     ```
   - If not set, Vite proxy is used (`/api` → `http://127.0.0.1:8000`).

3. Run the app:
   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`

---

## Project structure

```
backend/
  app/
    api/
    core/
    schemas/
    services/
    utils/

frontend/
  src/
    components/
      chat/
    config/
    constants/
    hooks/
    services/
    styles/
    types/
    utils/
```

---

## Notes

- Weather data is sourced from Open‑Meteo: https://open-meteo.com/en/docs
- The unit toggle affects temperature, wind speed, and precipitation units.


