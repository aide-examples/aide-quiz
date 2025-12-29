# Quiz App - Production Deployment Guide

## Prerequisites

- Linux Server (Ubuntu/Debian/CentOS)
- Node.js 18+ installed
- apache and nginx installed
- Domain with SSL certificate (Let's Encrypt recommended)
- Optional: Plesk or direct server access

---

## 1. Deploy Files to Server

### Server Structure:

```
/var/www/quiz-app/
├── public/          # Frontend (HTML, CSS, JS)
├── shared/          # Shared Code
└── server/          # Backend (Node.js)
    ├── app.js
    ├── config/
    ├── services/
    ├── .env         # Important: Configuration!
    └── package.json
```

### Deployment Methods:

**Option A: Git (Recommended)**
```bash
cd /var/www
git clone https://github.com/your-repo/quiz-app.git
cd quiz-app/server
npm install --production
```

**Option B: rsync (from local machine)**
```bash
cd ~/quiz-app
rsync -avz --exclude='node_modules' --exclude='.git' \
    ./ user@yourserver:/var/www/quiz-app/
```

**Option C: SCP**
```bash
scp -r ~/quiz-app/* user@yourserver:/var/www/quiz-app/
```

---

## 2. Set Permissions

**IMPORTANT:** If installation was done with root/different user:

```bash
# Switch to web user (typically: www-data, nginx, or custom user)
sudo chown -R www-data:www-data /var/www/quiz-app/

# Or with custom user:
sudo chown -R your-user:your-user /var/www/quiz-app/

# Set correct permissions:
sudo chmod -R 755 /var/www/quiz-app/
sudo chmod -R 775 /var/www/quiz-app/server/logs/
sudo chmod -R 775 /var/www/quiz-app/server/quizzes/
```

**With Plesk:**
```bash
# User is often follow_ssh or similar (see ls -la output)
sudo chown -R follow_ssh:psaserv /var/www/vhosts/domain.com/quiz-app/
sudo chmod -R 755 /var/www/vhosts/domain.com/quiz-app/
```

---

## 3. Environment Configuration (.env)

**File:** `/var/www/quiz-app/server/.env`

```bash
# Server Configuration
PORT=37373
HOST=0.0.0.0
BASE_PATH=/quiz-app
NODE_ENV=production
LOG_LEVEL=info
CONSOLE_LOGS=false
USE_HTTPS=false

# Authentication (CHANGE!)
TEACHER_PASS=your-secure-password-here
SESSION_SECRET=generated-secret-here

# Generate Session Secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important Settings:**

| Setting | Development | Production |
|---------|-------------|------------|
| BASE_PATH | `` (empty) | `/quiz-app` |
| NODE_ENV | development | production |
| CONSOLE_LOGS | true | false |
| USE_HTTPS | false | false (nginx handles SSL) |
| TEACHER_PASS | test | **secure password!** |

---

## 4. apache Configuration

```apache
<IfModule mod_proxy.c>
	ProxyPreserveHost On
	ProxyPass /quiz-app http://localhost:37373/quiz-app
	ProxyPassReverse /quiz-app http://localhost:37373/quiz-app
</IfModule>
```

## 5. nginx Configuration

```nginx
location ^~ /quiz-app/ {
	proxy_pass http://localhost:37373;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
	proxy_set_header Cookie $http_cookie;
	proxy_pass_header Set-Cookie;
}
```

---

## 6. Node.js as Service (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
cd /var/www/quiz-app/server
pm2 start app.js --name aide-quiz

# Save process list (survives reboot)
pm2 save

# Setup startup script
pm2 startup
```

---

## 7. Test Deployment

### Check 1: Node.js is running
```bash
sudo systemctl status quiz-app
curl http://localhost:37373/quiz-app/common/base.css
# → Should return CSS
```

### Check 2: nginx forwards correctly
```bash
curl -I https://yourdomain.com/quiz-app/common/base.css
# → HTTP/1.1 200 OK
# → Content-Type: text/css
```

### Check 3: Browser Test
```
https://yourdomain.com/quiz-app/editor
→ Opens without 404 error
→ DevTools Console: No errors
→ Login works
```

### Check 4: Sessions work
```
1. Login as Teacher
2. Reload page
3. Should still be logged in
```

---

## 8. Monitor Logs

with PM2 or directly:

```bash
# App Logs
tail -f /var/www/quiz-app/server/logs/combined-*.log

# nginx Logs
tail -f /var/log/nginx/access.log | grep quiz-app
tail -f /var/log/nginx/error.log
```

---

## Security Checklist

- [ ] `.env` is NOT committed to Git
- [ ] `TEACHER_PASS` changed (not "test")
- [ ] `SESSION_SECRET` generated (not default)
- [ ] `NODE_ENV=production` set
- [ ] File Permissions correct (not 777!)
- [ ] nginx HTTPS enabled (SSL certificate)
- [ ] Firewall allows only 80/443 (not 37373 directly!)
- [ ] Regular updates (npm, OS)

---

## Production URLs

After successful deployment:

```
https://yourdomain.com/quiz-app/              → Home
https://yourdomain.com/quiz-app/editor        → Editor (Teacher)
https://yourdomain.com/quiz-app/quiz          → Quiz (Student)
https://yourdomain.com/quiz-app/stats         → Stats (Teacher)
```

---

## Updates

For subsequent updates after initial installation.

### On Development Machine

```bash
./zipForProduction.sh
```

Creates `aide-quiz-prod.tar.gz` containing:
- server/, public/, shared/
- deploy.sh (the update script)

**Excludes:** node_modules, .env, data.sqlite, quizzes/, logs

### Transfer to Production

```bash
scp aide-quiz-prod.tar.gz user@prod:/var/www/quiz-app/
```

### On Production

```bash
cd /var/www/quiz-app
./deploy.sh
```

**deploy.sh performs:**
1. Stops PM2 process
2. Backs up .env
3. Deletes old server/, public/, shared/ (removes zombie files)
4. Extracts new archive
5. Restores .env
6. Runs npm install
7. Restarts PM2

**Preserved:** quizzes/, data.sqlite, .env

---

## Backup

**Important files to backup:**

```bash
# Database
/var/www/quiz-app/server/data.sqlite

# Quizzes
/var/www/quiz-app/server/quizzes/

# Config
/var/www/quiz-app/server/.env

# Backup Script:
tar -czf quiz-app-backup-$(date +%Y%m%d).tar.gz \
    /var/www/quiz-app/server/data.sqlite \
    /var/www/quiz-app/server/quizzes/ \
    /var/www/quiz-app/server/.env
```

---

## Monitoring

```bash
# PM2 Status
pm2 status aide-quiz

# Live Logs
pm2 logs aide-quiz

# App Logs (file)
tail -f /var/www/quiz-app/server/logs/combined-*.log

# Disk Space
df -h /var/www/quiz-app

# Log Size
du -sh /var/www/quiz-app/server/logs/
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start | `pm2 start aide-quiz` |
| Stop | `pm2 stop aide-quiz` |
| Restart | `pm2 restart aide-quiz` |
| Status | `pm2 status aide-quiz` |
| Logs | `pm2 logs aide-quiz` |
| Update | `./deploy.sh` |
| nginx reload | `sudo systemctl reload nginx` |
| Test nginx | `sudo nginx -t` |

---

## Support

If problems occur:
1. Check Logs: `sudo journalctl -u quiz-app -n 100`
2. Check nginx: `sudo nginx -T | grep quiz-app`
3. Check Permissions: `ls -la /var/www/quiz-app/`
4. Check .env: `cat /var/www/quiz-app/server/.env`

**Deployment successful? Test the URLs and get started!** 🎯
