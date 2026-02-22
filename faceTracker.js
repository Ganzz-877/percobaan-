/**
 * FaceTracker Module
 * Real-time face tracking using MediaPipe Face Detection
 * Includes Kalman filtering for smooth movement
 */

class FaceTracker {
    constructor() {
        this.videoElement = null;
        this.faceDetection = null;
        this.camera = null;
        this.isRunning = false;

        // Face position data
        this.facePosition = { x: 0.5, y: 0.5 };
        this.smoothedPosition = { x: 0.5, y: 0.5 };
        this.previousPosition = { x: 0.5, y: 0.5 };

        // Kalman filter parameters
        this.kalmanState = {
            x: { estimate: 0.5, errorEstimate: 1, errorMeasure: 0.05, processNoise: 0.03 },
            y: { estimate: 0.5, errorEstimate: 1, errorMeasure: 0.05, processNoise: 0.03 }
        };

        // Settings
        this.smoothingFactor = 0.3;
        this.detectionConfidence = 0.3;

        // Callbacks
        this.onFaceDetected = null;
        this.onFaceLost = null;

        // Stats
        this.lastDetectionTime = 0;
        this.detectionCount = 0;
        this._loggedOnce = false;
    }

    /**
     * Initialize MediaPipe Face Detection
     */
    async initialize() {
        try {
            console.log('🎭 Initializing Face Detection...');

            this.videoElement = document.getElementById('webcam');

            if (!this.videoElement) {
                throw new Error('Video element not found!');
            }

            if (typeof FaceDetection === 'undefined') {
                console.warn('⚠️ MediaPipe not loaded, waiting...');
                await this.waitForMediaPipe();
            }

            if (typeof FaceDetection === 'undefined') {
                throw new Error('MediaPipe FaceDetection failed to load!');
            }

            console.log('📦 Creating FaceDetection instance...');

            this.faceDetection = new FaceDetection({
                locateFile: (file) => {
                    console.log('📥 Loading MediaPipe file:', file);
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
                }
            });

            console.log('⚙️ Configuring FaceDetection...');

            this.faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: this.detectionConfidence
            });

            this.faceDetection.onResults(this.onResults.bind(this));

            console.log('⏳ Loading model, please wait...');
            if (typeof this.faceDetection.initialize === 'function') {
                await this.faceDetection.initialize();
            }

