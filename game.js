// Classe pour gérer la logique du jeu
class Game {
    constructor(dice) {
        this.dice = dice;
        this.enemies = [];
        this.projectiles = [];
        this.waveNumber = 1;
        this.enemiesSpawned = 0;
        this.enemiesInCurrentWave = 5;
        this.gameRunning = false;
        this.diceTimer = 0;
        this.diceInterval = 3000; // 3 secondes en millisecondes
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // Spawn un ennemi toutes les 2 secondes
        
        // Points de vie du dé
        this.diceHP = 100;
        this.maxDiceHP = 100;
        
        // État du jeu pour mobile
        this.isPaused = false;
        
        // Zone d'exclusion pour l'UI (en bas)
        this.uiHeight = 120; // Hauteur de la zone UI
        this.gameAreaHeight = window.innerHeight - this.uiHeight;
        
        // Système d'XP et de niveaux
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.isLevelingUp = false;
        
        this.init();
    }

    init() {
        this.setupCanvas2D();
        this.setupMobileUI();
        this.setupTouchControls();
        this.startGame();
    }

    // Configuration du canvas 2D pour les éléments UI
    setupCanvas2D() {
        this.canvas2D = document.createElement('canvas');
        this.canvas2D.width = window.innerWidth;
        this.canvas2D.height = this.gameAreaHeight; // Seulement la zone de jeu
        this.canvas2D.style.position = 'absolute';
        this.canvas2D.style.top = '0';
        this.canvas2D.style.left = '0';
        this.canvas2D.style.pointerEvents = 'none';
        this.canvas2D.style.zIndex = '10';
        this.canvas2D.style.overflow = 'hidden'; // Empêcher le débordement
        document.getElementById('container').appendChild(this.canvas2D);
        
        this.ctx = this.canvas2D.getContext('2d');
    }

    // Démarrer le jeu
    startGame() {
        this.gameRunning = true;
        this.lastTime = Date.now();
        
        // Spawner la première vague
        this.nextWave();
        
        this.gameLoop();
    }

