window.addEventListener("load", () => {
    const screen4 = document.querySelector('.screen-4');
    const marquee = document.querySelector('.marquee-container');
    
    // Находим HTML-элементы
    const domButton = document.getElementById('html-button');
    const domTopText = document.getElementById('html-top-text');

    if (!screen4) return;

    // --- ФУНКЦИЯ-КОНВЕРТЕР (пиксели из Figma -> реальные пиксели на экране) ---
    const vw = (px) => (px / 1920) * window.innerWidth;

    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Constraint = Matter.Constraint,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Events = Matter.Events,
        Bodies = Matter.Bodies;

    const engine = Engine.create(), world = engine.world;
    engine.gravity.y = 1.4;

    // СТРОГО 400! Не переводим в vw, так как в CSS жестко написано top: -400px
    const overlapY = 400; 

    let baseWidth = screen4.clientWidth;
    let baseHeight = screen4.clientHeight;

    const render = Render.create({
        element: screen4, 
        engine: engine,
        options: {
            width: baseWidth,
            height: baseHeight + overlapY,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // --- ДИНАМИЧЕСКИЙ РАСЧЕТ РАЗМЕРОВ ---
    let topTextW = domTopText ? domTopText.offsetWidth : vw(324);
    let topTextH = domTopText ? domTopText.offsetHeight : vw(64);
    
    let btnW = domButton ? domButton.offsetWidth : vw(180);
    let btnH = domButton ? domButton.offsetHeight : vw(42);

    let anchorY = vw(80); 
    if (marquee) {
        anchorY = marquee.offsetTop + marquee.offsetHeight;
    }

    const centerX = baseWidth / 2;

    // ==========================================
    // ПАРАМЕТРЫ ЦЕНТРАЛЬНОГО БАННЕРА
    // ==========================================
    const bannerW = vw(430); 
    const bannerH = vw(600);
    const rope1Len = vw(65);
    const rope2Len = vw(65);
    const rope3Len = vw(65);
    const imgScale = 0.26 * (window.innerWidth / 1920);

    const topTextY = anchorY + rope1Len + (topTextH / 2);  
    const bannerY = topTextY + (topTextH / 2) + rope2Len + (bannerH / 2); 
    const buttonY = bannerY + (bannerH / 2) + rope3Len + (btnH / 2);  

    // ==========================================
    // ПАРАМЕТРЫ БОКОВЫХ БАННЕРОВ
    // ==========================================
    const sideBannerW = vw(375); // Ширина боковых баннеров
    const sideBannerH = vw(527); // Высота боковых баннеров
    const sideRopeLen = vw(250); // Длина их веревок
    const sideOffset = vw(500);  // Отступ от центра влево и вправо (увеличьте, если наезжают друг на друга)
    const sideImgScale = 0.25 * (window.innerWidth / 1920); // Масштаб картинок для боковых

    const leftX = centerX - sideOffset;
    const rightX = centerX + sideOffset;
    const sideBannerY = anchorY + sideRopeLen + (sideBannerH / 2);

    const ropeLineWidth = Math.max(vw(5), 2);

    // --- ФИЗИКА: ЦЕНТРАЛЬНАЯ ОСЬ ---
    const topAnchor = { x: centerX, y: anchorY + overlapY };

    const topTextBody = Bodies.rectangle(centerX, topTextY + overlapY, topTextW, topTextH, {
        frictionAir: 0.04, render: { visible: false } 
    });

    const rope1 = Constraint.create({
        pointA: topAnchor, bodyB: topTextBody, pointB: { x: 0, y: -topTextH / 2 }, 
        stiffness: 1, length: rope1Len,
        render: { strokeStyle: '#D9D9D9', lineWidth: ropeLineWidth, anchors: false }
    });

    const bannerBody = Bodies.rectangle(centerX, bannerY + overlapY, bannerW, bannerH, {
        frictionAir: 0.02,
        render: { sprite: { texture: 'assets/images/banner-main-center.png', xScale: imgScale, yScale: imgScale } }
    });

    const rope2 = Constraint.create({
        bodyA: topTextBody, pointA: { x: 0, y: topTextH / 2 }, bodyB: bannerBody, pointB: { x: 0, y: -bannerH / 2 }, 
        stiffness: 1, length: rope2Len,
        render: { strokeStyle: '#D9D9D9', lineWidth: ropeLineWidth, anchors: false }
    });

    const buttonBody = Bodies.rectangle(centerX, buttonY + overlapY, btnW, btnH, {
        frictionAir: 0.05, render: { visible: false }
    });

    const rope3 = Constraint.create({
        bodyA: bannerBody, pointA: { x: 0, y: bannerH / 2 }, bodyB: buttonBody, pointB: { x: 0, y: -btnH / 2 },     
        stiffness: 1, length: rope3Len,
        render: { strokeStyle: '#D9D9D9', lineWidth: ropeLineWidth, anchors: false }
    });

    // --- ФИЗИКА: ЛЕВЫЙ БАННЕР ---
    const leftAnchor = { x: leftX, y: anchorY + overlapY };
    
    const leftBannerBody = Bodies.rectangle(leftX, sideBannerY + overlapY, sideBannerW, sideBannerH, {
        frictionAir: 0.02,
        render: { sprite: { texture: 'assets/images/banner-main-left.png', xScale: sideImgScale, yScale: sideImgScale } }
    });

    const leftRope = Constraint.create({
        pointA: leftAnchor, bodyB: leftBannerBody, pointB: { x: 0, y: -sideBannerH / 2 },
        stiffness: 1, length: sideRopeLen,
        render: { strokeStyle: '#D9D9D9', lineWidth: ropeLineWidth, anchors: false }
    });

    // --- ФИЗИКА: ПРАВЫЙ БАННЕР ---
    const rightAnchor = { x: rightX, y: anchorY + overlapY };
    
    const rightBannerBody = Bodies.rectangle(rightX, sideBannerY + overlapY, sideBannerW, sideBannerH, {
        frictionAir: 0.02,
        render: { sprite: { texture: 'assets/images/banner-main-right.png', xScale: sideImgScale, yScale: sideImgScale } }
    });

    const rightRope = Constraint.create({
        pointA: rightAnchor, bodyB: rightBannerBody, pointB: { x: 0, y: -sideBannerH / 2 },
        stiffness: 1, length: sideRopeLen,
        render: { strokeStyle: '#D9D9D9', lineWidth: ropeLineWidth, anchors: false }
    });

    // Добавляем все объекты в мир
    Composite.add(world, [
        topTextBody, rope1, bannerBody, rope2, buttonBody, rope3,
        leftBannerBody, leftRope, rightBannerBody, rightRope
    ]);

    // --- НАСТРОЙКА МЫШИ ---
    const mouse = Mouse.create(screen4);
    Mouse.setOffset(mouse, { x: 0, y: overlapY });

    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.15, render: { visible: false } }
    });

    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    mouse.element.removeEventListener('touchstart', mouse.mousedown);
    mouse.element.removeEventListener('touchmove', mouse.mousemove);
    mouse.element.removeEventListener('touchend', mouse.mouseup);

    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    // --- СИНХРОНИЗАЦИЯ HTML-ЭЛЕМЕНТОВ ---
    Events.on(engine, 'afterUpdate', function() {
        const posBtn = buttonBody.position;
        const angleBtn = buttonBody.angle;
        if (domButton) {
            domButton.style.transform = `translate(${posBtn.x - btnW / 2}px, ${posBtn.y - btnH / 2 - overlapY}px) rotate(${angleBtn}rad)`;
        }

        const posText = topTextBody.position;
        const angleText = topTextBody.angle;
        if (domTopText) {
            domTopText.style.transform = `translate(${posText.x - topTextW / 2}px, ${posText.y - topTextH / 2 - overlapY}px) rotate(${angleText}rad)`;
        }
    });

    // --- РЕСАЙЗ ОКНА ---
    window.addEventListener('resize', function() {
        baseWidth = screen4.clientWidth;
        baseHeight = screen4.clientHeight;
        
        render.canvas.width = baseWidth;
        render.canvas.height = baseHeight + overlapY;

        if (domTopText) {
            topTextW = domTopText.offsetWidth;
            topTextH = domTopText.offsetHeight;
        }
        if (domButton) {
            btnW = domButton.offsetWidth;
            btnH = domButton.offsetHeight;
        }

        if (marquee) {
            const newAnchorY = marquee.offsetTop + marquee.offsetHeight;
            const newSideOffset = vw(420); // Пересчитываем отступ

            rope1.pointA.y = newAnchorY + overlapY;
            rope1.pointA.x = baseWidth / 2;

            leftRope.pointA.y = newAnchorY + overlapY;
            leftRope.pointA.x = (baseWidth / 2) - newSideOffset;

            rightRope.pointA.y = newAnchorY + overlapY;
            rightRope.pointA.x = (baseWidth / 2) + newSideOffset;
        }
    });
});