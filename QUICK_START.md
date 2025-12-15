# 🚀 EduSense - Quick Start Guide

## ⚡ Get Started in 5 Minutes!

### Prerequisites
```bash
✅ Node.js v16+ installed
✅ npm or yarn installed
✅ Webcam connected
✅ Modern browser (Chrome recommended)
```

---

## 📥 Installation (3 steps)

### Step 1: Clone & Navigate
```bash
git clone https://github.com/your-username/edusense.git
cd edusense
```

### Step 2: Install Dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Step 3: Start Servers

**Terminal 1 - Start Backend:**
```bash
cd server
npm run server
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```

✅ **Done!** Open http://localhost:5173

---

## 🎯 First Time Usage

### 1. Create Account (30 seconds)
1. Click "Sign Up"
2. Enter name, email, password
3. Select role: Student / Caregiver / Admin
4. Click "Create Account"
5. You're in!

### 2. Try Sign Language (1 minute)
1. Click "Sign Language" mode
2. Click "Start Detection"
3. Allow camera access
4. Show ASL hand signs (A-Z)
5. See text appear instantly!

### 3. Try TouchRead (1 minute)
1. Click "TouchRead" mode
2. Open a book or document
3. Click "Start Reading"
4. Point your finger at text
5. Hear it read aloud!

### 4. Try Games (2 minutes)
1. Click "Games" mode
2. Select "Sign Match"
3. Play the game
4. Earn XP and level up!
5. Unlock badges!

---

## 📱 Mobile Camera Connection

### Connect Mobile in 4 Steps

1. **On Desktop:**
   - Open TouchRead module
   - Click "📱 Connect Mobile Camera"

2. **On Mobile:**
   - Scan the QR code
   - Allow camera access

3. **Done!**
   - Your mobile camera is now connected
   - Works from anywhere in the world via Cloudflare Tunnel

---

## 🎮 All Features Quick Access

### For Students
```
1. Sign Language   → Learn ASL alphabet
2. TouchRead       → Read books with finger
3. Sign2Talk       → Chat using signs
4. Games           → Play 4 fun games
5. Analytics       → Track your progress
```

### For Educators/Caregivers
```
1. Dashboard       → View all students
2. Analytics       → See performance metrics
3. Reports         → Export progress reports
4. Settings        → Manage system
```

---

## 🔧 Troubleshooting

### Camera Not Working?
```bash
✅ Check browser permissions
✅ Try Chrome/Firefox
✅ Restart browser
✅ Check camera device in settings
```

### Detection Not Accurate?
```bash
✅ Ensure good lighting
✅ Keep hand in camera view
✅ Hold gesture for 2-3 seconds
✅ Check confidence score (>85% is good)
```

### Mobile Camera Not Connecting?
```bash
✅ Check WiFi/Internet connection
✅ Ensure server is running
✅ Restart server to regenerate QR code
✅ Try scanning QR code again
```

### Server Won't Start?
```bash
✅ Check if port 5000 is free: lsof -i :5000
✅ Kill existing process: kill -9 <PID>
✅ Try different port in .env file
✅ Check Node.js version: node --version
```

---

## 📊 Module Overview

| Module | Time to Try | Difficulty | Fun Factor |
|--------|-------------|------------|------------|
| 🔐 Authentication | 30 sec | Easy | ⭐⭐⭐ |
| 🤟 Sign Language | 1 min | Medium | ⭐⭐⭐⭐⭐ |
| 📖 TouchRead | 1 min | Easy | ⭐⭐⭐⭐ |
| 💬 Sign2Talk | 2 min | Easy | ⭐⭐⭐⭐⭐ |
| 🎮 Games | 2 min | Medium | ⭐⭐⭐⭐⭐ |
| 📊 Analytics | 1 min | Easy | ⭐⭐⭐ |
| ✍️ Text-to-Sign | 1 min | Easy | ⭐⭐⭐⭐ |
| 🎛️ Admin | 2 min | Medium | ⭐⭐⭐ |

---

## 🎯 Pro Tips

### For Best Experience
```
✅ Use Chrome browser
✅ Good lighting for camera
✅ Stable internet for mobile connection
✅ Keep hand in center of frame
✅ Hold gestures for 2-3 seconds
✅ Complete daily tasks for streaks
```

### Keyboard Shortcuts
```
Space    → Start/Stop detection
Esc      → Close modals
Enter    → Submit forms
←→       → Navigate games
```

---

## 📚 Learn More

- 📖 **Full Documentation:** [README_NEW.md](./README_NEW.md)
- ✅ **Feature List:** [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md)
- 🔧 **Implementation:** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- ☁️ **Cloudflare Setup:** [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)

---

## 🆘 Need Help?

### Common Questions

**Q: Which browser works best?**  
A: Chrome or Firefox recommended. Safari works but may have camera issues.

**Q: Can I use external webcam?**  
A: Yes! Select it in TouchRead camera settings.

**Q: Does it work offline?**  
A: Frontend works offline, but features requiring backend need internet.

**Q: Can multiple users connect?**  
A: Yes! Each user creates their own account.

**Q: Is data saved?**  
A: Currently in-memory. For production, implement database.

**Q: Can I export my progress?**  
A: Yes! Use Export button in Analytics module.

---

## 🎉 You're Ready!

### What to Do Next
1. ✅ Create account
2. ✅ Try all 8 modules
3. ✅ Complete daily tasks
4. ✅ Earn badges and level up
5. ✅ Track your progress
6. ✅ Share with friends!

---

## 📞 Support

- 🐛 **Issues:** Check console logs
- 📧 **Email:** your.email@example.com
- 📖 **Docs:** See documentation files
- 💬 **Chat:** GitHub Discussions

---

**Enjoy learning with EduSense!** 🎓✨

*Last Updated: December 14, 2024*
