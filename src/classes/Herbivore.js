import Animal from './Animal';

class Herbivore extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffffff',
            radius: 12,
            species: 'zebra',
            maxSpeed: 1.0,
            searchRange: 150
        };
        
        const settings = { ...defaults, ...options };
        super(x, y, settings.color, settings.radius, "herbivore", settings.maxSpeed, settings.gender, settings.isChild);
        
        this.species = settings.species;
        this.searchRange = settings.searchRange;
        this.currentTargetGrass = null;
    }

    createOffspring(partner) {
        const gender = Math.random() < 0.5 ? "male" : "female";
        const maxSpeed = (this.maxSpeed + partner.maxSpeed) / 2 + (Math.random() - 0.5) * 0.3;
        
        const mother = this.gender === "female" ? this : partner;
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        const x = Math.max(12, Math.min(mother.x + offsetX, mother.world?.width || 800));
        const y = Math.max(12, Math.min(mother.y + offsetY, mother.world?.height || 600));
        
        return new Herbivore(x, y, {
            species: this.species,
            color: this.color,
            radius: 12,
            maxSpeed: Math.max(0.5, maxSpeed),
            gender: gender,
            isChild: true
        });
    }

    getNearestGrass(world, maxDistance = 240) {
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

    findFood(world) {
        return this.getNearestGrass(world, 240);
    }

    seekGrass(grass) {
        if (!grass || grass.isDepleted()) {
            this.currentTargetGrass = null;
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

    tryToEat(world) {
        if (this.hunger < 50) {
            this.currentTargetGrass = null;
            return false;
        }
        
        if (this.currentTargetGrass && this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
        }
        
        if (!this.currentTargetGrass) {
            this.currentTargetGrass = this.findFood(world);
            if (this.currentTargetGrass) {
                console.log(`🦓 ${this.species} нашёл траву на (${this.currentTargetGrass.x.toFixed(0)}, ${this.currentTargetGrass.y.toFixed(0)})`);
            }
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
            const eaten = this.currentTargetGrass.eat(25);
            if (eaten > 0) {
                this.eat(eaten);
                console.log(`✅ ${this.species} съел траву! +${eaten.toFixed(0)} еды`);
            }
            this.currentTargetGrass = null;
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
        
        for (const other of world.herbivores) {
            if (other === this) continue;
            if (!other.isAlive) continue;
            if (this.gender === other.gender) continue;
            if (other.matingCooldown > 0) continue;
            if (other.isChild) continue;
            if (this.species !== other.species) continue;  // ✅ только одинаковые виды
            
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

export default Herbivore;