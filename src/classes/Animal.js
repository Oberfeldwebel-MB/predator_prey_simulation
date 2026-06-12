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
        
        // Животные рождаются сытыми
        this.hunger = 10 + Math.random() * 20;  // от 10 до 30
        this.stamina = 60 + Math.random() * 30; // от 60 до 90
        
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * (this.maxSpeed * 0.6);
        this.dy = Math.sin(angle) * (this.maxSpeed * 0.6);
        this.directionChangeCooldown = 0;
    }

    getCurrentSpeed() {
        let speedFactor = this.stamina / 100;
        
        if (this.type === "predator") {
            speedFactor *= (1 + (100 - this.hunger) / 150);
        } else {
            speedFactor *= (this.hunger > 50 ? (120 - this.hunger) / 70 : 1);
        }
        
        let speed = this.maxSpeed * Math.max(0.3, Math.min(1.2, speedFactor));
        return Math.max(this.minSpeed, speed);
    }

    updateState() {
        this.hunger = Math.min(100, this.hunger + 0.02);
        this.stamina = Math.max(0, this.stamina - 0.01);
        
        if (this.hunger >= 100) {
            console.log(`${this.constructor.name} умер от голода`);
            this.isAlive = false;
        }
        
        if (this.stamina <= 0 && this.hunger > 85) {
            console.log(`${this.constructor.name} умер от истощения`);
            this.isAlive = false;
        }
    }

    // Проверка, есть ли у животного активная цель
    hasActiveTarget() {
        if (this.type === "predator") {
            return this.currentTarget && this.currentTarget.isAlive;
        } else if (this.type === "herbivore") {
            return this.currentTargetGrass && !this.currentTargetGrass.isDepleted();
        }
        return false;
    }

    moveWithInertia(width, height) {
        if (!this.isAlive) return;
        
        const currentSpeed = this.getCurrentSpeed();
        
        // Нормализация вектора скорости
        const len = Math.hypot(this.dx, this.dy);
        if (len > 0.01) {
            this.dx = (this.dx / len) * currentSpeed;
            this.dy = (this.dy / len) * currentSpeed;
        }
        
        // Случайное блуждание ТОЛЬКО если нет цели
        if (!this.hasActiveTarget()) {
            this.directionChangeCooldown--;
            if (this.directionChangeCooldown <= 0) {
                const angle = Math.random() * Math.PI * 2;
                this.dx = Math.cos(angle) * currentSpeed;
                this.dy = Math.sin(angle) * currentSpeed;
                this.directionChangeCooldown = 120 + Math.floor(Math.random() * 120);
            }
        }
        
        // Движение
        this.x += this.dx;
        this.y += this.dy;
        
        // Отскок от стен
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
        
        this.updateState();
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