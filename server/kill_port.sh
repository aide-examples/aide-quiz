#!/bin/bash
# kill-port.sh - Frees up a blocked port (IPv4 + IPv6)

PORT=${1:-37373}

echo "Searching for process on port $PORT (IPv4 + IPv6)..."

# Find process ID (IPv4 and IPv6!)
# -i4 = IPv4, -i6 = IPv6
PID_V4=$(lsof -ti4 :$PORT 2>/dev/null)
PID_V6=$(lsof -ti6 :$PORT 2>/dev/null)
PID_FUSER=$(fuser $PORT/tcp 2>/dev/null | awk '{print $1}')

# Combine all found PIDs
ALL_PIDS="$PID_V4 $PID_V6 $PID_FUSER"
UNIQUE_PIDS=$(echo $ALL_PIDS | tr ' ' '\n' | sort -u | grep -v '^$')

if [ -z "$UNIQUE_PIDS" ]; then
    echo "✓ Port $PORT is free (IPv4 + IPv6)"
    exit 0
fi

echo "Found processes:"
for PID in $UNIQUE_PIDS; do
    echo "  PID $PID:"
    ps -p $PID -o pid,ppid,cmd 2>/dev/null | tail -1 | sed 's/^/    /'

    # Show which protocol
    lsof -p $PID 2>/dev/null | grep -i "tcp.*:$PORT" | awk '{print "    " $8 " " $9}'
done

echo ""
read -p "Stop all processes? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
    echo "Cancelled"
    exit 0
fi

echo "Stopping processes..."
for PID in $UNIQUE_PIDS; do
    kill -9 $PID 2>/dev/null && echo "  ✓ PID $PID stopped" || echo "  ✗ PID $PID could not be stopped"
done

echo "✓ Port $PORT freed"
exit 0