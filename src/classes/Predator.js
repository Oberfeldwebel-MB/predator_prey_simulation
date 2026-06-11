import Animal from './Animal';

class Predator extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffd700',
            radius: 12,
            species: 'lion',
            maxSpeed: 3.5,
            huntingRange: 150
        };
        
        const settings = { ...defaults, ...options };
        
        // Передаём maxSpeed в базовый класс
        super(x, y, settings.color, settings.radius, "predator", settings.maxSpeed);
        
        this.species = settings.species;
        this.huntingRange = settings.huntingRange;
        this.huntingCooldown = 0;
    }

    hunt(herbivore) {
        if (this.huntingCooldown > 0) {
            this.huntingCooldown--;
            return false;
        }
        
        if (!herbivore || !herbivore.isAlive) return false;
        
        const dx = this.x - herbivore.x;
        const dy = this.y - herbivore.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.huntingRange) return false;
        
        const successChance = 0.4 + (100 - this.hunger) / 200 - herbivore.stamina / 200;
        
        if (Math.random() < successChance) {
            console.log(`${this.species} убил ${herbivore.species}`);
            herbivore.isAlive = false;
            this.eat(50);
            this.huntingCooldown = 30;
            return true;
        }
        
        if (herbivore.defend()) {
            console.log(`${herbivore.species} отбился от ${this.species}`);
            this.huntingCooldown = 20;
            return false;
        }
        
        this.huntingCooldown = 10;
        return false;
    }

    getNearestHerbivore(herbivores) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const prey of herbivores) {
            if (!prey.isAlive) continue;
            
            const dx = this.x - prey.x;
            const dy = this.y - prey.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = prey;
            }
        }
        
        return nearest;
    }
}

export default Predator;