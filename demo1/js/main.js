// 场景、相机和渲染器的全局变量
let scene, camera, renderer, controls;

// 行星和轨道的全局对象
let solarSystem = {
    sun: null,
    planets: [],
    orbits: []
};

// 动画控制
let animation = {
    paused: false,
    speed: 1,
    clock: new THREE.Clock(),
    time: 0
};

// 效果更新函数
let effectUpdates = [];

// 行星数据
const planetData = [
    { 
        name: '水星', 
        radius: 2.5, 
        distance: 35, 
        rotation: 0.004, 
        revolution: 0.04, 
        color: 0xC0C0C0, // 更亮的银色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mercury.jpg', // 改为本地纹理
        axialTilt: 0.03 // 约2度
    },
    { 
        name: '金星', 
        radius: 3.8, 
        distance: 50, 
        rotation: 0.002, 
        revolution: 0.015, 
        color: 0xFFC125, // 更亮的金黄色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/venus_atmosphere.jpg', // 改为本地纹理
        axialTilt: -3.1 // 约177度，逆向自转
    },
    { 
        name: '地球', 
        radius: 4, 
        distance: 70, 
        rotation: 0.01, 
        revolution: 0.01, 
        color: 0x1E90FF, // 更鲜艳的蓝色
        texturePath: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg", // 改为本地纹理
        hasAtmosphere: true,
        atmosphereColor: 0x5588FF, // 更鲜艳的大气蓝色
        hasMoon: true,
        axialTilt: 0.41 // 约23.5度
    },
    { 
        name: '火星', 
        radius: 3, 
        distance: 90, 
        rotation: 0.01, 
        revolution: 0.008, 
        color: 0xFF3300, // 更鲜艳的红色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars.jpg', // 改为本地纹理
        axialTilt: 0.44 // 约25度
    },
    { 
        name: '木星', 
        radius: 15, 
        distance: 120, 
        rotation: 0.04, 
        revolution: 0.002, 
        color: 0xFF9500, // 更亮的橙色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/jupiter.jpg', // 改为本地纹理
        axialTilt: 0.05 // 约3度
    },
    { 
        name: '土星', 
        radius: 12, 
        distance: 160, 
        rotation: 0.038, 
        revolution: 0.0009, 
        color: 0xFFE84C, // 更亮的金色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn.jpg', // 改为本地纹理
        hasRings: true,
        axialTilt: 0.47 // 约26.7度
    },
    { 
        name: '天王星', 
        radius: 8, 
        distance: 200, 
        rotation: 0.011, 
        revolution: 0.0004, 
        color: 0x00BFFF, // 更亮的青色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/uranus.jpg', // 改为本地纹理
        axialTilt: 1.71 // 约98度，几乎横躺
    },
    { 
        name: '海王星', 
        radius: 7.5, 
        distance: 240, 
        rotation: 0.01, 
        revolution: 0.0001, 
        color: 0x4169E1, // 保持皇家蓝色
        texturePath: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/neptune.jpg', // 改为本地纹理
        axialTilt: 0.5 // 约28度
    }
];

// 初始化函数
function init() {
    // 设置THREE.js的纹理加载器跨域配置
    THREE.TextureLoader.prototype.crossOrigin = 'anonymous';
    
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 5000);
    camera.position.set(0, 200, 350);
    
    // 创建渲染器，启用高质量渲染
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "default"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比
    
    // 启用高质量阴影
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    // 启用色调映射以改善明亮区域的显示
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // 启用物理上正确的光照
    renderer.physicallyCorrectLights = true;
    
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // 添加星云背景
    SolarSystemEffects.addNebula(scene);
    
    // 创建太阳系
    createSolarSystem();
    
    // 添加星空背景
    createStarBackground();
    
    // 添加事件监听器
    window.addEventListener('resize', onWindowResize);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('reset-btn').addEventListener('click', resetCamera);
    document.getElementById('speed-slider').addEventListener('input', updateSpeed);
    document.getElementById('top-view').addEventListener('click', setTopView);
    document.getElementById('side-view').addEventListener('click', setSideView);
    
    // 添加鼠标选择行星功能
    renderer.domElement.addEventListener('click', onCanvasClick);
    
    // 开始动画循环
    animate();
}

