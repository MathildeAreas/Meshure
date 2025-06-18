export default class ObjectManager {
    constructor(app) {
this.app = app;
    }

    createPrimitive(type) {
let geometry, material, object;

switch(type) {
    case 'cube':
        geometry = new THREE.BoxGeometry();
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        object = new THREE.Mesh(geometry, material);
        break;
    case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        object = new THREE.Mesh(geometry, material);
        break;
    case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        object = new THREE.Mesh(geometry, material);
        break;
    case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        object = new THREE.Mesh(geometry, material);
        break;
    case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        object = new THREE.Mesh(geometry, material);
        break;
    case 'cone':
        geometry = new THREE.ConeGeometry(1, 2, 32);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        object = new THREE.Mesh(geometry, material);
        break;
    case 'light':
        object = new THREE.DirectionalLight(0xffffff, 0.5);
        object.position.set(Math.random() * 10 - 5, 5, Math.random() * 10 - 5);
        break;
    case 'camera':
        object = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        object.position.set(Math.random() * 10 - 5, 5, Math.random() * 10 - 5);
        break;
}

if (object && object.isMesh) {
    object.castShadow = true;
    object.receiveShadow = true;
    
    // Positionner près de l'objet sélectionné
    if (this.app.selectedObject && this.app.selectedObject.isMesh) {
        object.position.copy(this.app.selectedObject.position);
        object.position.x += 2;
    } else {
        object.position.set(
            Math.random() * 4 - 2, 
            0, 
            Math.random() * 4 - 2
        );
    }
}

return object;
    }

    duplicateSelected() {
if (!this.app.selectedObject || !this.app.selectedObject.isMesh) return;

const geometry = this.app.selectedObject.geometry.clone();
const material = this.app.selectedObject.userData.originalMaterial ? 
    this.app.selectedObject.userData.originalMaterial.clone() : 
    this.app.selectedObject.material.clone();

const newObject = new THREE.Mesh(geometry, material);
newObject.castShadow = true;
newObject.receiveShadow = true;

newObject.position.copy(this.app.selectedObject.position);
newObject.position.x += 1;
newObject.rotation.copy(this.app.selectedObject.rotation);
newObject.scale.copy(this.app.selectedObject.scale);

const objectName = 'copy_' + Date.now();
this.app.addObject(objectName, newObject);
this.app.selectObject(newObject);

console.log('Objet dupliqué:', objectName);
    }
}

/**
 * Gestionnaire de l'interface utilisateur
 */
