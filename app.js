/**
 * Main Application
 * Connects face tracking with 3D rendering
 */

class App {
    constructor() {
        // Modules
        this.faceTracker = null;
        this.renderer3D = null;

        // UI Elements
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            loadingText: document.getElementById('loading-text'),
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close'),
            debugCanvas: document.getElementById('debug-canvas'),
            togglePanel: document.getElementById('toggle-panel'),
            controlPanel: document.getElementById('control-panel'),

            // Sliders
            sensitivitySlider: document.getElementById('sensitivity'),
            sensitivityValue: document.getElementById('sensitivity-value'),
            depthSlider: document.getElementById('depth'),
            depthValue: document.getElementById('depth-value'),
            smoothingSlider: document.getElementById('smoothing'),
            smoothingValue: document.getElementById('smoothing-value'),
            gridSizeSlider: document.getElementById('grid-size'),
            gridSizeValue: document.getElementById('grid-size-value'),
            layerCountSlider: document.getElementById('layer-count'),
            layerCountValue: document.getElementById('layer-count-value'),

            // Checkboxes
            performanceMode: document.getElementById('performance-mode'),
            debugMode: document.getElementById('debug-mode'),

            // Stats
            fpsDisplay: document.getElementById('fps-display'),
            positionDisplay: document.getElementById('position-display')
        };

        // State
        this.isRunning = false;
        this.debugContext = null;
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('🚀 Starting application...');

        try {
            // Initialize 3D Renderer
            this.elements.loadingText.textContent = 'Creating 3D scene...';
            this.renderer3D = new Renderer3D('canvas-container');
            this.renderer3D.initialize();
            this.renderer3D.start();

            // Create Face Tracker
            this.elements.loadingText.textContent = 'Loading face detection model...';

            // Wait for libraries
            await this.waitForLibraries();

            this.faceTracker = new FaceTracker();

            // Set callbacks
            this.faceTracker.onFaceDetected = this.onFaceDetected.bind(this);
            this.faceTracker.onFaceLost = this.onFaceLost.bind(this);

            // Setup UI event listeners
            this.setupEventListeners();

            // Setup debug canvas
            this.setupDebugCanvas();

            // Hide loading screen
            setTimeout(() => {
                this.elements.loadingScreen.classList.add('hidden');
            }, 1000);

            console.log('✅ Application started successfully');
        } catch (error) {
            console.error('❌ Application initialization error:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    /**
     * Wait for libraries to load
     */
    async waitForLibraries() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;

            const checkInterval = setInterval(() => {
                attempts++;

                const threeLoaded = typeof THREE !== 'undefined';
                const mediaPipeLoaded = typeof FaceDetection !== 'undefined';

                console.log(`Library check (${attempts}/${maxAttempts}): Three=${threeLoaded}, MediaPipe=${mediaPipeLoaded}`);

                if (threeLoaded && mediaPipeLoaded) {
                    clearInterval(checkInterval);
                    console.log('✅ All libraries loaded');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('⚠️ Some libraries failed to load, continuing...');
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start/Stop buttons
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());

        // Panel toggle
        this.elements.togglePanel.addEventListener('click', () => {
            this.elements.controlPanel.classList.toggle('collapsed');
            this.elements.togglePanel.textContent =
                this.elements.controlPanel.classList.contains('collapsed') ? '+' : '−';
        });

        // Sensitivity slider
        this.elements.sensitivitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.sensitivityValue.textContent = value;
            this.renderer3D.updateSettings({ sensitivity: value });
        });

        // Depth slider
        this.elements.depthSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.depthValue.textContent = value;
            this.renderer3D.updateSettings({ depth: value });
        });

