from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEALTH_LOG = ROOT / "logs" / "health-report.log"


def request(url: str, method: str = "GET", body: bytes | None = None, headers: dict[str, str] | None = None) -> tuple[bool, int, str]:
    req = urllib.request.Request(url, data=body, method=method)
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            return True, response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code < 500, exc.code, exc.read().decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        return False, 0, str(exc)


def main() -> int:
    HEALTH_LOG.parent.mkdir(exist_ok=True)
    checks = [
        ("Frontend", "GET", "http://127.0.0.1:5173", None, None),
        ("Backend", "GET", "http://127.0.0.1:4000/health", None, None),
        ("Auth API", "POST", "http://127.0.0.1:4000/api/auth/login", json.dumps({"email": "demo@example.com", "password": "password123"}).encode(), {"Content-Type": "application/json"}),
        ("Products API", "GET", "http://127.0.0.1:4000/api/products", None, {"Authorization": "Bearer offline-dev-token"}),
        ("Catalog API", "GET", "http://127.0.0.1:4000/api/catalogs", None, {"Authorization": "Bearer offline-dev-token"}),
        ("QR API", "GET", "http://127.0.0.1:4000/api/qr/product/00000000-0000-0000-0000-000000000000", None, {"Authorization": "Bearer offline-dev-token"}),
        ("Leads API", "GET", "http://127.0.0.1:4000/api/leads", None, {"Authorization": "Bearer offline-dev-token"}),
        ("Analytics API", "GET", "http://127.0.0.1:4000/api/analytics/summary", None, {"Authorization": "Bearer offline-dev-token"}),
    ]

    lines: list[str] = []
    print("Health check")
    for name, method, url, body, headers in checks:
        ok, status, payload = request(url, method=method, body=body, headers=headers)
        state = "OK" if ok and status < 500 else "FAIL"
        line = f"{name}: {state} ({status})"
        lines.append(line)
        print(line)
        if state == "FAIL":
            print(payload[:200])
    HEALTH_LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 0 if all("FAIL" not in line for line in lines) else 1


if __name__ == "__main__":
    raise SystemExit(main())
