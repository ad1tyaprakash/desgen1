# Desgen

AI-assisted product, UX, and visual design generator with a React + Vite dashboard and a FastAPI backend.

## What’s in this repo
- **Backend**: FastAPI API + orchestration layer in `app/` and `agents/`
- **Frontend**: React + Vite in `frontend/`

## Prerequisites
- Python 3.11+
- Node.js 18+
- A valid OpenAI API key
- Firebase project credentials (already expected in `frontend/.env`)

## Environment variables
### Backend
Create or update the root `.env` with:
- `OPENAI_API_KEY` (or `API_KEY`)
- Optional: `MODEL_NAME`, `MAX_RETRIES`, `BASE_DELAY_SECONDS`, `THROTTLE_SECONDS`, `LOG_USAGE`
- Optional: `FRONTEND_ORIGIN` (defaults to `http://localhost:5173`)

### Frontend
`frontend/.env` should contain your Firebase project credentials. If you need a new set, update:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Run locally
### Backend
1. Install dependencies: `pip install -r requirements.txt`
2. Start the API server: `uvicorn app.api:app --reload --host 0.0.0.0 --port 8000`

### Frontend
1. Install dependencies: `cd frontend && npm install`
2. Start the dev server: `npm run dev`

The frontend uses Vite’s dev proxy to route `/api` to `http://localhost:8000`.

## Run with Docker (backend only)
Build:
- `docker build -t desgen1:latest .`

Run:
- `docker run --rm -p 8000:8000 -e OPENAI_API_KEY=YOUR_KEY desgen1:latest`

If port 8000 is already in use, run on a different host port:
- `docker run --rm -p 8001:8000 -e OPENAI_API_KEY=YOUR_KEY desgen1:latest`

## CLI usage (optional)
You can run the orchestration flow from the CLI:
- `python app/main.py "Design a habit tracker app"`

## Troubleshooting
- **Port 8000 already in use**: stop the other process or map a different host port (e.g., `-p 8001:8000`).
- **Missing API key**: set `OPENAI_API_KEY` or `API_KEY` in the root `.env` or pass it with `-e` to Docker.
- **Frontend auth issues**: verify Firebase credentials in `frontend/.env`.
