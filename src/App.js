import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import World from './classes/World';
import Herbivore from './classes/Herbivore';
import Predator from './classes/Predator';
import Grass from './classes/Grass';
import PopulationChart from './classes/PopulationChart';

function App() {
  const canvasRef = useRef(null);
  const chartCanvasRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const animationRef = useRef(null);
  const [world] = useState(new World(800, 600));
  const [herbivores, setHerbivores] = useState([]);
  const [predators, setPredators] = useState([]);
  const [grassPatches, setGrassPatches] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('default');
  
  // Состояния для панели управления
  const [zebraCount, setZebraCount] = useState(10);
  const [zebraSpeed, setZebraSpeed] = useState(1.0);
  const [lionCount, setLionCount] = useState(6);
  const [lionSpeed, setLionSpeed] = useState(1.2);
  const [grassCount, setGrassCount] = useState(35);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // История для графиков (храним всё)
  const [populationHistory, setPopulationHistory] = useState({
    zebras: [],
    lions: [],
    grass: []
  });
  const [recordCounter, setRecordCounter] = useState(0);
  const RECORD_INTERVAL = 30; // запись раз в 30 кадров (~0.5 сек)

  // Инициализация графика
  useEffect(() => {
    if (chartCanvasRef.current && chartContainerRef.current && !chartRef.current) {
      chartRef.current = new PopulationChart(
        chartCanvasRef.current, 
        chartContainerRef, 
        2,    // 2 пикселя на точку
        120   // высота
      );
    }
  }, []);

  // Отрисовка графика при изменении истории
  useEffect(() => {
    if (chartRef.current && populationHistory.zebras.length > 0) {
      chartRef.current.draw(
        populationHistory.zebras,
        populationHistory.lions,
        populationHistory.grass
      );
      // Автоскролл в конец
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.scrollToEnd();
        }
      }, 10);
    }
  }, [populationHistory]);

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
  const createNonOverlappingGrass = (worldWidth, worldHeight, count) => {
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

  // Функция для расчета полов (50/50)
  const calculateGenders = (count) => {
    const males = Math.ceil(count / 2);
    const females = Math.floor(count / 2);
    return { males, females };
  };

  // Функция очистки истории
  const clearHistory = () => {
    setPopulationHistory({ zebras: [], lions: [], grass: [] });
    setRecordCounter(0);
    if (chartRef.current) {
      chartRef.current.clear();
    }
  };

  // Функция инициализации мира с заданными параметрами
  const initializeWorld = () => {
    // Очищаем историю
    clearHistory();
    
    // Создаём траву
    const newGrass = createNonOverlappingGrass(world.width, world.height, grassCount);
    world.grassPatches = newGrass;
    setGrassPatches(newGrass);

    const newHerbivores = [];
    const { males: zebraMales, females: zebraFemales } = calculateGenders(zebraCount);
    
    // Зебры
    for (let i = 0; i < zebraMales; i++) {
      newHerbivores.push(new Herbivore(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'zebra', color: '#ffffff', radius: 12, maxSpeed: zebraSpeed, gender: 'male' }
      ));
    }
    for (let i = 0; i < zebraFemales; i++) {
      newHerbivores.push(new Herbivore(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'zebra', color: '#ffffff', radius: 12, maxSpeed: zebraSpeed, gender: 'female' }
      ));
    }
    
    world.herbivores = newHerbivores;
    setHerbivores(newHerbivores);

    // Создаём львов
    const newPredators = [];
    const { males: lionMales, females: lionFemales } = calculateGenders(lionCount);
    
    for (let i = 0; i < lionMales; i++) {
      newPredators.push(new Predator(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'lion', color: '#ffd700', radius: 12, maxSpeed: lionSpeed, gender: 'male' }
      ));
    }
    for (let i = 0; i < lionFemales; i++) {
      newPredators.push(new Predator(
        Math.random() * world.width,
        Math.random() * world.height,
        { species: 'lion', color: '#ffd700', radius: 12, maxSpeed: lionSpeed, gender: 'female' }
      ));
    }
    world.predators = newPredators;
    setPredators(newPredators);
    
    setIsInitialized(true);
  };

  // Инициализация мира при монтировании
  useEffect(() => {
    initializeWorld();
  }, []);

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
    if (!isInitialized) return;
    
    const updateAnimation = () => {
      if (!isRunning || isPaused) {
        animationRef.current = requestAnimationFrame(updateAnimation);
        return;
      }
      
      world.update();
      
      const newGrass = [...world.grassPatches];
      const newHerbivores = [...world.herbivores];
      const newPredators = [...world.predators];
      
      setGrassPatches(newGrass);
      setHerbivores(newHerbivores);
      setPredators(newPredators);
      
      // Запись данных для графиков
      setRecordCounter(prev => {
        if (prev >= RECORD_INTERVAL) {
          const aliveZebras = newHerbivores.filter(h => h.isAlive).length;
          const aliveLions = newPredators.filter(p => p.isAlive).length;
          const aliveGrassCount = newGrass.filter(g => !g.isDepleted()).length;
          
          setPopulationHistory(prevHistory => ({
            zebras: [...prevHistory.zebras, aliveZebras],
            lions: [...prevHistory.lions, aliveLions],
            grass: [...prevHistory.grass, aliveGrassCount]
          }));
          return 0;
        }
        return prev + 1;
      });
      
      // Обновляем позиции животных
      setHerbivores(prev => {
        const newHerbivoresList = [...prev];
        newHerbivoresList.forEach(herbivore => {
          if (herbivore.isAlive) {
            herbivore.moveWithInertia(world.width, world.height);
          }
        });
        return newHerbivoresList;
      });
      
      setPredators(prev => {
        const newPredatorsList = [...prev];
        newPredatorsList.forEach(predator => {
          if (predator.isAlive) {
            predator.moveWithInertia(world.width, world.height);
          }
        });
        return newPredatorsList;
      });
      
      animationRef.current = requestAnimationFrame(updateAnimation);
    };

    updateAnimation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [world, isRunning, isPaused, isInitialized]);

  // Отрисовка при изменении состояния
  useEffect(() => {
    if (!isInitialized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    draw(ctx, world.width, world.height, grassPatches, herbivores, predators);
  }, [herbivores, predators, grassPatches, world, selectedAnimal, isInitialized]);

  // Статистика
  const aliveHerbivores = herbivores.filter(h => h.isAlive).length;
  const alivePredators = predators.filter(p => p.isAlive).length;
  const aliveGrass = grassPatches.filter(g => !g.isDepleted()).length;

  const allAnimals = [...herbivores, ...predators].filter(a => a.isAlive);

  const getAnimalStatus = (animal) => {
    if (!animal) return "";
    if (!animal.isAlive) return "💀 Мертв";
    
    if (animal.type === "predator") {
      if (animal.currentTarget && animal.currentTarget.isAlive) return "🦁 Преследует добычу";
      if (animal.huntingCooldown > 0) return "😴 Отдыхает после охоты";
      if (animal.hunger > 60) return "🍽️ Голоден, ищет добычу";
      return "🚶 Бродит";
    } else {
      if (animal.currentTargetGrass && !animal.currentTargetGrass.isDepleted()) return "🌿 Идет к траве";
      if (animal.hunger > 50) return "🍽️ Голоден, ищет траву";
      return "🌾 Пасётся";
    }
  };

  // Обработчики кнопок
  const handleStart = () => {
    console.log("Старт");
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    console.log("Пауза");
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    console.log("Сброс");
    setIsRunning(false);
    setIsPaused(false);
    initializeWorld();
    setIsRunning(true);
  };

  const handleApplySettings = () => {
    console.log("Применить настройки");
    if (lionSpeed <= zebraSpeed) {
      alert("Львы должны быть быстрее зебр!");
      return;
    }
    setIsRunning(false);
    setIsPaused(false);
    initializeWorld();
    setIsRunning(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ecosystem Simulation</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center' }}>
          
          {/* ЛЕВАЯ КОЛОНКА — Статистика и список животных */}
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
                <span>🦓 Зебры:</span>
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
                    {animal.type === "predator" ? "🦁" : "🦓"}
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
                  <div>⏳ Кулдаун: {selectedAnimal.matingCooldown > 0 ? selectedAnimal.matingCooldown + " кадров" : "Готов к размножению"}</div>
                </div>
              </>
            )}
          </div>
          
          {/* ЦЕНТРАЛЬНАЯ КОЛОНКА — Canvas поле */}
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
          
          {/* ПРАВАЯ КОЛОНКА — Панель управления */}
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '12px',
            borderRadius: '8px',
            width: '240px',
            textAlign: 'left',
            color: '#fff',
            fontSize: '13px',
            maxHeight: '600px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Управление (кнопки) */}
            <div>
              <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>⚙️ Управление</h3>
              <button 
                onClick={handleStart}
                style={{ width: '100%', padding: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                ▶ СТАРТ
              </button>
              <button 
                onClick={handlePause}
                style={{ width: '100%', padding: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                {isPaused ? "▶ ПРОДОЛЖИТЬ" : "⏸ ПАУЗА"}
              </button>
              <button 
                onClick={handleReset}
                style={{ width: '100%', padding: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                🔄 СБРОС
              </button>
              <button 
                onClick={handleApplySettings}
                style={{ width: '100%', padding: '8px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                ✔ ПРИМЕНИТЬ
              </button>
            </div>
            
            {/* Настройки */}
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>🐆 Настройки</div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🦓 Зебры:</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="50" 
                    step="1"
                    value={zebraCount}
                    onChange={(e) => setZebraCount(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px' }}>Скорость:</span>
                  <input 
                    type="number" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={zebraSpeed}
                    onChange={(e) => setZebraSpeed(parseFloat(e.target.value))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🦁 Львы:</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="30" 
                    step="1"
                    value={lionCount}
                    onChange={(e) => setLionCount(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px' }}>Скорость:</span>
                  <input 
                    type="number" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={lionSpeed}
                    onChange={(e) => setLionSpeed(parseFloat(e.target.value))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                </div>
                {lionSpeed <= zebraSpeed && (
                  <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>
                    ⚠️ Львы должны быть быстрее зебр!
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🌿 Трава:</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="80" 
                    step="1"
                    value={grassCount}
                    onChange={(e) => setGrassCount(Math.min(80, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                </label>
              </div>
            </div>
            
            {/* Графики с горизонтальным скроллом */}
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>📈 Динамика популяций</div>
              <div 
                ref={chartContainerRef}
                style={{ 
                  overflowX: 'auto', 
                  width: '216px', 
                  border: '1px solid #444', 
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a'
                }}
              >
                <canvas 
                  ref={chartCanvasRef}
                  width={216}
                  height={120}
                  style={{ 
                    display: 'block',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '5px', fontSize: '10px' }}>
                <span style={{ color: '#ffffff' }}>🦓 Зебры</span>
                <span style={{ color: '#ffd700' }}>🦁 Львы</span>
                <span style={{ color: '#4caf50' }}>🌿 Трава</span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;