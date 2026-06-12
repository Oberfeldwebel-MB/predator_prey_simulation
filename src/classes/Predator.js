import Animal from './Animal';

class Predator extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffd700',
            radius: 12,
            species: 'lion',
            maxSpeed: 1.2,
            huntingRange: 150,
            chaseRange: 250
        };
        
        const settings = { ...defaults, ...options };
        super(x, y, settings.color, settings.radius, "predator", settings.maxSpeed, settings.gender, settings.isChild);
        
        this.species = settings.species;
        this.huntingRange = settings.huntingRange;
        this.chaseRange = settings.chaseRange;
        this.huntingCooldown = 0;
        this.currentTarget = null;
    }

    createOffspring(partner) {
        const gender = Math.random() < 0.5 ? "male" : "female";
        const maxSpeed = (this.maxSpeed + partner.maxSpeed) / 2 + (Math.random() - 0.5) * 0.3;
        
        const mother = this.gender === "female" ? this : partner;
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        const x = Math.max(12, Math.min(mother.x + offsetX, mother.world?.width || 800));
        const y = Math.max(12, Math.min(mother.y + offsetY, mother.world?.height || 600));
        
        return new Predator(x, y, {
            species: this.species,
            color: this.color,
            radius: 12,
            maxSpeed: Math.max(0.5, maxSpeed),
            gender: gender,
            isChild: true
        });
    }

    getNearestHerbivore(herbivores, visionRange = 280) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const prey of herbivores) {
            if (!prey || !prey.isAlive) continue;
            
            const dx = this.x - prey.x;
            const dy = this.y - prey.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance <= visionRange) {
                minDistance = distance;
                nearest = prey;
            }
        }
        return nearest;
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
        if (this.hunger < 70) {
            this.currentTarget = null;
            return false;
        }
        
        if (this.huntingCooldown > 0) {
            this.huntingCooldown--;
            return false;
        }
        
        if (this.currentTarget && !this.currentTarget.isAlive) {
            this.currentTarget = null;
        }
        
        if (!this.currentTarget) {
            this.currentTarget = this.findFood(world);
            if (this.currentTarget) {
                console.log(`🦁 ${this.species} нашёл жертву: ${this.currentTarget.species}`);
            }
        }
        
        if (!this.currentTarget) return false;
        if (!this.currentTarget.isAlive) {
            this.currentTarget = null;
            return false;
        }
        
        this.chasePrey(this.currentTarget);
        
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

    tryToMate(world) {
        if (this.hunger > 50) return false;
        if (this.matingCooldown > 0) return false;
        if (this.isChild) return false;
        
        let nearestPartner = null;
        let minDistance = Infinity;
        
        for (const other of world.predators) {
            if (other === this) continue;
            if (!other.isAlive) continue;
            if (this.gender === other.gender) continue;
            if (other.matingCooldown > 0) continue;
            if (other.isChild) continue;
            if (this.species !== other.species) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance < 40) {
                minDistance = distance;
                nearestPartner = other;
            }
        }
        
        if (nearestPartner) {
            return this.mateWith(nearestPartner, world);
        }
        return false;
    }
}

export default Predator;