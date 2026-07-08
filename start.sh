#!/bin/bash

# Claude + ChatGPT Image MCP Server Startup Script

echo "🚀 Starting Claude + ChatGPT Image MCP Server..."
echo ""

# Install dependencies if not installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
    npm install
    fi

    # Build TypeScript
    echo "🔨 Building TypeScript..."
    npm run build

    echo ""
    echo "✅ Build complete!"
    echo ""
    echo "🎯 Starting MCP Server on http://localhost:3000"
    echo ""
    echo "Environment Variables required:"
    echo "  - CLAUDE_API_KEY: Your Claude API key"
    echo "  - CHATGPT_API_KEY: Your ChatGPT API key"
    echo ""
    echo "Configure your .env file before starting!"
    echo ""

    # Start the server
    npm start
