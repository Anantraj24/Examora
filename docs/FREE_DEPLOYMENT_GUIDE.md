# 🚀 Complete Free Deployment Guide: Examora

This guide walks you through deploying the complete platform (Frontend, Backend with WebSockets, and Managed Database) **100% free of charge**, requiring zero credit cards.

---

## 🏗️ Architecture Matrix (100% Free Tier)

| Layer | Platform | Cost | Free Tier Highlights |
| :--- | :--- | :---: | :--- |
| **Frontend Web App** | **Vercel** (or Render Static) | **$0** | Automatic HTTPS, Global CDN, 100GB/month bandwidth, instant git deploys. |
| **Backend API & WebSockets** | **Render.com** (or Koyeb / Hugging Face Spaces) | **$0** | 512MB RAM, shared CPU, HTTPS + WSS (native WebSocket support for proctoring). |
| **Database** | **Neon.tech** (or Supabase) | **$0** | 0.5 GiB permanent serverless PostgreSQL, pooled connections, automated backups. |

---

## 📋 Step 1: Create Free Cloud Database on Neon.tech (2 Minutes)

1. Go to [https://neon.tech](https://neon.tech) and sign up with GitHub (free, no credit card required).
2. Click **Create Project**, name it `examora-db`, and choose your preferred region (e.g. US East or Frankfurt).
3. On the dashboard, copy the **Connection string** (select **Pooled connection**):
   ```text
   postgresql://alex:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Note: The backend automatically transforms `postgresql://` into `postgresql+asyncpg://`)*.

---

## ⚡ Step 2: Deploy Backend to Render.com (3 Minutes)

Render natively supports WebSockets which are required for the 10-second proctoring heartbeat.

1. Go to [https://render.com](https://render.com) and sign up / log in with GitHub.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/Anantraj24/Examora`.
4. Configure the settings:
   - **Name**: `examora-backend`
   - **Region**: Oregon or Frankfurt
   - **Branch**: `main`
   - **Root Directory**: `backend` (or leave empty)
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: **Free** ($0/month)
5. Under **Environment Variables**, add:
   - `DATABASE_URL` = *(Paste your connection string from Neon.tech)*
   - `SECRET_KEY` = `production-super-secret-key-examora-2026`
   - `PYTHONPATH` = `.`
6. Click **Deploy Web Service**.
7. Once deployed, note your public URL (e.g., `https://examora-backend.onrender.com`).
   - Test it by visiting `https://examora-backend.onrender.com/health` in your browser (should return `{"status":"healthy"}`).
   - Swagger docs will be live at `https://examora-backend.onrender.com/docs`.

---

## 🌐 Step 3: Deploy Frontend to Vercel (2 Minutes)

Vercel provides blazing-fast edge CDN hosting with zero configuration for Vite + React.

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Anantraj24/Examora`).
4. In the project setup:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend`
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://examora-backend.onrender.com/api/v1` *(Replace with your actual Render URL)*
   - **Key**: `VITE_WS_BASE_URL` *(Optional — auto-derived if omitted)*
   - **Value**: `wss://examora-backend.onrender.com`
6. Click **Deploy**.
7. In ~30 seconds, your site will be live with a URL like `https://examora.vercel.app`!

---

## 🎯 Step 4: Verify Full Production System

1. **Access Web App**: Open your Vercel URL on desktop, laptop, or tablet.
2. **Camera & AI Proctor Test**:
   - Start any exam session.
   - Grant webcam permissions (Vercel provides HTTPS automatically, so the camera will initialize smoothly).
   - Verify the webcam HUD bounding box, face presence indicator, and gaze deflection alerts.
3. **Submit & Auto-Grade**:
   - Submit the exam and review the instant MCQ scoring and AI evaluation pre-grades.
4. **Examiner Grading Portal**:
   - Switch role to **Examiner** or **Admin** via the profile switcher in the top bar.
   - Inspect the 3x3 Live Proctor Mission Control grid, review candidate violations, and publish cohort results.

---

## 💡 Troubleshooting & Tips

- **Render Free Tier Spin-Down**:
  Render free web services enter sleep mode after 15 minutes of inactivity. When accessed again, it takes ~30–45 seconds to wake up. To keep it warm during demo presentations, you can use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) pinging `https://your-backend.onrender.com/health` every 10 minutes.
- **Alternative 1-Click Option**:
  You can also deploy the entire stack on Render using the included `render.yaml` blueprint: go to **Blueprints** on Render and select your repository!
