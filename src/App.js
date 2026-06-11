import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import World from './classes/World';
import Herbivore from './classes/Herbivore';
import Predator from './classes/Predator';
import Grass from './classes/Grass';

function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [world] = useState(new World(800, 600));
  const [herbivores, setHerbivores] = useState([]);
  const [predators, setPredators] = useState([]);
  const [grassPatches, setGrassPatches] = useState([]);

  // Проверка пересечения травы
  const isOverlapping = (newGrass, existingGrass, minDistance = 25) => {
    for (const grass of existingGrass) {
      const dx = grass.x - newGrass.x;
      const dy = grass.y - newGrass.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < grass.radius + newGrass.radius + minDistance) {
        return true;
      }
    }
    return false;
  };

  // Создание травы без наложений
  const createNonOverlappingGrass = (worldWidth, worldHeight, count = 35) => {
    const grassPatches = [];
    const maxAttempts = 200;
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let placed = false;
      
      while (!placed && attempts < maxAttempts) {
        const potentialGrass = new Grass(
          Math.random() * worldWidth,
          Math.random() * worldHeight,
          10 + Math.random() * 10
        );
        
        if (!isOverlapping(potentialGrass, grassPatches, 25)) {
          grassPatches.push(potentialGrass);
          placed = true;
        }
        attempts++;
      }
      
      if (!placed) {
        console.warn(`Не удалось разместить траву без наложения (попытка ${i + 1})`);
        grassPatches.push(new Grass(
          Math.random() * worldWidth,
          Math.random() * worldHeight,
          10 + Math.random() * 10
        ));
      }
    }
    
    return grassPatches;
  };

  // Инициализация мира
  useEffect(() => {
    // Создаём траву
    const newGrass = createNonOverlappingGrass(world.width, world.height, 35);
    world.grassPatches = newGrass;
    setGrassPatches(newGrass);

    // Создаём травоядных (зебры и буйволы)
    const newHerbivores = [];
    
    // 5 зебр
    for (let i = 0; i < 5; i++) {
      newHerbivores.push(new Herbivore(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'zebra', color: '#ffffff', radius: 10, maxSpeed: 2.8, courage: 30 + Math.random() * 40 }
      ));
    }
    
    // 2 буйвола
    for (let i = 0; i < 2; i++) {
      newHerbivores.push(new Herbivore(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'buffalo', color: '#333333', radius: 14, maxSpeed: 2.2, courage: 60 + Math.random() * 30 }
      ));
    }
    
    world.herbivores = newHerbivores;
    setHerbivores(newHerbivores);

    // Создаём хищников (львы)
    const newPredators = [];
    for (let i = 0; i < 3; i++) {
      newPredators.push(new Predator(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'lion', color: '#ffd700', radius: 12, maxSpeed: 3.0 }
      ));
    }
    world.predators = newPredators;
    setPredators(newPredators);
  }, [world]);

  // Отрисовка
  const draw = (ctx, width, height, grassList, herbivoresList, predatorsList) => {
    // Фон (земля)
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, width, height);

    // Трава
    grassList.forEach(grass => grass.draw(ctx));
    
    // Травоядные
    herbivoresList.forEach(herbivore => herbivore.draw(ctx));
    
    // Хищники
    predatorsList.forEach(predator => predator.draw(ctx));
  };

  // Анимация (движение животных)
  useEffect(() => {
    const updateAnimation = () => {
      // Обновляем травоядных
      setHerbivores(prev => {
        const newHerbivores = [...prev];
        newHerbivores.forEach(herbivore => {
          if (herbivore.isAlive) {
            herbivore.moveWithInertia(world.width, world.height, 1.5, 0.01);
          }
        });
        return newHerbivores;
      });
      
      // Обновляем хищников
      setPredators(prev => {
        const newPredators = [...prev];
        newPredators.forEach(predator => {
          if (predator.isAlive) {
            predator.moveWithInertia(world.width, world.height, 1.5, 0.01);
          }
        });
        return newPredators;
      });
      
      animationRef.current = requestAnimationFrame(updateAnimation);
    };

    updateAnimation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [world]);

  // Отрисовка при изменении состояния
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    draw(ctx, world.width, world.height, grassPatches, herbivores, predators);
  }, [herbivores, predators, grassPatches, world]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ecosystem Simulation</h1>
        <p>🦁 Хищники (жёлтые) | 🦓 Травоядные (белые/чёрные) | 🌿 Трава (зелёные овалы)</p>
        <canvas 
          ref={canvasRef}
          width={world.width}
          height={world.height}
          style={{ border: '2px solid #333', marginTop: '20px', backgroundColor: '#8B5A2B' }}
        />
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Животные двигаются плавно | Трава не накладывается
        </p>
      </header>
    </div>
  );
}

export default App;