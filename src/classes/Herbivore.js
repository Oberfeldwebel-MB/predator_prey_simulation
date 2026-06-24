import Animal from './Animal';

class Herbivore extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffffff',
            radius: 12,
            species: 'zebra',
            maxSpeed: 1.0,
            searchRange: 150,
            matingCooldown: 480
        };
        
        const settings = { ...defaults, ...options };
        super(x, y, settings['color'], settings['radius'], "herbivore", settings['maxSpeed'], settings['gender'], settings['isChild'], settings['matingCooldown']);
        
        this.species = settings['species'];
        this.searchRange = settings['searchRange'];
        this.currentTargetGrass = null;
        this.isPanicking = false;
    }

    getNearestPredator(world, visionRange = 150) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const predator of world.predators) {
            if (!predator.isAlive) continue;
            
            const dx = predator.x - this.x;
            const dy = predator.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance <= visionRange) {
                minDistance = distance;
                nearest = predator;
            }
        }
        return nearest;
    }

    runFromPredator(predator) {
        if (!predator) return false;
        
        const dx = this.x - predator.x;
        const dy = this.y - predator.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 60) {
            return false;
        }
        
        this.isPanicking = true;
        this.mateTarget = null;
        
        if (distance > 0.1) {
            const panicSpeed = this.getCurrentSpeed() * 1.5;
            this.dx = (dx / distance) * panicSpeed;
            this.dy = (dy / distance) * panicSpeed;
        }
        
        this.currentTargetGrass = null;
        
        return true;
    }

    findFood(world, maxDistance = 240) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const grass of world.grassPatches) {
            if (grass.isDepleted()) continue;
            
            const dx = grass.x - this.x;
            const dy = grass.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance <= maxDistance) {
                minDistance = distance;
                nearest = grass;
            }
        }
        return nearest;
    }

    seekGrass(grass) {
        if (!grass || grass.isDepleted()) {
            this.currentTargetGrass = null;
            this.isPanicking = false;
            return false;
        }
        
        const dx = grass.x - this.x;
        const dy = grass.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.searchRange) {
            this.currentTargetGrass = null;
            return false;
        }
        
        if (distance > 0.1) {
            const currentSpeed = this.getCurrentSpeed();
            this.dx = (dx / distance) * currentSpeed;
            this.dy = (dy / distance) * currentSpeed;
        }
        
        return true;
    }

    findMate(world) {
        let nearestMate = null;
        let minDistance = Infinity;
        
        for (const other of world.herbivores) {
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

    tryToEat(world) {
        const nearestPredator = this.getNearestPredator(world, 150);
        if (nearestPredator && nearestPredator.isAlive) {
            const fled = this.runFromPredator(nearestPredator);
            if (fled) return false;
        }
        
        this.isPanicking = false;
        
        if (this.hunger < 50) {
            this.currentTargetGrass = null;
            return false;
        }
        
        if (this.currentTargetGrass && this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
        }
        
        if (!this.currentTargetGrass) {
            this.currentTargetGrass = this.findFood(world);
        }
        
        if (!this.currentTargetGrass) return false;

        if (this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
            return false;
        }
        
        this.seekGrass(this.currentTargetGrass);
        
        if (!this.currentTargetGrass || this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
            return false;
        }
        
        const dx = this.currentTargetGrass.x - this.x;
        const dy = this.currentTargetGrass.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + this.currentTargetGrass.radius + 10) {
            const eaten = this.currentTargetGrass.eat();
            if (eaten > 0) {
                this.eat(eaten);
            }
            this.currentTargetGrass = null;
            return true;
        }
        
        return false;
    }

    tryToMate(world) {
        if (this.isPanicking) {
            this.mateTarget = null;
            return false;
        }
        
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
        const maxSpeed = this.maxSpeed;
        
        const mother = this.gender === "female" ? this : partner;
        const x = Math.max(12, Math.min(mother.x + 5, mother.world?.width || 800));
        const y = Math.max(12, Math.min(mother.y + 5, mother.world?.height || 600));
        
        return new Herbivore(x, y, {
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

export default Herbivore;