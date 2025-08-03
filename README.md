# 🎭 Facial Motion Capture Stick Figure

A science project that demonstrates real-time computer vision by tracking facial movements and animating a stick figure to copy your motions!

## 🌟 Features

- **Real-time Face Tracking**: Uses MediaPipe AI to detect 468 facial landmarks
- **Motion Mapping**: Stick figure copies your head movements, rotations, and tilts
- **Eye Blink Detection**: Stick figure blinks when you blink
- **Browser-based**: All processing happens locally - no data sent to servers
- **Modern UI**: Beautiful, responsive design with smooth animations

## 🚀 How to Run

1. **Start a local web server** (required for camera access):
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (if you have npx)
   npx serve .
   ```

2. **Open your browser** and go to:
   ```
   http://localhost:8000
   ```

3. **Grant camera permissions** when prompted

4. **Click "Start Motion Capture"** and move your head around!

## 🔬 How It Works

### Computer Vision Pipeline
1. **Camera Input**: Captures video from your webcam
2. **AI Processing**: MediaPipe analyzes each frame to find facial landmarks
3. **Motion Extraction**: Calculates head rotation, tilt, and eye states
4. **Animation**: Updates stick figure position and expressions in real-time

### Key Technologies
- **MediaPipe**: Google's machine learning framework for face detection
- **HTML5 Canvas**: For rendering both the face overlay and stick figure
- **WebRTC**: For accessing camera feed
- **JavaScript**: Real-time processing and animation loops

## 🎯 Educational Value

This project demonstrates several important computer science concepts:

- **Computer Vision**: How AI can understand and track human faces
- **Real-time Processing**: Handling 30fps video streams with low latency
- **Coordinate Systems**: Mapping 3D head movements to 2D animations
- **Browser APIs**: Using modern web technologies for multimedia applications
- **Machine Learning**: Applied AI for landmark detection and tracking

## 🛠️ Technical Details

- **Face Landmarks**: Tracks 468 points on your face in 3D space
- **Frame Rate**: Processes up to 30 frames per second
- **Accuracy**: Sub-pixel precision for landmark detection
- **Latency**: <50ms from face movement to stick figure update

## 🎨 Customization

You can modify the stick figure appearance by editing these variables in `script.js`:

```javascript
this.stickFigure = {
    centerX: 200,          // Horizontal position
    centerY: 200,          // Vertical position  
    headRadius: 30,        // Head size
    bodyLength: 100,       // Body height
    armLength: 60,         // Arm span
    legLength: 80,         // Leg length
    // ... motion properties
};
```

## 🔧 Troubleshooting

**Camera not working?**
- Make sure you're using HTTPS or localhost
- Grant camera permissions in your browser
- Try a different browser (Chrome, Firefox, Safari)

**Stick figure not moving?**
- Ensure good lighting on your face
- Position yourself clearly in front of the camera
- Check browser console for error messages

## 📱 Browser Compatibility

- ✅ Chrome 88+
- ✅ Firefox 85+  
- ✅ Safari 14+
- ✅ Edge 88+

## 🎓 Science Fair Presentation Tips

1. **Explain the AI**: Show how the computer "sees" your face with 468 points
2. **Demonstrate Real-time**: Move your head and show instant stick figure response
3. **Discuss Applications**: Face filters, motion capture, accessibility tools
4. **Show the Code**: Highlight key algorithms and data processing
5. **Interactive Demo**: Let judges try it themselves!

## 🔬 Possible Extensions

- Add more body parts that respond to hand gestures
- Implement facial expression recognition (smile, frown, surprise)
- Record and playback motion sequences
- Add multiple stick figures for group motion capture
- Create different character styles (robot, animal, etc.)

---

**Created for Science Fair 2024** 🏆
*Demonstrating the power of computer vision and real-time AI processing*
