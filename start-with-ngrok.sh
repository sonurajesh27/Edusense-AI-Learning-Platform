#!/bin/bash

echo "🚀 Starting EduSense with ngrok support..."
echo ""

# Kill any existing processes on ports 5000 and 5173
echo "🔄 Cleaning up existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start the backend server (this will auto-start ngrok)
echo "🌐 Starting backend server with ngrok..."
cd server
node index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start the frontend
echo "⚛️  Starting frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ EduSense is starting up!"
echo ""
echo "📝 Server PID: $SERVER_PID"
echo "📝 Frontend PID: $FRONTEND_PID"
echo ""
echo "⏳ Waiting for ngrok to establish tunnel..."
echo "   This may take 5-10 seconds..."
sleep 8

echo ""
echo "🌐 Fetching ngrok URL..."
curl -s http://localhost:5000/api/network-info | python3 -m json.tool 2>/dev/null || echo "Server is still starting..."

echo ""
echo "📱 To connect your mobile:"
echo "   1. Open TouchRead page"
echo "   2. Click 'Connect Mobile Camera'"
echo "   3. Scan the QR code with your mobile"
echo ""
echo "🛑 To stop the servers, run:"
echo "   kill $SERVER_PID $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop monitoring (servers will keep running)"
echo ""

# Monitor logs
wait
