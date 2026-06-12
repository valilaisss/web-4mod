uTexture: { value: texture },
        uDataTexture: { value: this.texture },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  updateDataTexture() {
    let data = this.texture.image.data;

    let gridMouseX = this.size * this.mouse.x;
    let gridMouseY = this.size * this.mouse.y; // Y уже инвертирован в слушателе
    let maxDist = this.size * this.settings.mouse;
    let aspect = this.height / this.width;

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {

        // ИСПРАВЛЕНА ОШИБКА ЗДЕСЬ (возведение в степень)
        let distance = (Math.pow(gridMouseX - i, 2)) / aspect + Math.pow(gridMouseY - j, 2);
        let maxDistSq = maxDist ** 2;

        if (distance < maxDistSq) {
          let index = 4 * (i + this.size * j);

          let power = maxDist / Math.sqrt(distance);
          power = clamp(power, 0, 10);

          data[index] += this.settings.strength * 100 * this.mouse.vX * power;
          data[index + 1] -= this.settings.strength * 100 * this.mouse.vY * power;
        }
      }
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= this.settings.relaxation;
      data[i + 1] *= this.settings.relaxation;
    }

    this.mouse.vX *= 0.9;
    this.mouse.vY *= 0.9;
    this.texture.needsUpdate = true;
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.updateDataTexture();
    this.material.uniforms.time.value = this.time;
    
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}

// ==========================================
// --- ИНИЦИАЛИЗАЦИЯ НА СТРАНИЦЕ ---
// ==========================================
window.addEventListener("load", () => {
    // Находим все картинки внутри блоков underlay
    const underlayImages = document.querySelectorAll('.underlay img');

    underlayImages.forEach(imgElement => {
        // Ждем загрузки картинки (чтобы WebGL мог взять её размеры и текстуру)
        if (imgElement.complete) {
            initSketch(imgElement);
        } else {
            imgElement.addEventListener('load', () => initSketch(imgElement));
        }
    });

    function initSketch(imgElement) {
        // Создаем контейнер-заменитель
        const container = document.createElement('div');
        container.className = imgElement.className; // Копируем классы (позиционирование, размеры)
        
        // Вставляем контейнер перед картинкой
        imgElement.parentNode.insertBefore(container, imgElement);
        
        // Прячем оригинальную картинку
        imgElement.style.display = 'none';

        // Запускаем WebGL
        new Sketch({
            dom: container,
            img: imgElement
        });
    }
});