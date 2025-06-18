export default class ImportManager {
    constructor(app) {
        this.app = app;
    }

    setupEventListeners() {
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileImport(e));
    }

    handleFileImport(event) {
        const files = event.target.files;
        
        for (let file of files) {
            const fileName = file.name.toLowerCase();
            const reader = new FileReader();
            
            if (fileName.endsWith('.glb') || fileName.endsWith('.stl')) {
                reader.onload = (e) => {
                    const arrayBuffer = e.target.result;
                    if (fileName.endsWith('.glb')) {
                        this.loadGLBFile(arrayBuffer, file.name);
                    } else if (fileName.endsWith('.stl')) {
                        this.loadSTLFile(arrayBuffer, file.name);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                reader.onload = (e) => {
                    const content = e.target.result;
                    if (fileName.endsWith('.obj')) {
                        this.loadOBJFile(content, file.name);
                    } else if (fileName.endsWith('.json')) {
                        this.loadJSONFile(content, file.name);
                    } else {
                        alert('Format non supporté. Utilisez OBJ, JSON, GLB ou STL.');
                    }
                };
                reader.readAsText(file);
            }
        }
        
        event.target.value = '';
    }

    centerObject(object) {
        try {
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);
        } catch (error) {
            console.warn('Impossible de centrer l\'objet:', error);
        }
    }

    loadOBJFile(content, fileName) {
        try {
            const lines = content.split('\n');
            const vertices = [];
            const faces = [];
            
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith('v ')) {
                    const coords = line.split(' ').slice(1).map(parseFloat);
                    vertices.push(coords[0], coords[1], coords[2]);
                } else if (line.startsWith('f ')) {
                    const indices = line.split(' ').slice(1);
                    for (let i = 1; i < indices.length - 1; i++) {
                        faces.push(
                            parseInt(indices[0].split('/')[0]) - 1,
                            parseInt(indices[i].split('/')[0]) - 1,
                            parseInt(indices[i + 1].split('/')[0]) - 1
                        );
                    }
                }
            }
            
            if (vertices.length === 0) {
                alert('Aucun vertex trouvé dans le fichier OBJ');
                return;
            }
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            
            if (faces.length > 0) {
                geometry.setIndex(faces);
            }
            
            geometry.computeVertexNormals();
            
            const material = new THREE.MeshLambertMaterial({ 
                color: Math.random() * 0xffffff,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.centerObject(mesh);
            
            const objectName = 'obj_' + Date.now();
            this.app.addObject(objectName, mesh);
            this.app.selectObject(mesh);
            
            console.log('Fichier OBJ importé:', fileName);
            
        } catch (error) {
            console.error('Erreur lors de l\'import OBJ:', error);
            alert('Erreur lors de l\'import du fichier OBJ.');
        }
    }

    loadSTLFile(arrayBuffer, fileName) {
        try {
            const view = new DataView(arrayBuffer);
            let offset = 80;
            
            const triangleCount = view.getUint32(offset, true);
            offset += 4;
            
            const vertices = [];
            const normals = [];
            
            for (let i = 0; i < triangleCount; i++) {
                const nx = view.getFloat32(offset, true); offset += 4;
                const ny = view.getFloat32(offset, true); offset += 4;
                const nz = view.getFloat32(offset, true); offset += 4;
                
                for (let j = 0; j < 3; j++) {
                    const x = view.getFloat32(offset, true); offset += 4;
                    const y = view.getFloat32(offset, true); offset += 4;
                    const z = view.getFloat32(offset, true); offset += 4;
                    
                    vertices.push(x, y, z);
                    normals.push(nx, ny, nz);
                }
                
                offset += 2;
            }
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            
            const material = new THREE.MeshLambertMaterial({ 
                color: Math.random() * 0xffffff,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.centerObject(mesh);
            
            const objectName = 'stl_' + Date.now();
            this.app.addObject(objectName, mesh);
            this.app.selectObject(mesh);
            
            console.log('Fichier STL importé:', fileName, `${triangleCount} triangles`);
            
        } catch (error) {
            console.error('Erreur lors de l\'import STL:', error);
            alert('Erreur lors de l\'import du fichier STL');
        }
    }

    loadJSONFile(content, fileName) {
        try {
            const json = JSON.parse(content);
            
            if (json.geometries || json.geometry) {
                const loader = new THREE.ObjectLoader();
                const object = loader.parse(json);
                
                this.centerObject(object);
                
                const objectName = 'json_' + Date.now();
                this.app.addObject(objectName, object);
                this.app.selectObject(object);
                
                console.log('Fichier JSON importé:', fileName);
            } else {
                alert('Format JSON non reconnu');
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'import JSON:', error);
            alert('Erreur lors de l\'import du fichier JSON');
        }
    }

    loadGLBFile(arrayBuffer, fileName) {
        try {
            const view = new DataView(arrayBuffer);
            const magic = view.getUint32(0, true);
            if (magic !== 0x46546C67) {
                throw new Error('Fichier GLB invalide');
            }
            
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshLambertMaterial({ 
                color: 0x00ff00,
                wireframe: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.centerObject(mesh);
            
            const objectName = 'glb_' + Date.now();
            this.app.addObject(objectName, mesh);
            
            console.log('Fichier GLB importé (placeholder):', fileName);
            alert('GLB importé comme cube placeholder.');
            
        } catch (error) {
            console.error('Erreur lors de l\'import GLB:', error);
            alert('Erreur lors de l\'import du fichier GLB');
        }
    }
}
