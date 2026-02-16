# Deployment Issues & Fixes

## 🚨 Critical Issues with Current Code

### Issue 1: HTTPS Required for WebRTC
**Problem**: Browsers block camera/mic access on HTTP (production)
**Impact**: App won't work on HTTP hosting
**Fix**: Deploy to platforms with HTTPS (Render, Railway, Heroku)

### Issue 2: STUN Servers Only
**Problem**: ~20% of users behind strict NAT can't connect
**Impact**: Some users can't see/hear each other
**Fix**: Add TURN servers (see below)

### Issue 3: Gunicorn on Windows
**Problem**: Procfile uses `gunicorn` which doesn't work on Windows
**Impact**: Can't run production server on Windows
**Fix**: Use `waitress` for Windows or deploy from Linux

### Issue 4: CORS Open to All
**Problem**: `cors_allowed_origins="*"` is insecure
**Impact**: Security vulnerability
**Fix**: Specify allowed origins

### Issue 5: No Environment Validation
**Problem**: Missing error handling for env vars
**Impact**: Silent failures
**Fix**: Add validation

---

## ✅ Fixed Production-Ready Code

### Fix 1: Add TURN Server Support

**Update `static/js/room.js` line 1-10:**

Replace:
```javascript
// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};
```

With:
```javascript
// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for better connectivity (optional but recommended)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};
```

### Fix 2: Cross-Platform Server Support

**Create new file `server.py`:**
```python
import os
import sys
from app import app, socketio

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    # Use waitress for Windows, eventlet for Unix
    if sys.platform == 'win32':
        print(f"🚀 Starting server on http://0.0.0.0:{port} (Windows/Waitress)")
        from waitress import serve
        serve(app, host='0.0.0.0', port=port)
    else:
        print(f"🚀 Starting server on http://0.0.0.0:{port} (Unix/Eventlet)")
        socketio.run(app, host='0.0.0.0', port=port, debug=False)
```

### Fix 3: Update requirements.txt

Add:
```
waitress==2.1.2
```

### Fix 4: Secure CORS

**Update `app.py` line 14:**

Replace:
```python
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
```

With:
```python
# Get allowed origins from environment or use default
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
socketio = SocketIO(app, cors_allowed_origins=ALLOWED_ORIGINS, async_mode='eventlet')
```

### Fix 5: Environment Variable Validation

**Add to `app.py` after imports:**
```python
# Validate environment
if not os.getenv('SECRET_KEY') and os.getenv('FLASK_ENV') == 'production':
    print("⚠️  WARNING: SECRET_KEY not set in production!")
    sys.exit(1)
```

---

## 🚀 Deployment Platforms Comparison

### Render (Recommended for beginners)
- ✅ Free tier
- ✅ Auto HTTPS
- ✅ Easy setup
- ✅ No credit card
- ❌ 50 hours/month limit

**Deploy Command:**
```bash
# Build: pip install -r requirements.txt
# Start: python app.py
```

### Railway
- ✅ Free tier ($5 credit)
- ✅ Auto HTTPS
- ✅ Very easy
- ❌ Requires GitHub

### Heroku
- ✅ Most popular
- ✅ Auto HTTPS
- ❌ No free tier (starts $7/mo)

### Vercel/Netlify
- ❌ Not suitable (needs long-running process)

---

## 📝 Production Deployment Checklist

Before deploying:

- [ ] Set `SECRET_KEY` environment variable
- [ ] Set `FLASK_ENV=production`
- [ ] Update `ALLOWED_ORIGINS` to your domain
- [ ] Test with ngrok first
- [ ] Add TURN servers (optional but recommended)
- [ ] Enable HTTPS
- [ ] Test on mobile devices
- [ ] Set up error monitoring (optional)

---

## 🔒 Security Enhancements (Optional)

### Add Rate Limiting
```bash
pip install flask-limiter
```

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

### Add Meeting Passwords
Update room creation to include optional password

### Add Participant Limits
Limit participants per room (e.g., max 20)

---

## 🧪 Production Testing Steps

1. **Deploy to staging** (Render free tier)
2. **Test HTTPS** (camera/mic permissions)
3. **Test with 2-3 friends** (different networks)
4. **Test on mobile** (iOS Safari, Android Chrome)
5. **Monitor server logs** for errors
6. **Load test** (10+ participants)
7. **Deploy to production** if all pass

---

## 📊 Cost Estimates

### Free Options:
- **Render**: Free (50 hrs/month)
- **Railway**: $5 free credit
- **STUN servers**: Free
- **TURN (Metered)**: Free tier (50GB/month)

### Paid (100 users/day):
- **Render**: $7/month
- **TURN servers**: $29/month (Twilio)
- **Database (optional)**: $5/month

**Total**: ~$12-40/month for serious use

---

**Need help with deployment? Check TESTING_GUIDE.md first!**
