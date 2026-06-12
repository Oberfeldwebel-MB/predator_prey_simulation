class Animal {
    constructor(x, y, color, radius, type, maxSpeed, gender = null, isChild = false) {
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
        
        // Размножение
        this.gender = gender || (Math.random() < 0.5 ? "male" : "female");
        this.matingCooldown = 0;
        this.childCooldown = isChild ? 600 : 0;  // 10 секунд детства (60 fps)
        this.isChild = isChild;
        
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
        
        // Кулдаун размножения
        if (this.matingCooldown > 0) {
            this.matingCooldown--;
        }
        
        // Детство
        if (this.childCooldown > 0) {
            this.childCooldown--;
            if (this.childCooldown <= 0) {
                this.isChild = false;
                console.log(`🌱 ${this.species || this.constructor.name} достиг половой зрелости`);
            }
        }
        
        if (this.hunger >= 100) {
            console.log(`${this.constructor.name} умер от голода`);
            this.isAlive = false;
        }
        
        if (this.stamina <= 0 && this.hunger > 85) {
            console.log(`${this.constructor.name} умер от истощения`);
            this.isAlive = false;
        }
    }

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
        
        const len = Math.hypot(this.dx, this.dy);
        if (len > 0.01) {
            this.dx = (this.dx / len) * currentSpeed;
            this.dy = (this.dy / len) * currentSpeed;
        }
        
        if (!this.hasActiveTarget()) {
            this.directionChangeCooldown--;
            if (this.directionChangeCooldown <= 0) {
                const angle = Math.random() * Math.PI * 2;
                this.dx = Math.cos(angle) * currentSpeed;
                this.dy = Math.sin(angle) * currentSpeed;
                this.directionChangeCooldown = 120 + Math.floor(Math.random() * 120);
            }
        }
        
        this.x += this.dx;
        this.y += this.dy;
        
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

    // === РАЗМНОЖЕНИЕ ===
    canMate(other) {
        if (this === other) return false;
        if (this.gender === other.gender) return false;
        if (!this.isAlive || !other.isAlive) return false;
        if (this.matingCooldown > 0 || other.matingCooldown > 0) return false;
        if (this.isChild || other.isChild) return false;  // дети не размножаются
        if (this.hunger > 50 || other.hunger > 50) return false;
        
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.radius + other.radius + 40) return false;
        
        return true;
    }

    mateWith(partner, world) {
        if (!this.canMate(partner)) return false;
        
        this.matingCooldown = 400;
        partner.matingCooldown = 400;
        
        const offspringCount = 1;  // только 1 детёныш
        
        for (let i = 0; i < offspringCount; i++) {
            const offspring = this.createOffspring(partner);
            if (offspring) {
                if (this.type === "predator") {
                    world.addPredator(offspring);
                } else {
                    world.addHerbivore(offspring);
                }
            }
        }
        
        const father = this.gender === "male" ? this : partner;
        const mother = this.gender === "female" ? this : partner;
        console.log(`🐾 Родился 1 ${this.species || this.constructor.name} от ${father.species}♂ и ${mother.species}♀`);
        
        return true;
    }

    // Фабричный метод (должен быть переопределён в дочерних классах)
    createOffspring(partner) {
        throw new Error("Метод createOffspring должен быть переопределён в дочернем классе");
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