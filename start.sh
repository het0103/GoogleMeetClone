#!/bin/bash
# Quick Start Script for Mac/Linux

echo "🎥 GMeet Clone - Starting Server..."
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install/Update dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo ""
echo "✅ Server is starting..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Access URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Local:    http://localhost:5000"
if [ ! -z "$LOCAL_IP" ]; then
    echo "   Network:  http://$LOCAL_IP:5000"
    echo ""
    echo "📱 Share http://$LOCAL_IP:5000 with friends on same WiFi!"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 For remote testing, see TESTING_GUIDE.md"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the server
python server.py
