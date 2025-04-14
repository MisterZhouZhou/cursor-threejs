// 简化版视觉效果库
// 不使用任何外部资源

const SolarSystemEffects = {
    // 添加星云背景
    addNebula: function(scene) {
        // 创建简单的背景色
        scene.background = new THREE.Color(0x000011);
    },
    
    // 添加星球光晕效果
    addStarGlow: function(star, color, size) {
        // 创建一个更大的发光球体
        const glowGeometry = new THREE.SphereGeometry(size * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        star.add(glow);
        
        return function(time) {
            const pulseFactor = 0.1 * Math.sin(time) + 1;
            glow.scale.set(pulseFactor, pulseFactor, pulseFactor);
        };
    },
    
    // 简化版太阳耀斑效果
    addSolarFlares: function(sun) {
        // 创建多个小球代表耀斑
        const flares = new THREE.Group();
        const flareCount = 20;
        
        for (let i = 0; i < flareCount; i++) {
            const flareGeometry = new THREE.SphereGeometry(1.5, 8, 8);
            const flareMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa44,
                transparent: true,
                opacity: 0.7
            });
            
            const flare = new THREE.Mesh(flareGeometry, flareMaterial);
            
            // 随机位置
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 26;
            
            flare.position.x = radius * Math.sin(phi) * Math.cos(theta);
            flare.position.y = radius * Math.sin(phi) * Math.sin(theta);
            flare.position.z = radius * Math.cos(phi);
            
            flare.userData = {
                originalPosition: flare.position.clone(),
                speed: Math.random() * 0.02 + 0.01,
                offset: Math.random() * Math.PI * 2
            };
            
            flares.add(flare);
        }
        
        sun.add(flares);
        
        return function(time) {
            flares.children.forEach((flare) => {
                const wave = Math.sin(time * flare.userData.speed + flare.userData.offset) * 2;
                const direction = flare.userData.originalPosition.clone().normalize();
                
                flare.position.copy(flare.userData.originalPosition);
                flare.position.addScaledVector(direction, wave);
                
                // 脉动效果
                const scale = 0.5 * Math.sin(time * 2 + flare.userData.offset) + 1.5;
                flare.scale.set(scale, scale, scale);
            });
        };
    },
    
    // 简化版大气层散射效果
    addAtmosphericScattering: function(planet, radius, color) {
        // 简单地使用半透明球体表示大气层
        const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);
        
        return function() {
            // 什么都不做，简化版没有动态更新
        };
    },
    
    // 简化版表面细节
    addSurfaceDetail: function() {
        // 什么都不做，简化版不添加表面细节
    }
}; 