#!/bin/bash

# Restart Server with ngrok
# This script stops any existing servers and restarts with ngrok support

echo "🔄 Restarting EduSense with ngrok support..."
echo ""

# Kill any existing ngrok processes
echo "1️⃣  Stopping existing ngrok tunnels..."
pkill -f ngrok 2>/dev/null
sleep 1

# Kill any existing node servers
echo "2️⃣  Stopping existing Node.js servers..."
pkill -f "node server/index.js" 2>/dev/null
sleep 1

echo "3️⃣  Starting fresh server with ngrok..."
echo ""

# Start the server
npm run server

echo ""
echo "✅ Server started!"
echo "📱 Check the terminal output for your ngrok URL"
