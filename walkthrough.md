# KrishiRaksha AI — Project Walkthrough 🌾

Welcome to the **KrishiRaksha AI** development repository. This guide provides a detailed walkthrough of the project's features and overall architecture.

## 🌟 Vision & Impact

KrishiRaksha AI is a comprehensive AI-powered platform tailored for the **Ministry of Agriculture** to empower Indian farmers with real-time risk monitoring and AI-driven protection advisories. 

### 🛡️ Feature: Crop Health Radar

The **Radar View** uses D3.js to visualize risk across 6 critical dimensions (Pest, Disease, Moisture, Nutrient, Weather, and Soil), providing an intuitive assessment for at-a-glance monitoring.

### 🔍 Feature: Disease Scanner

Powered by **YOLOv8** computer vision, the platform identifies crop diseases from photos uploaded by farmers, providing instant identification and treatment recommendations.

### 🎙️ Feature: Multilingual Voice Assistant

Integrating **Whisper** and **Gemini Pro**, the assistant provides localized support for over 10 Indian regional languages, allowing farmers to interact naturally with the AI.

## 🏗️ Technical Architecture

### Frontend (Vite + React + TS)
- High-performance SPA with modern React patterns.
- Integration with Mapbox GL JS for regional risk mapping.
- Framer Motion for smooth, high-premium micro-animations.

### Backend (FastAPI + Python)
- Asynchronous REST APIs for high-concurrency requests.
- Integrated RAG (Retrieval-Augmented Generation) for expert crop advisories.
- Celery task queue for distributed image and speech processing.

### Databases & Storage
- **PostgreSQL/TimescaleDB**: Relational and time-series data.
- **Qdrant**: Vector storage for semantic Search and Knowledge Base.
- **MinIO**: Distributed object storage for media assets.

## 🚀 Future Roadmap

- **Satellite Imagery Integration**: Real-time regional monitoring via satellite data.
- **Marketplace Expansion**: Peer-to-peer equipment sharing and localized input recommendations.
- **IoT Connectivity**: Direct data ingestion from field sensors.

---
**Developed with ❤️ by the KrishiRaksha Team**
