import os
import sys

# Ensure backend folder is in python path
for candidate in [
    os.path.abspath("backend"),
    os.path.dirname(os.path.abspath(__file__)),
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
]:
    if os.path.exists(candidate) and candidate not in sys.path:
        sys.path.insert(0, candidate)

from app.main import app as asgi_app

try:
    from a2wsgi import ASGIMiddleware
    application = ASGIMiddleware(asgi_app)
except Exception:
    application = asgi_app

app = application
