export default class TransformManager {
    constructor() {
this.app = null;
this.mode = 'none';
this.axis = 'none';
this.isTransforming = false;
this.startPosition = new THREE.Vector3();
this.startRotation = new THREE.Euler();
this.startScale = new THREE.Vector3();
this.startMouse = { x: 0, y: 0 };
    }

    setApp(app) {
this.app = app;
    }

    setupEventListeners() {
document.addEventListener('keydown', (e) => this.onKeyDown(e));
document.addEventListener('keyup', (e) => this.onKeyUp(e));
document.addEventListener('mousemove', (e) => this.onMouseMove(e));
document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onKeyDown(event) {
const key = event.key.toLowerCase();

if (key === 'delete' || key === 'backspace') {
    this.app.uiManager.deleteSelectedObject();
    return;
}

if (event.shiftKey && key === 'd') {
    this.app.objectManager.duplicateSelected();
    return;
}

if (event.shiftKey && key === 'a') {
    this.app.uiManager.showAddMenu();
    return;
}

if (!this.app.selectedObject) return;

if (key === 'escape') {
    this.cancelTransform();
    return;
}

if (key === 'enter' && this.isTransforming) {
    this.confirmTransform();
    return;
}

if (!this.isTransforming) {
    switch(key) {
        case 'g': this.startTransform('grab'); break;
        case 'r': this.startTransform('rotate'); break;
        case 's': this.startTransform('scale'); break;
    }
}

if (this.isTransforming) {
    switch(key) {
        case 'x': this.setAxis('x'); break;
        case 'y': this.setAxis('y'); break;
        case 'z': this.setAxis('z'); break;
    }
}
    }

    onKeyUp(event) {
// Gérer les relâchements de touches si nécessaire
    }

    onMouseMove(event) {
if (!this.isTransforming || !this.app.selectedObject) return;

this.handleTransformMove(event);
    }

    onMouseUp(event) {
if (this.isTransforming) {
    this.confirmTransform();
}
    }

    startTransform(mode) {
if (!this.app.selectedObject) return;

console.log('🔧 Début transformation:', mode);

this.mode = mode;
this.axis = 'none';
this.isTransforming = true;

// Sauvegarder les valeurs initiales
this.startPosition.copy(this.app.selectedObject.position);
this.startRotation.copy(this.app.selectedObject.rotation);
this.startScale.copy(this.app.selectedObject.scale);

// Position initiale de la souris
this.startMouse = { 
    x: this.app.cameraController.mouseX, 
    y: this.app.cameraController.mouseY 
};

console.log('Start mouse:', this.startMouse);
console.log('Start position:', this.startPosition);

this.updateIndicator();
    }

    setAxis(axis) {
if (!this.isTransforming) return;
this.axis = axis;
console.log('🎯 Axe contraint:', axis);
this.updateIndicator();
    }

    handleTransformMove(event) {
if (!this.isTransforming || !this.app.selectedObject) return;

// Calculer les deltas de souris
const currentMouseX = event.clientX;
const currentMouseY = event.clientY;

const deltaX = currentMouseX - this.startMouse.x;
const deltaY = currentMouseY - this.startMouse.y;

console.log('Delta X:', deltaX, 'Delta Y:', deltaY);

const sensitivity = 0.01;

switch(this.mode) {
    case 'grab':
        this.handleGrabTransform(deltaX, deltaY, sensitivity);
        break;
    case 'rotate':
        this.handleRotateTransform(deltaX, deltaY, sensitivity);
        break;
    case 'scale':
        this.handleScaleTransform(deltaX, deltaY, sensitivity);
        break;
}

this.app.uiManager.updatePropertiesPanel();
    }

    handleGrabTransform(deltaX, deltaY, sensitivity) {
// Restaurer la position initiale
this.app.selectedObject.position.copy(this.startPosition);

const movement = deltaX * sensitivity;

switch(this.axis) {
    case 'x':
        this.app.selectedObject.position.x += movement;
        console.log('Déplacement X:', movement);
        break;
    case 'y':
        this.app.selectedObject.position.y += movement;
        console.log('Déplacement Y:', movement);
        break;
    case 'z':
        this.app.selectedObject.position.z += movement;
        console.log('Déplacement Z:', movement);
        break;
    default:
        // Mouvement libre dans le plan de la caméra
        this.app.selectedObject.position.x += deltaX * sensitivity;
        this.app.selectedObject.position.y -= deltaY * sensitivity;
        console.log('Déplacement libre X:', deltaX * sensitivity, 'Y:', -deltaY * sensitivity);
        break;
}
    }

    handleRotateTransform(deltaX, deltaY, sensitivity) {
// Restaurer la rotation initiale
this.app.selectedObject.rotation.copy(this.startRotation);

const rotation = deltaX * sensitivity;

switch(this.axis) {
    case 'x':
        this.app.selectedObject.rotation.x += rotation;
        console.log('Rotation X:', rotation);
        break;
    case 'y':
        this.app.selectedObject.rotation.y += rotation;
        console.log('Rotation Y:', rotation);
        break;
    case 'z':
        this.app.selectedObject.rotation.z += rotation;
        console.log('Rotation Z:', rotation);
        break;
    default:
        // Rotation libre
        this.app.selectedObject.rotation.y += deltaX * sensitivity;
        this.app.selectedObject.rotation.x += deltaY * sensitivity;
        console.log('Rotation libre Y:', deltaX * sensitivity, 'X:', deltaY * sensitivity);
        break;
}
    }

    handleScaleTransform(deltaX, deltaY, sensitivity) {
// Restaurer l'échelle initiale
this.app.selectedObject.scale.copy(this.startScale);

const scaleMultiplier = 1 + (deltaX * sensitivity);

switch(this.axis) {
    case 'x':
        this.app.selectedObject.scale.x = this.startScale.x * scaleMultiplier;
        console.log('Échelle X:', scaleMultiplier);
        break;
    case 'y':
        this.app.selectedObject.scale.y = this.startScale.y * scaleMultiplier;
        console.log('Échelle Y:', scaleMultiplier);
        break;
    case 'z':
        this.app.selectedObject.scale.z = this.startScale.z * scaleMultiplier;
        console.log('Échelle Z:', scaleMultiplier);
        break;
    default:
        // Échelle uniforme
        this.app.selectedObject.scale.set(
            this.startScale.x * scaleMultiplier,
            this.startScale.y * scaleMultiplier,
            this.startScale.z * scaleMultiplier
        );
        console.log('Échelle uniforme:', scaleMultiplier);
        break;
}
    }

    confirmTransform() {
console.log('✅ Transformation confirmée');
this.isTransforming = false;
this.mode = 'none';
this.axis = 'none';
this.updateIndicator();
    }

    cancelTransform() {
if (!this.isTransforming || !this.app.selectedObject) return;

console.log('❌ Transformation annulée');

// Restaurer les valeurs initiales
this.app.selectedObject.position.copy(this.startPosition);
this.app.selectedObject.rotation.copy(this.startRotation);
this.app.selectedObject.scale.copy(this.startScale);

this.isTransforming = false;
this.mode = 'none';
this.axis = 'none';

this.updateIndicator();
this.app.uiManager.updatePropertiesPanel();
    }

    updateIndicator() {
const indicator = document.getElementById('transform-indicator');
const modeSpan = document.getElementById('transform-mode');
const axisSpan = document.getElementById('axis-indicator');

if (this.isTransforming) {
    indicator.classList.add('active');
    
    let modeText = '';
    switch(this.mode) {
        case 'grab': modeText = 'Déplacement'; break;
        case 'rotate': modeText = 'Rotation'; break;
        case 'scale': modeText = 'Échelle'; break;
    }
    
    modeSpan.textContent = modeText;
    axisSpan.textContent = this.axis !== 'none' ? ` - Axe ${this.axis.toUpperCase()}` : '';
} else {
    indicator.classList.remove('active');
}
    }
}

/**
 * Gestionnaire des objets 3D
 */
