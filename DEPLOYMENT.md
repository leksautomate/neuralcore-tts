# VPS Deployment Guide

## Prerequisites
- Ubuntu 20.04 or 22.04 VPS
- Root or sudo access
- Domain name (optional, for SSL)

## Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install nginx
sudo apt install nginx -y

# Install git
sudo apt install git -y
```

## Step 2: Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/longtts
cd /var/www/longtts

# Upload your project files or clone from git
# Option 1: Upload files via SCP/SFTP
# Option 2: Clone from git repository

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Gunicorn for production
pip install gunicorn

# Create .env file with your API token
nano .env
# Add: SPEECHIFY_API_TOKEN=your_token_here
```

## Step 3: Create Systemd Service

Create `/etc/systemd/system/longtts.service`:

```ini
[Unit]
Description=LongTTS Flask Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/longtts
Environment="PATH=/var/www/longtts/venv/bin"
ExecStart=/var/www/longtts/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:8080 app:app

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable longtts
sudo systemctl start longtts
sudo systemctl status longtts
```

## Step 4: Configure Nginx

Create `/etc/nginx/sites-available/longtts`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /var/www/longtts/static;
        expires 30d;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/longtts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Step 6: Setup Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Managing the Application

```bash
# Restart application
sudo systemctl restart longtts

# View logs
sudo journalctl -u longtts -f

# Stop application
sudo systemctl stop longtts

# Check status
sudo systemctl status longtts
```

## Updating the Application

```bash
cd /var/www/longtts
source venv/bin/activate
git pull  # or upload new files
pip install -r requirements.txt
sudo systemctl restart longtts
```

## Troubleshooting

**Check if app is running:**
```bash
sudo systemctl status longtts
```

**View error logs:**
```bash
sudo journalctl -u longtts -n 100 --no-pager
```

**Check nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Test Gunicorn directly:**
```bash
cd /var/www/longtts
source venv/bin/activate
gunicorn --bind 0.0.0.0:8080 app:app
```

## Security Recommendations

1. **Change default SSH port**
2. **Use SSH keys instead of passwords**
3. **Keep system updated:** `sudo apt update && sudo apt upgrade -y`
4. **Configure automatic security updates**
5. **Use strong API tokens**
6. **Regular backups of outputs folder and voices.json**
