# ScrutiniX Forensic & Native Tesseract OCR Engine (VPS Microservice)

Runs native C++ Tesseract OCR, Poppler, and OpenCV Error Level Analysis (ELA) inside an isolated Docker container on your Linux VPS.

---

## Direct Launch on Your Linux VPS

```bash
cd engine
docker compose up -d --build
```

That's it. Docker will build the image (`Dockerfile`) and start the container on port `8000`.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service status, Tesseract version, OpenCV version, and PyMuPDF version. |
| `POST` | `/analyze` | Multipart upload (`file`). Runs OpenCV ELA, XMP metadata analysis, and native Tesseract OCR. |
| `POST` | `/ocr` | Multipart upload (`file`). Runs pure Tesseract OCR on any image or PDF. |

---

## Connecting Your App

In your `.env.local` or hosting environment variables:

```env
FORENSIC_ENGINE_URL=http://<YOUR_VPS_IP>:8000
```
