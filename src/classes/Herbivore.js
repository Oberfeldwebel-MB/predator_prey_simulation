import Animal from './Animal';

class Herbivore extends Animal {
    constructor(x, y, options = {}) {
        const defaults = {
            color: '#ffffff',
            radius: 10,
            species: 'zebra',
            maxSpeed: 2.8,
            courage: 30 + Math.random() * 50
        };
        
        const settings = { ...defaults, ...options };
        
        // Передаём maxSpeed в базовый класс
        super(x, y, settings.color, settings.radius, "herbivore", settings.maxSpeed);
        
        this.species = settings.species;
        this.courage = settings.courage;
    }

    defend() {
        if (this.courage > 50 && Math.random() < 0.2) {
            console.log(`${this.species} защитился!`);
            return true;
        }
        console.log(`${this.species} не смог защититься`);
        return false;
    }

    eatGrass(grass) {
        if (!grass || grass.isDepleted) return false;
        
        const eaten = grass.eat(25);
        if (eaten > 0) {
            this.eat(eaten);
            console.log(`${this.species} съел траву +${eaten.toFixed(1)}`);
            return true;
        }
        return false;
    }
}

export default Herbivore;