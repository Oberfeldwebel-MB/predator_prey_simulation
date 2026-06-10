import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import World from './classes/World';
import Animal from './classes/Animal';
import Grass from './classes/Grass';

function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [world] = useState(new World(800, 600));
  const [animals, setAnimals] = useState([]);
  const [grassPatches, setGrassPatches] = useState([]);

  // Функция проверки пересечения травы
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

  // Функция создания травы без наложений
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
          10 + Math.random() * 10  // радиус от 10 до 20
        );
        
        if (!isOverlapping(potentialGrass, grassPatches, 25)) {
          grassPatches.push(potentialGrass);
          placed = true;
        }
        attempts++;
      }
      
      // Если не удалось разместить — добавляем в любом случае
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

  // Создаём животных и траву при запуске
  useEffect(() => {
    // Создаём траву без наложений
    const newGrass = createNonOverlappingGrass(world.width, world.height, 35);
    world.grassPatches = newGrass;
    setGrassPatches(newGrass);

    // Создаём животных (пока старый класс Animal)
    const newAnimals = [];
    // 3 льва (жёлтые)
    for (let i = 0; i < 3; i++) {
      newAnimals.push(new Animal(
        Math.random() * world.width,
        Math.random() * world.height,
        '#ffd700',
        12
      ));
    }
    // 5 зебр (белые)
    for (let i = 0; i < 5; i++) {
      newAnimals.push(new Animal(
        Math.random() * world.width,
        Math.random() * world.height,
        '#ffffff',
        10
      ));
    }
    // 2 буйвола (чёрные)
    for (let i = 0; i < 2; i++) {
      newAnimals.push(new Animal(
        Math.random() * world.width,
        Math.random() * world.height,
        '#333333',
        14
      ));
    }
    world.herbivores = newAnimals.filter(a => a.color !== '#ffd700');
    world.predators = newAnimals.filter(a => a.color === '#ffd700');
    setAnimals(newAnimals);
  }, [world]);

  // Функция отрисовки
  const draw = (ctx, width, height, grassList, animalsList) => {
    // Очищаем поле (цвет земли)
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, width, height);

    // Рисуем траву
    grassList.forEach(grass => grass.draw(ctx));
    
    // Рисуем всех животных
    animalsList.forEach(animal => animal.draw(ctx));
  };

  // Анимация (обновление позиций и перерисовка)
  useEffect(() => {
    const updateAnimation = () => {
      setAnimals(prevAnimals => {
        const newAnimals = [...prevAnimals];
        newAnimals.forEach(animal => {
          animal.moveWithInertia(world.width, world.height, 1.5, 0.01);
        });
        return newAnimals;
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

  // Отрисовка при изменении animals или grassPatches
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    draw(ctx, world.width, world.height, grassPatches, animals);
  }, [animals, grassPatches, world]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ecosystem Simulation</h1>
        <p>🦁 Львы (жёлтые) | 🦓 Зебры (белые) | 🐃 Буйволы (чёрные) | 🌿 Трава (зелёные овалы)</p>
        <canvas 
          ref={canvasRef}
          width={world.width}
          height={world.height}
          style={{ border: '2px solid #333', marginTop: '20px', backgroundColor: '#8B5A2B' }}
        />
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Животные двигаются плавно (с инерцией) | Трава не накладывается друг на друга
        </p>
      </header>
    </div>
  );
}

export default App;