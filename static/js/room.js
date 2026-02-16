// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Free TURN servers for better connectivity behind NAT/firewalls
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
const socket = io();
const peers = {};
let localStream;
let screenStream;
let isAudioEnabled = true;
let isVideoEnabled = true;
const username = sessionStorage.getItem('username') || 'Anonymous';

// Get DOM elements
const localVideo = document.getElementById('localVideo');
const videoGrid = document.getElementById('videoGrid');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const shareScreenBtn = document.getElementById('shareScreenBtn');
const leaveBtn = document.getElementById('leaveBtn');
const chatPanel = document.getElementById('chatPanel');
const closeChatBtn = document.getElementById('closeChatBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatMessages = document.getElementById('chatMessages');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const meetingTime = document.getElementById('meetingTime');

// Initialize media and join room
async function init() {
    try {
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        localVideo.srcObject = localStream;
        
        // Join the room
        socket.emit('join', { room: ROOM_ID, username: username });
        
        // Start meeting timer
        startMeetingTimer();
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
    }
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

// Socket events
socket.on('user-connected', async (data) => {
    console.log('User connected:', data);
    
    // Don't create connection to self
    if (data.userId === socket.id) return;
    
    // Create peer connection and send offer
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
    const pc = peers[data.sender].pc;
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('ice-candidate', async (data) => {
    console.log('Received ICE candidate from:', data.sender);
    const pc = peers[data.sender]?.pc;
    if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

socket.on('user-disconnected', (data) => {
    console.log('User disconnected:', data.userId);
    removePeer(data.userId);
});

socket.on('message', (data) => {
    addMessageToChat(data);
});

socket.on('user-video-toggle', (data) => {
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
    
    // Add local stream tracks to peer connection
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
    
    peers[userId] = { pc, username };
    
    // Create and send offer if initiator
    if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { offer: offer, target: userId });
    }
    
    return pc;
}

// Add remote video to grid
function addRemoteVideo(userId, stream, username) {
    // Remove existing video if any
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

// Toggle audio
toggleAudioBtn.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    localStream.getAudioTracks()[0].enabled = isAudioEnabled;
    toggleAudioBtn.classList.toggle('active');
    toggleAudioBtn.textContent = isAudioEnabled ? '🎤' : '🔇';
    
    socket.emit('toggle-audio', { room: ROOM_ID, audioEnabled: isAudioEnabled });
});

// Toggle video
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
    
    socket.emit('toggle-video', { room: ROOM_ID, videoEnabled: isVideoEnabled });
});

// Toggle chat
toggleChatBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('show');
    toggleChatBtn.classList.toggle('active');
});

closeChatBtn.addEventListener('click', () => {
    chatPanel.classList.remove('show');
    toggleChatBtn.classList.remove('active');
});

// Share screen
shareScreenBtn.addEventListener('click', async () => {
    try {
        if (!screenStream) {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track for all peers
            Object.values(peers).forEach(({ pc }) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });
            
            // Replace local video
            localVideo.srcObject = screenStream;
            shareScreenBtn.classList.add('active');
            
            // Handle screen share stop
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } else {
            stopScreenShare();
        }
    } catch (error) {
        console.error('Error sharing screen:', error);
    }
});

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
        
        const videoTrack = localStream.getVideoTracks()[0];
        
        // Replace back to camera for all peers
        Object.values(peers).forEach(({ pc }) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                sender.replaceTrack(videoTrack);
            }
        });
        
        localVideo.srcObject = localStream;
        shareScreenBtn.classList.remove('active');
    }
}

// Send message
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

// Add message to chat
function addMessageToChat(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    if (data.sender === socket.id) {
        messageDiv.classList.add('own');
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${data.username}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-text">${escapeHtml(data.message)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy meeting link
copyLinkBtn.addEventListener('click', () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = '✓';
        setTimeout(() => {
            copyLinkBtn.textContent = originalText;
        }, 2000);
    });
});

// Leave meeting
leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave this meeting?')) {
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Close all peer connections
        Object.values(peers).forEach(({ pc }) => pc.close());
        
        // Disconnect socket
        socket.disconnect();
        
        // Redirect to home
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

// Initialize on page load
init();
