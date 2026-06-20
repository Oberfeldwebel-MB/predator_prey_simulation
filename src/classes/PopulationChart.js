class PopulationChart {
    constructor(canvas, containerRef, widthPerPoint = 2, heightPerValue = 4) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.containerRef = containerRef;
        this.widthPerPoint = widthPerPoint;  // пикселей на одну точку по X
        this.heightPerValue = heightPerValue; // пикселей на одну единицу численности по Y
        this.currentWidth = 0;
        this.currentHeight = 200; // минимальная высота
    }

    updateCanvasSize(dataLength, maxValue) {
        // Ширина: количество точек * ширина точки
        const newWidth = Math.max(800, dataLength * this.widthPerPoint);
        
        // Высота: максимальное значение * высота на единицу + отступ для подписей
        const newHeight = Math.max(200, maxValue * this.heightPerValue + 40);
        
        if (this.currentWidth !== newWidth || this.currentHeight !== newHeight) {
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.currentWidth = newWidth;
            this.currentHeight = newHeight;
            
            // Обновляем стиль canvas для вертикального скролла
            if (this.canvas.style) {
                this.canvas.style.height = newHeight + 'px';
            }
        }
    }

    scrollToEnd() {
        if (this.containerRef && this.containerRef.current) {
            // Горизонтальный скролл в конец
            this.containerRef.current.scrollLeft = this.containerRef.current.scrollWidth;
            // Вертикальный скролл в конец (чтобы видеть последние данные)
            this.containerRef.current.scrollTop = this.containerRef.current.scrollHeight;
        }
    }

    draw(zebras, lions, grass) {
        const { ctx, widthPerPoint, heightPerValue } = this;
        
        // Находим максимальное значение для масштабирования
        const allData = [...zebras, ...lions, ...grass];
        const maxValue = allData.length > 0 ? Math.max(...allData, 1) : 50;
        
        // Обновляем размер canvas
        this.updateCanvasSize(zebras.length, maxValue);
        const width = this.currentWidth;
        const height = this.currentHeight;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Рисуем горизонтальные линии сетки
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const value = (maxValue / gridLines) * (gridLines - i);
            const y = i * (height - 30) / gridLines + 15;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // Подписи шкалы Y
            ctx.font = '8px monospace';
            ctx.fillStyle = '#888';
            ctx.fillText(Math.round(value).toString(), 2, y - 2);
        }
        
        // Отрисовка линий
        const drawLine = (data, color) => {
            if (!data || data.length < 2) return;
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            let firstPoint = true;
            for (let i = 0; i < data.length; i++) {
                const x = i * widthPerPoint;
                // Y координата: низ canvas - (значение / максимальное значение) * высоту
                const y = height - 20 - (data[i] / maxValue) * (height - 40);
                
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
    }

    clear() {
        this.canvas.width = 800;
        this.canvas.height = 200;
        this.currentWidth = 800;
        this.currentHeight = 200;
        const { ctx, height } = this;
        ctx.clearRect(0, 0, this.currentWidth, height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.currentWidth, height);
    }
}

export default PopulationChart;