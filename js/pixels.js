class PixelTrail {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        // Создаем холст для пикселей
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        // Стилизуем холст, чтобы он лежал поверх фона, но под текстом
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Чтобы не перекрывать кнопку "почитать подробнее"
        this.canvas.style.zIndex = '3'; 

        this.particles = [];
        // Цвета пикселей (под твой дизайн)
        this.colors = ['#8A8A8A'];

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Отслеживаем мышь только внутри 2-го экрана
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.addParticles(x, y);
        });

        this.animate();
    }

    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }

    addParticles(x, y) {
        // За одно движение мыши создаем 3-5 пикселей
        const amount = Math.floor(Math.random() * 3) + 2; 
        for (let i = 0; i < amount; i++) {
            this.particles.push({
                x: x,
                y: y,
                // ИСПРАВЛЕНИЕ: Полностью случайный разлет во все стороны (включая вверх)
                vx: (Math.random() - 0.5) * 8, // По X
                vy: (Math.random() - 0.5) * 8, // По Y, без гравитации
                size: Math.random() * 4 + 2, // Размер от 2px до 6px
                life: 1, // Жизнь частицы от 1 до 0
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
    }

    animate() {
        // Очищаем кадр
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            // ГРАВИТАЦИЯ УДАЛЕНА: p.vy больше не увеличивается

            p.life -= 0.01; // Чуть медленнее исчезают

            // ИСПРАВЛЕНИЕ ЧЕТКОСТИ: Полная непрозрачность большую часть времени
            // Мы задаем непрозрачность 1 (полная четкость) для 70% жизни,
            // а за последние 30% жизни пиксель быстро растворяется.
            const decayThreshold = 0.3; // Порог начала растворения (30% жизни)
            this.ctx.globalAlpha = p.life > decayThreshold ? 1 : Math.max(p.life / decayThreshold, 0);

            // Отрисовываем пиксель
            this.ctx.fillStyle = p.color;
            // fillRect рисует жесткие квадраты - то, что нужно для "пикселей"
            this.ctx.fillRect(p.x, p.y, p.size, p.size); 

            // Удаляем мертвые пиксели
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                i--;
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Запускаем при загрузке страницы
window.addEventListener('load', () => {
    new PixelTrail('.screen-2');
});