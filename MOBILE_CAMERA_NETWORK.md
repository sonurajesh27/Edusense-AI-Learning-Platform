# 📱 Mobile Camera Network Access Guide

## Overview
The TouchRead feature now supports connecting your mobile phone camera over your local WiFi network, allowing you to use your phone as an external high-quality camera for reading books!

## 🌐 Network Setup

### Requirements
- Your computer and mobile phone must be on the **same WiFi network**
- Server running on port 5000
- Frontend running on port 5173

### How It Works
1. The server automatically detects your computer's local network IP address
2. A QR code is generated with a URL that includes this IP address
3. Your mobile phone scans the QR code and connects over WiFi
4. The mobile camera stream is sent to your computer in real-time

## 🚀 Getting Started

### Step 1: Start the Server
```bash
cd server
npm start
```

The server will display:
```
🚀 Server running on:
   Local:   http://localhost:5000
   Network: http://192.168.1.XXX:5000

📱 Mobile Camera Access:
   Use this IP for QR code: 192.168.1.XXX
   Frontend: http://192.168.1.XXX:5173

🔌 Socket.IO server ready for connections
```

### Step 2: Start the Frontend
```bash
cd client
npm run dev
```

Vite will display:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.XXX:5173/
```

### Step 3: Connect Mobile Camera

1. **On your computer:**
   - Click "TouchRead" mode
   - Click "📱 Connect Mobile Camera" button
   - A QR code will appear with your network IP address

2. **On your mobile phone:**
   - Make sure you're on the same WiFi network
   - Open your camera app or QR code scanner
   - Scan the QR code
   - Allow camera permissions when prompted
   - The page will automatically connect

3. **Start Reading:**
   - Your mobile camera is now streaming
   - Point your phone at book text
   - Point your finger at specific words
   - The text will be extracted and read aloud!

## 🔧 Network Configuration

### Firewall Settings
If the connection doesn't work, you may need to allow network access:

**Linux (UFW):**
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
```

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Create new Inbound Rules for ports 5000 and 5173

**macOS:**
```bash
# Allow Node.js and Vite through firewall
```

### Router Configuration
Most home routers allow local network communication by default. If you have issues:
1. Check that both devices are on the same network (not guest network)
2. Disable AP isolation if enabled on your router
3. Some corporate networks block device-to-device communication

## 📱 Mobile Browser Compatibility

### Supported Browsers
- ✅ Safari (iOS) - Recommended
- ✅ Chrome (Android) - Recommended
- ✅ Samsung Internet (Android)
- ✅ Firefox (Android/iOS)

### Camera Access
Mobile browsers require HTTPS for camera access, but **localhost and local IP addresses** are exempt from this requirement, so HTTP works fine on your local network!

## 🎯 Use Cases

### Why Use Mobile Camera?
1. **Better Quality:** Modern phones have excellent cameras
2. **Flexibility:** Easily position the phone over books
3. **Overhead View:** Perfect for reading from books on a desk
4. **Portability:** Move around with your phone

### Ideal Scenarios
- Reading textbooks while studying
- Accessibility for visually impaired users
- Document scanning and reading
- Library or classroom use
- Reading books in bed or comfortable positions

## 🔍 Troubleshooting

### QR Code Not Working
- **Problem:** QR code doesn't scan
- **Solution:** Try the manual URL option below the QR code

### Can't Connect
- **Problem:** "Waiting for mobile connection..." doesn't complete
- **Solution:** 
  1. Check both devices are on same WiFi
  2. Check firewall settings
  3. Try manual URL entry

### Wrong IP Address
- **Problem:** Server detected wrong IP (multiple network interfaces)
- **Solution:** The server automatically selects the first non-internal IPv4 address. If incorrect, you can manually edit the URL.

### Camera Not Streaming
- **Problem:** Connected but no video
- **Solution:**
  1. Refresh the mobile page
  2. Check camera permissions in browser settings
  3. Try a different browser

### Poor Performance
- **Problem:** Laggy video or slow OCR
- **Solution:**
  1. Ensure strong WiFi signal on both devices
  2. Close other apps on mobile phone
  3. Use 5GHz WiFi if available
  4. Reduce OCR frequency (built-in throttling)

## 🛠️ Technical Details

### Network Detection
The server uses Node.js `os.networkInterfaces()` to detect your local IP:
```javascript
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
```

### CORS Configuration
Server allows all origins for local network access:
```javascript
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

### Socket.IO Communication
- Frontend requests network info from `/api/network-info`
- Server responds with local IP address
- QR code URL is generated: `http://[LOCAL_IP]:5173/mobile-camera?id=[CONNECTION_ID]`
- Mobile device connects via unique connection ID
- Video stream sent via Socket.IO events

## 🎨 UI Features

### Connection Modal
- Real-time QR code generation
- Network IP display
- Step-by-step instructions
- Manual URL fallback
- Copy to clipboard functionality
- Loading states
- Connection status indicators

### Mobile Page
- Full-screen camera view
- Connection status
- Auto-rotation support
- Optimized for mobile screens
- Battery-efficient streaming

## 📊 Performance Tips

1. **Use good lighting** for better OCR results
2. **Hold phone steady** when pointing at text
3. **Keep WiFi signal strong** for smooth streaming
4. **Close background apps** on mobile
5. **Use newer phone** for better camera quality

## 🔐 Security Considerations

### Local Network Only
- Connection only works on local network
- Not accessible from internet
- Secure for home/office use

### Privacy
- No data sent to external servers
- All processing happens locally
- Camera stream stays on your network

## 💡 Advanced Usage

### Multiple Mobile Cameras
The system supports multiple connection IDs, so you could potentially:
- Connect multiple phones
- Switch between devices
- Use different angles

### Custom Network Configuration
Edit the server to bind to specific IP:
```javascript
server.listen(PORT, '192.168.1.XXX', () => {
  // Your IP here
});
```

## 📞 Support

If you encounter issues:
1. Check the server console for IP address
2. Verify both devices on same network
3. Try manual URL entry
4. Check firewall/router settings
5. Test with different mobile browser

## 🎉 Enjoy!

Now you can use your mobile phone as a professional document camera for TouchRead! Perfect for accessibility, education, and comfortable reading experiences.

---

**Made with ❤️ for better accessibility and reading experiences**
