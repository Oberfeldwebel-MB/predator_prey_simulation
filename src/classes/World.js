class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }

    // Добавить участок травы
    addGrass(grass) {
        this.grassPatches.push(grass);
    }

    // Добавить травоядное
    addHerbivore(herbivore) {
        this.herbivores.push(herbivore);
    }

    // Добавить хищника
    addPredator(predator) {
        this.predators.push(predator);
    }

    // Получить всех живых существ (для отрисовки)
    getAllEntities() {
        return {
            grass: this.grassPatches.filter(g => !g.isDepleted),
            herbivores: this.herbivores.filter(h => h.isAlive),
            predators: this.predators.filter(p => p.isAlive)
        };
    }

    // Получить всех животных (для анимации)
    getAllAnimals() {
        return [...this.herbivores, ...this.predators];
    }

    // Получить ближайшую траву к животному
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

    // Обновление мира
    update() {

    }

    // Очистить мир
    clear() {
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }
}

export default World;