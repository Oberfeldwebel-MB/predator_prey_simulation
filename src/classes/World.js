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

    // Обновление мира (один шаг симуляции)
    update() {
        // Травоядные едят траву
        for (const herbivore of this.herbivores) {
            if (herbivore.isAlive) {
                herbivore.tryToEat(this);
            }
        }
        
        // Хищники охотятся
        for (const predator of this.predators) {
            if (predator.isAlive) {
                predator.tryToHunt(this);
            }
        }
        
        // Удаляем съеденную траву и мёртвых животных
        this.grassPatches = this.grassPatches.filter(grass => !grass.isDepleted());
        this.herbivores = this.herbivores.filter(herbivore => herbivore.isAlive);
        this.predators = this.predators.filter(predator => predator.isAlive);
    }

    // Очистить мир
    clear() {
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }
}

export default World;