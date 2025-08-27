#!/bin/bash

# Step Battle Discord Bot - PM2 Startup Script

echo "🚀 Starting Step Battle Discord Bot with PM2..."

# Build the project first
echo "📦 Building project..."
bun run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it first:"
    echo "   bun install -g pm2"
    exit 1
fi

# Start with PM2
echo "🎯 Starting bot with PM2..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✅ Bot started successfully!"
    echo ""
    echo "📋 Useful commands:"
    echo "   bun run pm2:status    - Check bot status"
    echo "   bun run pm2:logs      - View logs"
    echo "   bun run pm2:restart   - Restart bot"
    echo "   bun run pm2:stop      - Stop bot"
    echo "   bun run deploy        - Build and restart"
else
    echo "❌ Failed to start bot with PM2"
    exit 1
fi 