#!/bin/bash
#
# zipForProduction.sh - Create deployment archive
#
# Creates a tar.gz for production deployment.
# The archive includes deploy.sh which handles the update on production.
#
# Usage: ./zipForProduction.sh
#

set -e

ARCHIVE="aide-quiz-prod.tar.gz"

echo "Creating production archive..."

tar -czf "$ARCHIVE" \
  --exclude='node_modules' \
  --exclude='.git*' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='*.tar.gz' \
  --exclude='data.sqlite' \
  --exclude='logs' \
  server/ public/ shared/ deploy.sh

echo "✅ Created $ARCHIVE"
echo ""
echo "Contents:"
tar -tzf "$ARCHIVE" | head -20
echo "..."
echo ""
echo "Next steps:"
echo "  1. Transfer to production: scp $ARCHIVE user@prod:/path/"
echo "  2. On production: ./deploy.sh"
