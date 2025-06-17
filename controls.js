// Classe pour gérer les contrôles de l'interface utilisateur (simplifiée)
class DiceControls {
    constructor(dice) {
        this.dice = dice;
        this.init();
    }

    // Initialisation des contrôles
    init() {
        this.setupEventListeners();
    }

    // Configuration des événements pour les contrôles
    setupEventListeners() {
        // Possibilité d'ajouter des contrôles clavier ou autres interactions futures
        // Pour le moment, seules les interactions souris sont disponibles
        
        // Exemple : lancer le dé avec la barre d'espace
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.dice.animateDice();
            }
        });
    }

    // Méthode pour lancer le dé depuis l'extérieur
    rollDice() {
        this.dice.animateDice();
    }
} 