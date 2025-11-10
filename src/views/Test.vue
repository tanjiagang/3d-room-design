<template>
    <div></div>
</template>

<script setup lang="ts">
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
// 创建Three.js场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加光源
const ambientLight = new THREE.AmbientLight(0x404040); // 环境光
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// 设置相机位置
camera.position.z = 50;

// 加载GLB模型
const loader = new GLTFLoader();
let terrainMesh;
loader.load('/models/terrain.glb', function (gltf) {
    terrainMesh = gltf.scene.children[0] // 假设第一个子对象是地形网格
    scene.add(terrainMesh);

    // 提取高度数据
    const heightData = extractHeightData(terrainMesh.children[0].children[0].children[0].children[0].geometry);

    // 创建Cannon-es物理世界
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    // 创建地面材料
    const groundMaterial = new CANNON.Material('groundMaterial');

    // 创建Heightfield形状
    const shape = new CANNON.Heightfield(heightData.data, {
        elementWidth: heightData.elementWidth,
        elementHeight: heightData.elementHeight
    });

    // 创建刚体
    const groundBody = new CANNON.Body({
        mass: 0, // 静态物体质量为0
        material: groundMaterial
    });

    // 将形状附加到刚体
    groundBody.addShape(shape);

    // 将刚体添加到世界
    world.addBody(groundBody);

    // 创建球体测试碰撞
    const sphereShape = new CANNON.Sphere(1);
    const sphereBody = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(0, 10, 0),
        material: groundMaterial
    });
    sphereBody.addShape(sphereShape);
    world.addBody(sphereBody);

    // 更新函数
    let lastTime;
    function animate(time) {
        requestAnimationFrame(animate);

        if (lastTime !== undefined) {
            const dt = (time - lastTime) / 1000;
            world.step(dt);
        }

        // 同步Cannon-es物理世界和Three.js场景
        if (terrainMesh) {
            terrainMesh.position.copy(groundBody.position);
            terrainMesh.quaternion.copy(groundBody.quaternion);
        }

        sphereMesh.position.copy(sphereBody.position);
        sphereMesh.quaternion.copy(sphereBody.quaternion);

        renderer.render(scene, camera);
        lastTime = time;
    }

    // 创建球体的Three.js表示
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphereMesh);

    animate();
}, undefined, function (error) {
    console.error('An error happened:', error);
});

// 提取高度图数据
function extractHeightData(geometry) {
    const positionAttribute = geometry.attributes.position;
    const uvAttribute = geometry.attributes.uv;
    const verticesCount = positionAttribute.count;

    // 获取所有顶点的位置和UV坐标
    const positions = [];
    const uvs = [];

    for (let i = 0; i < verticesCount; i++) {
        positions.push(positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i));
        uvs.push(uvAttribute.getX(i), uvAttribute.getY(i));
    }

    // 找到唯一的U和V值
    const uniqueUs = [...new Set(uvs.filter((_, index) => index % 2 === 0))];
    const uniqueVs = [...new Set(uvs.filter((_, index) => index % 2 !== 0))];

    // 计算宽度和高度段数
    const widthSegments = uniqueUs.length - 1;
    const heightSegments = uniqueVs.length - 1;

    // 初始化高度数据数组
    const heightData = Array.from({ length: heightSegments + 1 }, () => Array(widthSegments + 1).fill(0));

    // 将顶点位置映射到高度数据数组
    for (let i = 0; i < verticesCount; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const u = uvs[i * 2];
        const v = uvs[i * 2 + 1];

        // 映射UV到数组索引
        const indexX = Math.round(((u - uniqueUs[0]) / (uniqueUs[uniqueUs.length - 1] - uniqueUs[0])) * widthSegments);
        const indexY = Math.round(((v - uniqueVs[0]) / (uniqueVs[uniqueVs.length - 1] - uniqueVs[0])) * heightSegments);

        // 存储高度值
        heightData[indexY][indexX] = y;
    }

    return {
        data: heightData,
        width: widthSegments + 1,
        height: heightSegments + 1,
        elementWidth: (uniqueUs[uniqueUs.length - 1] - uniqueUs[0]) / widthSegments,
        elementHeight: (uniqueVs[uniqueVs.length - 1] - uniqueVs[0]) / heightSegments
    };
}

// 处理窗口大小调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
</script>


<style scoped>
body {
    margin: 0;
}

canvas {
    display: block;
}
</style>