    // Boucle principale du jeu
    gameLoop() {
        if (!this.gameRunning) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    // Mise à jour du jeu
    update(deltaTime) {
        // Ne pas mettre à jour si en pause
        if (this.isPaused) {
            this.updateMobileUI();
            return;
        }

        // Timer pour lancer le dé automatiquement
        this.diceTimer += deltaTime;
        if (this.diceTimer >= this.diceInterval) {
            this.rollDiceAndShoot();
            this.diceTimer = 0;
        }

        // Les ennemis sont maintenant spawnés tous en même temps au début de chaque vague

        // Mettre à jour les ennemis
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);
            if (enemy.hp <= 0) {
                // Gagner de l'XP égale aux HP max de l'ennemi
                this.gainXP(enemy.maxHp);
                this.enemies.splice(index, 1);
            }
            
            // Vérifier si l'ennemi touche la bordure (fait perdre des HP au dé)
            if (enemy.y + enemy.radius >= this.gameAreaHeight) { // Collision quand l'ennemi touche la bordure
                this.diceHP -= enemy.damage; // Dégâts = HP de départ de l'ennemi
                this.enemies.splice(index, 1);
                
                if (this.diceHP <= 0) {
                    this.gameOver();
                }
            }
        });

        // Mettre à jour les projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            let hasHit = false;
            
            // Vérifier les collisions avec TOUS les ennemis (pas seulement la cible)
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (this.checkCollision(projectile, enemy)) {
                    enemy.takeDamage(2); // 1 projectile = 2 dégâts
                    hasHit = true;
                    break; // Un projectile ne peut toucher qu'un ennemi à la fois
                }
            }
            
            // Supprimer le projectile s'il a touché ou s'il sort de l'écran
            if (hasHit || 
                projectile.x < -50 || projectile.x > window.innerWidth + 50 || 
                projectile.y < -50 || projectile.y > window.innerHeight + 50) {
                this.projectiles.splice(i, 1);
            }
        }

        // Vérifier si la vague est terminée (tous les ennemis éliminés)
        if (this.enemies.length === 0 && this.waveNumber >= 1) {
            this.nextWave();
        }

        // Mettre à jour l'interface mobile
        this.updateMobileUI();
    }

    // Lancer le dé et tirer des projectiles
    rollDiceAndShoot() {
        // Choisir une face aléatoire du dé
        const faceKeys = ['face1', 'face2', 'face3', 'face4', 'face5', 'face6'];
        const randomFaceKey = faceKeys[Math.floor(Math.random() * faceKeys.length)];
        const diceValue = this.dice.faceValues[randomFaceKey];
        
        console.log(`MAIN: Face choisie: ${randomFaceKey}, valeur: ${diceValue}`);
        
        // Stocker cette valeur
        this.setDiceValue(diceValue);
        
        // Lancer l'animation du dé avec la valeur cible
        this.dice.animateDice(diceValue);
        
        // Attendre que l'animation soit terminée pour tirer
        setTimeout(() => {
            const projectileCount = this.getCurrentDiceValue();
            console.log(`MAIN: Dé tombé sur: ${projectileCount} - Tir de ${projectileCount} projectile(s)`);
            this.shootProjectiles(projectileCount);
        }, 2100); // Légèrement après la fin de l'animation du dé
    }

    // Obtenir la valeur actuelle du dé - approche simplifiée
    getCurrentDiceValue() {
        // Pour l'instant, on utilise une méthode simple : stocker la dernière valeur tirée
        // et utiliser le système de faces prédéfinies dans animateDice
        
        // Si lastRolledValue n'existe pas, initialiser à 1
        if (!this.lastRolledValue) {
            this.lastRolledValue = 1;
        }
        
        console.log(`DICE: Valeur utilisée: ${this.lastRolledValue}`);
        return this.lastRolledValue;
    }

    // Méthode pour définir la valeur après l'animation
    setDiceValue(value) {
        this.lastRolledValue = value;
        console.log(`DICE: Nouvelle valeur définie: ${value}`);
    }

    // Tirer des projectiles
    shootProjectiles(count) {
        console.log(`SHOOT: Début de tir - demandé: ${count} projectiles`);
        console.log(`SHOOT: Nombre d'ennemis disponibles: ${this.enemies.length}`);
        
        const centerX = window.innerWidth / 2;
        const centerY = this.gameAreaHeight * 0.75;

        let projectilesFired = 0;
        
        console.log(`SHOOT: Début de la boucle for avec délais (i=0; i<${count}; i++)`);
        for (let i = 0; i < count; i++) {
            console.log(`SHOOT: Itération ${i + 1}/${count}`);
            
            // Ajouter un délai progressif entre chaque projectile
            setTimeout(() => {
                // Toujours viser l'ennemi le plus proche au moment du tir
                const target = this.findNearestEnemy();
                
                if (target) {
                    // Ajouter un léger décalage pour éviter la superposition parfaite
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    const projectile = new Projectile(centerX + offsetX, centerY + offsetY, target);
                    this.projectiles.push(projectile);
                    projectilesFired++;
                    console.log(`SHOOT: Projectile ${projectilesFired} créé et ajouté après ${i * 100}ms - vise l'ennemi le plus proche`);
                } else {
                    console.log(`SHOOT: Pas d'ennemi disponible pour le projectile ${i + 1} après ${i * 100}ms`);
                }
            }, i * 100); // 100ms de délai entre chaque projectile
        }
        console.log(`SHOOT: FIN - ${count} projectiles programmés avec délais`);
    }

    // Trouver l'ennemi le plus proche
    findNearestEnemy() {
        if (this.enemies.length === 0) return null;

        const centerX = window.innerWidth / 2;
        const centerY = this.gameAreaHeight * 0.75;
        
        let nearest = this.enemies[0];
        let minDistance = this.getDistance(centerX, centerY, nearest.x, nearest.y);

        this.enemies.forEach(enemy => {
            const distance = this.getDistance(centerX, centerY, enemy.x, enemy.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });

        return nearest;
    }

    // Trouver les N ennemis les plus proches
    findNearestEnemies(count) {
        if (this.enemies.length === 0) return [];

        const centerX = window.innerWidth / 2;
        const centerY = this.gameAreaHeight * 0.75;
        
        // Créer un tableau avec les ennemis et leurs distances
        const enemiesWithDistance = this.enemies.map(enemy => ({
            enemy: enemy,
            distance: this.getDistance(centerX, centerY, enemy.x, enemy.y)
        }));

        // Trier par distance
        enemiesWithDistance.sort((a, b) => a.distance - b.distance);

        // Retourner les N plus proches (ou tous s'il y en a moins de N)
        const nearestCount = Math.min(count, enemiesWithDistance.length);
        return enemiesWithDistance.slice(0, nearestCount).map(item => item.enemy);
    }

    // Calculer la distance entre deux points
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Vérifier collision entre projectile et ennemi (détection améliorée)
    checkCollision(projectile, enemy) {
        const distance = this.getDistance(projectile.x, projectile.y, enemy.x, enemy.y);
        // Augmenter la zone de détection pour faciliter les touches
        const collisionRadius = projectile.radius + enemy.radius + 10; // +10 pixels de marge
        return distance < collisionRadius;
    }

    // Spawn un ennemi
    spawnEnemy() {
        const enemy = new Enemy(this.gameAreaHeight);
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }

    // Passer à la vague suivante
    nextWave() {
        this.waveNumber++;
        this.enemiesSpawned = 0;
        this.enemiesInCurrentWave += 2; // Plus d'ennemis à chaque vague
        
        // Spawner tous les ennemis de la vague en même temps
        for (let i = 0; i < this.enemiesInCurrentWave; i++) {
            this.spawnEnemy();
        }
        
        console.log(`Vague ${this.waveNumber} commencée avec ${this.enemiesInCurrentWave} ennemis !`);
    }

    // Rendu du jeu
    render() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);

        // Dessiner la bordure de séparation entre zone de jeu et UI
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.gameAreaHeight);
        this.ctx.lineTo(window.innerWidth, this.gameAreaHeight);
        this.ctx.stroke();

        // Dessiner les ennemis
        this.enemies.forEach(enemy => enemy.render(this.ctx));

        // Dessiner les projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));

        // Afficher les infos de jeu
        this.renderUI();
    }

    // Rendu de l'interface utilisateur (simplifié - UI dans HTML)
    renderUI() {
        // L'interface est maintenant gérée par updateMobileUI() et les éléments HTML
        // On garde cette fonction pour compatibilité mais elle ne fait plus rien
    }

    // Game Over
    gameOver() {
        this.gameRunning = false;
        alert(`Game Over! Vous avez survécu ${this.waveNumber} vagues!`);
        // Optionnel : redémarrer le jeu
        location.reload();
    }

    // Configuration de l'interface mobile
    setupMobileUI() {
        // Mettre à jour les éléments UI
        this.updateMobileUI();
    }

    // Configuration des contrôles tactiles
    setupTouchControls() {
        const pauseBtn = document.getElementById('pauseBtn');

        // Bouton pause
        pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });

        // Gérer les événements tactiles sur le canvas
        this.setupTouchEvents();
    }

    // Événements tactiles pour le canvas
    setupTouchEvents() {
        // Empêcher le zoom
        this.canvas2D.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }

    // Mettre à jour l'interface mobile
    updateMobileUI() {
        const waveDisplay = document.getElementById('waveDisplay');
        const enemyDisplay = document.getElementById('enemyDisplay');
        const diceHPDisplay = document.getElementById('diceHPDisplay');
        const healthFill = document.getElementById('healthFill');
        const timerDisplay = document.getElementById('timerDisplay');
        const levelDisplay = document.getElementById('levelDisplay');
        const xpDisplay = document.getElementById('xpDisplay');
        const xpFill = document.getElementById('xpFill');

        if (waveDisplay) waveDisplay.textContent = this.waveNumber;
        if (enemyDisplay) enemyDisplay.textContent = this.enemies.length;
        if (diceHPDisplay) diceHPDisplay.textContent = `${this.diceHP}/${this.maxDiceHP}`;
        if (healthFill) {
            const healthPercent = (this.diceHP / this.maxDiceHP) * 100;
            healthFill.style.width = `${healthPercent}%`;
        }
        if (timerDisplay) {
            const timeLeft = ((this.diceInterval - this.diceTimer) / 1000).toFixed(1);
            timerDisplay.textContent = timeLeft;
        }
        if (levelDisplay) levelDisplay.textContent = this.level;
        if (xpDisplay) xpDisplay.textContent = `${this.xp}/${this.xpToNextLevel}`;
        if (xpFill) {
            const xpPercent = (this.xp / this.xpToNextLevel) * 100;
            xpFill.style.width = `${xpPercent}%`;
        }
    }

    // Pause/Resume du jeu
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            pauseBtn.textContent = '▶️';
            pauseBtn.title = 'Reprendre';
        } else {
            pauseBtn.textContent = '⏸️';
            pauseBtn.title = 'Pause';
        }
    }

    // Système d'XP et de niveaux
    gainXP(amount) {
        if (this.isLevelingUp) return; // Ne pas gagner d'XP pendant le level up
        
        this.xp += amount;
        console.log(`XP gagné: ${amount}, Total: ${this.xp}/${this.xpToNextLevel}`);
        
        // Vérifier si on peut level up
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); // Augmentation exponentielle
        this.isLevelingUp = true;
        
        console.log(`Level Up! Niveau ${this.level}`);
        
        // Mettre le jeu en pause et afficher les améliorations
        this.isPaused = true;
        this.showUpgradeModal();
    }
    
    showUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        modal.style.display = 'flex';
        
        // Ajouter les écouteurs d'événements pour les boutons
        const upgrade1 = document.getElementById('upgrade1');
        const upgrade2 = document.getElementById('upgrade2');
        const upgrade3 = document.getElementById('upgrade3');
        
        const handleUpgrade = (type) => {
            this.applyUpgrade(type);
            this.hideUpgradeModal();
        };
        
        upgrade1.onclick = () => handleUpgrade(1);
        upgrade2.onclick = () => handleUpgrade(2);
        upgrade3.onclick = () => handleUpgrade(3);
    }
    
    hideUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        modal.style.display = 'none';
        this.isLevelingUp = false;
        this.isPaused = false; // Reprendre le jeu
    }
    
    applyUpgrade(type) {
        const faceKeys = ['face1', 'face2', 'face3', 'face4', 'face5', 'face6'];
        
        switch(type) {
            case 1: // +3 sur 1 face
                const randomFace1 = faceKeys[Math.floor(Math.random() * faceKeys.length)];
                this.dice.faceValues[randomFace1] += 3;
                console.log(`Amélioration: +3 sur ${randomFace1}, nouvelle valeur: ${this.dice.faceValues[randomFace1]}`);
                break;
                
            case 2: // +2 sur 2 faces
                for (let i = 0; i < 2; i++) {
                    const randomFace2 = faceKeys[Math.floor(Math.random() * faceKeys.length)];
                    this.dice.faceValues[randomFace2] += 2;
                    console.log(`Amélioration: +2 sur ${randomFace2}, nouvelle valeur: ${this.dice.faceValues[randomFace2]}`);
                }
                break;
                
            case 3: // +1 sur 3 faces
                for (let i = 0; i < 3; i++) {
                    const randomFace3 = faceKeys[Math.floor(Math.random() * faceKeys.length)];
                    this.dice.faceValues[randomFace3] += 1;
                    console.log(`Amélioration: +1 sur ${randomFace3}, nouvelle valeur: ${this.dice.faceValues[randomFace3]}`);
                }
                break;
        }
        
        // Mettre à jour le dé avec les nouvelles valeurs
        this.dice.updateFaceValues(this.dice.faceValues);
    }

    // Redimensionnement
    onResize() {
        this.gameAreaHeight = window.innerHeight - this.uiHeight;
        this.canvas2D.width = window.innerWidth;
        this.canvas2D.height = this.gameAreaHeight; // Ajuster à la zone de jeu seulement
    }
}

