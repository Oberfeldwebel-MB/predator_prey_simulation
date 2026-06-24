class Animal {
    constructor(x, y, color, radius, type, maxSpeed, gender = null, isChild = false, matingCooldown = 600) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.type = type;
        this.isAlive = true;
        
        this.maxSpeed = maxSpeed;
        this.minSpeed = 0.5;
        
        this.hunger = 10 + Math.random() * 20;
        this.stamina = 60 + Math.random() * 30;
        
        this.gender = gender || (Math.random() < 0.5 ? "male" : "female");
        this.matingCooldown = matingCooldown;
        this.defaultMatingCooldown = matingCooldown;
        this.childCooldown = isChild ? 600 : 0;
        this.isChild = isChild;
        
        this.mateEffectTimer = 0;
        this.originalColor = color;
        this.mateTarget = null;
        
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * (this.maxSpeed * 0.6);
        this.dy = Math.sin(angle) * (this.maxSpeed * 0.6);
        this.directionChangeCooldown = 0;
    }

    getCurrentSpeed() {
        let speedFactor = (this.stamina / 100) * (1 - (this.hunger / 100) * 0.3);
        
        let speed = this.maxSpeed * Math.max(0.3, speedFactor);
        return Math.max(this.minSpeed, speed);
    }

    updateState() {
        this.hunger = Math.min(100, this.hunger + 0.02);
        this.stamina = Math.max(0, this.stamina - 0.01);
        
        if (this.matingCooldown > 0) {
            this.matingCooldown--;
        }
        
        if (this.childCooldown > 0) {
            this.childCooldown--;
            if (this.childCooldown <= 0) {
                this.isChild = false;
            }
        }
        
        if (this.hunger >= 100) {
            this.isAlive = false;
        }
        
        if (this.stamina <= 0) {
            this.isAlive = false;
        }
    }

    getStatus() {
        if (!this.isAlive) return "Мертв";
        
        if (this.type === "predator") {
            if (this.currentTarget && this.currentTarget.isAlive) return "Преследует добычу";
            if (this.mateTarget && this.mateTarget.isAlive) return "Ищет партнёра";
            if (this.hunger > 60) return "Голоден, ищет добычу";
            return "Бродит";
        } else {
            if (this.currentTargetGrass && !this.currentTargetGrass.isDepleted()) return "Идёт к траве";
            if (this.mateTarget && this.mateTarget.isAlive) return "Ищет партнёра";
            if (this.hunger > 50) return "Голоден, ищет траву";
            return "Пасётся";
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

    isReadyToMate() {
        return this.isAlive && 
               !this.isChild && 
               this.matingCooldown === 0 && 
               this.hunger <= 50;
    }

    seekMate(partner) {
        if (!partner || !partner.isAlive || partner.isChild || partner.matingCooldown > 0) {
            this.mateTarget = null;
            return false;
        }
        
        const dx = partner.x - this.x;
        const dy = partner.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
            const currentSpeed = this.getCurrentSpeed();
            this.dx = (dx / distance) * currentSpeed;
            this.dy = (dy / distance) * currentSpeed;
        }
        
        return true;
    }

    startMateEffect() {
        this.mateEffectTimer = 20;
    }

    moveWithInertia(width, height) {
        if (!this.isAlive) return;
        
        const currentSpeed = this.getCurrentSpeed();
        
        const len = Math.hypot(this.dx, this.dy);
        if (len > 0.01) {
            this.dx = (this.dx / len) * currentSpeed;
            this.dy = (this.dy / len) * currentSpeed;
        }
        
        if (!this.hasActiveTarget() && !this.mateTarget) {
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
        
        // левый край
        if (this.x < this.radius) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx);
        }
        // правый край
        if (this.x > width - this.radius) {
            this.x = width - this.radius;
            this.dx = -Math.abs(this.dx);
        }
        // верхний край
        if (this.y < this.radius) {
            this.y = this.radius;
            this.dy = Math.abs(this.dy);
        }
        // нижний край
        if (this.y > height - this.radius) {
            this.y = height - this.radius;
            this.dy = -Math.abs(this.dy);
        }
        
        if (this.mateEffectTimer > 0) {
            this.mateEffectTimer--;
        }
        
        this.updateState();
    }

    eat(amount) {
        this.hunger = Math.max(0, this.hunger - amount);
        this.stamina = Math.min(100, this.stamina + amount / 2);
    }

    canMate(other) {
        if (this === other) return false;
        if (this.gender === other.gender) return false;
        if (!this.isAlive || !other.isAlive) return false;
        if (this.matingCooldown > 0 || other.matingCooldown > 0) return false;
        if (this.isChild || other.isChild) return false;
        if (this.hunger > 50 || other.hunger > 50) return false;
        
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.radius + other.radius + 2) return false;
        
        return true;
    }

    mateWith(partner, world) {
        if (!this.canMate(partner)) return false;
        
        this.startMateEffect();
        partner.startMateEffect();
        
        this.matingCooldown = this.defaultMatingCooldown;
        partner.matingCooldown = this.defaultMatingCooldown;
        
        this.mateTarget = null;
        partner.mateTarget = null;
        
        const offspringCount = 1;
        
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
        
        return true;
    }

    draw(ctx) {
        if (this.mateEffectTimer > 0) {
            const intensity = Math.sin(Date.now() * 0.03) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 215, 0, ${intensity})`;
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.mateTarget && this.mateTarget.isAlive && this.mateEffectTimer === 0) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.mateEffectTimer > 0) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

export default Animal;