from __future__ import annotations

import os
import subprocess
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"
NPM = "npm.cmd" if os.name == "nt" else "npm"
BACKEND_URL = "http://localhost:4000"
FRONTEND_URL = "http://localhost:5173"


def run(cmd: list[str], cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(cmd, cwd=str(cwd))


def main() -> int:
    if not FRONTEND.exists() or not BACKEND.exists():
        print("Missing frontend/ or backend/ folder.")
        return 1

    backend_proc = run([NPM, "run", "dev"], BACKEND)
    frontend_proc = run([NPM, "run", "dev", "--", "--host", "127.0.0.1"], FRONTEND)

    print(f"Backend: {BACKEND_URL}")
    print(f"Frontend: {FRONTEND_URL}")

    browser_opened = False
    try:
        while True:
            backend_code = backend_proc.poll()
            frontend_code = frontend_proc.poll()
            if backend_code is not None or frontend_code is not None:
                return backend_code or frontend_code or 0

            if not browser_opened:
                time.sleep(3)
                webbrowser.open(FRONTEND_URL)
                browser_opened = True
            time.sleep(1)
    except KeyboardInterrupt:
        backend_proc.terminate()
        frontend_proc.terminate()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
