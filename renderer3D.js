/**
 * Renderer3D Module
 * 3D grid and parallax effect using Three.js
 * Multi-layer depth system
 */

class Renderer3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);

        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gridLayers = [];

        // Animation
        this.animationId = null;
        this.clock = new THREE.Clock();

        // Settings
        this.settings = {
            sensitivity: 60,
            depth: 35,
            smoothing: 4,
            gridSize: 20,
            layerCount: 5,
            performanceMode: false
        };

        // Camera position
        this.targetCameraPosition = new THREE.Vector3(0, 0, 120);
        this.currentCameraPosition = new THREE.Vector3(0, 0, 120);

        // Performance
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();

        // Colors
        this.colors = {
            background: 0x0a1628,
            gridPrimary: 0x00d4ff,
            gridSecondary: 0x0099cc,
            gridTertiary: 0x0066aa
        };
    }

    /**
     * Initialize 3D scene
     */
    initialize() {
        console.log('🎨 Initializing 3D Renderer...');

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.colors.background);
        this.scene.fog = new THREE.Fog(this.colors.background, 150, 500);

        // Create camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 120);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.settings.performanceMode,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.settings.performanceMode ? 1 : window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Create grid layers
        this.createGridLayers();

        // Add lighting
        this.addLights();

        // Add particles
        this.addParticles();

        // Window resize event
        window.addEventListener('resize', this.onWindowResize.bind(this));

        console.log('✅ 3D Renderer initialized successfully');
    }

    /**
     * Create grid layers
     */
    createGridLayers() {
        // Clear old layers
        this.gridLayers.forEach(layer => {
            this.scene.remove(layer.mesh);
            layer.geometry.dispose();
            layer.material.dispose();
        });
        this.gridLayers = [];

        const gridSize = this.settings.gridSize;

        // BACK WALL
        const wallGeometry = new THREE.PlaneGeometry(400, 250, gridSize * 2, gridSize);
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.gridPrimary,
            wireframe: true,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 0, -200);
        this.scene.add(backWall);
        this.gridLayers.push({
            mesh: backWall,
            geometry: wallGeometry,
            material: wallMaterial,
            depth: 0.5,
            originalPosition: backWall.position.clone(),
            originalRotation: backWall.rotation.clone(),
            type: 'back'
        });

        // FLOOR
        const floorGeometry = new THREE.PlaneGeometry(400, 500, gridSize * 2, gridSize * 2);
        const floorMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.gridPrimary,
            wireframe: true,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -100, -100);
        this.scene.add(floor);
        this.gridLayers.push({
            mesh: floor,
            geometry: floorGeometry,
            material: floorMaterial,
            depth: 0.4,
            originalPosition: floor.position.clone(),
            originalRotation: floor.rotation.clone(),
            type: 'floor'
        });

        // CEILING
        const ceilingGeometry = new THREE.PlaneGeometry(400, 500, gridSize * 2, gridSize * 2);
        const ceilingMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.gridPrimary,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 100, -100);
        this.scene.add(ceiling);
        this.gridLayers.push({
            mesh: ceiling,
            geometry: ceilingGeometry,
            material: ceilingMaterial,
            depth: 0.4,
            originalPosition: ceiling.position.clone(),
            originalRotation: ceiling.rotation.clone(),
            type: 'ceiling'
        });

        // LEFT WALL
        const leftWallGeometry = new THREE.PlaneGeometry(500, 250, gridSize * 2, gridSize);
        const leftWallMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.gridPrimary,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-180, 0, -100);
        this.scene.add(leftWall);
        this.gridLayers.push({
            mesh: leftWall,
            geometry: leftWallGeometry,
            material: leftWallMaterial,
            depth: 0.8,
            originalPosition: leftWall.position.clone(),
            originalRotation: leftWall.rotation.clone(),
            type: 'left'
        });

        // RIGHT WALL
        const rightWallGeometry = new THREE.PlaneGeometry(500, 250, gridSize * 2, gridSize);
        const rightWallMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.gridPrimary,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(180, 0, -100);
        this.scene.add(rightWall);
        this.gridLayers.push({
            mesh: rightWall,
            geometry: rightWallGeometry,
            material: rightWallMaterial,
            depth: 0.8,
            originalPosition: rightWall.position.clone(),
            originalRotation: rightWall.rotation.clone(),
            type: 'right'
        });

        console.log(`📐 Grid layers created`);
    }

    /**
     * Add lighting
     */
    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x4fc3f7, 0.8);
        dirLight.position.set(10, 10, 20);
        this.scene.add(dirLight);

        const pointLight1 = new THREE.PointLight(0x4fc3f7, 1, 100);
        pointLight1.position.set(30, 30, 30);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x2196f3, 1, 100);
        pointLight2.position.set(-30, -30, 30);
        this.scene.add(pointLight2);
    }

    /**
     * Add particles for atmosphere
     */
    addParticles() {
        const particleCount = this.settings.performanceMode ? 500 : 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x4fc3f7,
            size: 0.5,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        particles.name = 'particles';
        this.scene.add(particles);
    }

    /**
     * Update camera and grid based on face position
     */
    updateFromFacePosition(faceData) {
        if (!faceData) {
            // Auto movement when no face detected
            const time = this.clock.getElapsedTime();
            const autoX = Math.sin(time * 0.2) * 0.03;
            const autoY = Math.cos(time * 0.15) * 0.02;

            this.targetCameraPosition.x = autoX * 30;
            this.targetCameraPosition.y = autoY * 20;
            this.targetCameraPosition.z = 120;

            const smoothingSpeed = 0.02;
            this.currentCameraPosition.lerp(this.targetCameraPosition, smoothingSpeed);
            this.camera.position.copy(this.currentCameraPosition);
            this.camera.lookAt(0, 0, 0);
            return;
        }

        // IMPORTANT: Invert X axis because webcam is mirrored
        // Moving head right will look at left side of room
        const offset = {
            x: -((faceData.smoothed.x - 0.5) * 2),
            y: (faceData.smoothed.y - 0.5) * 2
        };

        const sensitivity = this.settings.sensitivity / 30;
        const depthAmount = this.settings.depth * 1.5;

        // Target camera position
        this.targetCameraPosition.x = offset.x * sensitivity * 80;
        this.targetCameraPosition.y = -offset.y * sensitivity * 50;
        this.targetCameraPosition.z = 120 + Math.abs(offset.x) * depthAmount * 0.8;

        // Smooth transition
        const smoothingSpeed = 0.15 / (this.settings.smoothing + 1);
        this.currentCameraPosition.lerp(this.targetCameraPosition, smoothingSpeed);

        // Update camera
        this.camera.position.copy(this.currentCameraPosition);

        // Look at point
        const lookX = -offset.x * sensitivity * 40;
        const lookY = offset.y * sensitivity * 30;
        this.camera.lookAt(lookX, lookY, -50);

        // Parallax effect for each layer
        this.gridLayers.forEach((layer) => {
            const parallaxFactor = (1 - layer.depth) * sensitivity * 2;

            if (layer.type === 'back') {
                layer.mesh.position.x = layer.originalPosition.x + offset.x * 20;
                layer.mesh.position.y = layer.originalPosition.y - offset.y * 15;
            } else if (layer.type === 'floor') {
                layer.mesh.position.x = layer.originalPosition.x + offset.x * parallaxFactor * 40;
                layer.mesh.position.z = layer.originalPosition.z + offset.y * parallaxFactor * 25;
                layer.mesh.rotation.x = layer.originalRotation.x + offset.y * 0.1;
            } else if (layer.type === 'ceiling') {
                layer.mesh.position.x = layer.originalPosition.x + offset.x * parallaxFactor * 40;
                layer.mesh.position.z = layer.originalPosition.z - offset.y * parallaxFactor * 25;
                layer.mesh.rotation.x = layer.originalRotation.x - offset.y * 0.1;
            } else if (layer.type === 'left') {
                layer.mesh.position.z = layer.originalPosition.z + offset.x * parallaxFactor * 70;
                layer.mesh.position.y = layer.originalPosition.y - offset.y * parallaxFactor * 35;
                layer.mesh.position.x = layer.originalPosition.x - offset.x * 30;
            } else if (layer.type === 'right') {
                layer.mesh.position.z = layer.originalPosition.z - offset.x * parallaxFactor * 70;
                layer.mesh.position.y = layer.originalPosition.y - offset.y * parallaxFactor * 35;
                layer.mesh.position.x = layer.originalPosition.x + offset.x * 30;
            }
        });
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        // Calculate FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        const time = this.clock.getElapsedTime();

        // Grid animation
        this.gridLayers.forEach((layer, index) => {
            if (layer.material) {
                const baseOpacity = layer.type === 'back' ? 0.9 :
                                   layer.type === 'floor' ? 0.85 :
                                   layer.type === 'ceiling' ? 0.7 : 0.6;
                layer.material.opacity = baseOpacity + Math.sin(time * 0.3 + index) * 0.05;
            }
        });

        // Rotate particles
        const particles = this.scene.getObjectByName('particles');
        if (particles) {
            particles.rotation.y += 0.0005;
            particles.rotation.x = Math.sin(time * 0.2) * 0.05;
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Start animation
     */
    start() {
        if (!this.animationId) {
            this.animate();
            console.log('▶️ Animation started');
        }
    }

    /**
     * Stop animation
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log('⏸️ Animation stopped');
        }
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        const needsRecreate =
            newSettings.gridSize !== this.settings.gridSize ||
            newSettings.layerCount !== this.settings.layerCount;

        Object.assign(this.settings, newSettings);

        if (needsRecreate) {
            this.createGridLayers();
        }

        if (newSettings.performanceMode !== undefined) {
            this.renderer.setPixelRatio(newSettings.performanceMode ? 1 : window.devicePixelRatio);
        }
    }

    /**
     * Window resize handler
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Get FPS value
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stop();

        this.gridLayers.forEach(layer => {
            layer.geometry.dispose();
            layer.material.dispose();
        });

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);

        console.log('🗑️ Renderer disposed');
    }
}

