class Grass {
    constructor(x, y, radius = 12) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.amount = 100;
        this.isDepleted = false;
    }

    // Поедание травы (возвращает, сколько реально съедено)
    eat(eatAmount = 20) {
        if (this.isDepleted) return 0;
        
        const eaten = Math.min(eatAmount, this.amount);
        this.amount -= eaten;
        
        if (this.amount <= 0) {
            this.isDepleted = true;
        }
        
        return eaten;
    }

    // Проверка пересечения с другой травой
    overlaps(otherGrass, minDistance = 20) {
        const dx = this.x - otherGrass.x;
        const dy = this.y - otherGrass.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + otherGrass.radius + minDistance;
    }

    // Отрисовка на canvas
    draw(ctx) {
        if (this.isDepleted) return;
        
        // Цвет травы в зависимости от количества
        const greenIntensity = 80 + Math.floor(this.amount * 0.8);
        ctx.fillStyle = `rgb(40, ${greenIntensity}, 40)`;
        
        ctx.beginPath();
        // Рисуем овал (сплюснутый круг, похож на пучок травы)
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Лёгкая обводка
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Проверка, находится ли животное рядом с травой (для поедания)
    isAnimalNearby(animal, distanceThreshold = 15) {
        const dx = this.x - animal.x;
        const dy = this.y - animal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + animal.radius + distanceThreshold;
    }
}

export default Grass;