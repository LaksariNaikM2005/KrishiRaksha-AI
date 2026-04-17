# KrishiRaksha AI
Apni Fasal Ka Raksha Karo (Protect Your Crop)

KrishiRaksha AI is a full-stack agriculture platform for crop risk monitoring, disease detection, advisory, SOS alerts, and community support.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: FastAPI + SQLAlchemy + Celery
- Realtime: Socket.IO (Node.js)
- Data and Infra: PostgreSQL, Redis, Qdrant, MinIO
- AI: YOLOv8, Gemini/OpenAI integrations (optional keys)

## Project Structure
```text
KrishiRaksha AI/
|-- backend/               # FastAPI app, AI models, Celery, socket server
|   |-- app/
|   |-- socket-server/
|   |-- requirements.txt
|-- frontend/              # Vite React web app
|-- docker-compose.yml
|-- .env
```

## Prerequisites
- Python 3.10+
- Node.js 18+
- npm
- Docker Desktop (optional, for full container stack)

## Environment Setup
Create or update root .env:

```env
APP_ENV=development
DEMO_MODE=true
DATABASE_URL=sqlite+aiosqlite:///./krishiraksha.db
REDIS_URL=redis://localhost:6379/0

VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:3001
VITE_MAPBOX_ACCESS_TOKEN=
VITE_DEMO_MODE=true
```

## Run Project Locally (Website Mode)
Use 3 terminals from the project root.

1) Backend API
```powershell
cd backend
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2) Socket Server
```powershell
cd backend/socket-server
npm install
node server.js
```

3) Frontend Website
```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

Open in browser:
- Website: http://localhost:3000
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/health

## One-Command Run with Docker
From the project root:

```powershell
docker compose up --build
```

Open in browser:
- Website: http://localhost:3000
- API docs: http://localhost:8000/docs

Stop containers:

```powershell
docker compose down
```

## Run Frontend on Network (Access from Phone/LAN)
If you want to open the website from another device on same Wi-Fi:

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

Then open:
- http://YOUR_PC_IP:3000

## Optional: Enable Real AI Vision
By default, demo mode can be used. For real model inference/training:

1. Ensure backend dependencies are installed from backend/requirements.txt.
2. Place trained weights in backend/models/weights.
3. Set DEMO_MODE=false in .env.
4. Add valid API keys if you use Gemini/OpenAI features.

## Useful Commands
Backend tests:

```powershell
cd backend
pytest -q
```

Frontend build:

```powershell
cd frontend
npm run build
```

## Notes
- If PostgreSQL is unavailable locally, the backend can fall back to SQLite with the default .env shown above.
- Keep secrets in .env and never commit real API keys.

## License
For educational and social impact use.
