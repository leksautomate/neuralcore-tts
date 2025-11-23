#!/bin/bash
# NEURAL_CORE VPS Deployment Script (Python HTTP Server)
# Run this on your VPS after uploading files

set -e

echo "===================================="
echo "NEURAL_CORE // VPS DEPLOYMENT"
echo "===================================="

# Update system
echo "[1/4] Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Python3 (usually already installed)
echo "[2/4] Ensuring Python3 is installed..."
sudo apt install python3 -y

# Create application directory
echo "[3/4] Setting up application directory..."
sudo mkdir -p /opt/neuralcore
sudo cp index.html /opt/neuralcore/
sudo chmod -R 755 /opt/neuralcore

# Create systemd service
echo "[4/4] Creating systemd service..."
sudo tee /etc/systemd/system/neuralcore.service > /dev/null <<EOF
[Unit]
Description=NEURAL_CORE TTS System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/neuralcore
ExecStart=/usr/bin/python3 -m http.server 80
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable neuralcore
sudo systemctl start neuralcore

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 'OpenSSH'
sudo ufw --force enable

echo ""
echo "===================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "===================================="
echo ""
echo "Your NEURAL_CORE system is now live at:"
echo "http://45.10.154.212"
echo ""
echo "Server Status:"
sudo systemctl status neuralcore --no-pager
echo ""
echo "Management Commands:"
echo "  Start:   sudo systemctl start neuralcore"
echo "  Stop:    sudo systemctl stop neuralcore"
echo "  Restart: sudo systemctl restart neuralcore"
echo "  Logs:    sudo journalctl -u neuralcore -f"
