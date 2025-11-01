import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import {DragControlsManager} from '../three/DragControlsManager';

type Chunk = {
    name: string,
    position: THREE.Vector3,
    size: number,
    subScene: THREE.Scene
}

class ChunkManager {
    static instance: ChunkManager;
    scene!: THREE.Scene;
    camera!: THREE.Camera;
    chunkSize!: number;
    loadDistance!: number;
    unloadDistance!: number;
    chunks!: Chunk[];
    loadedChunks: Map<string, Chunk> = new Map();
    loadingQueue!: Chunk[];
    exporter = new GLTFExporter();
    loader = new GLTFLoader();
    dragControls!: DragControlsManager;


    constructor(scene: THREE.Scene, camera: THREE.Camera, dragControls: DragControlsManager, chunkSize: number, loadDistance: number = 100, unloadDistance: number = 100) {
        if (ChunkManager.instance) return ChunkManager.instance;
        ChunkManager.instance = this;
        this.scene = scene;
        this.camera = camera;
        this.dragControls = dragControls;
        this.chunkSize = chunkSize;
        this.loadDistance = loadDistance;
        this.unloadDistance = unloadDistance;
        this.chunks = [];
        this.loadingQueue = [];
        this.initChunks();
    }

    initChunks(){
        this.createSpatialChunks(500, this.chunkSize);
    }

    // 更新加载状态
    update() {  
        // 检查是否有需要加载的块
        ChunkManager.instance.chunks.forEach((chunk) => {
            const distance = ChunkManager.instance.getDistanceFromCamera(chunk);

            // 检查是否在加载距离内且未加载
            if (distance < ChunkManager.instance.loadDistance && !ChunkManager.instance.loadedChunks.has(chunk.name)) {
                ChunkManager.instance.addChunkToQueue(chunk);
                
            } 
            // 如果块在卸载距离外且已加载
            else if (distance > ChunkManager.instance.unloadDistance && ChunkManager.instance.loadedChunks.has(chunk.name)) {
                ChunkManager.instance.unloadChunk(chunk);
            }
        })

        // 处理加载队列
        ChunkManager.instance.processLoadingQueue();

    }

    

    // 创建空间区块
    createSpatialChunks(sceneSize: number, chunkSize: number) {
        const chunkCount = Math.floor(sceneSize / chunkSize);
        for (let i = 0; i < chunkCount; i++) {
            for (let j = 0; j < chunkCount; j++) {
                for (let k = 0; k < chunkCount; k++) {
                    const chunk: Chunk = {
                        name: `chunk_${i * chunkSize}_${j * chunkSize}_${k * chunkSize}`,
                        position: new THREE.Vector3(i * chunkSize, j * chunkSize, k * chunkSize),
                        size: chunkSize,
                        subScene: new THREE.Scene(), // 存储 chunk 中包含的所有对象
                    }
                    this.chunks.push(chunk);
                }
            }
        }

    }

    // 导出块
    exportChunk() {
        // 划分区域
        const divisions: any[] = [];
        for (let i = 0; i < this.chunks.length; i++) {
            divisions.push({
                name: `chunk_${this.chunks[i].position.x}_${this.chunks[i].position.y}_${this.chunks[i].position.z}`,
                xMin: this.chunks[i].position.x - 250,
                xMax: this.chunks[i].position.x + this.chunkSize - 250,
                yMin: 0,
                yMax: 500,
                zMin: this.chunks[i].position.z - 250,
                zMax: this.chunks[i].position.z + this.chunkSize - 250
            })
        }

        // 根据区域划分塞入对象
        this.scene.traverse((object) => {
            // if ((object as THREE.Group).isGroup && object.name !== 'village_landscape' && object.name !== 'ground' && object.name !== 'water_base') {
                if ((object as THREE.Group).isGroup && object.userData.isDraggable) {
                // 获取对象包围盒
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());

                // 检查是否在某个区域内
                for (let i = 0; i < divisions.length; i++) {
                    const division = divisions[i];
                    if (center.x >= division.xMin && center.x <= division.xMax &&
                        center.y >= division.yMin && center.y <= division.yMax &&
                        center.z >= division.zMin && center.z <= division.zMax) {
                        // 添加对象到 chunk 中
                        this.chunks[i].name = division.name;
                        // 保存位置，旋转，缩放
                        object.userData.position = object.position.clone();
                        object.userData.rotation = object.rotation.clone();
                        object.userData.scale = object.scale.clone();
                        this.chunks[i].subScene.add(object.clone());
                        break;
                    }
                }
            }
        })

