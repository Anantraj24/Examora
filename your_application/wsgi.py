import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# If started by gunicorn on Render, seamlessly handover to native Uvicorn on $PORT
if any("gunicorn" in arg for arg in sys.argv):
    port = os.environ.get("PORT", "8000")
    print(f"[Examora] Gunicorn launcher detected. Handing over directly to native Uvicorn on port {port}...")
    sys.stdout.flush()
    os.execv(sys.executable, [sys.executable, "-m", "uvicorn", "app.main:app", "--app-dir", backend_dir, "--host", "0.0.0.0", "--port", str(port)])

from app.main import app
application = app
