import sys
import os
from pathlib import Path

# Get official paths
root_path = Path(__file__).parent.parent.absolute()
backend_path = root_path / "backend"

# Insert paths into sys.path
# Inserting at index 0 to ensure local modules take precedence
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(backend_path))

# Standard Vercel FastAPI entry point
try:
    from main import app
except ImportError:
    from backend.main import app
except Exception as e:
    # This will at least show up in Vercel logs
    print(f"Error initializing Vidhi Setu: {e}")
    raise e
