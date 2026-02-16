// Enhanced room.js with production features
// Includes: participant list, better error handling, connection quality monitoring

// WebRTC Configuration with TURN servers
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Free TURN servers for better connectivity
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

// Global variables
const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

const peers = {};
const participants = new Map();
let localStream;
let screenStream;
let isAudioEnabled = true;
let isVideoEnabled = true;
const username = sessionStorage.getItem('username') || 'Anonymous';
let connectionQuality = 'good';

// Get DOM elements
const localVideo = document.getElementById('localVideo');
const videoGrid = document.getElementById('videoGrid');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const participantsBtn = document.getElementById('participantsBtn');
const shareScreenBtn = document.getElementById('shareScreenBtn');
const leaveBtn = document.getElementById('leaveBtn');
const chatPanel = document.getElementById('chatPanel');
const participantList = document.getElementById('participantList');
const closeChatBtn = document.getElementById('closeChatBtn');
const closeParticipantsBtn = document.getElementById('closeParticipantsBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatMessages = document.getElementById('chatMessages');
const participantItems = document.getElementById('participantItems');
const participantCount = document.getElementById('participantCount');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const meetingTime = document.getElementById('meetingTime');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize media and join room
async function init() {
    try {
        showLoading('Getting camera and microphone...');
        
        // Check if room exists
        const roomCheck = await fetch(`/api/room-status/${ROOM_ID}`);
        if (!roomCheck.ok) {
            showError('Meeting not found. Please check the meeting code.');
            setTimeout(() => window.location.href = '/', 3000);
            return;
        }
        
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        localVideo.srcObject = localStream;
        
        // Add self to participants
        addParticipant(socket.id, username, true);
        
        // Join the room
        showLoading('Joining meeting...');
        socket.emit('join', { room: ROOM_ID, username: username });
        
        // Start meeting timer
        startMeetingTimer();
        
        hideLoading();
        showSuccess('Connected to meeting!');
        
        // Monitor connection quality
        monitorConnectionQuality();
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        hideLoading();
        
        let errorMessage = 'Could not access camera/microphone. ';
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera and microphone permissions.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera or microphone found.';
        } else {
            errorMessage += 'Please check your device settings.';
        }
        
        showError(errorMessage);
    }
}