        // Smoothing slider
        this.elements.smoothingSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.smoothingValue.textContent = value;
            this.renderer3D.updateSettings({ smoothing: value });
            this.faceTracker.setSmoothingFactor(value / 10);
        });

        // Grid size slider
        this.elements.gridSizeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.gridSizeValue.textContent = value;
            this.renderer3D.updateSettings({ gridSize: value });
        });

        // Layer count slider
        this.elements.layerCountSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.layerCountValue.textContent = value;
            this.renderer3D.updateSettings({ layerCount: value });
        });

        // Performance mode
        this.elements.performanceMode.addEventListener('change', (e) => {
            this.renderer3D.updateSettings({ performanceMode: e.target.checked });
        });

        // Debug mode
        this.elements.debugMode.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.elements.debugCanvas.classList.add('visible');
            } else {
                this.elements.debugCanvas.classList.remove('visible');
            }
        });

        // Error modal close
        this.elements.errorClose.addEventListener('click', () => {
            this.elements.errorModal.classList.remove('visible');
        });

        // Stats update
        setInterval(() => this.updateStats(), 100);

        // Debug canvas update
        setInterval(() => {
            if (this.elements.debugMode.checked && this.isRunning) {
                this.drawDebugVideo();
            }
        }, 33);

        // Grid update when no face
        setInterval(() => {
            if (this.renderer3D && !this.isRunning) {
                this.renderer3D.updateFromFacePosition(null);
            }
        }, 16);
    }

    /**
     * Draw video to debug canvas
     */
    drawDebugVideo() {
        const ctx = this.debugContext;
        const canvas = this.elements.debugCanvas;
        const video = document.getElementById('webcam');

        if (video && video.readyState >= 2 && video.videoWidth > 0) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    /**
     * Setup debug canvas
     */
    setupDebugCanvas() {
        this.elements.debugCanvas.width = 320;
        this.elements.debugCanvas.height = 240;
        this.debugContext = this.elements.debugCanvas.getContext('2d');
    }

    /**
     * Start tracking
     */
    async start() {
        if (this.isRunning) return;

        const faceStatus = document.getElementById('face-status');

        try {
            this.elements.startBtn.disabled = true;
            this.elements.startBtn.textContent = '⏳ Starting...';

            if (faceStatus) {
                faceStatus.style.color = '#ffaa00';
                faceStatus.textContent = '🔄 Starting camera...';
            }

            await this.faceTracker.start();

            this.isRunning = true;
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.elements.startBtn.textContent = '🎥 Start';

            if (faceStatus) {
                faceStatus.style.color = '#ffaa00';
                faceStatus.textContent = '🔍 Searching for face... Look at the camera';
            }

            console.log('✅ Tracking started');
        } catch (error) {
            console.error('❌ Tracking start error:', error);
            this.showError(error.message);
            this.elements.startBtn.disabled = false;
            this.elements.startBtn.textContent = '🎥 Start';
        }
    }

    /**
     * Stop tracking
     */
    stop() {
        if (!this.isRunning) return;

        this.faceTracker.stop();
        this.isRunning = false;

        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;

        // Return camera to center
        this.renderer3D.updateFromFacePosition({
            smoothed: { x: 0.5, y: 0.5 }
        });

        console.log('⏹️ Tracking stopped');
    }

    /**
     * Called when face is detected
     */
    onFaceDetected(faceData) {
        // Debug log
        console.log('👤 Face detected:', {
            x: faceData.smoothed.x.toFixed(3),
            y: faceData.smoothed.y.toFixed(3),
            confidence: faceData.confidence?.toFixed(2)
        });

        // Update status
        const faceStatus = document.getElementById('face-status');
        if (faceStatus) {
            faceStatus.style.color = '#00ff00';
            faceStatus.textContent = `✅ Face detected! X: ${faceData.smoothed.x.toFixed(2)}, Y: ${faceData.smoothed.y.toFixed(2)}`;
        }

        // Update 3D scene
        this.renderer3D.updateFromFacePosition(faceData);

        // Update debug canvas
        if (this.elements.debugMode.checked) {
            this.drawDebugInfo(faceData);
        }
    }

    /**
     * Called when face is lost
     */
    onFaceLost() {
        console.log('❌ Face lost');

        const faceStatus = document.getElementById('face-status');
        if (faceStatus) {
            faceStatus.style.color = '#ff6666';
            faceStatus.textContent = '❌ Face not detected - Look at the camera';
        }
    }

    /**
     * Draw debug info
     */
    drawDebugInfo(faceData) {
        const ctx = this.debugContext;
        const canvas = this.elements.debugCanvas;

        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw webcam
        const video = document.getElementById('webcam');
        if (video && video.readyState >= 2 && video.videoWidth > 0) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
        } else {
            ctx.fillStyle = '#ff6666';
            ctx.font = '14px Arial';
            ctx.fillText('Waiting for camera...', 10, 30);
        }

        if (!faceData) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '12px Arial';
            ctx.fillText('No face detected', 10, 50);
            return;
        }

        // Mark face position (mirrored)
        const x = (1 - faceData.smoothed.x) * canvas.width;
        const y = faceData.smoothed.y * canvas.height;

        // Crosshair
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x + 15, y);
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x, y + 15);
        ctx.stroke();

        // Circle
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.stroke();

        // Confidence score
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px monospace';
        ctx.fillText(`Confidence: ${(faceData.confidence * 100).toFixed(0)}%`, 10, 20);
    }

    /**
     * Update stats
     */
    updateStats() {
        // FPS
        if (this.renderer3D) {
            this.elements.fpsDisplay.textContent = this.renderer3D.getFPS();
        }

        // Position
        if (this.faceTracker && this.isRunning) {
            const pos = this.faceTracker.smoothedPosition;
            this.elements.positionDisplay.textContent =
                `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}`;
        } else {
            this.elements.positionDisplay.textContent = '-';
        }
    }

    /**
     * Show error
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorModal.classList.add('visible');
    }
}

// Start application
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});

// Cleanup on page close
window.addEventListener('beforeunload', () => {
    if (app && app.faceTracker) {
        app.faceTracker.stop();
    }
});