// 创建太阳系
function createSolarSystem() {
    // 创建太阳
    const sunGeometry = new THREE.SphereGeometry(25, 64, 64);
    
    // 尝试加载太阳纹理
    let sunMaterial;
    try {
        console.log('尝试加载太阳纹理: ./textures/2k_sun.jpg');
        
        // 创建基础材质
        sunMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF5500,  // 先使用颜色作为基础
            emissive: 0xFF3300,  // 发光橙红色
            emissiveIntensity: 0.6,
            metalness: 0.0,
            roughness: 0.4
        });
        
        // 使用绝对路径
        const texturePath = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/sun.jpg';
        const absolutePath = window.location.origin + '/textures/2k_sun.jpg';
        console.log(`尝试绝对路径加载: ${absolutePath}`);
        
        const textureLoader = new THREE.TextureLoader();
        // 添加纹理加载的回调
        textureLoader.load(
            texturePath, // 先尝试原始路径
            // 成功回调
            function(texture) {
                console.log('成功加载太阳纹理', texture);
                sunMaterial.map = texture;
                sunMaterial.needsUpdate = true;
            },
            // 进度回调
            function(xhr) {
                console.log(`太阳纹理加载进度: ${(xhr.loaded / xhr.total * 100)}%`);
            },
            // 错误回调
            function(error) {
                console.error('原始路径加载失败，尝试绝对路径', error);
                
                // 如果原始路径失败，尝试绝对路径
                textureLoader.load(
                    absolutePath,
                    function(texture) {
                        console.log('使用绝对路径成功加载太阳纹理', texture);
                        sunMaterial.map = texture;
                        sunMaterial.needsUpdate = true;
                    },
                    null,
                    function(error) {
                        console.error('所有路径都无法加载太阳纹理:', error);
                    }
                );
            }
        );
    } catch(e) {
        console.warn('无法加载太阳纹理，回退到颜色材质', e);
        // 回退到颜色材质
        sunMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF5500,  // 橙红色
            emissive: 0xFF3300,  // 发光橙红色
            emissiveIntensity: 0.6,
            metalness: 0.0,
            roughness: 0.4
        });
    }
    
    // 创建太阳实体
    solarSystem.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(solarSystem.sun);
    
    // 创建额外的光源增强太阳的可见度
    const sunLight = new THREE.PointLight(0xffffaa, 5, 500, 1);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    solarSystem.sun.add(sunLight);
    
    // 添加环境光以提高整体亮度
    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);
    
    // 添加多层太阳光晕效果，使用纯色材质
    // 第一层光晕 - 红色
    const glow1Geometry = new THREE.SphereGeometry(27, 32, 32);
    const glow1Material = new THREE.MeshBasicMaterial({
        color: 0xFF5500,  // 红色
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    const glow1 = new THREE.Mesh(glow1Geometry, glow1Material);
    solarSystem.sun.add(glow1);
    
    // 第二层光晕 - 深红色
    const glow2Geometry = new THREE.SphereGeometry(29, 32, 32);
    const glow2Material = new THREE.MeshBasicMaterial({
        color: 0xFF3300,  // 深红色
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const glow2 = new THREE.Mesh(glow2Geometry, glow2Material);
    solarSystem.sun.add(glow2);
    
    // 第三层光晕 - 暗红色
    const glow3Geometry = new THREE.SphereGeometry(32, 32, 32);
    const glow3Material = new THREE.MeshBasicMaterial({
        color: 0xBB2200,  // 暗红色
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const glow3 = new THREE.Mesh(glow3Geometry, glow3Material);
    solarSystem.sun.add(glow3);
    
    // 添加太阳耀斑效果（简化版）
    // const updateSolarFlares = addSolarFlares(solarSystem.sun);
    // effectUpdates.push(updateSolarFlares);
    
    // 创建行星和轨道
    planetData.forEach((planet, index) => {
        createPlanet(planet, index);
        createOrbit(planet.distance);
    });
}

// 添加太阳耀斑效果
function addSolarFlares(sun) {
    const flareCount = 5;
    const flares = [];
    
    for (let i = 0; i < flareCount; i++) {
        // 创建耀斑几何体
        const size = Math.random() * 8 + 5;
        const flareGeometry = new THREE.PlaneGeometry(size, size * 2);
        
        // 创建耀斑材质
        const flareMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF3300,  // 红色，与太阳匹配
            transparent: true,
            opacity: Math.random() * 0.4 + 0.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        // 创建耀斑网格
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        
        // 设置随机位置和旋转
        const distance = 25 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;
        flare.position.set(
            Math.cos(angle) * distance,
            (Math.random() - 0.5) * 20,
            Math.sin(angle) * distance
        );
        flare.rotation.z = Math.random() * Math.PI;
        
        // 添加到太阳
        sun.add(flare);
        flares.push(flare);
    }
    
    // 返回更新函数
    return function updateFlares(time) {
        for (let i = 0; i < flares.length; i++) {
            const flare = flares[i];
            
            // 旋转耀斑
            flare.rotation.z += 0.01;
            
            // 调整不透明度
            const opacity = Math.sin(time * 0.5 + i) * 0.2 + 0.6;
            flare.material.opacity = opacity * 0.5;
            
            // 缩放脉动
            const scale = Math.sin(time * 0.3 + i * 0.5) * 0.1 + 1.0;
            flare.scale.set(scale, scale, scale);
        }
    };
}

// 创建行星
function createPlanet(data, index) {
    // 创建行星组
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);
    planetGroup.userData = { 
        revolution: data.revolution,
        distance: data.distance,
        currentAngle: Math.random() * Math.PI * 2 // 随机初始角度
    };
    
    // 设置行星初始位置
    const angle = planetGroup.userData.currentAngle;
    planetGroup.position.x = Math.cos(angle) * data.distance;
    planetGroup.position.z = Math.sin(angle) * data.distance;
    
    // 尝试加载纹理，如果纹理路径存在的话
    let planetMaterial;
    if (data.texturePath) {
        console.log(`尝试加载行星纹理: ${data.name} - ${data.texturePath}`);
        try {
            // 创建基础材质
            planetMaterial = new THREE.MeshStandardMaterial({ 
                color: data.color, // 先使用颜色作为基础
                metalness: 0.0,
                roughness: 0.5,
                emissive: new THREE.Color(data.color).multiplyScalar(0.2),
                emissiveIntensity: 0.3
            });
            
            // 使用绝对路径
            const absolutePath = window.location.origin + '/' + data.texturePath.replace(/^\.\//, '');
            console.log(`尝试绝对路径加载: ${absolutePath}`);
            
            // 尝试使用绝对路径加载
            const textureLoader = new THREE.TextureLoader();
            
            // 添加纹理加载的回调
            textureLoader.load(
                data.texturePath, // 先尝试原始路径
                // 成功回调
                function(texture) {
                    console.log(`成功加载纹理: ${data.name}`, texture);
                    // 确保纹理正确应用
                    planetMaterial.map = texture;
                    planetMaterial.needsUpdate = true;
                },
                // 进度回调
                function(xhr) {
                    console.log(`${data.name}纹理加载进度: ${(xhr.loaded / xhr.total * 100)}%`);
                },
                // 错误回调
                function(error) {
                    console.error(`原始路径加载失败，尝试绝对路径: ${absolutePath}`);
                    
                    // 如果原始路径失败，尝试绝对路径
                    textureLoader.load(
                        absolutePath,
                        function(texture) {
                            console.log(`使用绝对路径成功加载纹理: ${data.name}`, texture);
                            planetMaterial.map = texture;
                            planetMaterial.needsUpdate = true;
                        },
                        null,
                        function(error) {
                            console.error(`所有路径都无法加载纹理 ${data.name}:`, error);
                        }
                    );
                }
            );
        } catch(e) {
            console.warn(`无法加载纹理 ${data.texturePath}，回退到颜色材质`, e);
            // 回退到颜色材质
            planetMaterial = new THREE.MeshStandardMaterial({ 
                color: data.color,
                metalness: 0.0,
                roughness: 0.5,
                emissive: new THREE.Color(data.color),
                emissiveIntensity: 0.3
            });
        }
    } else {
        // 直接使用颜色材质，如果没有纹理路径
        planetMaterial = new THREE.MeshStandardMaterial({ 
            color: data.color,
            metalness: 0.0,
            roughness: 0.5,
            emissive: new THREE.Color(data.color),
            emissiveIntensity: 0.3
        });
    }
    
    // 创建行星
    const planetGeometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    planetMesh.userData = { rotation: data.rotation };
    
    // 设置轴倾角
    if (data.axialTilt) {
        planetMesh.rotation.x = data.axialTilt;
    }
    
    // 为行星添加局部光源使其更亮
    const planetLight = new THREE.PointLight(data.color, 1.0, data.radius * 10); // 使用行星颜色作为光源颜色
    planetLight.position.set(data.radius * 2, 0, 0);
    planetMesh.add(planetLight);
    
    // 添加标签
    addPlanetLabel(planetMesh, data.name);
    
    // 处理特殊行星特性
    if (data.hasRings) {
        addRings(planetMesh, data.radius);
    }
    
    if (data.hasMoon) {
        addMoon(planetMesh);
    }
    
    if (data.hasAtmosphere) {
        // 添加大气层效果
        addAtmosphere(planetMesh, data.radius, data.atmosphereColor || 0x88CCFF);
    }
    
    // 添加到行星组
    planetGroup.add(planetMesh);
    solarSystem.planets.push({ group: planetGroup, mesh: planetMesh });
}

// 添加土星环
function addRings(planet, planetRadius) {
    const innerRadius = planetRadius + 2;
    const outerRadius = planetRadius + 12;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // 调整环的顶点以便正确渲染
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        ringGeometry.attributes.uv.setXY(i, v3.length() < (innerRadius + 3) ? 0 : 1, 1);
        
        if (v3.x < 0) {
            v3.z = -Math.abs(v3.z) * 0.1;
        } else {
            v3.z = Math.abs(v3.z) * 0.1;
        }
        
        pos.setXYZ(i, v3.x, v3.y, v3.z);
    }
    
    // 直接使用颜色材质，不尝试加载纹理
    const ringsMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCBB99,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        emissive: new THREE.Color(0x444444),
        emissiveIntensity: 0.3,
        roughness: 0.6,
        metalness: 0.1
    });
    
    // 创建环实体
    const rings = new THREE.Mesh(ringGeometry, ringsMaterial);
    rings.rotation.x = Math.PI / 2;
    rings.castShadow = true;
    rings.receiveShadow = true;
    
    // 添加一个内环提高层次感
    const innerRingGeometry = new THREE.RingGeometry(innerRadius * 1.1, innerRadius * 1.4, 64);
    const innerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0xDDCCAA,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        emissive: new THREE.Color(0x555555),
        emissiveIntensity: 0.4,
        roughness: 0.4,
        metalness: 0.2
    });
    
    const innerRings = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRings.rotation.x = Math.PI / 2;
    innerRings.castShadow = true;
    innerRings.receiveShadow = true;
    
    planet.add(rings);
    planet.add(innerRings);
}