// Show/hide loading overlay
function showLoading(message = 'Loading...') {
    loadingOverlay.style.display = 'flex';
    loadingOverlay.querySelector('p').textContent = message;
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show notification messages
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `${type}-message`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Participant management
function addParticipant(userId, name, isSelf = false) {
    participants.set(userId, { name, isSelf, audioEnabled: true, videoEnabled: true });
    updateParticipantList();
}

function removeParticipant(userId) {
    participants.delete(userId);
    updateParticipantList();
}

function updateParticipantList() {
    participantItems.innerHTML = '';
    participantCount.textContent = participants.size;
    
    participants.forEach((participant, userId) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <div class="participant-avatar">${participant.name.charAt(0).toUpperCase()}</div>
            <div class="participant-info">
                <div class="participant-name">${participant.name}${participant.isSelf ? ' (You)' : ''}</div>
                <div class="participant-status">Active</div>
            </div>
            <div class="participant-indicators">
                <span class="indicator ${!participant.audioEnabled ? 'muted' : ''}">${participant.audioEnabled ? '🎤' : '🔇'}</span>
                <span class="indicator ${!participant.videoEnabled ? 'video-off' : ''}">${participant.videoEnabled ? '📹' : '📷'}</span>
            </div>
        `;
        participantItems.appendChild(item);
    });
}

// Monitor connection quality
function monitorConnectionQuality() {
    setInterval(() => {
        Object.values(peers).forEach(({ pc }) => {
            pc.getStats().then(stats => {
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        const rtt = report.currentRoundTripTime;
                        if (rtt > 0.3) connectionQuality = 'poor';
                        else if (rtt > 0.15) connectionQuality = 'medium';
                        else connectionQuality = 'good';
                    }
                });
            });
        });
    }, 5000);
}

// Start meeting timer
let meetingStartTime = Date.now();
function startMeetingTimer() {
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - meetingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        meetingTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    showInfo('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showError('Disconnected from server. Trying to reconnect...');
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Reconnected after', attemptNumber, 'attempts');
    showSuccess('Reconnected to server!');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
    showError(error.message || 'An error occurred');
});

socket.on('user-connected', async (data) => {
    console.log('User connected:', data);
    
    if (data.userId === socket.id) return;
    
    addParticipant(data.userId, data.username);
    showInfo(`${data.username} joined the meeting`);
    
    await createPeerConnection(data.userId, data.username, true);
});

socket.on('offer', async (data) => {
    console.log('Received offer from:', data.sender);
    const pc = await createPeerConnection(data.sender, 'Participant', false);
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { answer: answer, target: data.sender });
});

socket.on('answer', async (data) => {
    console.log('Received answer from:', data.sender);
    const pc = peers[data.sender]?.pc;
    if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('ice-candidate', async (data) => {
    console.log('Received ICE candidate from:', data.sender);
    const pc = peers[data.sender]?.pc;
    if (pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }
});

socket.on('user-disconnected', (data) => {
    console.log('User disconnected:', data.userId);
    const participant = participants.get(data.userId);
    if (participant) {
        showInfo(`${participant.name} left the meeting`);
        removeParticipant(data.userId);
    }
    removePeer(data.userId);
});

socket.on('message', (data) => {
    addMessageToChat(data);
});

socket.on('user-video-toggle', (data) => {
    const participant = participants.get(data.userId);
    if (participant) {
        participant.videoEnabled = data.videoEnabled;
        updateParticipantList();
    }
    
    const videoElement = document.getElementById(`video-${data.userId}`);
    if (videoElement) {
        const container = videoElement.parentElement;
        const status = container.querySelector('.video-status');
        if (!data.videoEnabled) {
            status.textContent = '📷 Camera off';
            status.classList.add('show');
        } else {
            status.classList.remove('show');
        }
    }
});

socket.on('user-audio-toggle', (data) => {
    const participant = participants.get(data.userId);
    if (participant) {
        participant.audioEnabled = data.audioEnabled;
        updateParticipantList();
    }
    
    const videoElement = document.getElementById(`video-${data.userId}`);
    if (videoElement) {
        const container = videoElement.parentElement;
        const status = container.querySelector('.video-status');
        if (!data.audioEnabled) {
            status.textContent = '🔇 Muted';
            status.classList.add('show');
        } else if (!status.textContent.includes('Camera')) {
            status.classList.remove('show');
        }
    }
});

// Create peer connection
async function createPeerConnection(userId, username, isInitiator) {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
        console.log('Received remote track');
        addRemoteVideo(userId, event.streams[0], username);
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                target: userId
            });
        }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed') {
            showError(`Connection to ${username} failed`);
        }
    };
    
    peers[userId] = { pc, username };
    
    // Create and send offer if initiator
    if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { offer: offer, target: userId });
    }
    
    return pc;
}

// Add remote video
function addRemoteVideo(userId, stream, username) {
    const existingVideo = document.getElementById(`video-${userId}`);
    if (existingVideo) {
        existingVideo.parentElement.remove();
    }
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    
    const video = document.createElement('video');
    video.id = `video-${userId}`;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    
    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = username;
    
    const status = document.createElement('div');
    status.className = 'video-status';
    
    videoContainer.appendChild(video);
    videoContainer.appendChild(label);
    videoContainer.appendChild(status);
    videoGrid.appendChild(videoContainer);
}

// Remove peer
function removePeer(userId) {
    if (peers[userId]) {
        peers[userId].pc.close();
        delete peers[userId];
    }
    
    const videoElement = document.getElementById(`video-${userId}`);
    if (videoElement) {
        videoElement.parentElement.remove();
    }
}

// Control button handlers
toggleAudioBtn.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    localStream.getAudioTracks()[0].enabled = isAudioEnabled;
    toggleAudioBtn.classList.toggle('active');
    toggleAudioBtn.textContent = isAudioEnabled ? '🎤' : '🔇';
    
    participants.get(socket.id).audioEnabled = isAudioEnabled;
    updateParticipantList();
    
    socket.emit('toggle-audio', { room: ROOM_ID, audioEnabled: isAudioEnabled });
});

toggleVideoBtn.addEventListener('click', () => {
    isVideoEnabled = !isVideoEnabled;
    localStream.getVideoTracks()[0].enabled = isVideoEnabled;
    toggleVideoBtn.classList.toggle('active');
    toggleVideoBtn.textContent = isVideoEnabled ? '📹' : '📷';
    
    const localStatus = document.getElementById('localVideoStatus');
    if (!isVideoEnabled) {
        localStatus.textContent = '📷 Camera off';
        localStatus.classList.add('show');
    } else {
        localStatus.classList.remove('show');
    }
    
    participants.get(socket.id).videoEnabled = isVideoEnabled;
    updateParticipantList();
    
    socket.emit('toggle-video', { room: ROOM_ID, videoEnabled: isVideoEnabled });
});

toggleChatBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('show');
    toggleChatBtn.classList.toggle('active');
    if (participantList.classList.contains('show')) {
        participantList.classList.remove('show');
        participantsBtn.classList.remove('active');
    }
});

participantsBtn.addEventListener('click', () => {
    participantList.classList.toggle('show');
    participantsBtn.classList.toggle('active');
    if (chatPanel.classList.contains('show')) {
        chatPanel.classList.remove('show');
        toggleChatBtn.classList.remove('active');
    }
});

closeChatBtn.addEventListener('click', () => {
    chatPanel.classList.remove('show');
    toggleChatBtn.classList.remove('active');
});

closeParticipantsBtn.addEventListener('click', () => {
    participantList.classList.remove('show');
    participantsBtn.classList.remove('active');
});

shareScreenBtn.addEventListener('click', async () => {
    try {
        if (!screenStream) {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: false
            });
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            Object.values(peers).forEach(({ pc }) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });
            
            localVideo.srcObject = screenStream;
            shareScreenBtn.classList.add('active');
            showInfo('Screen sharing started');
            
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } else {
            stopScreenShare();
        }
    } catch (error) {
        console.error('Error sharing screen:', error);
        showError('Could not share screen. Please try again.');
    }
});

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
        
        const videoTrack = localStream.getVideoTracks()[0];
        
        Object.values(peers).forEach(({ pc }) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                sender.replaceTrack(videoTrack);
            }
        });
        
        localVideo.srcObject = localStream;
        shareScreenBtn.classList.remove('active');
        showInfo('Screen sharing stopped');
    }
}

// Chat functions
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', {
            room: ROOM_ID,
            message: message,
            username: username
        });
        messageInput.value = '';
    }
}

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function addMessageToChat(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    if (data.sender === socket.id) {
        messageDiv.classList.add('own');
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(data.username)}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-text">${escapeHtml(data.message)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy meeting link
copyLinkBtn.addEventListener('click', () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        showSuccess('Meeting link copied!');
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = '✓';
        setTimeout(() => {
            copyLinkBtn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        showError('Could not copy link');
    });
});

// Leave meeting
leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave this meeting?')) {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        
        Object.values(peers).forEach(({ pc }) => pc.close());
        socket.disconnect();
        
        window.location.href = '/';
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
    }
});

// Add CSS animation for slideOut
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
init();
