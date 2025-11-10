import * as THREE from 'three';

export class LightManager {
    private static instance: LightManager;
    ambientLight!: THREE.AmbientLight; // 环境光, 模拟自然光
    directionalLight!: THREE.DirectionalLight; // 平行光, 模拟太阳光
    // private hemisphereLight!: THREE.HemisphereLight;
    // private pointLight!: THREE.PointLight;
    // private spotLight!: THREE.SpotLight;
    constructor() {
        if (LightManager.instance) return LightManager.instance;
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 3); // 颜色 + 强度
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        LightManager.instance = this;
    }

    // 初始化场景灯光
    initSceneLights(scene: THREE.Scene) {
        

        // 生成平行光
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(1000, 1500, 1000); // 光源位置（根据场景调整）
        this.directionalLight.shadow.camera.left = -2000;   // 左边界
        this.directionalLight.shadow.camera.right = 2000;   // 右边界
        this.directionalLight.shadow.camera.top = 2000;     // 上边界
        this.directionalLight.shadow.camera.bottom = -2000; // 下边界
        this.directionalLight.shadow.camera.near = 0.1;      // 与主相机 near 对齐
        this.directionalLight.shadow.camera.far = 5000;    // 与主相机 far 对齐
        this.directionalLight.shadow.mapSize.width = 2048;  // 横向分辨率
        this.directionalLight.shadow.mapSize.height = 2048; // 纵向分辨率
        this.directionalLight.shadow.camera.updateProjectionMatrix(); // 必须更新！

        scene.add(this.directionalLight);
        scene.add(this.ambientLight);
    }
    
    generateAmbientLight(config: any = { color: 0x404040, intensity: 1 }) {
        return new THREE.AmbientLight(config);
    }

    generateDirectionalLight(config: any = { color: 0xffffff, intensity: 1 }) {
        return new THREE.DirectionalLight(config);
    }

    
}