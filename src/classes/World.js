class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }

    addGrass(grass) {
        this.grassPatches.push(grass);
    }

    getAllAnimals() {
    return [...this.predators, ...this.herbivores];
    }

    addHerbivore(herbivore) {
        this.herbivores.push(herbivore);
    }

    addPredator(predator) {
        this.predators.push(predator);
    }

    getAllEntities() {
        return {
            grass: this.grassPatches,
            herbivores: this.herbivores.filter(h => h.status === "alive"),
            predators: this.predators.filter(p => p.status === "alive")
        };
    }

    update() {
        console.log("World updated");
    }

    clear() {
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
    }
}

export default World;