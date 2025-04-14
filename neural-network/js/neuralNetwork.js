// 神经网络3D可视化
document.addEventListener('DOMContentLoaded', () => {
    // 场景配置
    const config = {
        // 神经网络结构 [输入层节点数, 隐藏层节点数, 输出层节点数]
        networkStructure: [4, 6, 2],
        // 节点颜色
        nodeColors: {
            input: 0x4f83cc,    // 蓝色
            hidden: 0xc46f5c,   // 红色
            output: 0x55a868    // 绿色
        },
        // 连接颜色
        edgeColors: {
            active: 0xffcc00,   // 黄色
            inactive: 0x666666  // 灰色
        },
        // 节点大小
        nodeSizes: {
            input: 0.8,
            hidden: 0.7,
            output: 0.8
        },
        // 神经元层之间的距离
        layerDistance: 5,
        // 同一层神经元之间的垂直距离
        nodeDistance: 2.5,
        // 信号动画速度
        signalSpeed: 0.06,
        // 信号大小
        signalSize: 0.2
    };

    // 初始化场景
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 添加雾效，增强深度感
    scene.fog = new THREE.FogExp2(0x1a1a1a, 0.05);

    // 设置相机
    const camera = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.set(0, 5, 15);

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
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    scene.add(dirLight);

    // 添加聚光灯（次光源）
    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(-10, 8, 5);
    spotLight.castShadow = true;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    scene.add(spotLight);

    // 神经网络对象类
    class NeuralNetwork {
        constructor(config) {
            this.config = config;
            this.nodes = [];
            this.edges = [];
            this.signals = [];
            this.nodeObjects = new THREE.Group();
            this.edgeObjects = new THREE.Group();
            this.signalObjects = new THREE.Group();
            
            scene.add(this.nodeObjects);
            scene.add(this.edgeObjects);
            scene.add(this.signalObjects);

            this.buildNetwork();
            this.createLabels();
        }

        // 创建神经网络结构
        buildNetwork() {
            const { networkStructure, layerDistance, nodeDistance } = this.config;
            
            // 创建节点
            for (let layer = 0; layer < networkStructure.length; layer++) {
                const numNodes = networkStructure[layer];
                const layerType = layer === 0 ? 'input' : 
                                 layer === networkStructure.length - 1 ? 'output' : 'hidden';
                
                const nodesInLayer = [];
                const layerX = layer * layerDistance - 
                               (networkStructure.length - 1) * layerDistance / 2;
                
                for (let i = 0; i < numNodes; i++) {
                    const nodeY = (i - (numNodes - 1) / 2) * nodeDistance;
                    
                    const node = {
                        position: new THREE.Vector3(layerX, nodeY, 0),
                        type: layerType,
                        layer: layer,
                        index: i,
                        activation: Math.random() // 随机激活值
                    };
                    
                    this.createNodeObject(node);
                    nodesInLayer.push(node);
                }
                
                this.nodes.push(nodesInLayer);
            }
            
            // 创建连接
            for (let layer = 0; layer < networkStructure.length - 1; layer++) {
                const currentLayer = this.nodes[layer];
                const nextLayer = this.nodes[layer + 1];
                
                for (const sourceNode of currentLayer) {
                    for (const targetNode of nextLayer) {
                        const edge = {
                            source: sourceNode,
                            target: targetNode,
                            weight: Math.random() * 2 - 1, // -1到1之间的随机权重
                            active: Math.random() > 0.5 // 随机激活状态
                        };
                        
                        this.createEdgeObject(edge);
                        this.edges.push(edge);
                    }
                }
            }
        }

        // 创建节点的3D对象
        createNodeObject(node) {
            const { type } = node;
            const color = this.config.nodeColors[type];
            const size = this.config.nodeSizes[type];
            
            // 创建球体几何体
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            
            // 创建标准材质，使用金属质感和高光
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.5,
                roughness: 0.2,
                emissive: color,
                emissiveIntensity: 0.2 + node.activation * 0.3
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(node.position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // 添加发光效果
            const glow = new THREE.PointLight(color, 0.5, 2);
            glow.intensity = node.activation * 0.8;
            mesh.add(glow);
            
            node.object = mesh;
            this.nodeObjects.add(mesh);
        }

        // 创建连接的3D对象
        createEdgeObject(edge) {
            const { source, target, active } = edge;
            const color = active ? 
                        this.config.edgeColors.active : 
                        this.config.edgeColors.inactive;
            
            // 计算连接的起点和终点
            const start = source.position.clone();
            const end = target.position.clone();
            
            // 创建连接线的几何体
            const points = [start, end];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            // 使用自定义着色器材质来创建发光效果
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: active ? 0.8 : 0.3,
                linewidth: 1
            });
            
            const line = new THREE.Line(geometry, material);
            edge.object = line;
            
            this.edgeObjects.add(line);
        }

        // 创建标签
        createLabels() {
            // 添加输入层标签
            this.addLabel("输入层", this.nodes[0][0].position.x, 6, 0, this.config.nodeColors.input);
            
            // 添加隐藏层标签
            this.addLabel("隐藏层", this.nodes[1][0].position.x, 6, 0, this.config.nodeColors.hidden);
            
            // 添加输出层标签
            this.addLabel("输出层", this.nodes[2][0].position.x, 6, 0, this.config.nodeColors.output);
        }

        // 添加文本标签
        addLabel(text, x, y, z, color) {
            // 使用Three.js的文本几何体创建3D文本
            // 注意：在实际应用中，字体加载可能需要异步处理
            // 这里简化处理，实际项目中可能需要使用FontLoader异步加载字体
            
            // 创建一个平面作为标签背景
            const backgroundGeometry = new THREE.PlaneGeometry(3, 1);
            const backgroundMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x000000,
                transparent: true,
                opacity: 0.7
            });
            const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
            background.position.set(x, y, z);
            this.nodeObjects.add(background);
            
            // 将文本作为HTML元素添加（更简单的解决方案）
            const div = document.createElement('div');
            div.className = 'neural-network-label';
            div.style.position = 'absolute';
            div.style.color = '#' + new THREE.Color(color).getHexString();
            div.style.fontWeight = 'bold';
            div.style.fontSize = '14px';
            div.style.textShadow = '0px 0px 5px rgba(0,0,0,0.8)';
            div.textContent = text;
            
            document.body.appendChild(div);
            
            // 储存标签元素和对应的3D位置，以便于在动画循环中更新位置
            if (!this.labels) this.labels = [];
            this.labels.push({
                element: div,
                position: new THREE.Vector3(x, y, z)
            });
        }

        // 更新标签位置
        updateLabels() {
            if (!this.labels) return;
            
            this.labels.forEach(label => {
                // 将3D坐标转换为屏幕坐标
                const position = label.position.clone();
                position.project(camera);
                
                const x = (position.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
                
                // 更新HTML元素位置
                label.element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                
                // 如果在相机后面，隐藏标签
                if (position.z > 1) {
                    label.element.style.display = 'none';
                } else {
                    label.element.style.display = 'block';
                }
            });
        }

        // 创建信号动画
        createSignal(edge) {
            const { signalSize } = this.config;
            
            // 创建一个小球作为信号
            const geometry = new THREE.SphereGeometry(signalSize, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: edge.active ? this.config.edgeColors.active : this.config.edgeColors.inactive,
                transparent: true,
                opacity: 0.8
            });
            
            const signal = new THREE.Mesh(geometry, material);
            
            // 设置初始位置为起点
            signal.position.copy(edge.source.position);
            
            // 创建光源
            const light = new THREE.PointLight(
                edge.active ? this.config.edgeColors.active : this.config.edgeColors.inactive, 
                1, 
                2
            );
            signal.add(light);
            
            this.signalObjects.add(signal);
            
            const signalData = {
                object: signal,
                edge: edge,
                progress: 0,
                speed: this.config.signalSpeed * (0.8 + Math.random() * 0.4) // 稍微随机化速度
            };
            
            this.signals.push(signalData);
            
            return signalData;
        }

        // 更新信号动画
        updateSignals(deltaTime) {
            for (let i = this.signals.length - 1; i >= 0; i--) {
                const signal = this.signals[i];
                signal.progress += signal.speed * deltaTime;
                
                if (signal.progress >= 1) {
                    // 到达终点，移除信号
                    this.signalObjects.remove(signal.object);
                    this.signals.splice(i, 1);
                    
                    // 触发目标节点的激活
                    this.activateNode(signal.edge.target);
                } else {
                    // 更新信号位置
                    const start = signal.edge.source.position;
                    const end = signal.edge.target.position;
                    
                    signal.object.position.lerpVectors(start, end, signal.progress);
                }
            }
            
            // 随机产生新的信号
            if (Math.random() < 0.05 && this.edges.length > 0) {
                const randomEdge = this.edges[Math.floor(Math.random() * this.edges.length)];
                if (randomEdge.active) {
                    this.createSignal(randomEdge);
                }
            }
        }

        // 激活节点
        activateNode(node) {
            // 增加节点的激活值
            node.activation = Math.min(1, node.activation + 0.3);
            
            // 更新节点的视觉效果
            const material = node.object.material;
            material.emissiveIntensity = 0.2 + node.activation * 0.3;
            
            // 获取节点上的光源并更新强度
            const light = node.object.children[0];
            if (light) {
                light.intensity = node.activation * 0.8;
            }
            
            // 缓慢降低激活值
            setTimeout(() => {
                node.activation = Math.max(0.1, node.activation - 0.1);
            }, 500);
        }

        // 随机改变网络状态
        randomizeNetwork() {
            // 随机改变节点激活状态
            this.nodes.forEach(layer => {
                layer.forEach(node => {
                    if (Math.random() < 0.1) {
                        this.activateNode(node);
                    }
                });
            });
            
            // 随机改变边的激活状态
            this.edges.forEach(edge => {
                if (Math.random() < 0.05) {
                    edge.active = !edge.active;
                    
                    // 更新边的视觉效果
                    const material = edge.object.material;
                    material.color.setHex(
                        edge.active ? this.config.edgeColors.active : this.config.edgeColors.inactive
                    );
                    material.opacity = edge.active ? 0.8 : 0.3;
                }
            });
        }

        // 更新神经网络动画
        update(deltaTime) {
            // 更新标签位置
            this.updateLabels();
            
            // 更新信号动画
            this.updateSignals(deltaTime);
            
            // 偶尔随机改变网络状态
            if (Math.random() < 0.01) {
                this.randomizeNetwork();
            }
        }
    }

    // 创建神经网络实例
    const neuralNetwork = new NeuralNetwork(config);

    // 添加底部平面反射效果
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 0.5
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -8;
    plane.receiveShadow = true;
    scene.add(plane);

    // 时钟对象用于跟踪时间
    const clock = new THREE.Clock();

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        
        const deltaTime = clock.getDelta();
        
        // 更新控制器
        controls.update();
        
        // 更新神经网络
        neuralNetwork.update(deltaTime);
        
        // 渲染场景
        renderer.render(scene, camera);
    }

    // 处理窗口大小变化
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    // 开始动画循环
    animate();
}); 