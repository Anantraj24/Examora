import os
import sys

# Ensure backend folder is in python path
for candidate in [
    os.path.abspath("backend"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"),
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    os.path.dirname(os.path.abspath(__file__))
]:
    if os.path.exists(candidate) and candidate not in sys.path:
        sys.path.insert(0, candidate)

from app.main import app as asgi_app

class UniversalApplication:
    """
    Supports both ASGI (UvicornWorker, 3 args) and WSGI (Gunicorn sync worker, 2 args).
    Lazily initializes a2wsgi only if invoked via WSGI, preventing thread deadlocks across fork().
    """
    def __init__(self, asgi):
        self.asgi = asgi
        self._wsgi = None

    def __call__(self, *args, **kwargs):
        if len(args) == 3:
            # ASGI 3.0: (scope, receive, send)
            return self.asgi(*args, **kwargs)
        elif len(args) == 2:
            # WSGI: (environ, start_response)
            if self._wsgi is None:
                try:
                    from a2wsgi import ASGIMiddleware
                    self._wsgi = ASGIMiddleware(self.asgi)
                except Exception as e:
                    raise RuntimeError(f"a2wsgi not available: {e}")
            return self._wsgi(*args, **kwargs)
        return self.asgi(*args, **kwargs)

application = UniversalApplication(asgi_app)
app = asgi_app
