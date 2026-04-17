# KrishiRaksha AI — Render Deployment Strategy 🚀

This project is configured for seamless deployment on **Render** using the provided `render.yaml` Blueprint specification.

## 🏗️ Deployment Steps

1.  **Repository Setup**:
    Ensure your local changes are pushed to your GitHub repository.

2.  **Create a New Blueprint**:
    - Go to the [Render Dashboard](https://dashboard.render.com).
    - Select **"New" > "Blueprint"**.
    - Connect your GitHub repository.

3.  **Review the Infrastructure**:
    Render will automatically detect the `render.yaml` file and propose the following services:
    - `api` (Web Service)
    - `frontend` (Static Site/SPA)
    - `socket-server` (Web Service)
    - `celery-worker` (Background Worker)
    - `krishiraksha-db` (PostgreSQL)

4.  **Configure Environment Variables**:
    While some variables are linked automatically via the Blueprint, you'll need to manually add sensitive API Keys in the Render Dashboard:
    - `GEMINI_API_KEY`: Required for RAG-based AI advisories.
    - `MAPBOX_ACCESS_TOKEN`: Required for the Radar map view.
    - `MINIO_ROOT_USER` & `MINIO_ROOT_PASSWORD`: For object storage.

5.  **Provision and Deploy**:
    Click **"Apply"** to start the provisioning process. Render will build the Docker images and deploy the services.

## 🛡️ Health Checks

Render will monitor the `/health` endpoint of the `api` service to ensure stability. 

## 🌐 Scaling

For production use, you can scale the `api` and `celery-worker` services horizontally via the Render Dashboard's **"Scaling"** tab.

---
**Developed with ❤️ for the KrishiRaksha Team**
