class Animal {
    constructor(x, y, color, radius) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.isAlive = true;
        
        // Векторы скорости (инерция)
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
    }

    moveWithInertia(width, height, speed = 2, turnChance = 0.02) {
        // С вероятностью turnChance поворачиваем
        if (Math.random() < turnChance) {
            const angle = Math.random() * Math.PI * 2;
            this.dx = Math.cos(angle) * speed;
            this.dy = Math.sin(angle) * speed;
        }
        
        this.x += this.dx;
        this.y += this.dy;
        
        // Отскок от стен
        if (this.x < this.radius) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx) * 0.9;
        }
        if (this.x > width - this.radius) {
            this.x = width - this.radius;
            this.dx = -Math.abs(this.dx) * 0.9;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.dy = Math.abs(this.dy) * 0.9;
        }
        if (this.y > height - this.radius) {
            this.y = height - this.radius;
            this.dy = -Math.abs(this.dy) * 0.9;
        }
        
        // Трение
        this.dx *= 0.99;
        this.dy *= 0.99;
        
        // Минимальная скорость
        if (Math.abs(this.dx) < 0.1 && Math.abs(this.dy) < 0.1) {
            this.dx = (Math.random() - 0.5) * speed;
            this.dy = (Math.random() - 0.5) * speed;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

export default Animal;