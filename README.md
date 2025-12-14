# Sign Language to Text Converter

A real-time sign language recognition system that converts hand signs into text using AI, TensorFlow.js, React, Tailwind CSS, and Node.js.

## Features

- 🎥 **Real-time Camera Detection** - Uses webcam to capture hand gestures
- 🤖 **AI-Powered Recognition** - TensorFlow.js with MediaPipe Hands for accurate hand tracking
- ⚡ **Live Translation** - Instant conversion of signs to text
- 📊 **Performance Stats** - FPS monitoring and accuracy tracking
- 🎨 **Modern UI** - Beautiful, responsive interface with Tailwind CSS
- 🔄 **Real-time Updates** - Socket.IO for live synchronization
- 📝 **Text Management** - Copy, clear, and manage recognized text

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- TensorFlow.js
- MediaPipe Hands
- React Webcam
- Socket.IO Client
- Vite

### Backend
- Node.js
- Express
- Socket.IO
- CORS

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Webcam/Camera
- Modern web browser (Chrome, Firefox, Edge)

## Installation

1. **Clone or navigate to the project directory**

2. **Install root dependencies**
```bash
npm install
```

3. **Install client dependencies**
```bash
cd client
npm install
cd ..
```

## Running the Application

### Option 1: Run Everything Together
```bash
npm start
```

This will start both the server and client simultaneously.

### Option 2: Run Separately

**Terminal 1 - Start the Backend Server:**
```bash
npm run server
```

**Terminal 2 - Start the Frontend Client:**
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Usage

1. **Allow Camera Access** - Grant permission when prompted by your browser
2. **Start Detection** - Click the "Start Detection" button
3. **Show Hand Signs** - Display hand gestures to the camera
4. **View Translation** - See recognized text appear in real-time
5. **Manage Text** - Copy or clear text as needed

## Supported Gestures

Currently supports basic hand gestures:
- **A** - Closed fist
- **V** - Peace sign (two fingers)
- **I** - Pointing finger
- **👍** - Thumbs up
- **👋** - Open hand (Hello)

## Project Structure

```
edusense/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── CameraView.jsx
│   │   │   ├── TextDisplay.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Stats.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                # Node.js backend
│   └── index.js
├── package.json
├── .env
└── README.md
```

## API Endpoints

### REST API
- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/sentence` - Get current recognized sentence
- `POST /api/clear` - Clear current sentence

### WebSocket Events
- `sign-detected` - Emit when a sign is detected
- `sentence-update` - Receive sentence updates
- `clear-sentence` - Clear the current sentence

## Configuration

Edit `.env` file to change server settings:
```env
PORT=5000
NODE_ENV=development
```

## Browser Requirements

- Camera/webcam access
- WebRTC support
- Modern JavaScript support
- WebGL for TensorFlow.js

## Performance Tips

1. Use good lighting for better hand detection
2. Keep hands within camera frame
3. Avoid complex backgrounds
4. Position hands at medium distance from camera
5. Make clear, distinct gestures

## Future Enhancements

- [ ] Support for complete ASL alphabet
- [ ] Word and sentence prediction
- [ ] Multiple sign language support (BSL, ISL)
- [ ] Custom gesture training
- [ ] Voice output (text-to-speech)
- [ ] Mobile app version
- [ ] Recording and playback
- [ ] Multi-user collaboration

## Troubleshooting

**Camera not working:**
- Check browser permissions
- Ensure camera is not used by another application
- Try a different browser

**Low FPS:**
- Close other applications
- Use a less complex background
- Reduce video quality in settings

**Poor recognition:**
- Improve lighting conditions
- Move hands closer to camera
- Make gestures more distinct
- Ensure hands are fully visible

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

Built with ❤️ using React, TensorFlow.js, and Node.js
