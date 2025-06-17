// Classe pour gérer le dé Three.js
class Dice {
    constructor() {
        // Variables pour chaque face du dé
        this.faceValues = {
            face1: 1,
            face2: 2,
            face3: 1,
            face4: 2,
            face5: 1,
            face6: 2
        };

        // Variables Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
    }

    // Initialisation de la scène Three.js
    init() {
        // Création de la scène
        this.scene = new THREE.Scene();
        
        // Création de la caméra
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 3;
        this.camera.position.y = 0.8; // Descendre la vue pour que le dé soit plus bas
        
        // Création du renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Éclairage
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Création du dé
        this.createDice();
        
        // Événements de souris
        this.setupMouseEvents();
        
        // Démarrage de l'animation
        this.animate();
    }

    // Fonction pour créer une texture avec un nombre
    createNumberTexture(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Fond blanc
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 256, 256);
        
        // Bordure
        context.strokeStyle = '#000000';
        context.lineWidth = 8;
        context.strokeRect(4, 4, 248, 248);
        
        // Texte du nombre
        context.fillStyle = '#000000';
        context.font = 'bold 120px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(number.toString(), 128, 128);
        
        // Création de la texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // Fonction pour créer le dé
    createDice() {
        // Suppression de l'ancien cube s'il existe
        if (this.cube) {
            this.scene.remove(this.cube);
        }
        
        // Géométrie du cube (réduit en taille)
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        
        // Création des matériaux pour chaque face
        const materials = [
            new THREE.MeshLambertMaterial({ map: this.createNumberTexture(this.faceValues.face1) }), // Face droite
            new THREE.MeshLambertMaterial({ map: this.createNumberTexture(this.faceValues.face2) }), // Face gauche
            new THREE.MeshLambertMaterial({ map: this.createNumberTexture(this.faceValues.face3) }), // Face haut
            new THREE.MeshLambertMaterial({ map: this.createNumberTexture(this.faceValues.face4) }), // Face bas
            new THREE.MeshLambertMaterial({ map: this.createNumberTexture(this.faceValues.face5) }), // Face avant
            new THREE.MeshLambertMaterial({ map: this.createNumberTexture(this.faceValues.face6) })  // Face arrière
        ];
        
        // Création du cube avec les matériaux
        this.cube = new THREE.Mesh(geometry, materials);
        
        // Positionner le dé parfaitement au centre
        this.cube.position.set(0, 0, 0);
        
        this.scene.add(this.cube);
    }

    // Mettre à jour les valeurs des faces
    updateFaceValues(newValues) {
        this.faceValues = { ...newValues };
        this.createDice();
    }

