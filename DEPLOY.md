# 🚀 VPS Deployment Guide - NEURAL_CORE TTS

Deploy your NEURAL_CORE system to run 24/7 on your VPS using Python HTTP Server.

## 📋 Prerequisites

- Ubuntu VPS (18.04+)
- SSH access with sudo privileges
- VPS IP address: `45.10.154.212`
- Python 3 (usually pre-installed)

---

## 🎯 Quick Deployment (Recommended)

### Step 1: Upload Files to VPS

**Option A: Using SCP (from your local machine)**
```powershell
# From your Windows machine (PowerShell)
scp index.html deploy_vps.sh root@YOUR_VPS_IP:/root/
```

**Option B: Using Git**
```bash
# On your VPS
git clone https://github.com/leksautomate/neuralcore-tts.git
cd neuralcore-tts
```

---

### Step 2: Run Deployment Script

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Make script executable
chmod +x deploy_vps.sh

# Run deployment
./deploy_vps.sh
```

**That's it!** Your system will be live at `http://YOUR_VPS_IP` 🎉

---

## 🔧 Manual Deployment

If you prefer to deploy manually:

### 1. Install Python 3 (if needed)
```bash
sudo apt update
sudo apt install python3 -y
```

### 2. Create Application Directory
```bash
sudo mkdir -p /opt/neuralcore
sudo cp index.html /opt/neuralcore/
sudo chmod -R 755 /opt/neuralcore
```

### 3. Create Systemd Service
```bash
sudo nano /etc/systemd/system/neuralcore.service
```

Paste this configuration:
```ini
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
```

### 4. Enable & Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable neuralcore
sudo systemctl start neuralcore
```

### 5. Configure Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 'OpenSSH'
sudo ufw enable
```

---

## 🔒 Add SSL/HTTPS (Optional)

For HTTPS support with Python's http.server, you would need to:
1. Use a reverse proxy like Caddy (simpler than Nginx)
2. Or access via Cloudflare (free SSL)

**Recommended: Use Cloudflare for free SSL**
- Point your domain to VPS IP
- Enable Cloudflare proxy
- Automatic SSL without server configuration

If you don't have a domain, you can access via `http://YOUR_VPS_IP`

---

## 📊 Management Commands

### Check Server Status
```bash
sudo systemctl status neuralcore
```

### View Logs
```bash
# Live logs (real-time)
sudo journalctl -u neuralcore -f

# Last 50 lines
sudo journalctl -u neuralcore -n 50
```

### Restart Server
```bash
sudo systemctl restart neuralcore
```

### Update Application
```bash
# Upload new index.html
scp index.html root@YOUR_VPS_IP:/opt/neuralcore/

# Then restart service
ssh root@YOUR_VPS_IP "sudo systemctl restart neuralcore"

# Or if using git
cd /root/longtts
git pull
sudo cp index.html /opt/neuralcore/
sudo systemctl restart neuralcore
```

### Stop Server
```bash
sudo systemctl stop neuralcore
```

### Start Server
```bash
sudo systemctl start neuralcore
```

---

## 🌐 Access Your System

Once deployed, access from:

- **Direct IP**: `http://YOUR_VPS_IP`
- **With Domain**: `http://yourdomain.com` (after DNS setup)
- **With SSL**: `https://yourdomain.com` (after Certbot)

---

## 🔥 Performance Tips

### 1. Use Cloudflare CDN (Free)
For better global performance:
- Point domain to VPS IP
- Enable Cloudflare proxy
- Free SSL, caching, and DDoS protection

### 2. Optimize VPS
```bash
# Increase file descriptors (if needed)
ulimit -n 65536

# Keep system updated
sudo apt update && sudo apt upgrade -y
```

### 3. Monitor Resources
```bash
# Check CPU and memory
htop

# Check disk space
df -h
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 80
sudo lsof -i :80

# Kill the process if needed
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx     # if Nginx is running
```

### Service Won't Start
```bash
# Check service status
sudo systemctl status neuralcore

# View detailed logs
sudo journalctl -u neuralcore -n 50
```

### Can't Access from Browser
```bash
# Check firewall
sudo ufw status

# Allow HTTP
sudo ufw allow 80/tcp

# Check if service is running
sudo systemctl status neuralcore
```

### Permission Denied on Port 80
```bash
# Make sure service runs as root (already configured in service file)
# Or use a higher port (e.g., 8080) and forward with iptables:
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
```

---

## 📱 Mobile Access

The NEURAL_CORE interface is fully responsive! Access from:
- Desktop browsers
- Mobile phones
- Tablets

All features work identically across devices.

---

## 🔐 Security Recommendations

1. **Use HTTPS** in production (via Cloudflare or reverse proxy)
2. **Keep system updated**: `sudo apt update && sudo apt upgrade`
3. **Configure firewall**: Only allow necessary ports (80, 22)
4. **Regular backups**: Backup `/opt/neuralcore/`
5. **Monitor logs**: `sudo journalctl -u neuralcore -f`
6. **Change SSH port**: Default port 22 is often targeted

---

## 📞 Support

If you encounter issues:
1. Check service logs: `sudo journalctl -u neuralcore -n 50`
2. Verify firewall: `sudo ufw status`
3. Check service status: `sudo systemctl status neuralcore`
4. Verify port: `sudo lsof -i :80`

---

**NEURAL_CORE // DEPLOYMENT COMPLETE**

System Status: 🟢 ONLINE
