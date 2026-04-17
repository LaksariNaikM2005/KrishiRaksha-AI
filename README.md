# KrishiRaksha AI

Production and operations guide for KrishiRaksha AI.

KrishiRaksha AI is a full-stack agriculture platform that provides crop disease detection, advisory workflows, realtime notifications, and support features for farmers and operators.

## System Overview

Core services:

- Frontend web app: React + Vite + TypeScript
- Backend API: FastAPI
- Realtime service: Node.js + Socket.IO
- Background workers: Celery with Redis broker
- Data layer: SQLite or PostgreSQL (runtime-dependent)
- AI inference: YOLOv8 model flow with optional external AI integrations

High-level request flow:

1. User uploads or captures crop image in web app.
2. Frontend calls FastAPI detection endpoints.
3. Backend performs inference and advisory processing.
4. Realtime updates are pushed via Socket.IO where applicable.
5. Results are rendered with confidence and severity metadata.

## Repository Layout

```text
KrishiRaksha AI/
|-- backend/
|   |-- app/                    # API routes, models, schemas, realtime hooks
|   |-- socket-server/          # Node.js Socket.IO service
|   |-- scripts/                # Training and dataset utilities
|   |-- tests/                  # Python tests
|   |-- requirements.txt
|   |-- seed.py
|-- frontend/
|   |-- src/                    # Pages, components, API client
|   |-- package.json
|-- docker-compose.yml
|-- render.yaml
|-- RENDER_DEPLOYMENT.md
|-- DOCKER.md
```

## Runtime Requirements

- Python 3.10+
- Node.js 18+
- npm
- Docker Desktop (for containerized setup)

## Environment Contract

Create root .env before running locally:

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

Variable notes:

- APP_ENV: service mode selector
- DEMO_MODE: toggles model fallback behavior
- DATABASE_URL: SQLite for local quick start, PostgreSQL for production-grade workloads
- REDIS_URL: required for Celery/async paths
- VITE_API_URL and VITE_WS_URL: frontend service discovery

Security notes:

- Do not commit secrets or provider keys.
- Store environment values in deployment platform secret store for production.

## Local Runbook

Run all commands from repository root in separate terminals.

1. API service

```powershell
cd backend
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

1. Realtime service

```powershell
cd backend/socket-server
npm install
node server.js
```

1. Frontend service

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

Endpoints:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- API health: [http://localhost:8000/health](http://localhost:8000/health)

## Container Runbook

Start full stack:

```powershell
docker compose up --build
```

Stop stack:

```powershell
docker compose down
```

Use this mode to validate service wiring and environment parity before remote deployment.

## Build and Validation

Backend tests:

```powershell
cd backend
pytest -q
```

Frontend production build:

```powershell
cd frontend
npm run build
```

## Artifact Policy

To keep repository size manageable:

- Training outputs under backend/runs are local artifacts.
- Datasets under backend/data/datasets are local artifacts.
- Model weights under backend/models/weights and backend/*.pt are local artifacts.

These paths are intentionally ignored for future commits.

## Deployment Operations

Primary deployment assets in repository:

- render.yaml
- RENDER_DEPLOYMENT.md
- docker-compose.yml
- DOCKER.md

Recommended production checklist:

1. Validate all required environment variables in target platform.
2. Run backend tests and frontend build before deploy.
3. Verify API health endpoint post-deploy.
4. Verify websocket connectivity from frontend.
5. Validate inference path with representative sample image.

## Troubleshooting Runbook

TypeScript config errors in frontend:

- Confirm frontend/tsconfig.json and frontend/tsconfig.node.json are aligned.

Port conflicts:

- Move frontend to another port with npm run dev -- --port 3001.

Database startup issues:

- Start with default SQLite configuration, then switch to PostgreSQL.

Realtime connection issues:

- Verify VITE_WS_URL and socket-server process health.

Spell checker warnings for multilingual content:

- Update cSpell workspace dictionary in .vscode/settings.json.

## License

See LICENSE.
