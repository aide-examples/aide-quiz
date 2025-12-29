# Quiz App - Quick Reference

Practical overview of important files, commands, and configurations.

> **File organization:** [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md#file-organization)
> **Code statistics:** [PROJECT_METRICS.md](PROJECT_METRICS.md)

---

## 🔧 Most Important Files to Edit

### Backend Core

| File | Purpose | When to Edit |
|------|-------|----------------|
| `server/app.js` | Main Entry, Express Setup | Add middleware, routes |
| `server/.env` | Configuration | Change environment |
| `server/config/constants.js` | Global Constants | Modify timeouts, limits |
| `server/config/database.js` | Database Setup | Schema changes |

### Services (Business Logic)

| File | Purpose |
|------|-------|
| `server/services/QuizService.js` | Quiz CRUD Operations |
| `server/services/SessionService.js` | Session Lifecycle |
| `server/services/GradingService.js` | Auto-Grading Logic |
| `server/services/AuthService.js` | Authentication |
| `server/services/MediaService.js` | Media Upload/Management |

### Routers (API Endpoints)

| File | Endpoints |
|------|-----------|
| `server/routers/AuthRouter.js` | `/api/teacher/login`, `/logout`, `/status` |
| `server/routers/QuizRouter.js` | `/api/teacher/quiz`, `/quizzes` |
| `server/routers/SessionRouter.js` | `/api/teacher/session`, `/sessions` |
| `server/routers/ResultRouter.js` | `/api/result/{linkId}` |

### Frontend Core

| File | Purpose |
|------|-------|
| `public/common/ApiHelpers.js` | ⭐ Fetch Wrapper, Error Handling |
| `public/common/BasePath.js` | BASE_PATH Detection |
| `public/common/ValidationClient.js` | Client-side Validation |
| `public/editor/js/QuizEditor.js` | Editor Main Logic |
| `public/editor/js/SessionManager.js` | Session Management UI |
| `public/quiz/quiz.js` | Student Quiz Interface |
| `public/stats/stats.js` | Statistics Dashboard |

### Help & Documentation

| File | Purpose |
|------|-------|
| `public/help/HelpModal.js` | 📚 User Help System |
| `public/help/TechDocsModal.js` | 🏛️ Tech Docs Viewer |
| `docs/INDEX.md` | Documentation Index |
| `docs/DEVELOPMENT_GUIDELINES.md` | ⭐ Architecture Guide |

---

## 🔑 Important Configurations

### Development (.env)

```bash
PORT=37373
BASE_PATH=              # Empty for localhost
NODE_ENV=development
LOG_LEVEL=debug
TEACHER_PASS=test
```

### Production (.env)

```bash
PORT=37373
BASE_PATH=/quiz-app     # Subpath with reverse proxy
NODE_ENV=production
LOG_LEVEL=info
CONSOLE_LOGS=false      # Logs only to files
USE_HTTPS=false         # nginx handles SSL!
TEACHER_PASS=***        # Secure password!
SESSION_SECRET=***      # Generated with: openssl rand -base64 32
```

### nginx Reverse Proxy (Plesk)

```nginx
location ^~ /quiz-app/ {
    proxy_pass http://127.0.0.1:37373;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Cookie $http_cookie;       # ⚠️ Important for sessions!
    proxy_pass_header Set-Cookie;                # ⚠️ Important for sessions!
}
```

---

## 🚀 Common Commands

### Development

```bash
cd server
npm install
npm start
# → http://localhost:37373/
```

**Direct Links:**
- http://localhost:37373/ - Homepage
- http://localhost:37373/editor - Quiz Editor
- http://localhost:37373/quiz - Quiz Participation
- http://localhost:37373/stats - Statistics

### Production Deployment

```bash
# 1. Deploy files via rsync
rsync -avz --exclude 'node_modules' --exclude '.git' \
  quiz-app/ user@server:/var/www/quiz-app/

# 2. Install dependencies
ssh user@server
cd /var/www/quiz-app/server
npm install --production

# 3. Restart service
sudo systemctl restart quiz-app
```

### Debugging

```bash
# View logs
sudo journalctl -u quiz-app -f              # systemd logs
tail -f server/logs/combined-*.log          # application logs
tail -f server/logs/error-*.log             # error logs

# Service Status
sudo systemctl status quiz-app

# Test if server is running
curl http://localhost:37373/quiz-app/common/base.css

# Browser Console
# → Network Tab for API calls
# → Console for client errors
```

### Database

```bash
# Create backup
cp data.sqlite backups/data-$(date +%Y%m%d-%H%M%S).sqlite

# Optimize database
sqlite3 data.sqlite "VACUUM;"

# Inspect database
sqlite3 data.sqlite
sqlite> .tables
sqlite> .schema quizzes
sqlite> SELECT * FROM quizzes;
sqlite> SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Quick Fixes

### Problem: Static Files 404

```bash
# 1. Check if files exist
ls public/common/base.css
ls public/index.html

# 2. Check nginx config
sudo nginx -T | grep quiz-app
# → Should contain location ^~ /quiz-app/

# 3. Check BASE_PATH in .env
grep BASE_PATH server/.env
# → Production: BASE_PATH=/quiz-app
# → Development: BASE_PATH=

# 4. Restart nginx
sudo systemctl restart nginx
```

### Problem: 401 Unauthorized after Login

```bash
# 1. Check USE_HTTPS setting
grep USE_HTTPS server/.env
# → Should be: USE_HTTPS=false (nginx handles SSL!)

# 2. Check Cookie Settings in nginx
sudo nginx -T | grep -A5 "location.*quiz-app"
# → Must have: proxy_set_header Cookie
# → Must have: proxy_pass_header Set-Cookie

# 3. Restart Server
sudo systemctl restart quiz-app

# 4. Browser: Delete cookies
# → DevTools → Application → Cookies → Delete All
```

### Problem: Permission Denied

```bash
# Files Ownership
sudo chown -R www-data:www-data /var/www/quiz-app/

# Permissions
sudo chmod -R 755 /var/www/quiz-app/
sudo chmod -R 775 /var/www/quiz-app/server/logs/
sudo chmod 664 /var/www/quiz-app/data.sqlite
```

### Problem: Module Not Found

```bash
# Development
cd server
rm -rf node_modules package-lock.json
npm install

# Production
cd server
npm install --production
```

---

## 📚 Important Documentation

| File | Content | When to Read |
|-------|--------|-----------|
| [INDEX.md](INDEX.md) | 📚 Documentation Index | Start |
| [DEVELOPMENT GUIDELINES](DEVELOPMENT_GUIDELINES.md) | ⭐ Architecture & Best Practices | Before Development |
| [PROJECT METRICS](PROJECT%20METRICS.md) | 📊 Code Statistics | Code Reviews |
| [DATA.md](DATA.md) | 💾 Data Architecture | DB Changes |
| [ARCHITECTURE REVIEW](ARCHITECTURE%20REVIEW.md) | 🎯 TODO List & Roadmap | Planning |
| server/deployment/DEPLOYMENT.md | 🚀 Production Setup | Deployment |

---

## 🔗 URLs

### Development (localhost)

- http://localhost:37373/ - Homepage
- http://localhost:37373/editor - Quiz Editor (Login: `test`)
- http://localhost:37373/quiz - Quiz Participation
- http://localhost:37373/stats - Statistics
- http://localhost:37373/result/[linkId] - Results View

### Production

- https://followthescore.org/quiz-app/ - Homepage
- https://followthescore.org/quiz-app/editor - Quiz Editor
- https://followthescore.org/quiz-app/quiz - Quiz Participation
- https://followthescore.org/quiz-app/stats - Statistics

---

## 💾 Git Workflow

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "feat: description of change"

# Types:
# feat: new feature
# fix: bugfix
# docs: documentation
# refactor: code restructuring
# style: formatting
# test: tests

# Push
git push origin main

# Tag release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

## 🎓 For Developers: Where to Find What?

### "I want to..."

**...add a new API endpoint**
→ `server/routers/` (e.g., QuizRouter.js)
→ Service method in `server/services/`
→ See: [DEVELOPMENT GUIDELINES - Routers](DEVELOPMENT_GUIDELINES.md)

**...change business logic**
→ `server/services/` (e.g., QuizService.js)
→ Not in Router or Repository!
→ See: [DEVELOPMENT GUIDELINES - Services](DEVELOPMENT_GUIDELINES.md)

**...add a new validation rule**
→ `shared/validation/ObjectValidator.js`
→ Works on both client & server
→ See: [DEVELOPMENT GUIDELINES - Validation](DEVELOPMENT_GUIDELINES.md)

**...throw a custom error**
→ `server/errors/` (e.g., NotFoundError)
→ See: [DEVELOPMENT GUIDELINES - Error Handling](DEVELOPMENT_GUIDELINES.md)

**...change the UI**
→ Frontend in `public/[area]/`
→ Shared components in `public/common/`
→ Styles in corresponding CSS files

**...update documentation**
→ `docs/` for Tech Docs (🏛️ icon)
→ `public/[area]/README.md` for User Help (📚 ? icon)

---

## 📞 Support

For questions:
1. **Technical Architecture:** [DEVELOPMENT GUIDELINES](DEVELOPMENT_GUIDELINES.md)
2. **Code Metrics:** [PROJECT METRICS](PROJECT%20METRICS.md)
3. **Troubleshooting:** This file (Quick Fixes)
4. **Logs:** `server/logs/` & `journalctl -u quiz-app`

---

**Quick Reference complete! Everything important at a glance.** 📋

*For detailed code statistics see [Project Metrics](PROJECT_METRICS.md)*
