# 🌾 KrishiRaksha AI

### Apni Fasal Ka Raksha Karo — AI-Powered Crop Security

**KrishiRaksha AI** is a comprehensive full-stack agriculture protection platform developed for the **Ministry of Agriculture Hackathon 2024**. It empowers over **140 million Indian farming households** with real-time risk monitoring, AI-driven disease detection, and multilingual expert advisories to safeguard their livelihoods.


---

## ✨ Key Features

### 🛡️ Crop Health Radar
High-fidelity visualization across 6 critical dimensions: **Pest, Disease, Moisture, Nutrient, Weather, and Soil**. This "Radar" view allows farmers and officers to identify risks at a glance.

### 🔍 AI Disease Scanner

Utilizing a custom-trained **YOLOv8** computer vision model, the platform identifies crop diseases from simple smartphone photos, providing instant identification, severity scoring, and treatment recommendations.

### 🎙️ Multilingual Voice Assistant

Breaking the literacy barrier with a voice-first interface. Powered by **Whisper** (Speech-to-Text) and **Gemini Pro** (LLM), it provides localized support in over **11 Indian languages**.

### 🗺️ Regional Risk Mapping

Integration with **Mapbox GL JS** provides a geospatial view of crop risks, allowing government officers to monitor regional health trends and deploy resources effectively.


---

## 🏗️ Technical Architecture

### **Core Stack**
- **Frontend:** React 18 + Vite + TypeScript + Framer Motion (Aesthetics)
- **Primary Backend:** FastAPI (Asynchronous Python)
- **Realtime Engine:** Node.js + Socket.IO (Socket Server)
- **Background Tasks:** Celery + Redis
- **AI/ML:** YOLOv8 (Vision), Google Gemini Pro (Reasoning), Whisper (Speech)

### **Data & Infrastructure**
- **Database:** PostgreSQL with **TimescaleDB** (Time-series metrics)
- **Vector Search:** **Qdrant** (RAG Knowledge Base)
- **Object Storage:** **MinIO** (Secure storage for crop images)
- **Cache/Queue:** **Redis**


---

## 🚀 Local Development Runbook

Follow these steps to set up the KrishiRaksha AI ecosystem on your local machine.

### 1. Environment Preparation
Clone the repository and create a root `.env` file based on the provided template:

```env
APP_ENV=development
DATABASE_URL=sqlite+aiosqlite:///./krishiraksha.db
REDIS_URL=redis://localhost:6379/0
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:3001
```

### 2. Backend Setup (FastAPI)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python seed.py             # Initialize demo data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> [!IMPORTANT]
> Note the `app.main:app` module path. Running `uvicorn main:app` will result in an import error.

### 3. Realtime Service (Socket.IO)
```powershell
cd backend/socket-server
npm install
node server.js
```

### 4. Frontend Setup (Vite)
```powershell
cd frontend
npm install
npm run dev -- --port 3000
```


---

## 🐳 Containerized Setup (Docker)

For a production-grade environment including all database and storage services:

```powershell
docker-compose up --build
```

**Services launched:**
- **API:** [http://localhost:8000](http://localhost:8000)
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001)


---

## 📚 API Documentation
Once the backend is running, interactive API documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`


---

## 🤝 Contribution & License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

Developed with ❤️ by the **KrishiRaksha Team**.
