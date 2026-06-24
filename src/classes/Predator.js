import Animal from './Animal';

class Predator extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffd700',
            radius: 12,
            species: 'lion',
            maxSpeed: 1.2,
            huntingRange: 150,
            chaseRange: 250,
            matingCooldown: 840
        };
        
        const settings = { ...defaults, ...options };
        super(x, y, settings['color'], settings['radius'], "predator", settings['maxSpeed'], settings['gender'], settings['isChild'], settings['matingCooldown']);
        
        this.species = settings['species'];
        this.huntingRange = settings['huntingRange'];
        this.chaseRange = settings['chaseRange'];
        this.currentTarget = null;
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
        
        if (this.currentTarget && !this.currentTarget.isAlive) {
            this.currentTarget = null;
        }
        
        if (!this.currentTarget) {
            this.currentTarget = this.getNearestHerbivore(world.herbivores, 280);
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
            this.currentTarget.isAlive = false;
            this.eat(100);
            this.currentTarget = null;
            return true;
        }
        
        return false;
    }

    findMate(world) {
        let nearestMate = null;
        let minDistance = Infinity;
        
        for (const other of world.predators) {
            if (other === this) continue;
            if (!other.isAlive) continue;
            if (this.gender === other.gender) continue;
            if (!other.isReadyToMate()) continue;
            if (this.species !== other.species) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestMate = other;
            }
        }
        return nearestMate;
    }

    tryToMate(world) {
        if (this.mateTarget && this.mateTarget.isAlive && this.mateTarget.isReadyToMate()) {
            this.seekMate(this.mateTarget);
            
            if (this.canMate(this.mateTarget)) {
                return this.mateWith(this.mateTarget, world);
            }
            return false;
        }
        
        this.mateTarget = null;
        
        if (!this.isReadyToMate()) return false;
        
        const partner = this.findMate(world);
        if (partner) {
            this.mateTarget = partner;
            this.seekMate(partner);
        }
        
        return false;
    }

    createOffspring(partner) {
        const gender = Math.random() < 0.5 ? "male" : "female";
        const maxSpeed = (this.maxSpeed + partner.maxSpeed) / 2 + (Math.random() - 0.5) * 0.3;
        
        const mother = this.gender === "female" ? this : partner;
        const x = Math.max(12, Math.min(mother.x + 5, mother.world?.width || 800));
        const y = Math.max(12, Math.min(mother.y + 5, mother.world?.height || 600));
        
        return new Predator(x, y, {
            species: this.species,
            color: this.color,
            radius: 12,
            maxSpeed: Math.max(0.5, maxSpeed),
            gender: gender,
            isChild: true,
            matingCooldown: this.defaultMatingCooldown
        });
    }
}

export default Predator;