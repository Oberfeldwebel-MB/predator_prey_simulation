import Animal from './Animal';

class Herbivore extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffffff',
            radius: 10,
            species: 'zebra',
            maxSpeed: 1.0,
            searchRange: 150
        };
        
        const settings = { ...defaults, ...options };
        super(x, y, settings.color, settings.radius, "herbivore", settings.maxSpeed);
        
        this.species = settings.species;
        this.searchRange = settings.searchRange;
        this.currentTargetGrass = null;
    }

    // Поиск ближайшей травы в радиусе видимости
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

    // Движение к траве
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

    // Попытка поесть
    tryToEat(world) {
        // Ест только если голоден (голод > 50)
        if (this.hunger < 50) {
            this.currentTargetGrass = null;
            return false;
        }
        
        // Проверяем, существует ли ещё цель
        if (this.currentTargetGrass && this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
        }
        
        // Если нет цели — ищем
        if (!this.currentTargetGrass) {
            this.currentTargetGrass = this.findFood(world);
            if (this.currentTargetGrass) {
                console.log(`🦓 ${this.species} нашёл траву на (${this.currentTargetGrass.x.toFixed(0)}, ${this.currentTargetGrass.y.toFixed(0)})`);
            }
        }
        
        // Если цель не найдена — выходим
        if (!this.currentTargetGrass) {
            return false;
        }
        
        // Дополнительная проверка
        if (this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
            return false;
        }
        
        // Двигаемся к траве
        this.seekGrass(this.currentTargetGrass);
        
        // Ещё раз проверяем
        if (!this.currentTargetGrass || this.currentTargetGrass.isDepleted()) {
            this.currentTargetGrass = null;
            return false;
        }
        
        const dx = this.currentTargetGrass.x - this.x;
        const dy = this.currentTargetGrass.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Если достаточно близко — съедаем
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
}

export default Herbivore;