from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import sys
from datetime import datetime
import secrets
import logging
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Environment validation
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'
SECRET_KEY = os.getenv('SECRET_KEY')

if IS_PRODUCTION and not SECRET_KEY:
    logger.error("❌ SECRET_KEY is required in production!")
    sys.exit(1)

app.config['SECRET_KEY'] = SECRET_KEY or secrets.token_hex(16)

# CORS configuration - restrict in production
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')
if ALLOWED_ORIGINS != '*':
    ALLOWED_ORIGINS = ALLOWED_ORIGINS.split(',')

# Initialize SocketIO with secure CORS
socketio = SocketIO(
    app,
    cors_allowed_origins=ALLOWED_ORIGINS,
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True
)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Store active rooms and participants (in-memory for now, can integrate Firebase)
active_rooms = {}
room_participants = {}
meeting_history = []


@app.route('/')
def index():
    """Home page - Create or join a meeting"""
    return render_template('index.html')


@app.route('/room/<room_id>')
def room(room_id):
    """Meeting room page"""
    return render_template('room.html', room_id=room_id)


@app.route('/api/create-room', methods=['POST'])
@limiter.limit("10 per minute")
def create_room():
    """Create a new meeting room"""
    try:
        room_id = secrets.token_urlsafe(8)
        meeting_data = {
            'created_at': datetime.now().isoformat(),
            'participants': [],
            'creator_ip': request.remote_addr,
            'active': True
        }
        active_rooms[room_id] = meeting_data
        
        # Log meeting creation
        logger.info(f"Meeting created: {room_id} by {request.remote_addr}")
        
        # Add to history
        meeting_history.append({
            'room_id': room_id,
            'created_at': meeting_data['created_at'],
            'status': 'created'
        })
        
        return jsonify({
            'room_id': room_id,
            'url': f'/room/{room_id}',
            'success': True
        })
    except Exception as e:
        logger.error(f"Error creating room: {str(e)}")
        return jsonify({'error': 'Failed to create room', 'success': False}), 500


@app.route('/api/room-status/<room_id>', methods=['GET'])
def room_status(room_id):
    """Check if a room exists and is active"""
    if room_id in active_rooms:
        participant_count = len(room_participants.get(room_id, []))
        return jsonify({
            'exists': True,
            'active': active_rooms[room_id].get('active', True),
            'participant_count': participant_count
        })
    return jsonify({'exists': False}), 404


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint for deployment platforms"""
    return jsonify({
        'status': 'healthy',
        'active_rooms': len(active_rooms),
        'total_participants': sum(len(p) for p in room_participants.values())
    })


# SocketIO Events
@socketio.on('join')
def on_join(data):
    """Handle user joining a room"""
    try:
        room_id = data.get('room')
        username = data.get('username', 'Anonymous')
        
        # Validate room exists
        if room_id not in active_rooms:
            emit('error', {'message': 'Room not found'})
            return
        
        # Check participant limit (max 20 for performance)
        current_participants = len(room_participants.get(room_id, []))
        if current_participants >= 20:
            emit('error', {'message': 'Room is full (max 20 participants)'})
            return
        
        join_room(room_id)
        
        # Initialize room if it doesn't exist
        if room_id not in room_participants:
            room_participants[room_id] = []
        
        # Add participant with timestamp
        participant = {
            'sid': request.sid,
            'username': username,
            'joined_at': datetime.now().isoformat()
        }
        room_participants[room_id].append(participant)
        
        # Update active rooms
        if room_id in active_rooms:
            active_rooms[room_id]['participants'].append(username)
        
        # Notify others in the room
        emit('user-connected', {
            'userId': request.sid,
            'username': username,
            'participants': room_participants[room_id]
        }, room=room_id)
        
        logger.info(f"User {username} ({request.sid}) joined room {room_id}")
        
    except Exception as e:
        logger.error(f"Error in join: {str(e)}")
        emit('error', {'message': 'Failed to join room'})


@socketio.on('offer')
def on_offer(data):
    """Handle WebRTC offer"""
    emit('offer', {
        'offer': data['offer'],
        'sender': request.sid
    }, room=data['target'])


@socketio.on('answer')
def on_answer(data):
    """Handle WebRTC answer"""
    emit('answer', {
        'answer': data['answer'],
        'sender': request.sid
    }, room=data['target'])


@socketio.on('ice-candidate')
def on_ice_candidate(data):
    """Handle ICE candidate exchange"""
    emit('ice-candidate', {
        'candidate': data['candidate'],
        'sender': request.sid
    }, room=data['target'])


@socketio.on('message')
def on_message(data):
    """Handle chat messages"""
    room_id = data.get('room')
    message = data.get('message')
    username = data.get('username', 'Anonymous')
    
    emit('message', {
        'message': message,
        'username': username,
        'timestamp': datetime.now().strftime('%H:%M'),
        'sender': request.sid
    }, room=room_id)


@socketio.on('toggle-video')
def on_toggle_video(data):
    """Handle video toggle"""
    room_id = data.get('room')
    video_enabled = data.get('videoEnabled')
    
    emit('user-video-toggle', {
        'userId': request.sid,
        'videoEnabled': video_enabled
    }, room=room_id, include_self=False)


@socketio.on('toggle-audio')
def on_toggle_audio(data):
    """Handle audio toggle"""
    room_id = data.get('room')
    audio_enabled = data.get('audioEnabled')
    
    emit('user-audio-toggle', {
        'userId': request.sid,
        'audioEnabled': audio_enabled
    }, room=room_id, include_self=False)


@socketio.on('disconnect')
def on_disconnect():
    """Handle user disconnection"""
    try:
        # Find and remove user from all rooms
        for room_id, participants in room_participants.items():
            for participant in participants[:]:
                if participant['sid'] == request.sid:
                    participants.remove(participant)
                    emit('user-disconnected', {
                        'userId': request.sid
                    }, room=room_id)
                    logger.info(f"User {request.sid} left room {room_id}")
                    
                    # Clean up empty rooms
                    if len(participants) == 0:
                        if room_id in active_rooms:
                            active_rooms[room_id]['active'] = False
                            logger.info(f"Room {room_id} is now empty")
                    break
    except Exception as e:
        logger.error(f"Error in disconnect: {str(e)}")


@socketio.on('error')
def error_handler(e):
    """Handle SocketIO errors"""
    logger.error(f"SocketIO error: {str(e)}")


# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('index.html'), 404


@app.errorhandler(500)
def server_error(e):
    logger.error(f"Server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
