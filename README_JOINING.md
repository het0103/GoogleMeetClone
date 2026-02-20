# Pairing / Invite Guide — How to run and join a meeting

This guide shows how you can run the app locally, create a meeting on your machine, and have a friend join the same meeting (either on the same LAN or over the internet). It also explains common issues and quick fixes.

## Quick checklist

- [ ] Start the app on your machine (host)
- [ ] Create a meeting from the home screen
- [ ] Copy the full meeting URL shown after creation (server now returns an absolute link)
- [ ] Share the link with your friend (same LAN: use your local IP; internet: use ngrok or deploy to Render)
- [ ] Friend opens the link in their browser and allows camera/microphone

## 1) Start the app (Windows / PowerShell)

Open PowerShell in the project folder and activate your virtual environment (if used):

```powershell
# from project root
& .\.venv\Scripts\Activate.ps1    # if you created a virtualenv named .venv
pip install -r requirements.txt
python server.py
```

- By default the app listens on port 5000.
- The server prints helpful messages about sharing on your local network.

## 2) Host creates a meeting

- Open http://localhost:5000 in your browser.
- Enter a display name and click "Create Meeting".
- **NEW:** A modal will appear showing the full meeting link with a "Copy" button — click it to copy the link to your clipboard.
- The meeting link is absolute (e.g., `http://192.168.1.10:5000/room/AbCdEf12`) so you can share it directly.
- Click "Join Meeting Now" to enter the room, or "Cancel" to stay on the home page.

Important: The app stores the display name in sessionStorage. If the host sets a name before creating, that name will be shown to participants.

## 3) Friend joins (same local network)

- Ask the host for their machine's local IP (host can run `ipconfig` and share the IPv4 address).
- The friend opens the full URL the host shared, for example `http://192.168.1.10:5000/room/AbCdEf12`.
- The friend must allow access to camera and microphone. The app will prompt automatically.

Notes for host:
- If you are behind a router and want friends outside your LAN to join directly via your public IP, you'll need to set up port forwarding on your router for port 5000 → host machine. This is advanced and can be risky; use ngrok instead.

## 4) Friend joins (over the internet)

Options:

A) Use ngrok (recommended for quick testing)

1. Install ngrok: https://ngrok.com/download
2. Run (replace 5000 if you use a different port):

```powershell
ngrok http 5000
```

3. Copy the public URL ngrok provides (e.g., `https://abcd-1234.ngrok.io`) and append the room path: `https://abcd-1234.ngrok.io/room/AbCdEf12`
4. Share that link with your friend. They can open it from their browser.

B) Deploy to Render (or any hosting platform)

- Push the repository to GitHub and connect it to Render (see project's deployment docs).
- Once hosted publicly, share the Render URL + `/room/<id>` with your friend.

## 5) Permissions and browser tips

- Both participants must allow camera and microphone access. If the camera/mic doesn't work, check browser site permissions.
- Use modern browsers (Chrome, Edge, Firefox). Safari may have limitations with WebRTC/ScreenShare depending on OS version.

## 6) Troubleshooting

- "Can't access camera/microphone": Ensure the browser prompt was allowed, and no other app is using the device.
- "Peer never connects" or poor media quality:
  - If both users are on different NATs, WebRTC needs a TURN server for reliable connectivity. The app includes a free third-party TURN/STUN configuration, but for best results add a production TURN.
  - Try connecting using ngrok or a public deployment to avoid NAT issues.
- "Room not found": Make sure the host's server is running and you are using the correct full URL (host IP or public ngrok/host URL).
- "Socket disconnected" or CORS errors: When deployed, set ALLOWED_ORIGINS environment variable on the server to your deployment domain.

## 7) Security notes

- Do not share private Firebase credentials or `.env` files. Use env vars on deployed platforms.
- The demo keeps rooms and participants in-memory. For production, add authentication and persistent storage.

## 8) What changed in this repo to help sharing

- The `POST /api/create-room` endpoint now returns an absolute URL (not only the relative path). That makes it trivial for hosts to copy and paste a working link for their friend.
- **NEW:** Added a modal dialog that appears immediately after creating a room. It displays the full meeting link with a one-click Copy button, so hosts can share the link before joining.
- The modal includes helpful tips about local network vs internet sharing.

## 9) Optional improvements you can add

- Add a simple page that shows the full meeting link immediately after creation with a "Copy" button.
- Add a small relay (TURN) server or use a paid TURN provider for robust connectivity.
- Add authentication or room passwords to avoid uninvited guests.

## 10) Quick test flow

1. On host: run `python server.py`.
2. Open `http://localhost:5000` and create a meeting.
3. Copy the link (or run `ipconfig` and craft the link using host IPv4) and send it to friend.
4. Friend opens link and allows camera/mic.
5. Video/audio should connect automatically.

If anything fails, tell me what step failed (error messages or browser console logs) and I will help debug.
