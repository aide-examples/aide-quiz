# AIDE - Quiz

Professional quiz application for educators with live session management, automatic grading, and comprehensive statistics. Try the [LIVE DEMO](https://followthescore.org/aide-quiz) ..

This project is part of [AIDE examples](https://github.com/aide-examples) - a series of applications built almost completely with agentic coding.

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

For ease of teaching we wanted to have the same language on client and server, which excluded java and php. A layered architecture with a relational database is the practically most relevant environment and a "must" to teach. On the client we opted against heavy frameworks as they tend to hide some complexity which must first be understood. Furthermore such frameworks are subject to hype cycles and age rapidly. *jquery* could be an option if the UI should become more fancy.

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
- **pm2** - Service management
- **Let's Encrypt** - SSL certificates

