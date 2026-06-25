import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import World from './classes/World';
import Herbivore from './classes/Herbivore';
import Predator from './classes/Predator';
import Grass from './classes/Grass';
import PopulationChart from './classes/PopulationChart';

function App() {
  // ссылки 
  const canvasRef = useRef(null);         // ссылка на html элемент canvas для поля
  const chartCanvasRef = useRef(null);    // ссылка на html элемент canvas для графика (визуал)
  const chartContainerRef = useRef(null); // ссылка на контейнер под график
  const chartRef = useRef(null);          // ссылка на объект класса PopulationChart - график (логика)
  const animationRef = useRef(null);      
  const worldRef = useRef(null);
  
  // состояния 
  const [herbivores, setHerbivores] = useState([]);        
  const [predators, setPredators] = useState([]);
  const [grassPatches, setGrassPatches] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('default');
  
  const [zebraCount, setZebraCount] = useState(10);
  const [zebraSpeed, setZebraSpeed] = useState(1.0);
  const [lionCount, setLionCount] = useState(6);
  const [lionSpeed, setLionSpeed] = useState(1.2);
  const [grassCount, setGrassCount] = useState(35);
  const [zebraMatingCooldownSeconds, setZebraMatingCooldownSeconds] = useState(8);
  const [lionMatingCooldownSeconds, setLionMatingCooldownSeconds] = useState(14);
  const [grassRegenerationSeconds, setGrassRegenerationSeconds] = useState(5);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const [populationHistory, setPopulationHistory] = useState({
    // списки с количеством животных по кадрам
    zebras: [],
    lions: [],
    grass: []
  });  // история популяций для графика 

  const [recordCounter, setRecordCounter] = useState(0);  // счетчик кадров для записи данных
  const RECORD_INTERVAL = 30;

  // Инициализация мира
  useEffect(() => {
    const world = new World(800, 600);
    worldRef.current = world; // сохранаем ссылку на объект мира
    
    // перевод кулдаунов размножения в кадры
    const zebraMatingCooldown = zebraMatingCooldownSeconds * 60;
    const lionMatingCooldown = lionMatingCooldownSeconds * 60;
    const regenerationFrames = grassRegenerationSeconds * 60;
    
    // заполнение мира животными и травой
    const initialState = world.initializeWithParams(
      zebraCount, zebraSpeed, lionCount, lionSpeed, grassCount,
      zebraMatingCooldown, lionMatingCooldown, regenerationFrames,
      Herbivore, Predator
    );
    
    // обновление состояний списков животных и травы
    setGrassPatches(initialState.grassPatches);
    setHerbivores(initialState.herbivores);
    setPredators(initialState.predators);
    
    if (chartCanvasRef.current && chartContainerRef.current && !chartRef.current) {
      // создание объекта графика и сохранение ссылки на него
      chartRef.current = new PopulationChart(
        chartCanvasRef.current, 
        chartContainerRef, 
        2,
        3
      );
    }
  }, []);

  // Запись данных для графиков
  const recordPopulationData = () => {
    if (!worldRef.current) return;
    const counts = worldRef.current.getCounts();
    setPopulationHistory(prev => ({
      zebras: [...prev.zebras, counts.zebras],
      lions: [...prev.lions, counts.lions],
      grass: [...prev.grass, counts.grass]
    }));
  };

  // прорисовка изменений на поле
  useEffect(() => {
    if (!worldRef.current) return;
    
    const updateAnimation = () => {
      if (!isRunning || isPaused) {
        animationRef.current = requestAnimationFrame(updateAnimation);
        return;
      }
      
      if (!worldRef.current) return;
      
      // Обновляем мир (логика + движение)
      worldRef.current.update();
      
      // Синхронизируем состояние
      setGrassPatches([...worldRef.current.grassPatches]);
      setHerbivores([...worldRef.current.herbivores]);
      setPredators([...worldRef.current.predators]);
      
      // Запись данных для графиков
      setRecordCounter(prev => {
        if (prev >= RECORD_INTERVAL) {
          recordPopulationData();
          return 0;
        }
        return prev + 1;
      });
      
      animationRef.current = requestAnimationFrame(updateAnimation);
    };

    updateAnimation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Отрисовка графика
  useEffect(() => {
    if (chartRef.current && populationHistory.zebras.length > 0) {
      chartRef.current.draw(
        populationHistory.zebras,
        populationHistory.lions,
        populationHistory.grass
      );
    }
  }, [populationHistory]);

  // Отрисовка поля, травы и животных
  useEffect(() => {
    if (!canvasRef.current || !worldRef.current) return;
    const ctx = canvasRef.current.getContext('2d');   // 
    const world = worldRef.current;
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, world.width, world.height);

    grassPatches.forEach(grass => grass.draw(ctx));  // отрисовка каждого объекта травы
    
    const allAnimals = [...herbivores, ...predators];  
    // отрисовка всех животных (если оно выбрано, то подсвечивается (ctx.shadowBlur ))
    allAnimals.forEach(animal => {
      if (selectedAnimal === animal) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'yellow';
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
  }, [herbivores, predators, grassPatches, selectedAnimal]);

  // обработчик клика по полю
  const handleCanvasClick = (e) => {   // e - объект с информацией о событии (координаты мыши, тип события, элемент где произошло) передается автоматически
    
    const canvas = canvasRef.current;
    if (!canvas || !worldRef.current) return;
    
    
    const rect = canvas.getBoundingClientRect(); // rect = координаты canvas элемента
    
    // координаты мыши внутри поля
    const mouseX = Math.min(canvas.width, Math.max(0, (e.clientX - rect.left)));
    const mouseY = Math.min(canvas.height, Math.max(0, (e.clientY - rect.top)));
    

    const allAnimals = [...worldRef.current.herbivores, ...worldRef.current.predators];
    // нахождение животного на которое крикнул пользователь
    const clickedAnimal = allAnimals.find(animal => {
      if (!animal.isAlive) return false;
      const dx = animal.x - mouseX;
      const dy = animal.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= animal.radius + 5;
    });
    
    setSelectedAnimal(clickedAnimal || null); // изменение состояния selectedAnimal
  };

  // ф-ия изменения состояния курсосра при наведении на животное
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !worldRef.current) return;
    
    const rect = canvas.getBoundingClientRect(); // rect = координаты canvas элемента
    
    const mouseX = Math.min(canvas.width, Math.max(0, (e.clientX - rect.left)));
    const mouseY = Math.min(canvas.height, Math.max(0, (e.clientY - rect.top)));
    
    const allAnimals = [...worldRef.current.herbivores, ...worldRef.current.predators];
    const isOverAnimal = allAnimals.some(animal => {
      if (!animal.isAlive) return false;
      const dx = animal.x - mouseX;
      const dy = animal.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= animal.radius + 5;
    });
    
    setCursorStyle(isOverAnimal ? 'pointer' : 'default');  // установка стиля курсора
  };

  // обработка кнопки сброса (создание мира заново)
  const handleReset = () => {
    if (!worldRef.current) return;
    setIsRunning(false);
    setIsPaused(false);
    
    const zebraMatingCooldown = zebraMatingCooldownSeconds * 60;
    const lionMatingCooldown = lionMatingCooldownSeconds * 60;
    const regenerationFrames = grassRegenerationSeconds * 60;
    
    worldRef.current.initializeWithParams(
      zebraCount, zebraSpeed, lionCount, lionSpeed, grassCount,
      zebraMatingCooldown, lionMatingCooldown, regenerationFrames,
      Herbivore, Predator
    );
    
    setPopulationHistory({ zebras: [], lions: [], grass: [] });
    setRecordCounter(0);
    if (chartRef.current) chartRef.current.clear();
    
    setHerbivores([...worldRef.current.herbivores]);
    setPredators([...worldRef.current.predators]);
    setGrassPatches([...worldRef.current.grassPatches]);
    setSelectedAnimal(null);
    setIsRunning(true);
  };

  // ф-ия для сравнения задаваемых скоростей льва и зебры 
  const handleApplySettings = () => {
    if (lionSpeed <= zebraSpeed) {
      alert("Львы должны быть быстрее зебр!");
      return;
    }
    handleReset();
  };

  // списки живых животных и травы
  const aliveHerbivores = herbivores.filter(h => h.isAlive).length;   
  const alivePredators = predators.filter(p => p.isAlive).length;
  const aliveGrass = grassPatches.filter(g => !g.isDepleted()).length;
  const allAnimals = [...herbivores, ...predators].filter(a => a.isAlive);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ecosystem Simulation</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center' /* основной контейнер*/}}> 
          
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
            overflowY: 'auto'    // вертикальный скролл
          /*стили левой колонки */}}>   

            
            <div style={{ marginBottom: '12px' }/*блок со статистикой */}>
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
            
            <hr style={{ margin: '10px 0' }/* линия разделения*/} />
            
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
                    {selectedAnimal.type === "predator" ? "🦁" : "🦓"}
                    {' '}{selectedAnimal.species || selectedAnimal.constructor.name}
                    {' '}{selectedAnimal.gender === "male" ? "♂" : "♀"}
                  </div>
                  <div>🍽️ Голод: {Math.round(selectedAnimal.hunger)}%</div>
                  <div>⚡ Выносливость: {Math.round(selectedAnimal.stamina)}%</div>
                  <div>{selectedAnimal.getStatus()}</div>
                  <div>⏳ Статус: {selectedAnimal.matingCooldown > 0 ? "Не готов к размножению" : "✅ Готов к размножению"}</div>
                </div>
              </>
            )}
          </div>
          
          {/* ЦЕНТРАЛЬНАЯ КОЛОНКА — Canvas поле и график внизу */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <canvas //блок поля
              ref={canvasRef}   // присваивание ссылки
              width={800}
              height={600}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              style={{ 
                border: '2px solid #333', 
                backgroundColor: '#8B5A2B',
                cursor: cursorStyle
              }}
            />
            
            {/* График динамики популяций (под полем) */}
            <div style={{ marginTop: '15px', width: '800px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', color: '#fff' }}>📈 Динамика популяций</div>
              <div // блок видимой части графика
                ref={chartContainerRef} 
                style={{ 
                  overflowX: 'auto', 
                  overflowY: 'auto',
                  maxHeight: '200px',
                  maxWidth: '800px',
                  border: '1px solid #444', 
                  borderRadius: '4px', 
                  backgroundColor: '#1a1a1a' 
                }}
              >
                <canvas  // блок графика canvas
                  ref={chartCanvasRef} 
                  style={{ 
                    display: 'block', 
                    backgroundColor: '#1a1a1a'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '5px', fontSize: '12px', color: '#fff' }}>
                <span style={{ color: '#ffffff' }}>🦓 Зебры (белый)</span>
                <span style={{ color: '#ffd700' }}>🦁 Львы (жёлтый)</span>
                <span style={{ color: '#4caf50' }}>🌿 Трава (зелёный)</span>
              </div>
            </div>
          </div>
          
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
            <div>
              <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>⚙️ Управление</h3>
              <button onClick={() => { setIsRunning(true); setIsPaused(false); }} style={{ width: '100%', padding: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>▶ СТАРТ</button>
              <button onClick={() => setIsPaused(!isPaused)} style={{ width: '100%', padding: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}>{isPaused ? "▶ ПРОДОЛЖИТЬ" : "⏸ ПАУЗА"}</button>
              <button onClick={handleReset} style={{ width: '100%', padding: '8px', marginBottom: '8px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>🔄 СБРОС</button>
              <button onClick={handleApplySettings} style={{ width: '100%', padding: '8px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}>✔ ПРИМЕНИТЬ</button>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>🐆 Настройки</div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🦓 Зебры:</span>
                  <input type="number" min="0" max="50" step="1" value={zebraCount} onChange={(e) => setZebraCount(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))} style={{ width: '60px', textAlign: 'center' }} />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px' }}>Скорость:</span>
                  <input type="number" min="0.5" max="3.0" step="0.1" value={zebraSpeed} onChange={(e) => setZebraSpeed(parseFloat(e.target.value))} style={{ width: '60px', textAlign: 'center' }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🦁 Львы:</span>
                  <input type="number" min="0" max="30" step="1" value={lionCount} onChange={(e) => setLionCount(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))} style={{ width: '60px', textAlign: 'center' }} />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px' }}>Скорость:</span>
                  <input type="number" min="0.5" max="3.0" step="0.1" value={lionSpeed} onChange={(e) => setLionSpeed(parseFloat(e.target.value))} style={{ width: '60px', textAlign: 'center' }} />
                </div>
                {lionSpeed <= zebraSpeed && <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>⚠️ Львы должны быть быстрее зебр!</div>}
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🌿 Трава:</span>
                  <input type="number" min="0" max="80" step="1" value={grassCount} onChange={(e) => setGrassCount(Math.min(80, Math.max(0, parseInt(e.target.value) || 0)))} style={{ width: '60px', textAlign: 'center' }} />
                </label>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🦓 Пауза между размножениями у зебр:</span>
                  <input 
                    type="number" 
                    min="2" 
                    max="30" 
                    step="1"
                    value={zebraMatingCooldownSeconds}
                    onChange={(e) => setZebraMatingCooldownSeconds(Math.min(30, Math.max(2, parseInt(e.target.value) || 2)))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '11px', color: '#aaa' }}>сек</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🦁 пауза между размножениями у львов:</span>
                  <input 
                    type="number" 
                    min="2" 
                    max="30" 
                    step="1"
                    value={lionMatingCooldownSeconds}
                    onChange={(e) => setLionMatingCooldownSeconds(Math.min(30, Math.max(2, parseInt(e.target.value) || 2)))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '11px', color: '#aaa' }}>сек</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>🌱 Регенерация травы:</span>
                  <input 
                    type="number" 
                    min="2" 
                    max="30" 
                    step="1"
                    value={grassRegenerationSeconds}
                    onChange={(e) => setGrassRegenerationSeconds(Math.min(30, Math.max(2, parseInt(e.target.value) || 2)))}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '11px', color: '#aaa' }}>сек</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;