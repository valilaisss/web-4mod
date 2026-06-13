const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uDataTexture;
  uniform vec4 resolution;
  uniform float time;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    
    // Получаем смещение из DataTexture (r и g каналы)
    vec4 offset = texture2D(uDataTexture, uv);

    // Применяем искажение к координатам текстуры
    uv.x -= offset.r * 0.005; 
    uv.y -= offset.g * 0.005;

    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`;

class Sketch {
  constructor(options) {
    this.container = options.dom;
    this.img = options.img;
    
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5, -1000, 1000 );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.time = 0;
    this.isPlaying = true;
    
    this.settings = {
      grid: 50,
      mouse: 0.15,
      strength: 0.3,
      relaxation: 0.9
    };

    this.mouse = { x: 0, y: 0, vX: 0, vY: 0, prevX: 0, prevY: 0 };

    window.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - ((e.clientY - rect.top) / rect.height);
      this.mouse.vX = x - this.mouse.prevX;
      this.mouse.vY = y - this.mouse.prevY;
      
      this.mouse.x = x;
      this.mouse.y = y;

      this.mouse.prevX = x;
      this.mouse.prevY = y;
    });

    this.addObjects();
    this.resize();
    window.addEventListener("resize", this.resize.bind(this));
    this.render();
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);

    if(this.material) {
        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
    }

    this.camera.updateProjectionMatrix();
    this.regenerateGrid();
  }

  regenerateGrid() {
    this.size = this.settings.grid;

    const width = this.size;
    const height = this.size;

    const size = width * height;
    const data = new Float32Array(size * 4);
    
    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 1;
    }

    this.texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    
    this.texture.magFilter = this.texture.minFilter = THREE.LinearFilter;

    if (this.material) {
      this.material.uniforms.uDataTexture.value = this.texture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  addObjects() {
    this.regenerateGrid();
    
    let texture = new THREE.TextureLoader().load(this.img.src);
    texture.needsUpdate = true;

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
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
    let gridMouseY = this.size * this.mouse.y; 
    let maxDist = this.size * this.settings.mouse;
    let aspect = this.width / this.height;

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let distanceX = (gridMouseX - i) * aspect;
        let distanceY = (gridMouseY - j);
        let distance = Math.pow(distanceX, 2) + Math.pow(distanceY, 2);
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


window.addEventListener("load", () => {
    const underlayImages = document.querySelectorAll('.underlay img');

    underlayImages.forEach(imgElement => {
        if (imgElement.complete) {
            initSketch(imgElement);
        } else {
            imgElement.addEventListener('load', () => initSketch(imgElement));
        }
    });

    function initSketch(imgElement) {
        const container = document.createElement('div');
        container.className = imgElement.className; 
        
        imgElement.parentNode.insertBefore(container, imgElement);
        imgElement.style.display = 'none';

        new Sketch({
            dom: container,
            img: imgElement
        });
    }
});