// Classe Enemy
class Enemy {
    constructor(gameAreaHeight = window.innerHeight - 120) {
        // Spawn seulement par le haut de l'écran avec des marges de sécurité
        const margin = 60; // Marge de sécurité augmentée pour éviter les débordements
        this.x = margin + Math.random() * (window.innerWidth - 2 * margin);
        this.y = -50;
        
        this.radius = 25;
        this.hp = 4 + Math.floor(Math.random() * 4); // 4-7 HP
        this.maxHp = this.hp;
        this.damage = this.hp; // Dégât = HP de départ
        this.speed = 5 + Math.random() * 5; // pixels par seconde (très lent)
        this.color = this.getHealthColor();
        
        // Les ennemis descendent simplement vers le bas
        this.vx = 0; // Pas de mouvement horizontal
        this.vy = this.speed; // Descente verticale uniquement
    }

    update(deltaTime) {
        // Se déplacer vers le centre (dé)
        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);
        this.color = this.getHealthColor();
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
    }

    getHealthColor() {
        const healthPercent = this.hp / this.maxHp;
        if (healthPercent > 0.6) return '#4CAF50'; // Vert
        if (healthPercent > 0.3) return '#FF9800'; // Orange
        return '#F44336'; // Rouge
    }

    render(ctx) {
        // Dessiner le cercle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Afficher les HP
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.hp.toString(), this.x, this.y + 5);
    }
}

// Classe Projectile
class Projectile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 300; // pixels par seconde
        this.target = target;
        
        // Calculer la direction vers la cible
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
    }

    update(deltaTime) {
        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700'; // Doré
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}