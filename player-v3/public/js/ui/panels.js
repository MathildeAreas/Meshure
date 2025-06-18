export default class UIManager {
    constructor(app) {
this.app = app;
    }

    setupEventListeners() {
// Contrôles de rendu
document.getElementById('wireframe-btn').addEventListener('click', () => this.setRenderMode('wireframe'));
document.getElementById('solid-btn').addEventListener('click', () => this.setRenderMode('solid'));
document.getElementById('material-preview-btn').addEventListener('click', () => this.setRenderMode('material'));
document.getElementById('rendered-btn').addEventListener('click', () => this.setRenderMode('rendered'));

// Menu ajouter
document.getElementById('add-btn').addEventListener('click', (e) => this.showAddMenu(e));

// Boutons du menu d'ajout
document.querySelectorAll('.add-menu button').forEach(button => {
    button.addEventListener('click', () => {
        const type = button.dataset.type;
        this.addPrimitive(type);
        this.hideAddMenu();
    });
});

// Propriétés
['pos-x', 'pos-y', 'pos-z', 'rot-x', 'rot-y', 'rot-z', 'scale-x', 'scale-y', 'scale-z'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => this.updateObjectTransform());
});

// Sélection par clic
document.querySelector('.viewport').addEventListener('mousedown', (e) => this.handleViewportClick(e));

// Fermer menus en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('#add-btn') && !e.target.closest('#add-menu')) {
        this.hideAddMenu();
    }
});
    }

    handleViewportClick(event) {
const startX = event.clientX;
const startY = event.clientY;

const onMouseUp = (upEvent) => {
    const deltaX = Math.abs(upEvent.clientX - startX);
    const deltaY = Math.abs(upEvent.clientY - startY);
    
    if (deltaX < 3 && deltaY < 3) {
        const hitObject = this.app.getObjectByRaycast(upEvent);
        this.app.selectObject(hitObject);
    }
    
    document.removeEventListener('mouseup', onMouseUp);
};

document.addEventListener('mouseup', onMouseUp);
    }

    addObjectToList(name, object) {
const objectList = document.getElementById('object-list');
const listItem = document.createElement('li');
listItem.className = 'object-item';
listItem.dataset.object = name;

const displayName = this.getDisplayName(name, object);

listItem.innerHTML = `
    <div class="object-icon"></div>
    <span>${displayName}</span>
    <button class="delete-btn" title="Supprimer">×</button>
`;

// Event listeners
listItem.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        this.deleteObject(name);
        return;
    }
    this.app.selectObject(this.app.objects[name]);
});

const deleteBtn = listItem.querySelector('.delete-btn');
deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    this.deleteObject(name);
});

