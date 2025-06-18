export default class CameraController {
    constructor() {
this.camera = null;
this.renderer = null;
this.isMouseDown = false;
this.mouseX = 0;
this.mouseY = 0;
this.cameraTarget = new THREE.Vector3(0, 0, 0);
this.cameraDistance = 8.66;
this.cameraTheta = Math.PI / 4;
this.cameraPhi = Math.PI / 4;
    }

    setCamera(camera) {
this.camera = camera;
    }

    setRenderer(renderer) {
this.renderer = renderer;
    }

    updatePosition() {
if (!this.camera) return;

const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
const y = this.cameraDistance * Math.cos(this.cameraPhi);
const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

this.camera.position.set(x, y, z);
this.camera.position.add(this.cameraTarget);
this.camera.lookAt(this.cameraTarget);
    }

    setupControls(viewport) {
viewport.addEventListener('mousedown', (e) => this.onMouseDown(e));
viewport.addEventListener('mousemove', (e) => this.onMouseMove(e));
viewport.addEventListener('mouseup', () => this.onMouseUp());
viewport.addEventListener('wheel', (e) => this.onWheel(e));
    }

    onMouseDown(event) {
// Géré par l'app principale pour la sélection
this.isMouseDown = true;
this.mouseX = event.clientX;
this.mouseY = event.clientY;
    }

    onMouseMove(event) {
if (!this.isMouseDown) return;

const deltaX = event.clientX - this.mouseX;
const deltaY = event.clientY - this.mouseY;

if (event.shiftKey) {
    // Pan
    const panSpeed = 0.01;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    
    this.camera.getWorldDirection(new THREE.Vector3());
    right.setFromMatrixColumn(this.camera.matrix, 0);
    up.setFromMatrixColumn(this.camera.matrix, 1);
    
    right.multiplyScalar(deltaX * panSpeed);
    up.multiplyScalar(-deltaY * panSpeed);
    
    this.cameraTarget.add(right);
    this.cameraTarget.add(up);
} else {
    // Rotation
    const rotateSpeed = 0.005;
    this.cameraTheta += deltaX * rotateSpeed;
    this.cameraPhi -= deltaY * rotateSpeed;
    this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));
}

this.updatePosition();
this.mouseX = event.clientX;
this.mouseY = event.clientY;
    }

    onMouseUp() {
this.isMouseDown = false;
    }

    onWheel(event) {
event.preventDefault();

const zoomFactor = 0.95;

if (event.deltaY > 0) {
    this.cameraDistance = this.cameraDistance / zoomFactor;
} else {
    this.cameraDistance = this.cameraDistance * zoomFactor;
    if (this.cameraDistance < 0.1) {
        this.cameraDistance = 0.1;
    }
}

console.log('🔍 Zoom - Distance:', this.cameraDistance.toFixed(1));
this.updatePosition();
    }
}

/**
 * Gestionnaire des transformations
 */
