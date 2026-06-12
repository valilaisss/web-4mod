class PixelSimulation {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        // Создаем холст для пикселей
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        // Настройки холста: поверх фона, под текстом
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Пропускаем клики насквозь
        this.canvas.style.zIndex = '3'; 

        this.particles = [];
        this.colors = ['#8A8A8A'];
        
        // ==========================================
        // НАСТРОЙКИ ДЛЯ НЕПОДВИЖНОГО СЛЕДА
        // ==========================================
        this.settings = {
            dispersion: 2,      // Разброс при появлении
            friction: 1,       // Трение (быстрее останавливаются в воздухе)
            particlesPerFrame: 1, // Строго 1 пиксель за микродвижение
            pixelSize: 7,         // Единый фиксированный размер для всех пикселей
            lifeDecay: 0.004      // Скорость исчезновения
        };

        // Координаты мыши
        this.mouse = { x: -1000, y: -1000, isActive: false };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Отслеживаем мышь
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.isActive = true;
            
            // Генерируем пиксели при движении
            this.addParticles(this.mouse.x, this.mouse.y);
        });

        this.container.addEventListener('mouseleave', () => {
            this.mouse.isActive = false;
        });

        this.animate();
    }

    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }

    addParticles(x, y) {
        for (let i = 0; i < this.settings.particlesPerFrame; i++) {
            // Пиксели появляются в небольшом облаке вокруг мыши
            const spawnRadius = 20; 
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spawnRadius;
            const spawnX = x + Math.cos(angle) * radius;
            const spawnY = y + Math.sin(angle) * radius;

            this.particles.push({
                x: spawnX, 
                y: spawnY,
                size: this.settings.pixelSize, // Одинаковый размер
                
                // Начальная скорость (дрейф при появлении)
                vx: (Math.random() - 0.5) * this.settings.dispersion,
                vy: (Math.random() - 0.5) * this.settings.dispersion,
                life: 1, // Жизнь частицы начинается со 100%
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            // Инерция: пиксель чуть-чуть пролетает и плавно замирает на месте
            p.vx *= this.settings.friction;
            p.vy *= this.settings.friction;

            p.x += p.vx;
            p.y += p.vy;
            p.life -= this.settings.lifeDecay; 

            // ВОЗВРАЩЕНО: Плавное затухание
            // Пиксель остается на 100% ярким первые 70% жизни (пока p.life > 0.3)
            // Последние 30% жизни он начинает плавно растворяться
            const decayThreshold = 0.3; 
            this.ctx.globalAlpha = p.life > decayThreshold ? 1 : Math.max(p.life / decayThreshold, 0);

            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size); 

            // Удаляем мертвые пиксели, когда их время выходит
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
    new PixelSimulation('.screen-2');
});