            console.log('✅ Face Detection initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Face Detection initialization error:', error);
            throw error;
        }
    }

    /**
     * Wait for MediaPipe to load
     */
    async waitForMediaPipe() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (typeof FaceDetection !== 'undefined') {
                    clearInterval(checkInterval);
                    console.log('✅ MediaPipe loaded');
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
    }

    /**
     * Start camera
     */
    async startCamera() {
        try {
            console.log('📹 Starting camera...');

            if (this.videoElement.srcObject) {
                const tracks = this.videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.videoElement.srcObject = stream;
            this.videoElement.muted = true;
            this.videoElement.playsInline = true;

            await this.videoElement.play();

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Video timeout')), 10000);

                if (this.videoElement.readyState >= 2) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    this.videoElement.onloadeddata = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                    this.videoElement.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Video loading error'));
                    };
                }
            });

            console.log('✅ Camera started successfully');
            console.log(`📹 Video size: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
            return true;
        } catch (error) {
            console.error('❌ Camera start error:', error);
            throw new Error('Camera access denied or not found: ' + error.message);
        }
    }

    /**
     * Start tracking
     */
    async start() {
        if (this.isRunning) {
            console.warn('⚠️ Tracking already running');
            return;
        }

        try {
            await this.initialize();
            await this.startCamera();

            this.isRunning = true;

            if (typeof Camera !== 'undefined') {
                console.log('📹 Using MediaPipe Camera Utils...');

                this.camera = new Camera(this.videoElement, {
                    onFrame: async () => {
                        if (this.isRunning && this.faceDetection) {
                            try {
                                await this.faceDetection.send({ image: this.videoElement });
                            } catch (err) {
                                console.error('Frame send error:', err);
                            }
                        }
                    },
                    width: 640,
                    height: 480
                });

                await this.camera.start();
                console.log('✅ MediaPipe Camera started');
            } else {
                console.warn('⚠️ Camera utils not found, using manual mode');
                this.startManualFrameProcessing();
            }

            console.log('🚀 Face tracking started');
        } catch (error) {
            console.error('❌ Tracking start error:', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Manual frame processing (fallback)
     */
    startManualFrameProcessing() {
        const processFrame = async () => {
            if (this.isRunning && this.videoElement.readyState === 4) {
                try {
                    await this.faceDetection.send({ image: this.videoElement });
                } catch (error) {
                    console.error('Frame processing error:', error);
                }
            }
            if (this.isRunning) {
                requestAnimationFrame(processFrame);
            }
        };
        requestAnimationFrame(processFrame);
    }

    /**
     * Stop tracking
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.camera) {
            this.camera.stop();
        }

        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }

        console.log('⏹️ Face tracking stopped');
    }

    /**
     * Process MediaPipe results
     */
    onResults(results) {
        try {
            // Debug log (once)
            if (!this._loggedOnce && results.detections && results.detections.length > 0) {
                console.log('🔍 MediaPipe RAW results:', JSON.stringify(results.detections[0], null, 2));
                this._loggedOnce = true;
            }

            if (!results.detections || results.detections.length === 0) {
                if (this.onFaceLost) {
                    this.onFaceLost();
                }
                return;
            }

            const detection = results.detections[0];

            // BoundingBox - support different MediaPipe versions
            let centerX = 0.5, centerY = 0.5, boundingBox = null;

            if (detection.boundingBox) {
                boundingBox = detection.boundingBox;
                if (typeof boundingBox.xCenter === 'number') {
                    centerX = boundingBox.xCenter;
                    centerY = boundingBox.yCenter;
                } else if (typeof boundingBox.originX === 'number') {
                    centerX = boundingBox.originX + (boundingBox.width || 0) / 2;
                    centerY = boundingBox.originY + (boundingBox.height || 0) / 2;
                } else if (typeof boundingBox.x === 'number') {
                    centerX = boundingBox.x + (boundingBox.width || 0) / 2;
                    centerY = boundingBox.y + (boundingBox.height || 0) / 2;
                }
            } else if (detection.locationData?.relativeBoundingBox) {
                const bb = detection.locationData.relativeBoundingBox;
                boundingBox = bb;
                centerX = (bb.xMin || bb.x || 0) + (bb.width || 0) / 2;
                centerY = (bb.yMin || bb.y || 0) + (bb.height || 0) / 2;
            }

            if (isNaN(centerX) || isNaN(centerY)) {
                console.warn('⚠️ Invalid coordinates:', centerX, centerY);
                return;
            }

            // Update position
            this.facePosition.x = centerX;
            this.facePosition.y = centerY;

            // Apply Kalman filter
            this.smoothedPosition.x = this.applyKalmanFilter('x', centerX);
            this.smoothedPosition.y = this.applyKalmanFilter('y', centerY);

            // Extra smoothing (lerp)
            this.smoothedPosition.x = this.lerp(
                this.previousPosition.x,
                this.smoothedPosition.x,
                1 - this.smoothingFactor
            );
            this.smoothedPosition.y = this.lerp(
                this.previousPosition.y,
                this.smoothedPosition.y,
                1 - this.smoothingFactor
            );

            this.previousPosition.x = this.smoothedPosition.x;
            this.previousPosition.y = this.smoothedPosition.y;

            // Confidence score - safe access
            let confidence = 0.5;
            if (Array.isArray(detection.score) && detection.score.length > 0) {
                confidence = detection.score[0];
            } else if (typeof detection.score === 'number') {
                confidence = detection.score;
            } else if (detection.categories?.[0]?.score) {
                confidence = detection.categories[0].score;
            }

            // Call callback
            if (this.onFaceDetected) {
                this.onFaceDetected({
                    raw: this.facePosition,
                    smoothed: this.smoothedPosition,
                    confidence: confidence,
                    boundingBox: boundingBox
                });
            }

            this.lastDetectionTime = Date.now();
            this.detectionCount++;

        } catch (error) {
            console.error('❌ onResults error:', error.message);
            console.log('Detection object:', results.detections?.[0]);
        }
    }

    /**
     * Apply Kalman filter
     */
    applyKalmanFilter(axis, measurement) {
        const state = this.kalmanState[axis];

        const predictedEstimate = state.estimate;
        const predictedError = state.errorEstimate + state.processNoise;

        const kalmanGain = predictedError / (predictedError + state.errorMeasure);
        const estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
        const errorEstimate = (1 - kalmanGain) * predictedError;

        state.estimate = estimate;
        state.errorEstimate = errorEstimate;

        return estimate;
    }

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * Math.max(0, Math.min(1, t));
    }

    /**
     * Set smoothing factor (0-1)
     */
    setSmoothingFactor(factor) {
        this.smoothingFactor = Math.max(0, Math.min(1, factor));
    }

    /**
     * Set detection confidence threshold
     */
    setDetectionConfidence(confidence) {
        this.detectionConfidence = confidence;
        if (this.faceDetection) {
            this.faceDetection.setOptions({
                minDetectionConfidence: confidence
            });
        }
    }
}

