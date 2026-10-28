#!/usr/bin/env bash
set -e

echo "=========================================================================="
echo "    ScrutiniX Forensic & Native Tesseract OCR Engine — VPS Setup Script   "
echo "=========================================================================="

# 1. Update OS & Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "[1/4] Installing Docker and dependencies..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
else
    echo "[1/4] Docker is already installed."
fi

# 2. Configure 4GB Swap for memory safety
if [ ! -f /swapfile ]; then
    echo "[2/4] Allocating 4GB swap space for heavy OCR memory spikes..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "[2/4] Swap space is already configured."
fi

# 3. Build & Launch Docker Container
echo "[3/4] Building and starting ScrutiniX Forensic & OCR Engine container..."
cd "$(dirname "$0")"
docker compose down || true
docker compose up -d --build

# 4. Health Check
echo "[4/4] Verifying engine health..."
sleep 5
for i in {1..10}; do
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo ""
        echo "=========================================================================="
        echo " SUCCESS: ScrutiniX Forensic Engine is LIVE on port 8000!"
        echo " Endpoints:"
        echo "   • Health:  http://$(curl -s ifconfig.me):8000/health"
        echo "   • Analyze: POST http://$(curl -s ifconfig.me):8000/analyze"
        echo "   • OCR:     POST http://$(curl -s ifconfig.me):8000/ocr"
        echo "=========================================================================="
        exit 0
    fi
    echo "Waiting for container to boot... ($i/10)"
    sleep 3
done

echo "Error: Engine did not respond on http://localhost:8000/health. Check logs with: docker logs scrutinix-forensic-engine"
exit 1
