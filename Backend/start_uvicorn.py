import os
import sys

# Ensure project root directory is on sys.path so `backend` package is importable
# When this script is run from inside `backend/`, adding the parent directory
# (project root) lets Python locate the top-level `backend` package.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import uvicorn
import importlib


def find_app():
    """Try to import the ASGI `app` object from several possible module paths.
    Returns the app object if found, otherwise raises ImportError.
    """
    candidates = [
        ("backend.main", "app"),
        ("main", "app"),
        ("backend.app", "app"),
        ("app", "app"),
    ]

    for mod_name, attr in candidates:
        try:
            mod = importlib.import_module(mod_name)
            if hasattr(mod, attr):
                return getattr(mod, attr)
        except Exception:
            continue
    raise ImportError("Could not locate ASGI `app` in any known module path")


if __name__ == '__main__':
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', '8000'))

    # Import the app object directly to avoid import-string parsing issues
    try:
        app = find_app()
    except ImportError as e:
        print("Error:", e)
        print("sys.path:\n", "\n".join(sys.path))
        raise

    # When passing app object directly, uvicorn requires reload=False
    # (reload only works with import strings)
    uvicorn.run(app, host=host, port=port, reload=False)
