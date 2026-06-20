import Grass from './Grass';

class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
        
        this.regenerationTimer = 0;
        this.minGrassDistance = 40;
        this.regenerationDelay = 300;
        this.zebraMatingCooldown = 480;
        this.lionMatingCooldown = 840;
    }

    addHerbivore(herbivore) {
        herbivore.world = this;
        this.herbivores.push(herbivore);
    }

    addPredator(predator) {
        predator.world = this;
        this.predators.push(predator);
    }

    isOverlapping(newGrass, existingGrass, minDistance = 35) {
        for (const grass of existingGrass) {
            const dx = grass.x - newGrass.x;
            const dy = grass.y - newGrass.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < grass.radius + newGrass.radius + minDistance) {
                return true;
            }
        }
        return false;
    }

    createNonOverlappingGrass(count) {
        const grassPatches = [];
        const maxAttempts = 200;
        const minDistance = 35;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let placed = false;
            
            while (!placed && attempts < maxAttempts) {
                const potentialGrass = new Grass(
                    Math.random() * this.width,
                    Math.random() * this.height,
                    10 + Math.random() * 10
                );
                
                let isFree = true;
                for (const grass of grassPatches) {
                    const dx = grass.x - potentialGrass.x;
                    const dy = grass.y - potentialGrass.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < grass.radius + potentialGrass.radius + minDistance) {
                        isFree = false;
                        break;
                    }
                }
                
                if (isFree) {
                    grassPatches.push(potentialGrass);
                    placed = true;
                }
                attempts++;
            }
            
            if (!placed) {
                grassPatches.push(new Grass(
                    Math.random() * this.width,
                    Math.random() * this.height,
                    10 + Math.random() * 10
                ));
            }
        }
        
        return grassPatches;
    }

    isPositionFreeForGrass(x, y, minDistance = 40) {
        for (const grass of this.grassPatches) {
            if (grass.isDepleted()) continue;
            const dx = grass.x - x;
            const dy = grass.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < grass.radius + minDistance) {
                return false;
            }
        }
        return true;
    }

    spawnNewGrass() {
        const step = 30;
        const minDistance = 40;
        let hasFreeSpace = false;
        
        for (let x = 0; x < this.width; x += step) {
            for (let y = 0; y < this.height; y += step) {
                if (this.isPositionFreeForGrass(x, y, minDistance)) {
                    hasFreeSpace = true;
                    break;
                }
            }
            if (hasFreeSpace) break;
        }
        
        if (!hasFreeSpace) {
            return false;
        }
        
        const maxAttempts = 150;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            
            if (this.isPositionFreeForGrass(x, y, minDistance)) {
                const newGrass = new Grass(x, y, 10 + Math.random() * 10);
                this.grassPatches.push(newGrass);
                return true;
            }
        }
        
        return false;
    }

    calculateGenders(count) {
        const males = Math.ceil(count / 2);
        const females = Math.floor(count / 2);
        return { males, females };
    }

    getCounts() {
        return {
            zebras: this.herbivores.filter(h => h.isAlive).length,
            lions: this.predators.filter(p => p.isAlive).length,
            grass: this.grassPatches.filter(g => !g.isDepleted()).length
        };
    }

    initializeWithParams(
        zebraCount, zebraSpeed, lionCount, lionSpeed, grassCount,
        zebraMatingCooldown, lionMatingCooldown, regenerationFrames,
        HerbivoreClass, PredatorClass
    ) {
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
        this.zebraMatingCooldown = zebraMatingCooldown;
        this.lionMatingCooldown = lionMatingCooldown;
        this.regenerationDelay = regenerationFrames;
        this.regenerationTimer = 0;
        
        const newGrass = this.createNonOverlappingGrass(grassCount);
        this.grassPatches = newGrass;

        const newHerbivores = [];
        const { males: zebraMales, females: zebraFemales } = this.calculateGenders(zebraCount);
        
        for (let i = 0; i < zebraMales; i++) {
            newHerbivores.push(new HerbivoreClass(
                Math.random() * this.width,
                Math.random() * this.height,
                { species: 'zebra', color: '#ffffff', radius: 12, maxSpeed: zebraSpeed, gender: 'male', matingCooldown: zebraMatingCooldown }
            ));
        }
        for (let i = 0; i < zebraFemales; i++) {
            newHerbivores.push(new HerbivoreClass(
                Math.random() * this.width,
                Math.random() * this.height,
                { species: 'zebra', color: '#ffffff', radius: 12, maxSpeed: zebraSpeed, gender: 'female', matingCooldown: zebraMatingCooldown }
            ));
        }
        
        this.herbivores = newHerbivores;

        const newPredators = [];
        const { males: lionMales, females: lionFemales } = this.calculateGenders(lionCount);
        
        for (let i = 0; i < lionMales; i++) {
            newPredators.push(new PredatorClass(
                Math.random() * this.width,
                Math.random() * this.height,
                { species: 'lion', color: '#ffd700', radius: 12, maxSpeed: lionSpeed, gender: 'male', matingCooldown: lionMatingCooldown }
            ));
        }
        for (let i = 0; i < lionFemales; i++) {
            newPredators.push(new PredatorClass(
                Math.random() * this.width,
                Math.random() * this.height,
                { species: 'lion', color: '#ffd700', radius: 12, maxSpeed: lionSpeed, gender: 'female', matingCooldown: lionMatingCooldown }
            ));
        }
        this.predators = newPredators;
        
        return {
            grassPatches: this.grassPatches,
            herbivores: this.herbivores,
            predators: this.predators
        };
    }

    update() {
        for (const herbivore of this.herbivores) {
            if (herbivore.isAlive) {
                herbivore.tryToEat(this);
            }
        }
        
        for (const predator of this.predators) {
            if (predator.isAlive) {
                predator.tryToHunt(this);
            }
        }
        
        for (const herbivore of this.herbivores) {
            if (herbivore.isAlive) {
                herbivore.tryToMate(this);
            }
        }
        
        for (const predator of this.predators) {
            if (predator.isAlive) {
                predator.tryToMate(this);
            }
        }
        
        this.grassPatches = this.grassPatches.filter(grass => !grass.isDepleted());
        this.herbivores = this.herbivores.filter(herbivore => herbivore.isAlive);
        this.predators = this.predators.filter(predator => predator.isAlive);
        
        if (this.regenerationTimer <= 0) {
            const hasSpace = this.spawnNewGrass();
            if (hasSpace) {
                this.regenerationTimer = this.regenerationDelay;
            } else {
                this.regenerationTimer = this.regenerationDelay / 2;
            }
        } else {
            this.regenerationTimer--;
        }
    }

    clear() {
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
        this.regenerationTimer = 0;
    }
}

export default World;