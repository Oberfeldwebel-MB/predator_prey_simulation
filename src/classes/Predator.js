import Animal from './Animal';

class Predator extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffd700',
            radius: 12,
            species: 'lion',
            maxSpeed: 1.5,
            huntingRange: 150,
            chaseRange: 250
        };
        
        const settings = { ...defaults, ...options };
        super(x, y, settings.color, settings.radius, "predator", settings.maxSpeed);
        
        this.species = settings.species;
        this.huntingRange = settings.huntingRange;
        this.chaseRange = settings.chaseRange;
        this.huntingCooldown = 0;
        this.currentTarget = null;
    }

    findFood(world) {
        return this.getNearestHerbivore(world.herbivores, 280);
    }

    chasePrey(prey) {
        if (!prey || !prey.isAlive) {
            this.currentTarget = null;
            return false;
        }
        
        const dx = prey.x - this.x;
        const dy = prey.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.chaseRange) {
            this.currentTarget = null;
            return false;
        }
        
        if (distance > 0.1) {
            const currentSpeed = this.getCurrentSpeed();
            this.dx = (dx / distance) * currentSpeed;
            this.dy = (dy / distance) * currentSpeed;
        }
        
        return true;
    }

    tryToHunt(world) {
        // Голодный лев охотится (голод > 70)
        if (this.hunger < 70) {
            this.currentTarget = null;
            return false;
        }
        
        if (this.huntingCooldown > 0) {
            this.huntingCooldown--;
            return false;
        }
        
        // Проверяем, жив ли текущий цель
        if (this.currentTarget && !this.currentTarget.isAlive) {
            this.currentTarget = null;
        }
        
        // Если нет цели — ищем
        if (!this.currentTarget) {
            this.currentTarget = this.findFood(world);
            if (this.currentTarget) {
                console.log(`🦁 ${this.species} нашёл жертву: ${this.currentTarget.species}`);
            }
        }
        
        // Если цель не найдена — выходим
        if (!this.currentTarget) {
            return false;
        }
        
        // Дополнительная проверка: цель может умереть в процессе
        if (!this.currentTarget.isAlive) {
            this.currentTarget = null;
            return false;
        }
        
        // Преследование
        this.chasePrey(this.currentTarget);
        
        // Ещё раз проверяем, что цель не исчезла после chasePrey
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            this.currentTarget = null;
            return false;
        }
        
        const dx = this.currentTarget.x - this.x;
        const dy = this.currentTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.radius + this.currentTarget.radius + 10) {
            console.log(`🦁 ${this.species} убил ${this.currentTarget.species} (голод: ${Math.round(this.hunger)})`);
            this.currentTarget.isAlive = false;
            this.eat(50);
            this.huntingCooldown = 40;
            this.currentTarget = null;
            return true;
        }
        
        return false;
    }

    getNearestHerbivore(herbivores, visionRange = 280) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const prey of herbivores) {
            if (!prey || !prey.isAlive) continue;
            
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