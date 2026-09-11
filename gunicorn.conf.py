import os

# Port binding
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Use high-performance async Uvicorn worker for FastAPI
worker_class = "uvicorn.workers.UvicornWorker"
workers = 1
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
