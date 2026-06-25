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

    createGrass(count) {
        const grassPatches = [];
        const maxAttempts = count === 1 ? 300 : 500;
        const minDistance = 50;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let placed = false;
            
            while (!placed && attempts < maxAttempts) {
                const potentialGrass = new Grass(
                    Math.random() * this.width,
                    Math.random() * this.height,
                    10 + Math.random() * 10
                );
                
                const existingGrass = count === 1 ? this.grassPatches : grassPatches;
                let isFree = true;
                
                for (const grass of existingGrass) {
                    if (potentialGrass.isOverlapping(grass, minDistance)) {
                        isFree = false;
                        break;
                    }
                }
                
                if (isFree) {
                    if (count === 1) {
                        this.grassPatches.push(potentialGrass);
                    } else {
                        grassPatches.push(potentialGrass);
                    }
                    placed = true;
                }
                attempts++;
            }
            
            if (!placed) {
                if (count === 1) {
                    return [];
                }
            }
        }
        
        return grassPatches;
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
        
        const newGrass = this.createGrass(grassCount);
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
            const newGrass = this.createGrass(1);
            if (newGrass.length > 0) {
                this.regenerationTimer = this.regenerationDelay;
            } else {
                this.regenerationTimer = this.regenerationDelay / 2;
            }
        } else {
            this.regenerationTimer--;
        }

        for (const herbivore of this.herbivores) {
            if (herbivore.isAlive) {
                herbivore.moveWithInertia(this.width, this.height);
            }
        }
        
        for (const predator of this.predators) {
            if (predator.isAlive) {
                predator.moveWithInertia(this.width, this.height);
            }
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