// 添加月球
function addMoon(planet) {
    const moonGroup = new THREE.Group();
    
    const moonGeometry = new THREE.SphereGeometry(1.5, 24, 24);
    const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.1,
        roughness: 0.8,
        emissive: 0x444444,
        emissiveIntensity: 0.2
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;
    
    // 设置月球位置
    moon.position.set(10, 0, 0);
    
    // 添加月球标签
    addPlanetLabel(moon, "月球");
    
    // 为月球添加微弱光源使其更明显
    const moonLight = new THREE.PointLight(0xDDDDDD, 0.6, 12); // 增强月球光源
    moonLight.position.set(2, 0, 0);
    moon.add(moonLight);
    
    moonGroup.add(moon);
    moonGroup.userData = { revolution: 0.05 };
    planet.add(moonGroup);
}

// 添加大气层
function addAtmosphere(planet, planetRadius, atmosphereColor) {
    // 创建外层大气
    const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.15, 32, 32);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide,
        emissive: new THREE.Color(atmosphereColor).multiplyScalar(0.5),
        emissiveIntensity: 0.4,
        shininess: 30
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planet.add(atmosphere);
    
    // 创建内层大气 - 更加明亮
    const innerAtmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.08, 32, 32);
    const innerAtmosphereMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(atmosphereColor).lerp(new THREE.Color(0xffffff), 0.3),
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        emissive: new THREE.Color(atmosphereColor).lerp(new THREE.Color(0xffffff), 0.5),
        emissiveIntensity: 0.5,
        shininess: 50
    });
    
    const innerAtmosphere = new THREE.Mesh(innerAtmosphereGeometry, innerAtmosphereMaterial);
    planet.add(innerAtmosphere);
    
    // 添加大气闪烁效果
    const atmosphereUpdate = function(time) {
        const pulseFactor = 0.05 * Math.sin(time * 2) + 1;
        atmosphere.material.opacity = 0.4 * pulseFactor;
        innerAtmosphere.material.opacity = 0.3 * pulseFactor;
    };
    
    effectUpdates.push(atmosphereUpdate);
}

