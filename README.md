<<<<<<< HEAD
# Quiz-App - Interactive Quiz Application

Professional quiz application for educators with live session management, automatic grading, and comprehensive statistics.

---

## Features

### For Teachers
- 📝 **Quiz Editor** - Visual editor with Markdown support
- 🎯 **Multiple Question Types** - Multiple Choice, Checkboxes, Gap Fill, True/False
- 📸 **Media Support** - Images and videos in questions
- 🔄 **Live Sessions** - Real-time student participation
- 📊 **Statistics** - Detailed performance analytics
- 💾 **Export** - CSV and detailed reports
- 🔒 **Authentication** - Secure teacher access

### For Students
- 🚀 **Instant Join** - No registration needed
- ⏱️ **Timed Sessions** - Automatic submission
- ✅ **Instant Feedback** - See results immediately
- 📱 **Responsive** - Works on all devices
- 🎨 **Clean UI** - Intuitive and distraction-free

---

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (better-sqlite3)
- **Winston** - Logging with rotation

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Marked.js** - Markdown rendering
- **Modern CSS** - Responsive design

### Infrastructure
- **nginx** - Reverse proxy
- **systemd** - Service management
- **Let's Encrypt** - SSL certificates

---

## Project Structure

```
quiz-app/
├── public/                 # Frontend (served as static files)
│   ├── common.css         # Shared styles
│   ├── common.js          # Shared utilities
│   ├── ValidationClient.js
│   ├── editor/            # Quiz editor
│   ├── quiz/              # Student quiz interface
│   ├── stats/             # Statistics dashboard
│   └── result/            # Results view
├── shared/                # Shared code (validation rules)
│   └── validation/
└── server/                # Backend
    ├── app.js            # Main entry point
    ├── config/           # Configuration
    ├── middleware/       # Express middleware
    ├── repositories/     # Database layer
    ├── routers/          # API routes
    ├── services/         # Business logic
    ├── utils/            # Utilities
    ├── .env             # Environment config (not in git!)
    └── package.json      # Dependencies
```

---

## Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/quiz-app.git
cd quiz-app

# Install dependencies
cd server
npm install

# Setup environment
cp .env.development .env

# Start server
npm start
```

### Access

```
http://localhost:37373/             # Home
http://localhost:37373/editor       # Editor (Password: test)
http://localhost:37373/quiz         # Quiz (Student view)
http://localhost:37373/stats        # Statistics
```

---

## Production Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete production setup guide.

### Quick Steps

1. Deploy files to server
2. Configure `.env` with production settings
3. Setup nginx reverse proxy
4. Create systemd service
5. Start and enable service

### Production URLs

```
https://yourdomain.com/quiz-app/              # Home
https://yourdomain.com/quiz-app/editor        # Editor
https://yourdomain.com/quiz-app/quiz          # Quiz
https://yourdomain.com/quiz-app/stats         # Statistics
```

---

## Configuration

### Environment Variables

**Development (`.env.development`):**
```bash
PORT=37373
HOST=localhost
BASE_PATH=
NODE_ENV=development
LOG_LEVEL=debug
TEACHER_PASS=test
SESSION_SECRET=dev-secret
```

**Production (`.env.production`):**
```bash
PORT=37373
HOST=0.0.0.0
BASE_PATH=/quiz-app
NODE_ENV=production
LOG_LEVEL=info
CONSOLE_LOGS=false
USE_HTTPS=false
TEACHER_PASS=your-secure-password
SESSION_SECRET=generated-secure-secret
```

---

## API Overview

### Teacher Endpoints (Authentication Required)

```
POST   /api/teacher/login           # Login
POST   /api/teacher/logout          # Logout
GET    /api/teacher/status          # Check auth status

GET    /api/teacher/quizzes         # List quizzes
GET    /api/teacher/quiz/:id        # Get quiz
POST   /api/teacher/quiz            # Create quiz
PUT    /api/teacher/quiz/:id        # Update quiz
DELETE /api/teacher/quiz/:id        # Delete quiz

POST   /api/teacher/session         # Create session
GET    /api/teacher/sessions        # List sessions
PUT    /api/teacher/session/:id     # Update session
DELETE /api/teacher/session/:id     # Delete session

