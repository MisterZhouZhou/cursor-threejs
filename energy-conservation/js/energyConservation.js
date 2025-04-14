// 能量守恒定律3D可视化
document.addEventListener('DOMContentLoaded', () => {
    // 物理参数
    const physics = {
        gravity: 9.8,         // 重力加速度 (m/s²)
        mass: 1.0,            // 小球质量 (kg)
        friction: 0.1,        // 摩擦系数
        initialHeight: 7,    // 初始高度 (m)
        energyLoss: 0.1,      // 碰撞能量损失比例
        isPaused: false,      // 是否暂停
        // 能量相关值
        potentialEnergy: 0,   // 势能 (J)
        kineticEnergy: 0,     // 动能 (J)
        totalEnergy: 0,       // 总能量 (J)
        initialTotalEnergy: 0 // 初始总能量 (J)
    };

    // 初始化场景
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 添加雾效，增强深度感
    scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

    // 设置相机
    const camera = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.set(15, 10, 15);

    // 设置渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 轨道控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    // 添加平行光（主光源）
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // 添加聚光灯（强调小球）
    const spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(-5, 15, 5);
    spotLight.castShadow = true;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    scene.add(spotLight);

    // 创建坡道
    const createRamp = () => {
        // 创建坡道的几何体
        const rampGeometry = new THREE.BoxGeometry(20, 0.5, 8);
        const rampMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,  // 棕色
            metalness: 0.2,
            roughness: 0.8
        });
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        // 倾斜坡道
        ramp.rotation.z = -Math.PI / 12; // 15度倾斜
        
        // 调整位置
        ramp.position.set(0, 2, 0);
        
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        
        // 添加坡道到场景
        scene.add(ramp);
        
        // 添加标签：势能
        addLabel("势能", -8, 7, 0, 0x4f83cc);
        
        // 添加标签：动能
        addLabel("动能", 8, 1, 0, 0xc46f5c);
        
        // 返回坡道对象
        return ramp;
    };

    // 创建地面
    const createGround = () => {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.2,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;
        scene.add(ground);
        
        return ground;
    };

    // 创建小球
    const createBall = () => {
        const radius = 0.5;
        const ballGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x333333,
            emissiveIntensity: 0.2
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        
        // 设置初始位置在坡道顶端
        ball.position.set(-9, physics.initialHeight, 0);
        
        ball.castShadow = true;
        ball.receiveShadow = true;
        
        // 添加发光效果
        const ballLight = new THREE.PointLight(0xffffff, 0.5, 2);
        ball.add(ballLight);
        
        scene.add(ball);
        
        // 初始化物理属性
        ball.userData.velocity = new THREE.Vector3(0, 0, 0);
        ball.userData.onGround = false;
        
        return ball;
    };

    // 添加能量条
    const createEnergyBars = () => {
        // 容器组
        const barsGroup = new THREE.Group();
        scene.add(barsGroup);
        
        // 能量条的最大高度
        const maxBarHeight = 10;
        const barWidth = 0.5;
        const barDepth = 0.5;
        
        // 创建势能条
        const potentialBarGeometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
        const potentialBarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4f83cc,
            transparent: true,
            opacity: 0.8
        });
        const potentialBar = new THREE.Mesh(potentialBarGeometry, potentialBarMaterial);
        potentialBar.position.set(-12, 0, 0);
        barsGroup.add(potentialBar);
        
        // 创建动能条
        const kineticBarGeometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
        const kineticBarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xc46f5c,
            transparent: true,
            opacity: 0.8
        });
        const kineticBar = new THREE.Mesh(kineticBarGeometry, kineticBarMaterial);
        kineticBar.position.set(-10, 0, 0);
        barsGroup.add(kineticBar);
        
        // 创建总能量条
        const totalBarGeometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
        const totalBarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x55a868,
            transparent: true,
            opacity: 0.8
        });
        const totalBar = new THREE.Mesh(totalBarGeometry, totalBarMaterial);
        totalBar.position.set(-8, 0, 0);
        barsGroup.add(totalBar);
        
        // 创建能量条底座
        const baseGeometry = new THREE.BoxGeometry(6, 0.5, 1);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(-10, -2, 0);
        barsGroup.add(base);
        
        return {
            potentialBar,
            kineticBar,
            totalBar,
            maxBarHeight,
            update: (potential, kinetic, total, maxEnergy) => {
                // 更新能量条高度
                const potentialHeight = (potential / maxEnergy) * maxBarHeight;
                const kineticHeight = (kinetic / maxEnergy) * maxBarHeight;
                const totalHeight = (total / maxEnergy) * maxBarHeight;
                
                potentialBar.scale.y = potentialHeight || 0.01; // 避免缩放为0
                kineticBar.scale.y = kineticHeight || 0.01;
                totalBar.scale.y = totalHeight || 0.01;
                
                potentialBar.position.y = -2 + potentialHeight / 2;
                kineticBar.position.y = -2 + kineticHeight / 2;
                totalBar.position.y = -2 + totalHeight / 2;
            }
        };
    };
    
    // 添加文本标签
    const addLabel = (text, x, y, z, color) => {
        // 创建一个精灵来显示文本
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        context.font = 'Bold 40px Arial';
        context.fillStyle = '#' + new THREE.Color(color).getHexString();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 128, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(5, 2.5, 1);
        
        scene.add(sprite);
        
        return sprite;
    };

    // 创建轨迹
    const createTrail = () => {
        const maxPoints = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxPoints * 3); // xyz
        
        // 初始化所有点为原点
        for (let i = 0; i < maxPoints * 3; i++) {
            positions[i] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // 创建渐变材质
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        
        let currentIndex = 0;
        
        return {
            line,
            maxPoints,
            addPoint: (point) => {
                positions[currentIndex * 3] = point.x;
                positions[currentIndex * 3 + 1] = point.y;
                positions[currentIndex * 3 + 2] = point.z;
                
                currentIndex = (currentIndex + 1) % maxPoints;
                
                // 更新几何体
                geometry.attributes.position.needsUpdate = true;
            },
            clear: () => {
                for (let i = 0; i < maxPoints * 3; i++) {
                    positions[i] = 0;
                }
                currentIndex = 0;
                geometry.attributes.position.needsUpdate = true;
            }
        };
    };

    // 创建图表显示能量变化
    const createEnergyChart = () => {
        // 图表组
        const chartGroup = new THREE.Group();
        scene.add(chartGroup);
        
        // 定义图表参数
        const chartWidth = 15;
        const chartHeight = 8;
        const chartDepth = 0.1;
        
        // 创建图表背景
        const chartGeometry = new THREE.BoxGeometry(chartWidth, chartHeight, chartDepth);
        const chartMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x111111,
            transparent: true,
            opacity: 0.7
        });
        const chartBackground = new THREE.Mesh(chartGeometry, chartMaterial);
        chartBackground.position.set(10, 5, -5);
        chartGroup.add(chartBackground);
        
        // 创建时间轴和能量轴
        const axisGeometry = new THREE.BoxGeometry(chartWidth, 0.05, 0.05);
        const axisYGeometry = new THREE.BoxGeometry(0.05, chartHeight, 0.05);
        const axisMaterial = new THREE.MeshBasicMaterial({ color: 0x777777 });
        
        const xAxis = new THREE.Mesh(axisGeometry, axisMaterial);
        xAxis.position.set(10, 1, -4.9);
        chartGroup.add(xAxis);
        
        const yAxis = new THREE.Mesh(axisYGeometry, axisMaterial);
        yAxis.position.set(2.5, 5, -4.9);
        chartGroup.add(yAxis);
        
        // 创建标签
        const chartLabelCanvas = document.createElement('canvas');
        const chartLabelContext = chartLabelCanvas.getContext('2d');
        chartLabelCanvas.width = 512;
        chartLabelCanvas.height = 128;
        
        chartLabelContext.font = 'Bold 36px Arial';
        chartLabelContext.fillStyle = '#FFFFFF';
        chartLabelContext.textAlign = 'center';
        chartLabelContext.fillText('能量-时间图', 256, 64);
        
        const chartLabelTexture = new THREE.CanvasTexture(chartLabelCanvas);
        const chartLabelMaterial = new THREE.SpriteMaterial({ 
            map: chartLabelTexture,
            transparent: true
        });
        const chartLabel = new THREE.Sprite(chartLabelMaterial);
        chartLabel.position.set(10, 9.5, -4.9);
        chartLabel.scale.set(10, 2.5, 1);
        chartGroup.add(chartLabel);
        
        // 创建能量曲线
        const createEnergyCurve = (color, yOffset) => {
            const maxPoints = 100;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(maxPoints * 3);
            
            for (let i = 0; i < maxPoints; i++) {
                positions[i * 3] = 2.5 + (i / maxPoints) * chartWidth;
                positions[i * 3 + 1] = 1;
                positions[i * 3 + 2] = -4.8;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
            const line = new THREE.Line(geometry, material);
            chartGroup.add(line);
            
            let currentIndex = 0;
            
            return {
                update: (value, maxValue) => {
                    const normalizedValue = (value / maxValue) * (chartHeight - 1) + 1;
                    
                    // 移动所有点向左偏移
                    for (let i = 0; i < maxPoints - 1; i++) {
                        positions[i * 3] = positions[(i + 1) * 3];
                        positions[i * 3 + 1] = positions[(i + 1) * 3 + 1];
                    }
                    
                    // 添加新点
                    positions[(maxPoints - 1) * 3] = 2.5 + chartWidth - 0.5;
                    positions[(maxPoints - 1) * 3 + 1] = normalizedValue + yOffset;
                    
                    geometry.attributes.position.needsUpdate = true;
                }
            };
        };
        
        const potentialCurve = createEnergyCurve(0x4f83cc, 0);
        const kineticCurve = createEnergyCurve(0xc46f5c, 0);
        const totalCurve = createEnergyCurve(0x55a868, 0);
        
        return {
            update: (potential, kinetic, total, maxEnergy) => {
                potentialCurve.update(potential, maxEnergy);
                kineticCurve.update(kinetic, maxEnergy);
                totalCurve.update(total, maxEnergy);
            }
        };
    };

    // 初始化场景对象
    const ramp = createRamp();
    const ground = createGround();
    const ball = createBall();
    const energyBars = createEnergyBars();
    const trail = createTrail();
    const energyChart = createEnergyChart();

    // 计算坡道的世界坐标和法线
    const calculateRampWorldInfo = () => {
        // 创建一个平面的法向量（坡道的法线）
        const normalLocal = new THREE.Vector3(0, 1, 0);
        const normalWorld = normalLocal.clone().applyQuaternion(ramp.quaternion);
        
        // 计算坡道表面的世界坐标系点
        const pointLocal = new THREE.Vector3(0, 0.25, 0); // 坡道上表面
        const pointWorld = pointLocal.clone().applyMatrix4(ramp.matrixWorld);
        
        return { normal: normalWorld, point: pointWorld };
    };

    // 计算小球与坡道的碰撞
    const checkBallRampCollision = () => {
        const rampInfo = calculateRampWorldInfo();
        
        // 计算小球到坡道平面的有向距离
        const ballToPlane = new THREE.Vector3().subVectors(ball.position, rampInfo.point);
        const distance = ballToPlane.dot(rampInfo.normal);
        
        // 小球半径
        const radius = 0.5;
        
        // 如果距离小于半径，则发生碰撞
        if (distance < radius) {
            // 调整小球位置，使其位于坡道表面
            const adjustment = new THREE.Vector3().copy(rampInfo.normal).multiplyScalar(radius - distance);
            ball.position.add(adjustment);
            
            // 计算反弹后的速度
            const velocity = ball.userData.velocity;
            
            // 计算沿法线的速度分量
            const normalVelocity = rampInfo.normal.clone().multiplyScalar(velocity.dot(rampInfo.normal));
            
            // 计算平行于坡道的速度分量
            const tangentialVelocity = new THREE.Vector3().subVectors(velocity, normalVelocity);
            
            // 应用摩擦力减小切向速度
            tangentialVelocity.multiplyScalar(1 - physics.friction);
            
            // 反弹：反转法线速度方向，并损失一部分能量
            normalVelocity.multiplyScalar(-(1 - physics.energyLoss));
            
            // 合成新的速度
            velocity.copy(new THREE.Vector3().addVectors(normalVelocity, tangentialVelocity));
            
            return true;
        }
        
        return false;
    };

    // 计算小球与地面的碰撞
    const checkBallGroundCollision = () => {
        const radius = 0.5;
        
        // 检查小球是否接触地面
        if (ball.position.y - radius < ground.position.y) {
            // 调整小球位置
            ball.position.y = ground.position.y + radius;
            
            // 计算反弹速度
            const velocity = ball.userData.velocity;
            
            // 仅反转y方向分量，并添加能量损失
            velocity.y = -velocity.y * (1 - physics.energyLoss);
            
            // 应用地面摩擦力减小x和z方向的速度
            velocity.x *= (1 - physics.friction);
            velocity.z *= (1 - physics.friction);
            
            // 如果y方向速度很小，认为小球停止弹跳
            if (Math.abs(velocity.y) < 0.1) {
                velocity.y = 0;
                ball.userData.onGround = true;
            }
            
            return true;
        }
        
        return false;
    };

    // 计算能量值
    const calculateEnergy = () => {
        const velocity = ball.userData.velocity;
        const height = ball.position.y + 2; // 相对于地面的高度
        
        // 计算势能: mgh
        physics.potentialEnergy = physics.mass * physics.gravity * height;
        
        // 计算动能: 1/2 * m * v^2
        const speed = velocity.length();
        physics.kineticEnergy = 0.5 * physics.mass * speed * speed;
        
        // 计算总能量
        physics.totalEnergy = physics.potentialEnergy + physics.kineticEnergy;
        
        // 更新DOM中的能量值显示
        document.getElementById('potential-value').textContent = physics.potentialEnergy.toFixed(2);
        document.getElementById('kinetic-value').textContent = physics.kineticEnergy.toFixed(2);
        document.getElementById('total-value').textContent = physics.totalEnergy.toFixed(2);
        
        // 返回能量值，方便外部使用
        return {
            potential: physics.potentialEnergy,
            kinetic: physics.kineticEnergy,
            total: physics.totalEnergy
        };
    };

    // 更新小球位置和速度
    const updateBallPhysics = (deltaTime) => {
        if (physics.isPaused) return;
        
        const velocity = ball.userData.velocity;
        
        // 应用重力加速度
        velocity.y -= physics.gravity * deltaTime;
        
        // 检查与坡道的碰撞
        checkBallRampCollision();
        
        // 检查与地面的碰撞
        checkBallGroundCollision();
        
        // 更新小球位置
        ball.position.x += velocity.x * deltaTime;
        ball.position.y += velocity.y * deltaTime;
        ball.position.z += velocity.z * deltaTime;
        
        // 限制小球在场景范围内
        if (Math.abs(ball.position.x) > 20) {
            ball.position.x = Math.sign(ball.position.x) * 20;
            velocity.x *= -0.8; // 碰到边界反弹
        }
        
        if (Math.abs(ball.position.z) > 20) {
            ball.position.z = Math.sign(ball.position.z) * 20;
            velocity.z *= -0.8; // 碰到边界反弹
        }
        
        // 添加轨迹点
        trail.addPoint(ball.position);
        
        // 计算能量
        const energy = calculateEnergy();
        
        // 更新能量条
        energyBars.update(
            energy.potential,
            energy.kinetic,
            energy.total,
            physics.initialTotalEnergy * 1.2 // 稍微放大一点，避免能量条过满
        );
        
        // 更新能量图表
        energyChart.update(
            energy.potential,
            energy.kinetic,
            energy.total,
            physics.initialTotalEnergy * 1.2
        );
        
        // 更新光源跟随小球
        spotLight.position.set(ball.position.x, ball.position.y + 10, ball.position.z);
        spotLight.target = ball;
    };

    // 重置模拟
    const resetSimulation = () => {
        // 重置小球位置和速度
        ball.position.set(-9, physics.initialHeight, 0);
        ball.userData.velocity.set(0, 0, 0);
        ball.userData.onGround = false;
        
        // 重置轨迹
        trail.clear();
        
        // 计算初始总能量
        physics.initialTotalEnergy = physics.mass * physics.gravity * (physics.initialHeight + 2);
        
        // 重新计算并更新能量显示
        calculateEnergy();
    };

    // 时钟对象用于跟踪时间
    const clock = new THREE.Clock();

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        
        const deltaTime = Math.min(clock.getDelta(), 0.1); // 限制最大时间步长，避免物理计算不稳定
        
        // 更新控制器
        controls.update();
        
        // 更新小球物理
        updateBallPhysics(deltaTime);
        
        // 渲染场景
        renderer.render(scene, camera);
    }

    // 事件监听器
    document.getElementById('reset-btn').addEventListener('click', resetSimulation);
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        physics.isPaused = !physics.isPaused;
    });
    
    document.getElementById('gravity').addEventListener('input', (e) => {
        physics.gravity = parseFloat(e.target.value);
        document.getElementById('gravity-value').textContent = physics.gravity.toFixed(1);
    });
    
    document.getElementById('friction').addEventListener('input', (e) => {
        physics.friction = parseFloat(e.target.value);
        document.getElementById('friction-value').textContent = physics.friction.toFixed(2);
    });

    // 处理窗口大小变化
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    // 初始化模拟
    resetSimulation();

    // 开始动画循环
    animate();
}); 