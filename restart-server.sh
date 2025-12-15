#!/bin/bash

# Restart Server Script for EduSense

echo "🔄 Restarting EduSense Server..."

# Find and kill existing server process
echo "🔍 Looking for existing server processes..."
pkill -f "node.*server/index.js" || echo "No existing server found"
pkill -f "nodemon.*server" || true

sleep 2

# Start the server in the background
echo "🚀 Starting server..."
cd server && npm start &

sleep 3

# Test if server is running
echo ""
echo "✅ Testing server..."
curl -s http://localhost:5000/api/health | jq . || echo "❌ Server might not be running correctly"

echo ""
echo "📊 Testing online users API..."
curl -s http://localhost:5000/api/sign2talk/online-count | jq . || echo "❌ API endpoint not responding"

echo ""
echo "✨ Server restart complete!"
echo "📍 Server should be running at: http://localhost:5000"
echo ""
echo "To test online users API, run:"
echo "  node test-online-users.js"
