# 🔄 Restart Server with ngrok

## Quick Restart Steps:

1. **Stop the current server** (Press `Ctrl+C` in the server terminal)

2. **Restart the server:**
   ```bash
   npm run server
   ```

3. **Look for this output:**
   ```
   ✅ ngrok tunnel established!
   🌐 PUBLIC ACCESS URLS:
      Frontend: https://xxxx-xx-xx.ngrok-free.app
   ```

4. **If you see "❌ Failed to start ngrok tunnel":**
   - Your authtoken might be invalid
   - Another ngrok process might be running
   - See troubleshooting below

---

## ✅ Success Indicators:

When ngrok works correctly, you'll see:
- ✅ ngrok tunnel established!
- A public URL like: `https://xxxx-xx-xx.ngrok-free.app`
- Mobile QR code will show "PUBLIC INTERNET ACCESS"

---

## 🔧 Troubleshooting:

### Issue: "invalid tunnel configuration"

**Solution 1: Kill existing ngrok processes**
```bash
pkill ngrok
npm run server
```

**Solution 2: Verify authtoken**
```bash
# Your authtoken:
2Nn9unMLbzX3F0CwZUmcbsWpC08_74iGYc5Loxz5FnD9kbJSb

# Test manually:
npx ngrok http 5173 --authtoken=2Nn9unMLbzX3F0CwZUmcbsWpC08_74iGYc5Loxz5FnD9kbJSb
```

**Solution 3: Check ngrok dashboard**
- Visit: https://dashboard.ngrok.com/
- Make sure you're not exceeding free tier limits
- Check if there are active tunnels

---

## 📱 After Server Restart:

1. **Refresh the browser** (where TouchRead is open)
2. Click **"Connect Mobile Camera"** button
3. You should now see **"PUBLIC INTERNET ACCESS (ngrok)"**
4. Scan the QR code - it will work from anywhere!

---

## 🌐 Testing ngrok:

After server starts successfully, test in browser console:
```javascript
fetch('http://localhost:5000/api/network-info')
  .then(r => r.json())
  .then(d => console.log('ngrok URL:', d.ngrokUrl))
```

If `ngrokUrl` is not null, ngrok is working! ✅

---

## 📝 Alternative: Manual ngrok Setup

If automatic setup keeps failing:

1. **Open a separate terminal:**
   ```bash
   npx ngrok http 5173 --authtoken=2Nn9unMLbzX3F0CwZUmcbsWpC08_74iGYc5Loxz5FnD9kbJSb
   ```

2. **Copy the ngrok URL** (e.g., `https://abc123.ngrok-free.app`)

3. **Open that URL in your browser** instead of localhost

4. The QR code will automatically use the ngrok URL

---

## 🎯 Expected Result:

```
🚀 Server running on:
   Local:   http://localhost:5000
   Network: http://10.86.23.243:5000

⏳ Starting ngrok tunnel for frontend...

✅ ngrok tunnel established!

🌐 PUBLIC ACCESS URLS:
   Frontend: https://xxxx-xx-xx.ngrok-free.app
   
📱 Mobile Camera QR Code:
   https://xxxx-xx-xx.ngrok-free.app/mobile-camera
   
✨ Share this URL to access from ANYWHERE in the world!

💡 Tips:
   - QR code will automatically use this ngrok URL
   - Share https://xxxx-xx-xx.ngrok-free.app with anyone to access the app
   - Mobile camera works from any location

🔌 Socket.IO server ready for connections
```
