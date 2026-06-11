class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }

    getAllAnimals() {
        return [...this.herbivores, ...this.predators];
    }

    getNearestGrass(animal, maxDistance = 50) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const grass of this.grassPatches) {
            if (grass.isDepleted) continue;
            
            const dx = grass.x - animal.x;
            const dy = grass.y - animal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance < maxDistance) {
                minDistance = distance;
                nearest = grass;
            }
        }
        return nearest;
    }

    update() {
        // Логика будет добавлена позже
    }

    clear() {
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }
}

export default World;