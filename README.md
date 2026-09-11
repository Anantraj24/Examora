# Examora: Intelligent Examination Platform with Automated Proctoring & Candidate Performance Analysis

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg)](https://www.sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange.svg)](https://alembic.sqlalchemy.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen.svg)]()

A high-concurrency, enterprise-grade AI-proctored online examination platform built with **Python (FastAPI)**, **SQLAlchemy 2.0 Async**, and **Modern React/Next.js**.

---

## 🌟 Key Architecture & Highlights

1. **Client-Edge AI Proctoring (MediaPipe & WebSockets)**:
   - Client-side face presence verification, multiple-person detection, gaze orientation tracking, and browser tab blur logging.
   - Privacy-preserving: Raw video streams never leave candidate devices; only numerical telemetry vectors and violation snapshots are transmitted via a 10-second WebSocket heartbeat.
2. **Server-Side Monotonic Timed Exam Engine**:
   - Zero-trust client clock architecture: Server computes deadlines on session initiation.
   - Background APScheduler auto-finalizes and scores exams when time expires.
3. **Deterministic Paper Randomization**:
   - Seeded permutation engine (`hash(exam_id + student_id)`) guarantees unique question sequences and randomized option ordering per student, preventing screen-peeking while remaining 100% reproducible across re-connections.
4. **AI Subjective Grading Studio & OCR**:
   - LLM-assisted evaluation for short/long subjective answers against model answers and rubric criteria.
   - OCR pre-processing for handwritten diagram / formula answer uploads.
   - Human-in-the-loop review studio for examiners with AI suggested pre-grades and 1-click cohort publication.
5. **Student Performance & Cohort Analytics**:
   - Interactive candidate scorecards with objective vs subjective mark breakdowns, percentile rank bell curve visualizers, and examiner annotations.

---

## 🚀 Quickstart Guide

### 1. Launch Backend (FastAPI + Async DB + APScheduler)
```bash
# In project root
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger/OpenAPI docs will be available at: **`http://localhost:8000/docs`**

### 2. Launch Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Test Suite
```bash
python -m pytest backend/tests -v -o "pythonpath=backend"
```
**10/10 Unit, Validation Constraints, Edge Cases & API Lifecycle Integration Tests Passed.**

---

## ⚡ High-Concurrency Stress & Load Testing
```bash
# Run headless async benchmark simulation
python scripts/stress_test.py

# Or launch distributed Locust testing
locust -f backend/tests/locustfile.py --headless -u 50 -r 10 --run-time 1m --host http://localhost:8000
```

---

## 🗄️ Database Migrations (Alembic)
```bash
cd backend
python -m alembic upgrade head
```

---

## 📊 Final Project Presentation Deck
The official 12-slide enterprise project presentation deck conforming to Week 8 specifications is available at:
- **`Examora_Final_Presentation.pptx`**
- Re-generate anytime using: `python scripts/generate_presentation.py`

For deep-dive architecture diagrams and ER specifications, see: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🐳 Production Deployment with Docker Compose
```bash
docker compose up --build -d
```
Runs PostgreSQL 16, FastAPI backend appliance, and Nginx-powered Frontend in isolated containers.
