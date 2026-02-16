// Get elements
const usernameInput = document.getElementById('username');
const createMeetingBtn = document.getElementById('createMeetingBtn');
const joinMeetingBtn = document.getElementById('joinMeetingBtn');
const roomCodeInput = document.getElementById('roomCode');

// Create new meeting
createMeetingBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim() || 'Anonymous';
    
    try {
        const response = await fetch('/api/create-room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        // Store username in session
        sessionStorage.setItem('username', username);
        
        // Redirect to room
        window.location.href = `/room/${data.room_id}`;
    } catch (error) {
        console.error('Error creating room:', error);
        alert('Failed to create meeting. Please try again.');
    }
});

// Join existing meeting
joinMeetingBtn.addEventListener('click', () => {
    const roomCode = roomCodeInput.value.trim();
    const username = usernameInput.value.trim() || 'Anonymous';
    
    if (!roomCode) {
        alert('Please enter a meeting code');
        return;
    }
    
    // Store username in session
    sessionStorage.setItem('username', username);
    
    // Redirect to room
    window.location.href = `/room/${roomCode}`;
});

// Allow Enter key to join meeting
roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinMeetingBtn.click();
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createMeetingBtn.click();
    }
});
