# ScrutiniX Forensic & Native Tesseract OCR Engine (VPS Microservice)

Runs native C++ Tesseract OCR, Poppler, and OpenCV Error Level Analysis (ELA) inside an isolated, hardened Docker container on your Linux VPS.

---

## Direct Launch on Your Linux VPS

```bash
cd engine
docker compose up -d --build
```

Docker will build the hardened image (`Dockerfile`) and run the container on port `8000`.

---

## Security Hardening (Built-In)

1. **Non-Root Execution**: The container drops root privileges and runs as an unprivileged system user (`appuser`, UID 1000).
2. **Resource Capping**: Memory is strictly capped to `3G` and CPU to `2.0` cores. It can never consume your 12GB VPS RAM or freeze the host.
3. **Privilege Escalation Protection**: `no-new-privileges:true` prevents container processes from gaining elevated permissions.
4. **DoS File Size Limiter**: Files exceeding 25MB are rejected immediately with HTTP 413.
5. **Optional API Key Lockdown**: Set `ENGINE_API_KEY` in `docker-compose.yml` (and `FORENSIC_ENGINE_KEY` in Next.js) to reject any unauthenticated requests from unauthorized internet scanners.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service status, Tesseract version, OpenCV version, and PyMuPDF version (Public healthcheck). |
| `POST` | `/analyze` | Multipart upload (`file`). Runs OpenCV ELA, XMP metadata analysis, and native Tesseract OCR. |
| `POST` | `/ocr` | Multipart upload (`file`). Runs pure Tesseract OCR on any image or PDF. |

---

## Connecting Your App

In your `.env.local` or hosting environment variables:

```env
FORENSIC_ENGINE_URL=http://<YOUR_VPS_IP>:8000
# Optional: if you configured an API key in docker-compose.yml:
# FORENSIC_ENGINE_KEY=your-secret-api-key
```
