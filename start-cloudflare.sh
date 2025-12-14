#!/bin/bash

# 🚀 EduSense with Cloudflare Tunnel Launcher
# This script starts the server with Cloudflare Tunnel for global access

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌐 EduSense + Cloudflare Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed!"
    echo ""
    echo "📥 Install cloudflared:"
    echo "   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "   sudo dpkg -i cloudflared-linux-amd64.deb"
    echo ""
    exit 1
fi

echo "✅ cloudflared found: $(cloudflared --version | head -1)"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "node server/index.js" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
sleep 1

# Start the server
echo "🚀 Starting EduSense server with Cloudflare Tunnel..."
echo ""
npm run server

# Cleanup on exit
trap 'echo "\n\n🛑 Shutting down..."; pkill -f cloudflared; exit 0' INT TERM
