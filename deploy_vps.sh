#!/bin/bash
# NEURALCORE - Fix Deployment Issues

echo "===================================="
echo "DIAGNOSING DEPLOYMENT ISSUE..."
echo "===================================="

# Check what's using port 80
echo ""
echo "[1] Checking port 80..."
sudo lsof -i :80 || echo "Port 80 is free"

# Check service logs
echo ""
echo "[2] Service logs:"
sudo journalctl -u neuralcore -n 20 --no-pager

# Check if there's a permission issue
echo ""
echo "[3] Checking Python capabilities..."
which python3

# Stop the failing service
echo ""
echo "[4] Stopping current service..."
sudo systemctl stop neuralcore

# Check for Apache/Nginx
echo ""
echo "[5] Checking for conflicting services..."
sudo systemctl status apache2 --no-pager 2>/dev/null || echo "Apache not running"
sudo systemctl status nginx --no-pager 2>/dev/null || echo "Nginx not running"

echo ""
echo "===================================="
echo "FIX: Using port 8080 instead of 80"
echo "===================================="

# Update service to use port 8080
sudo tee /etc/systemd/system/neuralcore.service > /dev/null <<EOF
[Unit]
Description=NEURALCORE TTS System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/neuralcore
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart neuralcore

# Add port forwarding from 80 to 8080
echo ""
echo "[6] Setting up port forwarding (80 -> 8080)..."
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

# Open port 8080 in firewall
sudo ufw allow 8080/tcp

# Wait a moment
sleep 2

echo ""
echo "===================================="
echo "✓ FIX APPLIED!"
echo "===================================="
echo ""
echo "Service Status:"
sudo systemctl status neuralcore --no-pager
echo ""
echo "Your NEURALCORE is now accessible at:"
echo "http://45.10.154.212"
echo ""
echo "To make port forwarding persistent:"
echo "sudo apt install iptables-persistent"
echo "sudo netfilter-persistent save"
