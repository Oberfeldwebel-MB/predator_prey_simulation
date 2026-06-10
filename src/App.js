import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import World from './classes/World';
import Animal from './classes/Animal';

function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [world] = useState(new World(800, 600));
  const [animals, setAnimals] = useState([]);

  // Создаём животных при запуске
  useEffect(() => {
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
    setAnimals(newAnimals);
  }, [world]);

  // Функция отрисовки
  const draw = (ctx, width, height, animalsList) => {
    // Очищаем поле (трава)
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, width, height);

    // Рисуем сетку (полупрозрачную)
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

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

  // Отрисовка при изменении animals
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    draw(ctx, world.width, world.height, animals);
  }, [animals, world]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ecosystem Simulation</h1>
        <p>🦁 Львы (жёлтые) | 🦓 Зебры (белые) | 🐃 Буйволы (чёрные)</p>
        <canvas 
          ref={canvasRef}
          width={world.width}
          height={world.height}
          style={{ border: '2px solid #333', marginTop: '20px', backgroundColor: '#2e7d32' }}
        />
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Животные двигаются плавно (с инерцией)
        </p>
      </header>
    </div>
  );
}

export default App;