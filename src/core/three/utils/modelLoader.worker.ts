/// <reference lib="webworker" />
declare const THREE: any;
// model-loader.worker.js
importScripts('https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.min.js');
importScripts('https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.min.js');

self.addEventListener('message', async (e) => {
    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(new THREE.DRACOLoader().setDecoderPath('./draco/'));
    const gltf = await loader.loadAsync(e.data.modelUrl); // 异步加载模型
    gltf.scene.traverse((obj: THREE.Object3D) => obj.updateMatrix()); // 更新模型矩阵‌
    gltf.scene.animations = gltf.animations; // 传递动画数据‌
    const modelJson = gltf.scene.toJSON(); // 转换为JSON格式‌
    self.postMessage({ type: 'modelData', data: modelJson });
});


// 主线程代码
// const worker = new Worker('model-loader.worker.js');

// // 主线程代码
// worker.onmessage = (e) => {
//     if (e.data.type === 'modelData') {
//         const loader = new THREE.ObjectLoader();
//         const model = loader.parse(e.data.data); // 解析JSON数据‌:ml-citation{ref="1" data="citationList"}
//         scene.add(model); // 将模型加入主场景
//     }
// };