objectList.appendChild(listItem);
    }

    removeObjectFromList(name) {
const listItem = document.querySelector(`[data-object="${name}"]`);
if (listItem) {
    listItem.remove();
}
    }

    getDisplayName(name, object) {
if (name.includes('_')) {
    const parts = name.split('_');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}
return name.charAt(0).toUpperCase() + name.slice(1);
    }

    updateObjectSelection(object) {
document.querySelectorAll('.object-item').forEach(item => {
    item.classList.remove('selected');
    const objectName = item.dataset.object;
    if (this.app.objects[objectName] === object) {
        item.classList.add('selected');
    }
});
    }

    updatePropertiesPanel() {
const obj = this.app.selectedObject;

if (!obj || !obj.position) {
    this.resetPropertiesPanel();
    return;
}

document.getElementById('pos-x').value = obj.position.x.toFixed(2);
document.getElementById('pos-y').value = obj.position.y.toFixed(2);
document.getElementById('pos-z').value = obj.position.z.toFixed(2);

document.getElementById('rot-x').value = obj.rotation.x.toFixed(2);
document.getElementById('rot-y').value = obj.rotation.y.toFixed(2);
document.getElementById('rot-z').value = obj.rotation.z.toFixed(2);

document.getElementById('scale-x').value = obj.scale.x.toFixed(2);
document.getElementById('scale-y').value = obj.scale.y.toFixed(2);
document.getElementById('scale-z').value = obj.scale.z.toFixed(2);
    }

    resetPropertiesPanel() {
['pos-x', 'pos-y', 'pos-z'].forEach(id => document.getElementById(id).value = '0');
['rot-x', 'rot-y', 'rot-z'].forEach(id => document.getElementById(id).value = '0');
['scale-x', 'scale-y', 'scale-z'].forEach(id => document.getElementById(id).value = '1');
    }

    updateObjectTransform() {
const obj = this.app.selectedObject;
if (!obj || !obj.position) return;

obj.position.set(
    parseFloat(document.getElementById('pos-x').value),
    parseFloat(document.getElementById('pos-y').value),
    parseFloat(document.getElementById('pos-z').value)
);

obj.rotation.set(
    parseFloat(document.getElementById('rot-x').value),
    parseFloat(document.getElementById('rot-y').value),
    parseFloat(document.getElementById('rot-z').value)
);

obj.scale.set(
    parseFloat(document.getElementById('scale-x').value),
    parseFloat(document.getElementById('scale-y').value),
    parseFloat(document.getElementById('scale-z').value)
);
    }

    setRenderMode(mode) {
document.querySelectorAll('.viewport-controls button').forEach(btn => btn.classList.remove('active'));

switch(mode) {
    case 'wireframe':
        document.getElementById('wireframe-btn').classList.add('active');
        this.app.scene.traverse(child => {
            if (child.material) child.material.wireframe = true;
        });
        break;
    case 'solid':
        document.getElementById('solid-btn').classList.add('active');
        this.app.scene.traverse(child => {
            if (child.material) child.material.wireframe = false;
        });
        break;
    case 'material':
        document.getElementById('material-preview-btn').classList.add('active');
        break;
    case 'rendered':
        document.getElementById('rendered-btn').classList.add('active');
        break;
}
    }

    showAddMenu(event) {
const menu = document.getElementById('add-menu');
if (event) {
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
} else {
    const viewport = document.querySelector('.viewport');
    const rect = viewport.getBoundingClientRect();
    menu.style.left = (rect.left + rect.width / 2 - 60) + 'px';
    menu.style.top = (rect.top + rect.height / 2 - 100) + 'px';
}
menu.style.display = 'block';
    }

    hideAddMenu() {
document.getElementById('add-menu').style.display = 'none';
    }

    addPrimitive(type) {
const object = this.app.objectManager.createPrimitive(type);
if (object) {
    const objectName = type + '_' + Date.now();
    this.app.addObject(objectName, object);
    this.app.selectObject(object);
    console.log('Objet ajouté:', type, objectName);
}
    }

    deleteObject(name) {
console.log('=== SUPPRESSION ===');
console.log('Objet à supprimer:', name);

if (this.app.removeObject(name)) {
    console.log('✅ Suppression réussie');
} else {
    console.log('❌ Échec de la suppression');
}
    }

    deleteSelectedObject() {
if (!this.app.selectedObject) return;

// Trouver le nom de l'objet sélectionné
for (const [name, obj] of Object.entries(this.app.objects)) {
    if (obj === this.app.selectedObject) {
        this.deleteObject(name);
        return;
    }
}
    }

    updateStats() {
let vertCount = 0, faceCount = 0;

this.app.scene.traverse(child => {
    if (child.geometry) {
        if (child.geometry.attributes && child.geometry.attributes.position) {
            vertCount += child.geometry.attributes.position.count;
        }
        if (child.geometry.index) {
            faceCount += child.geometry.index.count / 3;
        }
    }
});

document.getElementById('vert-count').textContent = vertCount;
document.getElementById('face-count').textContent = Math.floor(faceCount);
document.getElementById('object-count').textContent = Object.keys(this.app.objects).length;
    }
}

/**
 * Gestionnaire d'import de fichiers
 */
