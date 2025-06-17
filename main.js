// Fichier principal pour orchestrer l'application du dé
class DiceApp {
    constructor() {
        this.dice = null;
        this.controls = null;
        this.init();
    }

    // Initialisation de l'application
    init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    // Configuration de l'application
    setup() {
        try {
            // Créer l'instance du dé
            this.dice = new Dice();
            this.dice.init();

            // Créer les contrôles
            this.controls = new DiceControls(this.dice);

            // Créer le système de jeu
            this.game = new Game(this.dice);

            // Événement de redimensionnement de la fenêtre
            window.addEventListener('resize', () => {
                this.dice.onWindowResize();
                this.game.onResize();
            });

            console.log('Jeu de dé tower defense initialisé avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this.showError('Erreur lors du chargement de l\'application. Vérifiez que Three.js est bien chargé.');
        }
    }

    // Afficher une erreur à l'utilisateur
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // Supprimer l'erreur après 5 secondes
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Méthodes publiques pour l'interaction externe
    getDice() {
        return this.dice;
    }

    getControls() {
        return this.controls;
    }

    // Animation du dé depuis l'extérieur
    animateDice() {
        if (this.dice) {
            this.dice.animateDice();
        }
    }

    // Lancer le dé depuis l'extérieur
    rollDice() {
        if (this.controls) {
            this.controls.rollDice();
        }
    }
}

// Créer et démarrer l'application
const diceApp = new DiceApp();

// Exposer l'application globalement pour le debugging
window.diceApp = diceApp;