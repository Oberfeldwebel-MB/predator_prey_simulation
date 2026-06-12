class Grass {
    constructor(x, y, radius = 12) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.amount = 100;
        this.isEaten = false;
    }

    eat(eatAmount = 25) {
        if (this.isEaten) return 0;
        
        const eaten = this.amount;
        this.amount = 0;
        this.isEaten = true;
        
        return eaten;
    }

    isDepleted() {
        return this.isEaten;
    }

    draw(ctx) {
        if (this.isDepleted()) return;
        
        ctx.fillStyle = `rgb(40, 160, 40)`;
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

export default Grass;