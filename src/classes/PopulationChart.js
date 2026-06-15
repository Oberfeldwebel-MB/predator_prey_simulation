class PopulationChart {
  constructor(canvas, containerRef, widthPerPoint = 2, height = 120) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.containerRef = containerRef;
    this.widthPerPoint = widthPerPoint;
    this.height = height;
    this.MAX_Y = 50;
    this.currentWidth = 0;
  }

  // Обновление размера canvas
  updateCanvasWidth(dataLength) {
    const newWidth = Math.max(220, dataLength * this.widthPerPoint);
    if (this.currentWidth !== newWidth) {
      this.canvas.width = newWidth;
      this.currentWidth = newWidth;
    }
  }

  // Автоскролл в конец
  scrollToEnd() {
    if (this.containerRef && this.containerRef.current) {
      this.containerRef.current.scrollLeft = this.containerRef.current.scrollWidth;
    }
  }

  draw(zebras, lions, grass) {
    const { ctx, widthPerPoint, height, MAX_Y } = this;
    
    // Обновляем ширину canvas
    this.updateCanvasWidth(zebras.length);
    
    const width = this.currentWidth;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);
    
    // Рисуем фон
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Рисуем сетку (горизонтальные линии)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Рисуем оси
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    
    // Отрисовка линии
    const drawLine = (data, color) => {
      if (!data || data.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      let firstPoint = true;
      for (let i = 0; i < data.length; i++) {
        const x = i * widthPerPoint;
        const y = height - (data[i] / MAX_Y) * height;
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };
    
    drawLine(zebras, '#ffffff');
    drawLine(lions, '#ffd700');
    drawLine(grass, '#4caf50');
    
    // Легенда
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🦓', 5, 10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('🦁', 25, 10);
    ctx.fillStyle = '#4caf50';
    ctx.fillText('🌿', 45, 10);
  }

  clear() {
    this.canvas.width = 220;
    this.currentWidth = 220;
    const { ctx, height } = this;
    ctx.clearRect(0, 0, this.currentWidth, height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.currentWidth, height);
  }
}

export default PopulationChart;