// 添加行星标签
function addPlanetLabel(planet, name) {
    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256; // 保持canvas大小
    canvas.height = 96;
    
    // 设置完全透明背景
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置字体
    context.font = 'bold 42px Arial, "Microsoft YaHei", sans-serif';
    
    // 添加文字阴影效果，增强可读性
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // 文字颜色设为纯白色
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 绘制文字
    context.fillText(name, canvas.width / 2, canvas.height / 2);
    
    // 添加发光效果
    context.shadowColor = 'rgba(255, 255, 255, 0.9)';
    context.shadowBlur = 15;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.fillText(name, canvas.width / 2, canvas.height / 2);
    
    // 创建精灵纹理
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    
    // 创建精灵并设置位置
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false, // 禁用深度测试，确保标签始终可见
            depthWrite: false // 禁用深度写入
        })
    );
    
    const scaleFactor = planet.geometry.parameters.radius / 4 + 1; // 根据行星大小调整标签大小
    sprite.scale.set(8 * scaleFactor, 3 * scaleFactor, 1);
    sprite.position.y = planet.geometry.parameters.radius + 3; // 稍微提高标签位置
    
    // 添加始终面向相机的功能
    sprite.onBeforeRender = function(renderer, scene, camera) {
        const cameraPos = new THREE.Vector3();
        camera.getWorldPosition(cameraPos);
        sprite.lookAt(cameraPos);
    };
    
    planet.add(sprite);
}

