class FaceMotionCapture {
    constructor() {
        this.videoElement = document.getElementById('input_video');
        this.canvasElement = document.getElementById('output_canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');
        this.stickFigureCanvas = document.getElementById('stick_figure_canvas');
        this.stickFigureCtx = this.stickFigureCanvas.getContext('2d');
        
        this.faceMesh = null;
        this.camera = null;
        this.isRunning = false;
        
        // Face properties
        this.face = {
            centerX: 200,
            centerY: 200,
            faceRadius: 80,
            eyeLeftOpen: true,
            eyeRightOpen: true,
            isSmiling: false,
            smileIntensity: 0,
            leftEyeOpenness: 1.0,
            rightEyeOpenness: 1.0
        };
        
        this.initializeEventListeners();
        this.initializeFaceMesh();
        this.drawInitialFace();
    }
    
    initializeEventListeners() {
        const startBtn = document.getElementById('start_btn');
        const stopBtn = document.getElementById('stop_btn');
        const resetBtn = document.getElementById('reset_btn');
        
        startBtn.addEventListener('click', () => this.startCapture());
        stopBtn.addEventListener('click', () => this.stopCapture());
        resetBtn.addEventListener('click', () => this.resetFace());
    }
    
    initializeFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.faceMesh.onResults((results) => this.onResults(results));
    }
    
    async startCapture() {
        try {
            const startBtn = document.getElementById('start_btn');
            const stopBtn = document.getElementById('stop_btn');
            
            startBtn.disabled = true;
            startBtn.innerHTML = '<div class="loading"></div>Starting...';
            
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.faceMesh.send({image: this.videoElement});
                },
                width: 320,
                height: 240
            });
            
            await this.camera.start();
            
            this.isRunning = true;
            startBtn.style.display = 'none';
            stopBtn.disabled = false;
            stopBtn.style.display = 'inline-block';
            
            console.log('Motion capture started successfully!');
            
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Error accessing camera. Please make sure you have granted camera permissions.');
            
            const startBtn = document.getElementById('start_btn');
            startBtn.disabled = false;
            startBtn.innerHTML = 'Start Motion Capture';
        }
    }
    
    stopCapture() {
        if (this.camera) {
            this.camera.stop();
        }
        
        this.isRunning = false;
        
        const startBtn = document.getElementById('start_btn');
        const stopBtn = document.getElementById('stop_btn');
        
        startBtn.style.display = 'inline-block';
        startBtn.disabled = false;
        startBtn.innerHTML = 'Start Motion Capture';
        stopBtn.disabled = true;
        stopBtn.style.display = 'none';
        
        // Clear the canvas
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        console.log('Motion capture stopped');
    }
    
    onResults(results) {
        // Clear and draw the camera feed with landmarks
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Draw face mesh
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
            drawConnectors(this.canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
            
            // Extract face motion data and update face
            this.updateFaceFromLandmarks(landmarks);
        }
        
        this.canvasCtx.restore();
    }
    
    updateFaceFromLandmarks(landmarks) {
        // Key landmark indices for face tracking
        const noseTip = landmarks[1]; // Nose tip
        
        // Enhanced eye blink detection
        const leftEyeTop = landmarks[159]; // Left eye top
        const leftEyeBottom = landmarks[145]; // Left eye bottom
        const rightEyeTop = landmarks[386]; // Right eye top
        const rightEyeBottom = landmarks[374]; // Right eye bottom
        
        const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
        const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
        
        // Calculate eye openness as a ratio (0 = closed, 1 = open)
        this.face.leftEyeOpenness = Math.min(1.0, leftEyeHeight / 0.02);
        this.face.rightEyeOpenness = Math.min(1.0, rightEyeHeight / 0.02);
        
        this.face.eyeLeftOpen = this.face.leftEyeOpenness > 0.3;
        this.face.eyeRightOpen = this.face.rightEyeOpenness > 0.3;
        
        // Enhanced smile detection using correct mouth landmarks
        const mouthLeft = landmarks[61]; // Left mouth corner
        const mouthRight = landmarks[291]; // Right mouth corner
        const mouthCenter = landmarks[13]; // Center of upper lip
        const upperLip = landmarks[12]; // Upper lip center
        const lowerLip = landmarks[15]; // Lower lip center
        
        // Calculate mouth corner positions relative to center
        const mouthCenterY = (upperLip.y + lowerLip.y) / 2;
        const leftCornerElevation = mouthCenterY - mouthLeft.y; // Higher values = smile
        const rightCornerElevation = mouthCenterY - mouthRight.y; // Higher values = smile
        
        // Average corner elevation (positive when corners are above center)
        const avgCornerElevation = (leftCornerElevation + rightCornerElevation) / 2;
        
        // Calculate mouth width for additional validation
        const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
        const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
        const widthToHeightRatio = mouthWidth / Math.max(mouthHeight, 0.001);
        
        // Improved smile detection with multiple criteria
        const isSmileByElevation = avgCornerElevation > 0.005; // Corners elevated
        const isSmileByRatio = widthToHeightRatio > 3.0; // Wide mouth
        
        // Combined smile detection
        this.face.isSmiling = isSmileByElevation && isSmileByRatio;
        
        // Calculate smile intensity (0 to 1)
        this.face.smileIntensity = Math.min(1.0, Math.max(0, avgCornerElevation * 100));
        
        // Debug logging for development
        if (this.face.isSmiling) {
            console.log(`Smile detected! Elevation: ${avgCornerElevation.toFixed(4)}, Ratio: ${widthToHeightRatio.toFixed(2)}, Intensity: ${this.face.smileIntensity.toFixed(2)}`);
        }
        
        // Draw updated face
        this.drawFace();
    }
    
    drawFace() {
        const ctx = this.stickFigureCtx;
        const canvas = this.stickFigureCanvas;
        const face = this.face;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context for transformations
        ctx.save();
        
        // Move to center (no rotations)
        ctx.translate(face.centerX, face.centerY);
        
        // Draw face outline (circle)
        ctx.beginPath();
        ctx.arc(0, 0, face.faceRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#ffeaa7';
        ctx.fill();
        ctx.stroke();
        
        // Draw eyes with dynamic openness
        const eyeOffset = face.faceRadius * 0.35;
        const eyeY = -face.faceRadius * 0.2;
        const eyeRadius = 8;
        
        // Left eye
        ctx.beginPath();
        if (face.eyeLeftOpen) {
            // Draw open eye with openness factor
            const openness = face.leftEyeOpenness;
            ctx.ellipse(-eyeOffset, eyeY, eyeRadius, eyeRadius * openness, 0, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw pupil
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, eyeRadius * 0.4 * openness, 0, 2 * Math.PI);
            ctx.fillStyle = '#2c3e50';
            ctx.fill();
        } else {
            // Draw closed eye (line)
            ctx.moveTo(-eyeOffset - eyeRadius, eyeY);
            ctx.lineTo(-eyeOffset + eyeRadius, eyeY);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Right eye
        ctx.beginPath();
        if (face.eyeRightOpen) {
            // Draw open eye with openness factor
            const openness = face.rightEyeOpenness;
            ctx.ellipse(eyeOffset, eyeY, eyeRadius, eyeRadius * openness, 0, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw pupil
            ctx.beginPath();
            ctx.arc(eyeOffset, eyeY, eyeRadius * 0.4 * openness, 0, 2 * Math.PI);
            ctx.fillStyle = '#2c3e50';
            ctx.fill();
        } else {
            // Draw closed eye (line)
            ctx.moveTo(eyeOffset - eyeRadius, eyeY);
            ctx.lineTo(eyeOffset + eyeRadius, eyeY);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Draw nose
        ctx.beginPath();
        ctx.moveTo(0, eyeY + 15);
        ctx.lineTo(-3, eyeY + 25);
        ctx.lineTo(3, eyeY + 25);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw mouth - smile or neutral based on detection
        const mouthY = face.faceRadius * 0.35;
        const mouthWidth = face.faceRadius * 0.5;
        
        ctx.beginPath();
        if (face.isSmiling) {
            // Draw clear smile - upward curving arc
            const smileRadius = mouthWidth * 0.8;
            const smileDepth = 8 + (face.smileIntensity * 12); // How deep the smile curve is
            
            // Create a smile arc that curves upward
            ctx.arc(0, mouthY - smileDepth, smileRadius, 0.3, Math.PI - 0.3);
            
            // Make smile very visible
            ctx.strokeStyle = '#e74c3c'; // Red color for smile
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
        } else {
            // Draw neutral mouth - straight line
            ctx.moveTo(-mouthWidth/2, mouthY);
            ctx.lineTo(mouthWidth/2, mouthY);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
        }
        ctx.stroke();
        
        // Add subtle mouth corners for neutral expression
        if (!face.isSmiling) {
            ctx.beginPath();
            ctx.arc(-mouthWidth/2, mouthY, 2, 0, 2 * Math.PI);
            ctx.arc(mouthWidth/2, mouthY, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#2c3e50';
            ctx.fill();
        }
        
        // Restore context
        ctx.restore();
        
        // Add facial expression indicators
        this.drawExpressionIndicators();
    }
    
    drawExpressionIndicators() {
        const ctx = this.stickFigureCtx;
        const face = this.face;
        
        // Expression status indicators
        const indicatorY = 350;
        
        // Eye blink indicators
        ctx.fillStyle = face.eyeLeftOpen ? '#27ae60' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(50, indicatorY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = face.eyeRightOpen ? '#27ae60' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(100, indicatorY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Smile indicator
        ctx.fillStyle = face.isSmiling ? '#f39c12' : '#95a5a6';
        ctx.beginPath();
        ctx.arc(150, indicatorY, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Smile intensity bar
        if (face.isSmiling) {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(170, indicatorY - 5, face.smileIntensity * 50, 10);
        }
        
        // Labels
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.fillText('Left Eye', 30, indicatorY + 25);
        ctx.fillText('Right Eye', 75, indicatorY + 25);
        ctx.fillText('Smile', 125, indicatorY + 25);
        
        // Expression status title
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.fillText('Expression Status:', 30, 330);
    }
    
    drawInitialFace() {
        this.drawFace();
        
        // Add instructions
        const ctx = this.stickFigureCtx;
        ctx.fillStyle = '#95a5a6';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Motion Capture"', 200, 30);
        ctx.fillText('to track your expressions!', 200, 50);
        ctx.fillText('Blink and smile to see the magic! 😊', 200, 380);
        ctx.textAlign = 'left';
    }
    
    resetFace() {
        this.face = {
            centerX: 200,
            centerY: 200,
            faceRadius: 80,
            eyeLeftOpen: true,
            eyeRightOpen: true,
            isSmiling: false,
            smileIntensity: 0,
            leftEyeOpenness: 1.0,
            rightEyeOpenness: 1.0
        };
        
        this.drawInitialFace();
        console.log('Face reset to default expression');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Facial Motion Capture...');
    
    // Check if browser supports required features
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
    }
    
    // Initialize the motion capture system
    try {
        const motionCapture = new FaceMotionCapture();
        console.log('Facial Motion Capture initialized successfully!');
        
        // Store globally for debugging
        window.motionCapture = motionCapture;
        
    } catch (error) {
        console.error('Error initializing motion capture:', error);
        alert('Error initializing the application. Please refresh the page and try again.');
    }
});

// Add some helpful console messages
console.log(`
🎭 Facial Expression Capture
=============================
This science project demonstrates:
- Real-time eye blink detection with precision
- Individual left and right eye tracking
- Smile detection and intensity measurement
- Facial landmark processing focused on expressions
- Browser-based AI facial analysis

Ready to start! Click the "Start Motion Capture" button and try blinking and smiling!
`);