    // Animation du dé (rotation aléatoire)
    animateDice(targetValue = null) {
        // Positions des faces du cube avec leurs valeurs (en radians)
        const facePositions = [
            { x: 0, y: 0, value: this.faceValues.face5 },           // Face avant
            { x: 0, y: Math.PI, value: this.faceValues.face6 },     // Face arrière  
            { x: 0, y: Math.PI/2, value: this.faceValues.face1 },   // Face droite
            { x: 0, y: -Math.PI/2, value: this.faceValues.face2 },  // Face gauche
            { x: -Math.PI/2, y: 0, value: this.faceValues.face3 },  // Face haut
            { x: Math.PI/2, y: 0, value: this.faceValues.face4 }    // Face bas
        ];
        
        let targetFace;
        if (targetValue !== null) {
            // Trouver la première face qui a la valeur demandée
            targetFace = facePositions.find(face => face.value === targetValue);
            if (!targetFace) {
                // Si pas trouvé, prendre la première face
                targetFace = facePositions[0];
            }
            console.log(`DICE_ANIM: Visant la valeur ${targetValue}, position trouvée: x=${targetFace.x.toFixed(2)}, y=${targetFace.y.toFixed(2)}`);
        } else {
            // Choisir une face aléatoire
            targetFace = facePositions[Math.floor(Math.random() * facePositions.length)];
            console.log(`DICE_ANIM: Face aléatoire choisie, valeur: ${targetFace.value}`);
        }
        
        // Ajouter des tours complets pour l'effet visuel (2-4 tours)
        const extraRotationsX = (Math.floor(Math.random() * 3) + 2) * Math.PI * 2;
        const extraRotationsY = (Math.floor(Math.random() * 3) + 2) * Math.PI * 2;
        
        const startRotationX = this.cube.rotation.x;
        const startRotationY = this.cube.rotation.y;
        const targetRotationX = targetFace.x + extraRotationsX;
        const targetRotationY = targetFace.y + extraRotationsY;
        
        let progress = 0;
        const duration = 2000; // 2 secondes
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Fonction d'easing (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.cube.rotation.x = startRotationX + (targetRotationX - startRotationX) * easeProgress;
            this.cube.rotation.y = startRotationY + (targetRotationY - startRotationY) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // S'assurer que la rotation finale est exactement sur la face
                this.cube.rotation.x = targetFace.x;
                this.cube.rotation.y = targetFace.y;
                console.log(`DICE_ANIM: Animation terminée, face finale: ${targetFace.value}`);
            }
        };
        
        animate();
        return targetFace.value; // Retourner la valeur qui sera affichée
    }

        // Configuration des événements de souris et tactiles
    setupMouseEvents() {
        const canvas = this.renderer.domElement;
        
        // Événements souris (desktop)
        canvas.addEventListener('mousedown', (event) => {
            this.isDragging = true;
            this.previousMousePosition.x = event.clientX;
            this.previousMousePosition.y = event.clientY;
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (this.isDragging) {
                const deltaMove = {
                    x: event.clientX - this.previousMousePosition.x,
                    y: event.clientY - this.previousMousePosition.y
                };
                
                this.cube.rotation.y += deltaMove.x * 0.01;
                this.cube.rotation.x += deltaMove.y * 0.01;
                
                this.previousMousePosition.x = event.clientX;
                this.previousMousePosition.y = event.clientY;
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // Événements tactiles (mobile)
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.touches.length === 1) {
                this.isDragging = true;
                this.previousMousePosition.x = event.touches[0].clientX;
                this.previousMousePosition.y = event.touches[0].clientY;
            }
        });
        
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (this.isDragging && event.touches.length === 1) {
                const deltaMove = {
                    x: event.touches[0].clientX - this.previousMousePosition.x,
                    y: event.touches[0].clientY - this.previousMousePosition.y
                };
                
                this.cube.rotation.y += deltaMove.x * 0.01;
                this.cube.rotation.x += deltaMove.y * 0.01;
                
                this.previousMousePosition.x = event.touches[0].clientX;
                this.previousMousePosition.y = event.touches[0].clientY;
            }
        });
        
        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.isDragging = false;
        });
        
        // Zoom avec la molette (desktop seulement)
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.camera.position.z += event.deltaY * 0.01;
            this.camera.position.z = Math.max(1.5, Math.min(8, this.camera.position.z));
        });
        
        // Pinch to zoom sur mobile
        let initialDistance = 0;
        canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length === 2) {
                initialDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
            }
        });
        
        canvas.addEventListener('touchmove', (event) => {
            if (event.touches.length === 2) {
                event.preventDefault();
                const currentDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
                const deltaDistance = currentDistance - initialDistance;
                
                this.camera.position.z -= deltaDistance * 0.01;
                this.camera.position.z = Math.max(1.5, Math.min(8, this.camera.position.z));
                
                initialDistance = currentDistance;
            }
        });
    }
    
    // Calculer la distance entre deux touches
    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Boucle d'animation
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Pas de rotation automatique - le dé reste statique sauf si manipulé
        
        this.renderer.render(this.scene, this.camera);
    }

    // Redimensionnement de la fenêtre
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}