# Local Development Setup

This guide helps you set up AIDE Quiz on your local machine for development.

---

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Just try AIDE Quiz | [Live Demo](https://followthescore.org/aide-quiz) |
| Already have WSL + Node.js | [Quick Setup](#quick-setup-experienced-developers) |
| Start from scratch (Windows) | [Full Setup Guide](#full-setup-windows--wsl) |
| Start from scratch (macOS/Linux) | [Full Setup Guide](#full-setup-macos--linux) |

---

## Prerequisites

| Tool | Version | Why needed |
|------|---------|------------|
| **WSL 2** | Ubuntu 22.04+ | Required on Windows (native Linux commands) |
| **Git** | 2.x+ | Clone repository |
| **Node.js** | 18+ LTS | JavaScript runtime |
| **npm** | 9+ | Package manager (comes with Node.js) |
| **VS Code** | Latest | Recommended IDE with WSL support |
| **Claude Code** | Latest | AI pair programming (CLI) |

### Check Your Setup

```bash
# Run these commands to verify your setup
git --version      # Should show 2.x+
node --version     # Should show v18+ or v20+
npm --version      # Should show 9+ or 10+
claude --version   # Should show claude-code version
```

---

## Quick Setup (Experienced Developers)

If you already have WSL/Linux, Node.js 18+, and Git:

```bash
# Clone repository
git clone https://github.com/aide-examples/aide-quiz.git
cd aide-quiz

# Enable pre-commit hooks
git config core.hooksPath .githooks

# Install dependencies and start
cd server
npm install
npm start

# Open in browser
# http://localhost:37373/
```

**Default login for Editor:** Password `test`

---

## Full Setup: Windows + WSL

### Step 1: Install WSL 2

WSL (Windows Subsystem for Linux) is **required** for AIDE Quiz development on Windows.

```powershell
# Run in PowerShell as Administrator
wsl --install
```

This installs Ubuntu by default. Restart your computer when prompted.

After restart, Ubuntu will open automatically. Create a username and password.

### Step 2: Update Ubuntu

```bash
# In Ubuntu terminal
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Node.js via nvm

We recommend **nvm** (Node Version Manager) for easy Node.js management:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js LTS
nvm install --lts

# Verify installation
node --version   # Should show v20.x or v22.x
npm --version    # Should show 10.x
```

### Step 4: Install VS Code with WSL Extension

1. Download and install [VS Code](https://code.visualstudio.com/) on Windows
2. Install the **WSL extension** (search "WSL" in Extensions)
3. In Ubuntu terminal, type `code .` to open VS Code connected to WSL

### Step 5: Install Claude Code

Claude Code is a CLI tool for AI-assisted development:

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

# First-time setup (requires Anthropic API key or Claude account)
claude
```

### Step 6: Clone and Run AIDE Quiz

```bash
# Clone from GitHub
git clone https://github.com/aide-examples/aide-quiz.git

# Navigate to server directory
cd aide-quiz/server

# Install dependencies
npm install

# Start the server
npm start
```

Open your browser: **http://localhost:37373/**

---

## Full Setup: macOS / Linux

### Step 1: Install Node.js via nvm

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc   # or ~/.zshrc on macOS

# Install Node.js LTS
nvm install --lts

# Verify
node --version
npm --version
```

### Step 2: Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

### Step 3: Clone and Run

```bash
git clone https://github.com/aide-examples/aide-quiz.git
cd aide-quiz/server
npm install
npm start
```

Open: **http://localhost:37373/**

---

## About AI Tools

### Claude Code CLI (Recommended)

AIDE Quiz is designed for **CLI-based AI collaboration**. Claude Code runs in your terminal and can:

- Read and edit files directly
- Run commands
- Understand your entire codebase
- Follow project conventions (via `.claude/` configuration)

```bash
# Start Claude Code in project directory
cd aide-quiz
claude

# Begin a session
/start
```

### Web-based AI (Limited)

You can experiment with web-based AI tools like:
- [claude.ai](https://claude.ai)
- ChatGPT
- Gemini

However, **web UIs are not suitable for serious development** because:

| CLI (Claude Code) | Web UI |
|-------------------|--------|
| Reads your files directly | Copy-paste code manually |
| Edits files in place | Copy-paste back manually |
| Understands project structure | No context between messages |
| Runs commands | You run commands manually |
| Follows `.claude/` conventions | No project awareness |

**Our concept relies on the terminal.** Web UIs may work for quick questions but are nearly unusable for the iterative, context-aware workflow AIDE teaches.

---

## For Java Developers

Coming from Spring Boot / Maven? Here's the mapping:

| Java Ecosystem | Node.js Equivalent |
|----------------|-------------------|
| JDK | Node.js |
| Maven / Gradle | npm |
| `pom.xml` / `build.gradle` | `package.json` |
| Spring Boot | Express.js |
| JPA / Hibernate | better-sqlite3 (raw SQL) |
| `application.properties` | `.env` files |
| `@RestController` | Router (e.g., `QuizRouter.js`) |
| `@Service` | Service (e.g., `QuizService.js`) |
| `@Repository` | Repository (e.g., `QuizRepository.js`) |

**Key differences:**
- No compilation step (JavaScript runs directly)
- Single-threaded event loop (not thread pools)
- `async/await` instead of `CompletableFuture`
- No type annotations (unless using TypeScript)

---

## Project Structure

After cloning, you'll see:

```
aide-quiz/
├── server/           # Backend (Node.js + Express)
│   ├── app.js        # Entry point
│   ├── routers/      # API endpoints
│   ├── services/     # Business logic
│   ├── repositories/ # Database access
│   └── package.json  # Dependencies
│
├── public/           # Frontend (Vanilla JS)
│   ├── index.html    # Landing page
│   ├── editor/       # Quiz Editor
│   ├── quiz/         # Quiz participation
│   ├── stats/        # Statistics
│   └── docs/         # Documentation (you are here)
│
├── shared/           # Shared code (client + server)
│   └── validation/   # Isomorphic validation
│
└── .claude/          # Claude Code configuration
    └── commands/     # Custom slash commands
```

---

## Common URLs

| URL | Purpose |
|-----|---------|
| http://localhost:37373/ | Home / Landing Page |
| http://localhost:37373/editor | Quiz Editor (Teacher) |
| http://localhost:37373/quiz | Take Quiz (Student) |
| http://localhost:37373/stats | Statistics |
| http://localhost:37373/result | View Results |

---

## Troubleshooting

### Port 37373 already in use

```bash
# Find process using the port
lsof -i :37373

# Kill it (replace PID with actual number)
kill -9 <PID>

# Or use the helper script
./kill_port.sh 37373
```

### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

### WSL networking issues

If `localhost` doesn't work from Windows browser:

```bash
# Get WSL IP address
hostname -I

# Use that IP instead, e.g., http://172.x.x.x:37373/
```

### Claude Code not found

```bash
# Ensure global npm bin is in PATH
export PATH="$PATH:$(npm config get prefix)/bin"

# Add to ~/.bashrc for persistence
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.bashrc
```

---

## Next Steps

Once running locally:

1. **Read the [Student Guide](STUDENT_GUIDE.md)** - Choose your learning path
2. **Start a Claude session** - Run `claude` then `/start`
3. **Explore the architecture** - Click 🏛️ in the header
4. **Try the Quiz Editor** - Login with password `test`

---

## See Also

- [STUDENT_GUIDE.md](STUDENT_GUIDE.md) - Learning paths by experience level
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production server setup
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Cheat sheet
- [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) - Coding standards
