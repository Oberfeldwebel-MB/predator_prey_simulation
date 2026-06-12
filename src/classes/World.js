import Grass from './Grass';
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grassPatches = [];
        this.herbivores = [];
        this.predators = [];
        
        // Параметры регенерации травы
        this.maxGrassCount = 40;           // максимальное количество кустов
        this.regenerationDelay = 300;       // кадров до появления новой травы (5 сек при 60 fps)
        this.regenerationTimer = 0;
    }

    addGrass(grass) {
        this.grassPatches.push(grass);
    }

    addHerbivore(herbivore) {
        herbivore.world = this;
        this.herbivores.push(herbivore);
    }

    addPredator(predator) {
        predator.world = this;
        this.predators.push(predator);
    }

    // Проверка, можно ли разместить траву в этой позиции
    isPositionFreeForGrass(x, y, minDistance = 25) {
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

    // Создание новой травы в случайной свободной позиции
    spawnNewGrass() {
        const maxAttempts = 100;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            
            if (this.isPositionFreeForGrass(x, y, 30)) {
                const newGrass = new Grass(x, y, 10 + Math.random() * 10);
                this.grassPatches.push(newGrass);
                console.log(`🌱 Новая трава выросла на (${x.toFixed(0)}, ${y.toFixed(0)})`);
                return true;
            }
        }
        console.log("🌱 Не удалось найти место для новой травы");
        return false;
    }

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
        
        // Спаривание травоядных
        for (const herbivore of this.herbivores) {
            if (herbivore.isAlive) {
                herbivore.tryToMate(this);
            }
        }
        
        // Спаривание хищников
        for (const predator of this.predators) {
            if (predator.isAlive) {
                predator.tryToMate(this);
            }
        }
        
        // Удаление мёртвых
        this.grassPatches = this.grassPatches.filter(grass => !grass.isDepleted());
        this.herbivores = this.herbivores.filter(herbivore => herbivore.isAlive);
        this.predators = this.predators.filter(predator => predator.isAlive);
        
        // РЕГЕНЕРАЦИЯ ТРАВЫ
        const currentGrassCount = this.grassPatches.length;
        
        // Если травы меньше 50% от максимума - запускаем таймер регенерации
        if (currentGrassCount < this.maxGrassCount * 0.5) {
            if (this.regenerationTimer <= 0) {
                // Трава восстанавливается
                this.spawnNewGrass();
                this.regenerationTimer = this.regenerationDelay;
            } else {
                this.regenerationTimer--;
            }
        } else {
            // Если травы достаточно - сбрасываем таймер
            this.regenerationTimer = 0;
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