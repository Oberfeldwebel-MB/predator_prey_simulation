class Animal {
    constructor(x, y, color, radius, type = "animal", maxSpeed = 2.5) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.type = type;
        this.isAlive = true;
        
        this.maxSpeed = maxSpeed;
        this.minSpeed = 0.5;
        this.hunger = 30 + Math.random() * 50;
        this.stamina = 50 + Math.random() * 50;
        
        // Инерция: одно направление надолго
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * (this.maxSpeed * 0.6);
        this.dy = Math.sin(angle) * (this.maxSpeed * 0.6);
        
        // Счётчик для редкой смены направления (раз в 3-5 секунд)
        this.directionChangeCooldown = 0;
    }

    getCurrentSpeed() {
        let speedFactor = this.stamina / 100;
        
        if (this.type === "predator") {
            speedFactor *= (1 + (100 - this.hunger) / 150);
        } else {
            speedFactor *= (this.hunger > 50 ? (120 - this.hunger) / 70 : 1);
        }
        
        let speed = this.maxSpeed * Math.max(0.4, Math.min(1.2, speedFactor));
        return Math.max(this.minSpeed, speed);
    }

    moveWithInertia(width, height) {
        const currentSpeed = this.getCurrentSpeed();
        
        // Нормализуем вектор направления и применяем текущую скорость
        const len = Math.hypot(this.dx, this.dy);
        if (len > 0.01) {
            this.dx = (this.dx / len) * currentSpeed;
            this.dy = (this.dy / len) * currentSpeed;
        }
        
        // Редкая смена направления (раз в 120-240 кадров ≈ 2-4 секунды)
        this.directionChangeCooldown--;
        if (this.directionChangeCooldown <= 0) {
            const angle = Math.random() * Math.PI * 2;
            this.dx = Math.cos(angle) * currentSpeed;
            this.dy = Math.sin(angle) * currentSpeed;
            this.directionChangeCooldown = 120 + Math.floor(Math.random() * 120);
        }
        
        // Движение
        this.x += this.dx;
        this.y += this.dy;
        
        // Отскок от стен (с сохранением инерции)
        if (this.x < this.radius) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx);
        }
        if (this.x > width - this.radius) {
            this.x = width - this.radius;
            this.dx = -Math.abs(this.dx);
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.dy = Math.abs(this.dy);
        }
        if (this.y > height - this.radius) {
            this.y = height - this.radius;
            this.dy = -Math.abs(this.dy);
        }
        
        // Медленные изменения состояния
        this.hunger = Math.min(100, this.hunger + 0.03);
        this.stamina = Math.max(10, this.stamina - 0.01);
    }

    eat(amount = 30) {
        this.hunger = Math.max(0, this.hunger - amount);
        this.stamina = Math.min(100, this.stamina + amount / 2);
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