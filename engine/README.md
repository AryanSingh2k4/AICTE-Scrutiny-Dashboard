# ScrutiniX Dedicated Forensic & Native Tesseract OCR Engine (VPS Microservice)

This microservice replaces all external cloud vision APIs by running **native C++ Tesseract OCR**, **Poppler**, and **OpenCV Error Level Analysis (ELA)** inside an isolated, production-grade Docker container on your Linux VPS.

---

## 1. Quick Start on Your Linux VPS (1 Command)

SSH into your Ubuntu VPS (22.04 or 24.04 LTS) and run:

```bash
# 1. Clone or copy the engine directory to your VPS
mkdir -p /opt/scrutinix-engine
cd /opt/scrutinix-engine

# Copy the files: Dockerfile, docker-compose.yml, main.py, requirements.txt, setup.sh

# 2. Make setup script executable and run it:
chmod +x setup.sh
./setup.sh
```

The script will automatically:
- Install Docker & Docker Compose (if not already present).
- Configure a 4GB Swap file to prevent memory exhaustion during multi-page scans.
- Build the container with native `tesseract-ocr`, `poppler-utils`, and `opencv-python-headless`.
- Start the server on port `8000`.
- Verify the health endpoint.

---

## 2. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns service status, native Tesseract version, OpenCV version, and PyMuPDF version. |
| `POST` | `/analyze` | Multipart upload (`file`). Runs OpenCV ELA, XMP metadata analysis, and native Tesseract OCR. Returns structured JSON. |
| `POST` | `/ocr` | Multipart upload (`file`). Runs pure Tesseract OCR on any scanned image or PDF page. |

---

## 3. Connecting to Vercel

In your **Vercel Project Settings $\rightarrow$ Environment Variables** (or in `.env.local`):

```env
FORENSIC_ENGINE_URL=http://<YOUR_VPS_IP>:8000
```

Once set, all document uploads from `scrutinix.vercel.app` will be processed by your VPS's native Tesseract & OpenCV engine with **zero quota limits**.
