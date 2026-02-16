# Testing Guide - GMeet Clone

## 🧪 How to Test with Friends

### Option 1: Same WiFi Network (Easiest)
**Use when**: Your friends are in the same location/WiFi

1. **Find your local IP address**
   - Windows: Open PowerShell and run:
     ```powershell
     ipconfig
     ```
     Look for "IPv4 Address" (e.g., `192.168.1.100`)
   
   - Mac/Linux:
     ```bash
     ifconfig | grep "inet "
     ```

2. **Start the server**
   ```bash
   python app.py
   ```

3. **Share the URL with friends**
   - Your URL: `http://192.168.1.100:5000` (use YOUR IP)
   - Friends open this URL on their devices
   - Create/join meetings normally

**Limitations**: Only works on same WiFi network

---

### Option 2: Using ngrok (Best for Remote Testing)
**Use when**: Friends are in different locations (most common)

1. **Install ngrok**
   - Download from: https://ngrok.com/download
   - Extract and add to PATH

2. **Start your Flask app**
   ```bash
   python app.py
   ```

3. **In a new terminal, start ngrok**
   ```bash
   ngrok http 5000
   ```

4. **Share the ngrok URL**
   - ngrok will show: `https://abc123.ngrok.io`
   - Share THIS URL with friends
   - Create a meeting and share the link

**Advantages**:
- ✅ Works anywhere in the world
- ✅ HTTPS enabled (WebRTC will work)
- ✅ Free tier available

**Limitations**:
- URL changes each restart (use paid ngrok for static URLs)
- Free tier has connection limits

---

### Option 3: Quick Cloud Deployment (Render - Free)
**Use when**: You want a permanent testing URL

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - Sign up/login
   - Click "New +" → "Web Service"
   - Connect GitHub repo
   - Settings:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python app.py`
     - **Environment Variables**: Add `SECRET_KEY=your-secret-key-123`
   - Click "Create Web Service"

3. **Share the Render URL**
   - Render gives you: `https://your-app.onrender.com`
   - Share with friends to test

**Advantages**:
- ✅ Permanent URL
- ✅ HTTPS enabled
- ✅ Free tier available (50 hours/month)

---

## 📝 Testing Checklist

Test these features with friends:

- [ ] **Video**: Can you see each other?
- [ ] **Audio**: Can you hear each other?
- [ ] **Mute/Unmute**: Does toggling audio work?
- [ ] **Camera On/Off**: Does toggling video work?
- [ ] **Chat**: Can you send/receive messages?
- [ ] **Screen Share**: Can others see your screen?
- [ ] **Multiple Participants**: Join with 3+ people
- [ ] **Join Late**: Someone joins after meeting started
- [ ] **Leave/Rejoin**: Does it work properly?
- [ ] **Mobile**: Test on phones/tablets

---

## 🐛 Common Issues & Solutions

### Issue: "Camera/Microphone blocked"
**Solution**: 
- Allow permissions in browser
- Use HTTPS (ngrok or cloud deployment)

### Issue: "Can't see/hear other person"
**Solution**:
- Check if both users allowed camera/mic
- Try different browsers (Chrome works best)
- Check firewall settings

### Issue: "Connection failed"
**Solution**:
- Use ngrok or cloud deployment
- Current STUN servers may not work for all networks
- Consider adding TURN servers (see deployment guide)

### Issue: "Screen share doesn't work"
**Solution**:
- Only works in Chrome/Edge (not all browsers)
- Requires HTTPS (use ngrok/cloud)

---

## 💡 Quick Test Script

**Test with yourself** (2 browser windows):

1. Open your app in Chrome
2. Create a meeting
3. Copy the meeting link
4. Open in Incognito/Private window
5. Join the meeting
6. You should see yourself in both windows!

**Note**: Use different browser windows/tabs to simulate multiple users

---

## 📊 Performance Notes

- **Recommended**: 2-8 participants for smooth performance
- **Maximum tested**: 15-20 participants (may lag)
- **Network**: Minimum 2 Mbps upload/download per user
- **Browser**: Chrome/Edge recommended (best WebRTC support)

---

## 🔍 Debug Mode

To see detailed logs, check browser console:
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Look for WebRTC connection logs

---

**Ready to test? Pick the option that works best for you! 🚀**
