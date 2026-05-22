# EduSense – AI-Powered Sign Language Learning Platform

EduSense is a web app built to bridge the communication gap for specially abled individuals. It uses your camera to detect hand gestures in real time and converts them into text — making it easier for people with hearing or speech impairments to express themselves and interact with the world around them.

🔗 **Live Demo:** [https://edusense-frontend.vercel.app](https://edusense-frontend.vercel.app)

---

## What it does

- **Sign to Text** — Point your camera at your hand and watch it convert ASL signs to text instantly
- **Sign2Talk** — A chat interface where you can communicate using sign language
- **Text to Sign** — Type any text and see the corresponding sign language gestures
- **TouchRead** — Point your camera at printed text and it reads it for you (OCR)
- **Learning Games** — Gamified exercises to practice and improve your ASL skills
- **Progress Analytics** — Track how you're improving over time
- **Admin Dashboard** — For teachers and caregivers to monitor student progress

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TensorFlow.js + HandPose model (runs entirely in the browser)
- Fingerpose for gesture classification
- Tailwind CSS
- Socket.IO client

**Backend**
- Node.js + Express
- Socket.IO
- SQLite (gesture learning database)
- Tesseract.js (OCR)

---

## Run it locally

**1. Clone the repo**
```bash
git clone https://github.com/sonurajesh27/Edusense-AI-Learning-Platform.git
cd Edusense-AI-Learning-Platform
```

**2. Install dependencies**
```bash
npm install
cd client && npm install
```

**3. Start the server**
```bash
cd server
npm run dev
```

**4. Start the frontend**
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser and allow camera access.

---

## Demo login

```
Email: demo@edusense.com
Password: demo123
```

---

## Deployment

- Frontend hosted on **Vercel**
- Backend hosted on **Render**