        // 导出每个子场景为 GLTF 文件
        const exporter = new GLTFExporter();
        const exportPromises = this.chunks.map((chunk) => {
            return new Promise<void>((resolve, reject) => {
                exporter.parse(chunk.subScene, (result: any,) => {
                    const blob = new Blob([result], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${chunk.name}.glb`;
                    link.click();
                    URL.revokeObjectURL(url);
                    // console.log(chunk.subScene.children);
                    resolve();
                }, (error) => {
                    reject(error);
                }, { binary: true, trs: true })
            })
        })

        return exportPromises;
    }


    // 检查块是否在视椎体内
    isChunkInFrustum(chunk: Chunk) {
        const frustum = new THREE.Frustum();

        this.camera.updateMatrixWorld();
        (this.camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        const cameraViewProjectionMatrix = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

        // 为块创建包围盒
        const box = new THREE.Box3(
            new THREE.Vector3(chunk.position.x, chunk.position.y, chunk.position.z),
            new THREE.Vector3(chunk.position.x + chunk.size, chunk.position.y + chunk.size, chunk.position.z + chunk.size)
        )

        return frustum.intersectsBox(box);
    }

    // 计算块与相机的距离
    getDistanceFromCamera(chunk: Chunk) {
        // 为块创建包围盒
        const box = new THREE.Box3(
            new THREE.Vector3(chunk.position.x, chunk.position.y, chunk.position.z),
            new THREE.Vector3(chunk.position.x + chunk.size, chunk.position.y + chunk.size, chunk.position.z + chunk.size)
        )
        const distance = box.getCenter(new THREE.Vector3()).distanceTo(this.camera.position);
        return distance;
    }

    // 将块加入队列
    addChunkToQueue(chunk: Chunk) {
        if (!this.loadingQueue.includes(chunk)) {
            this.loadingQueue.push(chunk);
        }
    }

    // 处理加载队列
    processLoadingQueue() {
        // 一次只加载一个块
        if (this.loadingQueue.length > 0) {
            const chunk = this.loadingQueue.shift() || { name: '', position: new THREE.Vector3(), size: 0, subScene: new THREE.Scene() };
            this.loadChunk(chunk);
        }
    }

    // 加载块
    loadChunk(chunk: Chunk) {
        const fileName = new URL(`../../assets/gltfs/${chunk.name}.glb`, import.meta.url).href;
        // 记录已加载的块
        this.loadedChunks.set(chunk.name, chunk)
        this.loader.load(fileName, (gltf) => {
            // gltf.scene.position.copy(chunk.position);
            
            chunk.subScene = gltf.scene;
            // console.log('已加载场景:', chunk.subScene);
            chunk.subScene.traverse((object) => {
                if(object.userData.isDraggable) {
                    object.position.copy(object.userData.position);
                    object.rotation.copy(object.userData.rotation);
                    object.scale.copy(object.userData.scale);
                    object.userData.isDragable = true;
                    this.dragControls.addObject(object);
                    // console.log('可拖拽对象:', this.dragControls.draggableObjects);
                }
            })
            this.scene.add(chunk.subScene);
            // console.log('可拖拽对象:', this.dragControls.draggableObjects);
            

        }, (xhr) => {
            if(xhr.loaded === xhr.total) {
                // console.log('已加载块:', chunk.name);
                
            }
        }, (error) => {
            console.error('加载块出错', error);
        })
    }

    // 移除块
    unloadChunk(chunk: Chunk) {
        const loadedChunk = this.loadedChunks.get(chunk.name);
        if (loadedChunk) {
            this.scene.remove(loadedChunk.subScene);
            this.loadedChunks.delete(chunk.name);
            chunk.subScene.traverse((object: THREE.Object3D) => { 
                if (object.userData.isDraggable) {
                    this.dragControls.removeObject(object);
                }
            });
            // console.log('已移除块:', loadedChunk.name);
        }
    }

}

export default ChunkManager;