// 创建行星轨道
function createOrbit(radius) {
    const segments = 128;
    const orbitGeometry = new THREE.BufferGeometry();
    const vertices = [];
    
    // 创建完整的圆形路径点
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        vertices.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    }
    
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    // 根据轨道半径选择不同的颜色
    let orbitColor;
    if (radius < 60) { // 内行星（水星、金星）
        orbitColor = 0x6699FF; // 蓝色
    } else if (radius < 100) { // 地球、火星
        orbitColor = 0x33CCFF; // 青色
    } else if (radius < 180) { // 木星、土星
        orbitColor = 0xFFAA00; // 橙色
    } else { // 天王星、海王星
        orbitColor = 0x66FFCC; // 青绿色
    }
    
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: orbitColor,
        transparent: true,
        opacity: 0.5,
        linewidth: 2 // 注意：由于WebGL限制，线宽在大多数浏览器中被限制为1
    });
    
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
    solarSystem.orbits.push(orbit);
}

// 创建星空背景
function createStarBackground() {
    // 创建更多更亮的星星
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        sizeAttenuation: false
    });
    
    const starsVertices = [];
    for (let i = 0; i < 15000; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // 创建一些亮星
    const brightStarsGeometry = new THREE.BufferGeometry();
    const brightStarsMaterial = new THREE.PointsMaterial({
        color: 0xffffcc,
        size: 1.0,
        sizeAttenuation: false
    });
    
    const brightStarsVertices = [];
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1500 - 750;
        const y = Math.random() * 1500 - 750;
        const z = Math.random() * 1500 - 750;
        brightStarsVertices.push(x, y, z);
    }
    
    brightStarsGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(brightStarsVertices, 3)
    );
    
    const brightStars = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
    scene.add(brightStars);
}

