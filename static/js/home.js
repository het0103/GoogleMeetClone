// Get elements
const usernameInput = document.getElementById('username');
const createMeetingBtn = document.getElementById('createMeetingBtn');
const joinMeetingBtn = document.getElementById('joinMeetingBtn');
const roomCodeInput = document.getElementById('roomCode');

// Modal elements
const linkModal = document.getElementById('linkModal');
const meetingLinkInput = document.getElementById('meetingLinkInput');
const copyLinkModalBtn = document.getElementById('copyLinkModalBtn');
const joinMeetingModalBtn = document.getElementById('joinMeetingModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

let currentMeetingUrl = '';

// Create new meeting
createMeetingBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim() || 'Anonymous';
    
    try {
        createMeetingBtn.disabled = true;
        createMeetingBtn.innerHTML = '<span>⏳</span> Creating...';
        
        const response = await fetch('/api/create-room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to create room');
        }
        
        // Store username in session
        sessionStorage.setItem('username', username);
        
        // Get the full URL (server now returns absolute URL)
        currentMeetingUrl = data.url || `${window.location.origin}/room/${data.room_id}`;
        
        // Show modal with the meeting link
        showLinkModal(currentMeetingUrl);
        
    } catch (error) {
        console.error('Error creating room:', error);
        alert('Failed to create meeting. Please try again.');
    } finally {
        createMeetingBtn.disabled = false;
        createMeetingBtn.innerHTML = '<span>📹</span> Create New Meeting';
    }
});

// Show the link modal
function showLinkModal(url) {
    meetingLinkInput.value = url;
    linkModal.classList.add('show');
    
    // Auto-select the link for easy copying
    meetingLinkInput.select();
}

// Hide the link modal
function hideLinkModal() {
    linkModal.classList.remove('show');
}

// Copy link to clipboard
copyLinkModalBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(meetingLinkInput.value);
        
        // Visual feedback
        const originalText = copyLinkModalBtn.textContent;
        copyLinkModalBtn.textContent = '✅ Copied!';
        copyLinkModalBtn.classList.add('copied');
        
        setTimeout(() => {
            copyLinkModalBtn.textContent = originalText;
            copyLinkModalBtn.classList.remove('copied');
        }, 2000);
    } catch (error) {
        // Fallback for older browsers
        meetingLinkInput.select();
        document.execCommand('copy');
        
        const originalText = copyLinkModalBtn.textContent;
        copyLinkModalBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyLinkModalBtn.textContent = originalText;
        }, 2000);
    }
});

// Join meeting from modal
joinMeetingModalBtn.addEventListener('click', () => {
    if (currentMeetingUrl) {
        window.location.href = currentMeetingUrl;
    }
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    hideLinkModal();
});

// Close modal when clicking outside
linkModal.addEventListener('click', (e) => {
    if (e.target === linkModal) {
        hideLinkModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && linkModal.classList.contains('show')) {
        hideLinkModal();
    }
});// Join existing meeting
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
