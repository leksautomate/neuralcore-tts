# 🚀 Quick Deploy to VPS - NEURALCORE

Deploy NEURALCORE to your VPS at `45.10.154.212` in 2 simple steps.

---

## 📦 Step 1: Upload Files

From your Windows machine (PowerShell):

```powershell
# Upload files to VPS
scp index.html deploy_vps.sh root@45.10.154.212:/root/
```

Enter your VPS root password when prompted.

---

## ⚡ Step 2: Run Deployment

SSH into your VPS and run the deployment script:

```bash
# Connect to VPS
ssh root@45.10.154.212

# Make script executable
chmod +x deploy_vps.sh

# Run deployment
./deploy_vps.sh
```

---

## ✅ Done!

Your NEURALCORE system will be live at: **http://45.10.154.212**

The script will:
- ✅ Install Python 3
- ✅ Create systemd service
- ✅ Configure firewall
- ✅ Start service (runs 24/7)

---

## 🔧 Management Commands

```bash
# Check status
sudo systemctl status neuralcore

# View logs
sudo journalctl -u neuralcore -f

# Restart
sudo systemctl restart neuralcore

# Stop
sudo systemctl stop neuralcore
```

---

## 🔄 Update Application

To update after making changes:

```bash
# Upload new version
scp index.html root@45.10.154.212:/opt/neuralcore/

# Restart service
ssh root@45.10.154.212 "sudo systemctl restart neuralcore"
```

---

## 📋 Alternative: Deploy via Git

If you prefer using Git:

```bash
# SSH into VPS
ssh root@45.10.154.212

# Clone repository
git clone https://github.com/leksautomate/neuralcore-tts.git
cd neuralcore-tts

# Run deployment
chmod +x deploy_vps.sh
./deploy_vps.sh
```

---

**NEURALCORE // DEPLOYMENT READY**
