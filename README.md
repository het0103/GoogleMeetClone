# GMeet Clone - Video Conferencing Application

A fully functional Google Meet clone built with Python (Flask) backend and minimal HTML/CSS/JS frontend. Features real-time video/audio communication, screen sharing, chat, and participant management.

## Features

- 🎥 **Video Conferencing**: Real-time video and audio communication using WebRTC
- 💬 **In-Meeting Chat**: Send and receive messages during meetings
- 🖥️ **Screen Sharing**: Share your screen with other participants
- 🎤 **Audio Controls**: Mute/unmute microphone
- 📹 **Video Controls**: Turn camera on/off
- 👥 **Multi-Participant Support**: Connect with multiple users simultaneously
- 🔗 **Easy Meeting Links**: Share meeting codes to invite others
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Backend
- **Flask**: Web framework
- **Flask-SocketIO**: Real-time bidirectional communication
- **Eventlet**: Asynchronous networking library

### Frontend
- **HTML5/CSS3**: Structure and styling
- **Vanilla JavaScript**: Interactive functionality
- **WebRTC**: Peer-to-peer video/audio communication
- **Socket.IO**: Real-time communication client

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd GMeetClone
   ```

2. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables** (optional)
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set your `SECRET_KEY`

6. **Run the application**
   
   **Option A: Simple (recommended)**
   ```bash
   python server.py
   ```
   
   **Option B: Quick start script**
   - Windows: Double-click `start.ps1` or run:
     ```powershell
     .\start.ps1
     ```
   - Mac/Linux:
     ```bash
     chmod +x start.sh
     ./start.sh
     ```

7. **Open your browser**
   Navigate to `http://localhost:5000`

## Testing with Friends

### 🚀 Quick Test (3 Methods)

1. **Using ngrok** (Recommended - works anywhere)
   - Download ngrok from https://ngrok.com/download
   - Run: `ngrok http 5000`
   - Share the HTTPS link with friends
   - **✅ Works remotely with HTTPS**

2. **Same WiFi Network**
   - Find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Share: `http://YOUR_IP:5000`
   - **⚠️ Only works on same network**

3. **Cloud Deployment**
   - Deploy to Render/Railway (see Deployment section)
   - Get permanent HTTPS URL
   - **✅ Best for ongoing testing**

**📖 Detailed testing guide: See [QUICK_TEST.md](QUICK_TEST.md)**

## Usage

### Creating a Meeting
1. Open the application homepage
2. Enter your name (optional)
3. Click "Create New Meeting"
4. Share the meeting link or code with others

### Joining a Meeting
1. Open the application homepage
2. Enter your name (optional)
3. Enter the meeting code
4. Click "Join Meeting"

### In-Meeting Controls
- **Microphone**: Toggle audio on/off
- **Camera**: Toggle video on/off
- **Chat**: Open/close chat panel
- **Screen Share**: Share your screen
- **Leave**: Exit the meeting

## Deployment

### Deploy to Heroku

1. **Install Heroku CLI** and login
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-gmeet-clone
   ```

3. **Create a Procfile**
   ```
   web: gunicorn --worker-class eventlet -w 1 app:app
   ```

4. **Set environment variables**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   ```

5. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

### Deploy to Railway/Render

1. Create a new project
2. Connect your GitHub repository
3. Set environment variables (SECRET_KEY, PORT)
4. Deploy

### Deploy to VPS (DigitalOcean, AWS, etc.)

1. **SSH into your server**
2. **Clone the repository**
3. **Install dependencies**
4. **Set up a process manager (systemd or supervisor)**
5. **Configure Nginx as reverse proxy**
6. **Enable HTTPS with Let's Encrypt**

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Project Structure

```
GMeetClone/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── README.md             # This file
├── static/
│   ├── css/
│   │   ├── style.css     # Homepage styles
│   │   └── room.css      # Meeting room styles
│   └── js/
│       ├── home.js       # Homepage logic
│       └── room.js       # Meeting room logic (WebRTC)
└── templates/
    ├── index.html        # Homepage template
    └── room.html         # Meeting room template
```

## Security Considerations

For production deployment:
- Use HTTPS (required for WebRTC)
- Set a strong SECRET_KEY
- Implement user authentication
- Add rate limiting
- Use TURN servers for better connectivity
- Implement meeting passwords
- Add participant limits

## Known Limitations

- Uses STUN servers only (may not work behind strict NAT/firewalls)
- No persistent storage of meetings
- No recording functionality
- No waiting room feature

## Future Enhancements

- User authentication and profiles
- Meeting scheduling
- Recording and playback
- Virtual backgrounds
- Breakout rooms
- Participant hand raise
- Polls and Q&A
- Mobile app

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Python and WebRTC**
