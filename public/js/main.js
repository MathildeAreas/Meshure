// main.js - Point d'entrée de l'application 3D
class BlenderWebApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.objects = [];
        this.measurements = [];
        this.measurementMode = false;
        this.selectedPoints = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.stats = null;
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLights();
        this.setupEventListeners();
        this.setupStats();
        this.addDefaultObjects();
        this.animate();
        
        console.log('🎯 Blender Web App initialisée !');
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2b2b2b);
        
        // Grille de référence
        const gridHelper = new THREE.GridHelper(20, 20, 0x404040, 0x404040);
        this.scene.add(gridHelper);
        
        // Axes de référence
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }

    setupCamera() {
        const container = document.getElementById('canvas-container');
        const aspect = container.clientWidth / container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        const container = document.getElementById('canvas-container');
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        // Contrôles de caméra (version simplifiée)
        const canvas = this.renderer.domElement;
        let isMouseDown = false;
        let mouseDownPosition = { x: 0, y: 0 };
        let cameraTarget = new THREE.Vector3(0, 0, 0);
        
        canvas.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseDownPosition.x = event.clientX;
            mouseDownPosition.y = event.clientY;
        });
        
        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (isMouseDown && !this.measurementMode) {
                const deltaX = event.clientX - mouseDownPosition.x;
                const deltaY = event.clientY - mouseDownPosition.y;
                
                // Rotation de la caméra
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position.clone().sub(cameraTarget));
                spherical.theta -= deltaX * 0.01;
                spherical.phi += deltaY * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                this.camera.position.copy(cameraTarget).add(new THREE.Vector3().setFromSpherical(spherical));
                this.camera.lookAt(cameraTarget);
                
                mouseDownPosition.x = event.clientX;
                mouseDownPosition.y = event.clientY;
            }
        });
        
        // Zoom avec la molette
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            const direction = new THREE.Vector3().subVectors(this.camera.position, cameraTarget).normalize();
            const distance = this.camera.position.distanceTo(cameraTarget);
            const zoomSpeed = Math.max(distance * 0.1, 0.1);
            
            if (event.deltaY > 0) {
                this.camera.position.add(direction.multiplyScalar(zoomSpeed));
            } else {
                this.camera.position.sub(direction.multiplyScalar(zoomSpeed));
            }
        });
    }

    setupLights() {
        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Lumière directionnelle
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Lumière ponctuelle
        const pointLight = new THREE.PointLight(0x4a9eff, 0.3, 100);
        pointLight.position.set(-5, 5, -5);
        this.scene.add(pointLight);
    }

    setupEventListeners() {
        // Boutons de l'interface
        document.getElementById('btn-add-cube').addEventListener('click', () => this.addCube());
        document.getElementById('btn-add-sphere').addEventListener('click', () => this.addSphere());
        document.getElementById('btn-measure').addEventListener('click', () => this.toggleMeasurementMode());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetScene());
        
        // Mode de mesure
        this.renderer.domElement.addEventListener('click', (event) => this.onCanvasClick(event));
        
        // Modale de mesure
        document.getElementById('save-measurement').addEventListener('click', () => this.saveMeasurement());
        document.getElementById('cancel-measurement').addEventListener('click', () => this.cancelMeasurement());
        
        // Redimensionnement
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Sélecteur de mode
        document.getElementById('mode-select').addEventListener('change', (event) => {
            const mode = event.target.value;
            if (mode === 'measure') {
                this.enableMeasurementMode();
            } else {
                this.disableMeasurementMode();
            }
        });
    }

    setupStats() {
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        document.body.appendChild(this.stats.dom);
        this.stats.dom.style.position = 'absolute';
        this.stats.dom.style.top = '70px';
        this.stats.dom.style.left = '10px';
    }

    addDefaultObjects() {
        // Ajouter un cube par défaut
        this.addCube();
        
        // Ajouter une sphère par défaut
        const sphere = this.addSphere();
        sphere.position.set(3, 0, 0);
        
        this.updateObjectsList();
    }

    addCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0x4a9eff });
        const cube = new THREE.Mesh(geometry, material);
        
        cube.position.set(
            (Math.random() - 0.5) * 10,
            1,
            (Math.random() - 0.5) * 10
        );
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.userData = { type: 'cube', name: `Cube_${this.objects.length + 1}` };
        
        this.scene.add(cube);
        this.objects.push(cube);
        this.updateObjectsList();
        
        return cube;
    }

    addSphere() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshLambertMaterial({ color: 0xff6b4a });
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.set(
            (Math.random() - 0.5) * 10,
            1,
            (Math.random() - 0.5) * 10
        );
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.userData = { type: 'sphere', name: `Sphère_${this.objects.length + 1}` };
        
        this.scene.add(sphere);
        this.objects.push(sphere);
        this.updateObjectsList();
        
        return sphere;
    }

    toggleMeasurementMode() {
        this.measurementMode = !this.measurementMode;
        const btn = document.getElementById('btn-measure');
        
        if (this.measurementMode) {
            btn.classList.add('active');
            btn.textContent = '📏 Mode Mesure (ON)';
            document.getElementById('mode-select').value = 'measure';
        } else {
            btn.classList.remove('active');
            btn.textContent = '📏 Mesurer';
            document.getElementById('mode-select').value = 'view';
            this.selectedPoints = [];
        }
    }

    enableMeasurementMode() {
        this.measurementMode = true;
        document.getElementById('btn-measure').classList.add('active');
    }

    disableMeasurementMode() {
        this.measurementMode = false;
        document.getElementById('btn-measure').classList.remove('active');
        this.selectedPoints = [];
    }

    onCanvasClick(event) {
        if (!this.measurementMode) return;
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.selectedPoints.push(point);
            
            // Ajouter un marqueur visuel
            this.addPointMarker(point);
            
            if (this.selectedPoints.length === 2) {
                this.calculateDistance();
            }
        }
    }

    addPointMarker(point) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(point);
        marker.userData = { isMarker: true };
        this.scene.add(marker);
    }

    calculateDistance() {
        const [pointA, pointB] = this.selectedPoints;
        const distance = pointA.distanceTo(pointB);
        
        // Afficher la modale avec les résultats
        document.getElementById('distance-value').textContent = distance.toFixed(3);
        document.getElementById('point-a-coords').textContent = 
            `(${pointA.x.toFixed(2)}, ${pointA.y.toFixed(2)}, ${pointA.z.toFixed(2)})`;
        document.getElementById('point-b-coords').textContent = 
            `(${pointB.x.toFixed(2)}, ${pointB.y.toFixed(2)}, ${pointB.z.toFixed(2)})`;
        
        document.getElementById('measurement-modal').classList.remove('hidden');
    }

    saveMeasurement() {
        const distance = document.getElementById('distance-value').textContent;
        const pointA = this.selectedPoints[0];
        const pointB = this.selectedPoints[1];
        
        const measurement = {
            id: Date.now(),
            distance: parseFloat(distance),
            pointA: { x: pointA.x, y: pointA.y, z: pointA.z },
            pointB: { x: pointB.x, y: pointB.y, z: pointB.z },
            timestamp: new Date().toLocaleString()
        };
        
        this.measurements.push(measurement);
        this.updateMeasurementsList();
        this.closeMeasurementModal();
        
        // Envoyer au serveur
        this.sendMeasurementToServer(measurement);
    }

    async sendMeasurementToServer(measurement) {
        try {
            const response = await fetch('/api/measurements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(measurement)
            });
            
            if (response.ok) {
                console.log('✅ Mesure sauvegardée sur le serveur');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    cancelMeasurement() {
        this.closeMeasurementModal();
    }

    closeMeasurementModal() {
        document.getElementById('measurement-modal').classList.add('hidden');
        this.selectedPoints = [];
        
        // Supprimer les marqueurs
        const markers = this.scene.children.filter(obj => obj.userData.isMarker);
        markers.forEach(marker => this.scene.remove(marker));
    }

    updateMeasurementsList() {
        const container = document.getElementById('measurements-list');
        
        if (this.measurements.length === 0) {
            container.innerHTML = '<p class="placeholder">Cliquez sur deux points pour mesurer la distance</p>';
            return;
        }
        
        container.innerHTML = this.measurements.map(m => `
            <div class="measurement-item">
                <div class="measurement-distance">${m.distance.toFixed(3)} unités</div>
                <div style="font-size: 10px; color: #888;">${m.timestamp}</div>
            </div>
        `).join('');
    }

    updateObjectsList() {
        const container = document.getElementById('objects-list');
        
        container.innerHTML = this.objects.map((obj, index) => `
            <div class="object-item">
                <span class="object-name">${obj.userData.name}</span>
                <div class="object-actions">
                    <button onclick="app.deleteObject(${index})">🗑️</button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('object-count').textContent = `Objets: ${this.objects.length}`;
    }

    deleteObject(index) {
        const object = this.objects[index];
        this.scene.remove(object);
        this.objects.splice(index, 1);
        this.updateObjectsList();
    }

    resetScene() {
        // Supprimer tous les objets
        this.objects.forEach(obj => this.scene.remove(obj));
        this.objects = [];
        
        // Supprimer toutes les mesures
        this.measurements = [];
        
        // Supprimer les marqueurs
        const markers = this.scene.children.filter(obj => obj.userData.isMarker);
        markers.forEach(marker => this.scene.remove(marker));
        
        // Réinitialiser l'interface
        this.updateObjectsList();
        this.updateMeasurementsList();
        this.disableMeasurementMode();
        
        // Remettre des objets par défaut
        this.addDefaultObjects();
    }

    onWindowResize() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.stats.begin();
        
        // Rotation automatique des objets (optionnel)
        this.objects.forEach(obj => {
            obj.rotation.y += 0.005;
        });
        
        // Mise à jour de la position du curseur
        const camera = this.camera;
        document.getElementById('cursor-position').textContent = 
            `Position: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`;
        
        // Mise à jour des FPS
        document.getElementById('fps-counter').textContent = `FPS: ${Math.round(1000 / this.stats.dom.children[0].textContent)}`;
        
        this.renderer.render(this.scene, this.camera);
        
        this.stats.end();
    }
}

// Initialisation de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BlenderWebApp();
});