# 🎮 3D Parallax Wallpaper with Face Tracking

A mesmerizing 3D wallpaper that responds to your head movements using webcam face tracking. Move your head and watch the 3D room move with you - just like looking through a window into another dimension!

![Preview](preview.gif)

## ✨ Features

- **Real-time Face Tracking** - Uses MediaPipe for accurate face detection
- **3D Parallax Effect** - Move your head to look around the virtual room
- **Customizable Settings** - Adjust sensitivity, depth, smoothing, and more
- **Performance Mode** - Optimized for lower-end systems
- **Debug Mode** - See face tracking in action

## 🚀 Quick Start

1. **Download** all files to a folder
2. **Run** `start.bat` (Windows) or `python -m http.server 8000`
3. **Open** `http://localhost:8000` in your browser
4. **Click** "🎥 Start" button
5. **Allow** camera access
6. **Move** your head and enjoy!

## 📁 Files Included

```
├── index.html      # Main HTML file
├── style.css       # Styling
├── app.js          # Main application controller
├── faceTracker.js  # Face detection module
├── renderer3D.js   # Three.js 3D rendering
├── start.bat       # Windows launcher
└── README.md       # This file
```

## 🎛️ Controls

| Control | Description |
|---------|-------------|
| Sensitivity | How much the scene reacts to movement |
| Depth | Parallax depth effect intensity |
| Smoothing | Movement smoothness (higher = smoother) |
| Grid Size | Detail level of the grid |
| Layer Count | Number of parallax layers |
| Performance Mode | Reduces quality for better FPS |
| Debug Mode | Shows camera feed and face position |

## 💻 Requirements

- Modern web browser (Chrome, Firefox, Edge)
- Webcam
- Python 3.x (for local server) or any HTTP server

## 🎯 How It Works

1. **Face Detection**: MediaPipe detects your face position in the webcam feed
2. **Position Tracking**: Your face coordinates are smoothed using Kalman filtering
3. **3D Rendering**: Three.js renders a 3D room with multiple parallax layers
4. **Parallax Effect**: Each layer moves at different speeds based on your position

## ⚡ Tips for Best Experience

- Ensure good lighting on your face
- Position yourself 50-80cm from the camera
- Keep your face centered initially
- Adjust sensitivity based on your preference

## 🛠️ Customization

Edit `renderer3D.js` to change:
- Colors (`this.colors`)
- Room dimensions
- Grid density
- Fog distance

## 📝 License

Free to use and modify. Credit appreciated!

---

**Enjoy your 3D Parallax Wallpaper!** 🎉

*Created with Three.js + MediaPipe*