GET    /api/teacher/results/:sessionId  # Get results
POST   /api/export/:sessionId/csv       # Export CSV
```

### Student Endpoints (Public)

```
GET    /api/session/active/:name    # Get active session
POST   /api/submission              # Submit answers
GET    /api/result/:submissionId    # Get result
```

---

## Database Schema

### Tables

- **quizzes** - Quiz definitions (JSON)
- **quiz_sessions** - Active quiz sessions
- **submissions** - Student answers and scores
- **sessions** - Express sessions (auth)

### Relationships

```
quizzes (1) ──< (N) quiz_sessions (1) ──< (N) submissions
```

---

## Logging

Logs are automatically rotated daily:

```
server/logs/
├── combined-YYYY-MM-DD.log    # All logs (7 days)
├── error-YYYY-MM-DD.log       # Errors only (14 days)
├── exceptions-YYYY-MM-DD.log  # Crashes (30 days)
└── rejections-YYYY-MM-DD.log  # Promise rejections (30 days)
```

### Log Levels

- `debug` - Detailed info (development)
- `info` - General info (production default)
- `warn` - Warnings
- `error` - Errors

---

## Security

### Implemented

- ✅ HTTPS (via nginx)
- ✅ Secure session cookies
- ✅ Password protection (bcrypt)
- ✅ CSRF protection (SameSite cookies)
- ✅ Input validation
- ✅ File type validation (media uploads)
- ✅ HTTP-only cookies
- ✅ Request correlation IDs

### Best Practices

- Change default passwords in production
- Generate secure SESSION_SECRET
- Keep `.env` out of git
- Regular security updates
- Monitor logs
- Backup database regularly

---

## Backup & Maintenance

### Manual Backup

```bash
# Backup database
cp server/data.sqlite backups/data-$(date +%Y%m%d).sqlite

# Backup quizzes
tar -czf backups/quizzes-$(date +%Y%m%d).tar.gz server/quizzes/
```

### Automated Backup

See `backup.sh` script in DEPLOYMENT.md

### Database Maintenance

```bash
# Optimize database (reduces size)
sqlite3 server/data.sqlite "VACUUM;"

# Check integrity
sqlite3 server/data.sqlite "PRAGMA integrity_check;"
```

---

## Troubleshooting

### Common Issues

**Static files 404:**
- Check nginx config has `location ^~ /quiz-app/` (not just `/quiz-app/api/`)
- Verify files exist in `public/` directory

**401 after login:**
- Check `USE_HTTPS=false` in `.env` (when behind nginx)
- Verify nginx forwards Cookie headers

**Permission denied:**
- Run `chmod -R 755` on quiz-app directory
- Check `.env` is readable by service user

**Service won't start:**
- Check logs: `sudo journalctl -u quiz-app -n 50`
- Verify port 37373 is free
- Check `.env` exists and is valid

See DEPLOYMENT.md for detailed troubleshooting.

---

## Development

### File Watching

```bash
# Development with auto-reload
npm install -g nodemon
nodemon server/app.js
```

### Testing Endpoints

```bash
# Test API (examples)
curl http://localhost:37373/api/teacher/quizzes
curl -X POST http://localhost:37373/api/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}'
```

### Code Style

- ES6+ JavaScript
- Async/await for asynchronous code
- Class-based architecture
- Comprehensive error handling
- JSDoc comments for functions

---

## Performance

### Optimization Features

- Daily log rotation (prevents disk full)
- SQLite with WAL mode (concurrent reads)
- Session store in SQLite (persistent)
- Static file serving via nginx
- Connection pooling
- Request correlation for debugging

### Scalability Considerations

- Single-server setup (suitable for small-medium load)
- SQLite handles ~100k requests/day easily
- For higher load: Consider PostgreSQL + Redis
- Horizontal scaling: Use session store in Redis

---

## License

[Specify your license here]

---

## Support

**Issues:** [GitHub Issues](https://github.com/your-repo/quiz-app/issues)
**Documentation:** See `/docs` folder
**Deployment:** See DEPLOYMENT.md

---

## Changelog

### v1.0.0 (2024-12-17)
- Initial production release
- Quiz editor with media support
- Live session management
- Automatic grading
- Statistics and export
- Production deployment

---

## Credits

Built with ❤️ for education

**Key Dependencies:**
- [Express.js](https://expressjs.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Winston](https://github.com/winstonjs/winston)
- [Marked](https://marked.js.org/)

---

**Ready to create engaging quizzes!** 🎯
=======
# aide-quiz
Online Quiz Application
>>>>>>> origin/main
