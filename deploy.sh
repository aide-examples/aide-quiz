#!/bin/bash
#
# deploy.sh - Update production installation
#
# Extracts aide-quiz-prod.tar.gz and updates the application.
# Preserves: quizzes/, data.sqlite, .env
#
# Usage: ./deploy.sh
#

set -e

ARCHIVE="aide-quiz-prod.tar.gz"
APP_NAME="aide-quiz"

# Check archive exists
if [ ! -f "$ARCHIVE" ]; then
    echo "❌ Archive not found: $ARCHIVE"
    echo "   Transfer it to this directory first."
    exit 1
fi

echo "=== AIDE Quiz Production Deployment ==="
echo ""

# 1. Stop PM2 process
echo "1. Stopping $APP_NAME..."
pm2 stop "$APP_NAME" 2>/dev/null || echo "   (not running)"

# 2. Backup .env
echo "2. Backing up .env..."
if [ -f "server/.env" ]; then
    cp server/.env .env.backup
    echo "   Saved to .env.backup"
else
    echo "   No .env found"
fi

# 3. Remove old code (preserves quizzes/, data.sqlite, deploy.sh)
echo "3. Removing old code..."
rm -rf server/ public/ shared/
echo "   Removed: server/, public/, shared/"

# 4. Extract new code
echo "4. Extracting $ARCHIVE..."
tar -xzf "$ARCHIVE"
echo "   Extracted."

# 5. Restore .env
echo "5. Restoring .env..."
if [ -f ".env.backup" ]; then
    mv .env.backup server/.env
    echo "   Restored server/.env"
else
    echo "   ⚠️  No .env to restore - create server/.env manually!"
fi

# 6. Install dependencies
echo "6. Installing dependencies..."
cd server
npm install --production --silent
cd ..
echo "   Done."

# 7. Start PM2 process
echo "7. Starting $APP_NAME..."
pm2 start "$APP_NAME"

echo ""
echo "=== Deployment complete ==="
pm2 status "$APP_NAME"