// 窗口大小调整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 更新速度
function updateSpeed() {
    const slider = document.getElementById('speed-slider');
    animation.speed = parseFloat(slider.value);
    document.getElementById('speed-value').textContent = animation.speed + 'x';
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 更新时间
    const delta = animation.clock.getDelta();
    animation.time += delta;
    
    if (!animation.paused) {
        // 更新太阳自转
        solarSystem.sun.rotation.y += 0.002 * animation.speed;
        
        // 更新行星自转和公转
        solarSystem.planets.forEach((planetObj, index) => {
            // 行星自转 - 考虑轴倾角
            const planet = planetData[index];
            const rotationSpeed = planetObj.mesh.userData.rotation * animation.speed;
            
            // 如果行星有倾角，使用四元数进行旋转更新
            if (planet && planet.axialTilt) {
                // 创建表示绕自转轴的旋转四元数
                const rotationQuat = new THREE.Quaternion();
                rotationQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed);
                
                // 应用四元数旋转，保持倾角
                planetObj.mesh.quaternion.multiply(rotationQuat);
            } else {
                // 普通Y轴自转
                planetObj.mesh.rotation.y += rotationSpeed;
            }
            
            // 行星公转 - 使用正弦和余弦计算新位置
            const planetGroup = planetObj.group;
            const distance = planetGroup.userData.distance;
            const revolution = planetGroup.userData.revolution * animation.speed;
            
            // 更新角度并计算新位置
            planetGroup.userData.currentAngle = (planetGroup.userData.currentAngle || 0) + revolution;
            const angle = planetGroup.userData.currentAngle;
            
            planetGroup.position.x = Math.cos(angle) * distance;
            planetGroup.position.z = Math.sin(angle) * distance;
            
            // 如果行星有月球，更新月球公转
            planetObj.mesh.children.forEach(child => {
                if (child instanceof THREE.Group && child.userData.revolution) {
                    child.rotation.y += child.userData.revolution * animation.speed;
                }
            });
        });
        
        // 更新特效
        effectUpdates.forEach(updateFn => {
            updateFn(animation.time);
        });
    }
    
    // 更新轨道控制器
    controls.update();
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 暂停/继续动画
function togglePause() {
    animation.paused = !animation.paused;
}

// 重置相机位置
function resetCamera() {
    camera.position.set(0, 200, 350);
    camera.lookAt(0, 0, 0);
    controls.reset();
}

// 设置俯视图
function setTopView() {
    camera.position.set(0, 400, 0);
    camera.lookAt(0, 0, 0);
    controls.update();
}

// 设置侧视图
function setSideView() {
    camera.position.set(400, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.update();
}

// 鼠标点击检测
function onCanvasClick(event) {
    // 计算鼠标在归一化设备坐标中的位置
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 创建射线投射器
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // 获取所有可能的交点
    const planetMeshes = solarSystem.planets.map(p => p.mesh);
    const intersects = raycaster.intersectObjects(planetMeshes, true);
    
    // 清除之前的行星信息
    const planetInfo = document.getElementById('planet-info');
    planetInfo.style.display = 'none';
    planetInfo.innerHTML = '';
    
    // 如果有交点，显示第一个行星的信息
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // 查找行星数据
        let planetName = '';
        let selectedPlanet = null;
        
        solarSystem.planets.forEach((planet, index) => {
            if (planet.mesh === object || planet.mesh.children.includes(object)) {
                planetName = planetData[index].name;
                selectedPlanet = planetData[index];
            }
        });
        
        if (selectedPlanet) {
            // 轴倾角信息，如果有的话
            const axialTiltInfo = selectedPlanet.axialTilt ? 
                `<p>轴倾角: ${Math.abs(selectedPlanet.axialTilt * 180 / Math.PI).toFixed(1)}°</p>` : 
                '';
            
            // 特殊特性
            let specialFeatures = '';
            if (selectedPlanet.hasRings) specialFeatures += '<span class="feature-tag">环系</span>';
            if (selectedPlanet.hasMoon) specialFeatures += '<span class="feature-tag">卫星</span>';
            if (selectedPlanet.hasAtmosphere) specialFeatures += '<span class="feature-tag">大气层</span>';
            
            const featuresSection = specialFeatures ? 
                `<div class="special-features">${specialFeatures}</div>` : '';
            
            planetInfo.innerHTML = `
                <h3>${planetName}</h3>
                <p>半径: ${selectedPlanet.radius} 单位</p>
                <p>距太阳: ${selectedPlanet.distance} 单位</p>
                <p>自转速度: ${selectedPlanet.rotation.toFixed(4)}</p>
                <p>公转速度: ${selectedPlanet.revolution.toFixed(4)}</p>
                ${axialTiltInfo}
                ${featuresSection}
            `;
            planetInfo.style.display = 'block';
            
            // 添加样式类以设置与行星相同的边框颜色
            planetInfo.style.borderColor = '#' + selectedPlanet.color.toString(16).padStart(6, '0');
        }
    }
}

// 当页面加载完成时，初始化场景
window.addEventListener('load', init); 