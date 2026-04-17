# KrishiRaksha AI — Docker Deployment Guide 🐳

This document provides instructions on how to run **KrishiRaksha AI** locally using Docker Compose.

## 🚀 Quick Start

Ensure you have [Docker](https://www.docker.com/products/docker-desktop/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/krishiraksha-ai.git
   cd krishiraksha-ai
   ```

2. **Environment Setup**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. **Launch the Services**
   ```bash
   docker compose up --build
   ```

## 🏗️ Architecture

The project consists of the following Dockerized services:

- **api**: FastAPI backend serving the AI logic and REST endpoints.
- **frontend**: Vite-powered React application (Social/UI).
- **socket-server**: Node.js server for real-time alerts and notifications.
- **celery-worker**: Background task processor for AI vision and speech tasks.
- **postgres**: TimescaleDB for time-series IoT and relational data.
- **redis**: Message broker and caching layer.
- **qdrant**: Vector database for RAG (Retrieval-Augmented Generation).
- **minio**: S3-compatible object storage for field photos and audio clips.

## 🛠️ Management Commands

### Stop Services

```bash
docker compose down
```

### View Logs

```bash
docker compose logs -f [service_name]
```

### Rebuild a Specific Service

```bash
docker compose build [service_name]
```

### Execute Shell in a Container

```bash
docker compose exec [service_name] /bin/bash
```

## 🧹 Cleanup

To remove all containers, networks, and volumes created by `up`:

```bash
docker compose down -v
```

---
### Developed with ❤️ for the KrishiRaksha Team
