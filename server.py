"""
Production-ready server with cross-platform support
Automatically uses the best server for your OS
"""
import os
import sys
from app import app, socketio

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = '0.0.0.0'
    
    # Check environment
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    if is_production and not os.getenv('SECRET_KEY'):
        print("❌ ERROR: SECRET_KEY must be set in production!")
        print("   Set it in your environment variables or .env file")
        sys.exit(1)
    
    # Use appropriate server based on platform
    if sys.platform == 'win32':
        # Use waitress for Windows (better compatibility)
        print(f"🚀 Starting server on http://{host}:{port}")
        print(f"📱 Platform: Windows (using Waitress)")
        print(f"🌍 Share this with friends on same network: http://YOUR_LOCAL_IP:{port}")
        print(f"💡 To find your IP: Run 'ipconfig' and look for IPv4 Address")
        print("-" * 60)
        
        try:
            from waitress import serve
            serve(app, host=host, port=port, threads=6)
        except ImportError:
            print("⚠️  Waitress not installed. Installing...")
            os.system(f"{sys.executable} -m pip install waitress")
            from waitress import serve
            serve(app, host=host, port=port, threads=6)
    else:
        # Use eventlet for Unix-based systems (Linux, Mac)
        print(f"🚀 Starting server on http://{host}:{port}")
        print(f"📱 Platform: {sys.platform} (using Eventlet)")
        print(f"🌍 Share this with friends on same network: http://YOUR_LOCAL_IP:{port}")
        print(f"💡 To find your IP: Run 'ifconfig | grep inet' or 'ip addr'")
        print("-" * 60)
        
        socketio.run(app, host=host, port=port, debug=not is_production)
