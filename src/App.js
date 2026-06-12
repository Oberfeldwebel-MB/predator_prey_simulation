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
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('default');

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
    const newGrass = createNonOverlappingGrass(world.width, world.height, 35);
    world.grassPatches = newGrass;
    setGrassPatches(newGrass);

    const newHerbivores = [];
    
    // 5 зебр
    for (let i = 0; i < 5; i++) {
      newHerbivores.push(new Herbivore(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'zebra', color: '#ffffff', radius: 12, maxSpeed: 1.0 }
      ));
    }
    
    // 2 буйвола
    for (let i = 0; i < 2; i++) {
      newHerbivores.push(new Herbivore(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'buffalo', color: '#333333', radius: 12, maxSpeed: 0.8 }
      ));
    }
    
    world.herbivores = newHerbivores;
    setHerbivores(newHerbivores);

    // Создаём хищников (львы) - 6 особей для стабильности
    const newPredators = [];
    for (let i = 0; i < 6; i++) {
      newPredators.push(new Predator(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'lion', color: '#ffd700', radius: 12, maxSpeed: 1.2 }
      ));
    }
    world.predators = newPredators;
    setPredators(newPredators);
  }, [world]);

  // Обработчик движения мыши для изменения курсора
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;
    
    mouseX = Math.min(canvas.width, Math.max(0, mouseX));
    mouseY = Math.min(canvas.height, Math.max(0, mouseY));
    
    const allAnimals = [...herbivores, ...predators];
    const isOverAnimal = allAnimals.some(animal => {
      if (!animal.isAlive) return false;
      const dx = animal.x - mouseX;
      const dy = animal.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= animal.radius + 5;
    });
    
    setCursorStyle(isOverAnimal ? 'pointer' : 'default');
  };

  // Обработчик клика на canvas
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;
    
    mouseX = Math.min(canvas.width, Math.max(0, mouseX));
    mouseY = Math.min(canvas.height, Math.max(0, mouseY));
    
    const allAnimals = [...herbivores, ...predators];
    const clickedAnimal = allAnimals.find(animal => {
      if (!animal.isAlive) return false;
      const dx = animal.x - mouseX;
      const dy = animal.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= animal.radius + 5;
    });
    
    if (clickedAnimal) {
      setSelectedAnimal(clickedAnimal);
    } else {
      setSelectedAnimal(null);
    }
  };

  // Отрисовка с подсветкой выбранного животного
  const draw = (ctx, width, height, grassList, herbivoresList, predatorsList) => {
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, width, height);

    grassList.forEach(grass => grass.draw(ctx));
    
    const allAnimals = [...herbivoresList, ...predatorsList];
    allAnimals.forEach(animal => {
      if (selectedAnimal === animal) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'yellow';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      animal.draw(ctx);
      if (selectedAnimal === animal) {
        ctx.restore();
        ctx.beginPath();
        ctx.arc(animal.x, animal.y, animal.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  // Анимация
  useEffect(() => {
    const updateAnimation = () => {
      world.update();
      
      setGrassPatches([...world.grassPatches]);
      setHerbivores([...world.herbivores]);
      setPredators([...world.predators]);
      
      setHerbivores(prev => {
        const newHerbivores = [...prev];
        newHerbivores.forEach(herbivore => {
          if (herbivore.isAlive) {
            herbivore.moveWithInertia(world.width, world.height);
          }
        });
        return newHerbivores;
      });
      
      setPredators(prev => {
        const newPredators = [...prev];
        newPredators.forEach(predator => {
          if (predator.isAlive) {
            predator.moveWithInertia(world.width, world.height);
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    draw(ctx, world.width, world.height, grassPatches, herbivores, predators);
  }, [herbivores, predators, grassPatches, world, selectedAnimal]);

  // Статистика
  const aliveHerbivores = herbivores.filter(h => h.isAlive).length;
  const alivePredators = predators.filter(p => p.isAlive).length;
  const aliveGrass = grassPatches.filter(g => !g.isDepleted()).length;

  const allAnimals = [...herbivores, ...predators].filter(a => a.isAlive);

  const getAnimalStatus = (animal) => {
    if (!animal) return "";
    if (!animal.isAlive) return "💀 Мёртв";
    
    if (animal.type === "predator") {
      if (animal.currentTarget && animal.currentTarget.isAlive) return "🦁 Преследует добычу";
      if (animal.huntingCooldown > 0) return "😴 Отдыхает после охоты";
      if (animal.hunger > 60) return "🍽️ Голоден, ищет добычу";
      return "🚶 Бродит";
    } else {
      if (animal.currentTargetGrass && !animal.currentTargetGrass.isDepleted()) return "🌿 Идёт к траве";
      if (animal.hunger > 50) return "🍽️ Голоден, ищет траву";
      return "🌾 Пасётся";
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ecosystem Simulation</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Левая панель */}
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '12px',
            borderRadius: '8px',
            minWidth: '220px',
            textAlign: 'left',
            color: '#fff',
            fontSize: '13px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>🦁 Львы:</span>
                <span style={{ fontWeight: 'bold' }}>{alivePredators}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>🦓 Зебры + 🐃 Буйволы:</span>
                <span style={{ fontWeight: 'bold' }}>{aliveHerbivores}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🌿 Трава:</span>
                <span style={{ fontWeight: 'bold' }}>{aliveGrass}</span>
              </div>
            </div>
            
            <hr style={{ margin: '10px 0' }} />
            
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📋 Список животных:</div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {allAnimals.map((animal, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAnimal(animal)}
                  style={{
                    padding: '6px 8px',
                    marginBottom: '4px',
                    backgroundColor: selectedAnimal === animal ? '#3a6ea5' : '#3a3a3a',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <span>
                    {animal.type === "predator" ? "🦁" : animal.species === 'zebra' ? "🦓" : "🐃"}
                    {' '}{animal.species || animal.constructor.name}
                    {' '}{animal.gender === "male" ? "♂" : "♀"}
                  </span>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>
                    🍽️ {Math.round(animal.hunger)}%
                  </span>
                </div>
              ))}
              {allAnimals.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>
                  Все животные погибли
                </div>
              )}
            </div>
            
            {selectedAnimal && selectedAnimal.isAlive && (
              <>
                <hr style={{ margin: '10px 0' }} />
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {selectedAnimal.species || selectedAnimal.constructor.name}
                    {' '}{selectedAnimal.gender === "male" ? "♂" : "♀"}
                  </div>
                  <div>🍽️ Голод: {Math.round(selectedAnimal.hunger)}%</div>
                  <div>⚡ Выносливость: {Math.round(selectedAnimal.stamina)}%</div>
                  <div>{getAnimalStatus(selectedAnimal)}</div>
                  {selectedAnimal.type === "herbivore" && (
                    <div>🛡️ Смелость: {Math.round(selectedAnimal.courage)}%</div>
                  )}
                  <div>⏳ Кулдаун: {selectedAnimal.matingCooldown > 0 ? selectedAnimal.matingCooldown + " кадров" : "Готов к размножению"}</div>
                </div>
              </>
            )}
          </div>
          
          <canvas 
            ref={canvasRef}
            width={world.width}
            height={world.height}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            style={{ 
              border: '2px solid #333', 
              marginTop: '20px', 
              backgroundColor: '#8B5A2B',
              cursor: cursorStyle
            }}
          />
        </div>
      </header>
    </div>
  );
}

export default App;