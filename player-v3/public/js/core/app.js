import CameraController from "./camera.js";
import TransformManager from "../tools/transform-manager.js";
import ObjectManager from "../objects/mesh.js";
import UIManager from "../ui/panels.js";
import ImportManager from "../tools/import-manager.js";
/**
 * Classe principale de l'application Blender Clone
 */
export default class BlenderCloneApp {
    constructor() {
// Propriétés de la scène 3D
this.scene = null;
this.camera = null;
this.renderer = null;
this.raycaster = new THREE.Raycaster();
this.mouse = new THREE.Vector2();

// Gestion des objets
this.objects = {};
this.selectedObject = null;

// Contrôles caméra
this.cameraController = new CameraController();

// Gestionnaire de transformations
this.transformManager = new TransformManager();

// Gestionnaire d'objets
this.objectManager = new ObjectManager(this);

// Gestionnaire d'interface
this.uiManager = new UIManager(this);

// Gestionnaire d'import
this.importManager = new ImportManager(this);

this.init();
    }

    init() {
console.log('🚀 Initialisation de Blender Clone App');

const canvas = document.getElementById('viewport-canvas');
const viewport = document.querySelector('.viewport');

// Initialiser la scène Three.js
this.scene = new THREE.Scene();
this.scene.background = new THREE.Color(0x2a2a2a);

// Caméra
this.camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
this.cameraController.setCamera(this.camera);
this.cameraController.updatePosition();

// Renderer
this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
this.renderer.shadowMap.enabled = true;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Éclairage
this.setupLighting();

// Helpers
this.setupHelpers();

// Objets par défaut
this.createDefaultObjects();

// Gestionnaires
this.transformManager.setApp(this);
this.cameraController.setRenderer(this.renderer);

// Event listeners
this.setupEventListeners();

// Démarrer le rendu
this.animate();

console.log('✅ Application initialisée avec succès');
    }

    setupLighting() {
// Lumière ambiante
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
this.scene.add(ambientLight);

// Lumière directionnelle
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
this.scene.add(directionalLight);
this.objects['light'] = directionalLight;
    }

    setupHelpers() {
// Grille
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
this.scene.add(gridHelper);

// Repère XYZ
const axisHelper = this.createAxisHelper();
this.scene.add(axisHelper);
    }

    createAxisHelper() {
const axisGroup = new THREE.Group();
axisGroup.name = 'axisHelper';

const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
const lineGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);

// Axe X (Rouge)
const xLine = new THREE.Mesh(lineGeometry, redMaterial);
xLine.rotation.z = -Math.PI / 2;
xLine.position.x = 1;

const xArrow = new THREE.Mesh(arrowGeometry, redMaterial);
xArrow.rotation.z = -Math.PI / 2;
xArrow.position.x = 2.15;

// Axe Y (Vert)
const yLine = new THREE.Mesh(lineGeometry, greenMaterial);
yLine.position.y = 1;

const yArrow = new THREE.Mesh(arrowGeometry, greenMaterial);
yArrow.position.y = 2.15;

// Axe Z (Bleu)
const zLine = new THREE.Mesh(lineGeometry, blueMaterial);
zLine.rotation.x = Math.PI / 2;
zLine.position.z = 1;

const zArrow = new THREE.Mesh(arrowGeometry, blueMaterial);
zArrow.rotation.x = Math.PI / 2;
zArrow.position.z = 2.15;

axisGroup.add(xLine, xArrow, yLine, yArrow, zLine, zArrow);

return axisGroup;
    }

    createDefaultObjects() {
// Cube par défaut
const cube = this.objectManager.createPrimitive('cube');
cube.material.color.setHex(0x00ff88);
this.addObject('cube', cube);
this.selectObject(cube);

// Caméra par défaut
const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
cam.position.set(0, 0, 5);
this.addObject('camera', cam);
    }

    addObject(name, object) {
this.objects[name] = object;
this.scene.add(object);
this.uiManager.addObjectToList(name, object);
this.uiManager.updateStats();
    }

    removeObject(name) {
const object = this.objects[name];
if (!object) return false;

if (this.selectedObject === object) {
    this.selectObject(null);
}

this.scene.remove(object);
delete this.objects[name];
this.uiManager.removeObjectFromList(name);
this.uiManager.updateStats();

return true;
    }

    selectObject(object) {
// Désélectionner l'objet précédent
if (this.selectedObject) {
    this.clearObjectSelection(this.selectedObject);
}

this.selectedObject = object;

// Sélectionner le nouvel objet
if (object && object.isMesh) {
    this.highlightObject(object);
}

this.uiManager.updateObjectSelection(object);
this.uiManager.updatePropertiesPanel();
    }

    clearObjectSelection(object) {
if (object.userData && object.userData.originalMaterial) {
    object.material = object.userData.originalMaterial;
    delete object.userData.originalMaterial;
}

if (object.userData && object.userData.selectionBox) {
    this.scene.remove(object.userData.selectionBox);
    delete object.userData.selectionBox;
}
    }

    highlightObject(object) {
// Sauvegarder le matériau original
if (!object.userData.originalMaterial) {
    object.userData.originalMaterial = object.material;
}

// Créer un matériau de sélection
const selectionMaterial = object.userData.originalMaterial.clone();
selectionMaterial.emissive = new THREE.Color(0x666666);
selectionMaterial.emissiveIntensity = 0.4;
object.material = selectionMaterial;

// Ajouter un contour de sélection
const box = new THREE.Box3().setFromObject(object);
const boxHelper = new THREE.Box3Helper(box, 0xffff00);
boxHelper.material.opacity = 0.3;
boxHelper.material.transparent = true;
this.scene.add(boxHelper);
object.userData.selectionBox = boxHelper;
    }

    getObjectByRaycast(event) {
const rect = this.renderer.domElement.getBoundingClientRect();
this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

this.raycaster.setFromCamera(this.mouse, this.camera);

const selectableObjects = [];
this.scene.traverse(child => {
    if (child.isMesh && 
        child.name !== 'axisHelper' && 
        child.type !== 'GridHelper' &&
        child.type !== 'Box3Helper' &&
        (!child.parent || (child.parent.name !== 'axisHelper' && child.parent.type !== 'Box3Helper'))) {
        selectableObjects.push(child);
    }
});

const intersects = this.raycaster.intersectObjects(selectableObjects);
return intersects.length > 0 ? intersects[0].object : null;
    }

    setupEventListeners() {
// Redimensionnement
window.addEventListener('resize', () => this.onWindowResize());

// Contrôles de viewport
this.cameraController.setupControls(document.querySelector('.viewport'));

// Gestionnaires spécialisés
this.transformManager.setupEventListeners();
this.uiManager.setupEventListeners();
this.importManager.setupEventListeners();
    }

    onWindowResize() {
const viewport = document.querySelector('.viewport');
this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
this.camera.updateProjectionMatrix();
this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }

    animate() {
requestAnimationFrame(() => this.animate());
this.renderer.render(this.scene, this.camera);
    }
}

/**
 * Gestionnaire des contrôles de caméra
 */
