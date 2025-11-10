// model loader
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';
import { githubPagePublicDir } from '@/utils/config';
// import { useGlobalState } from '@/hooks/useGlobalState';

type LoadProgressCallback = (url: string, loaded: number, total: number) => void;

// const useGlobal = useGlobalState();

export class LoadManager {
    private cache = new Map<string, THREE.Group>();
    private pendingRequests = new Map<string, Promise<THREE.Group>>();
    loader: GLTFLoader;
    private dracoLoader: DRACOLoader;
    fbxLoader: FBXLoader;

    constructor() {
        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.fbxLoader = new FBXLoader();
        this.dracoLoader.setDecoderPath(githubPagePublicDir + '/draco/');
        this.loader.setDRACOLoader(this.dracoLoader);
    }

    async load(url: string, onProgress?: LoadProgressCallback, enableWorker: boolean = false): Promise<THREE.Group> {


        // 存在缓存直接返回克隆体
        if (this.cache.has(url)) return this.cache.get(url)!.clone();

        // 防止重复请求 ‌
        if (this.pendingRequests.has(url)) return this.pendingRequests.get(url)!;
        
        const promise = new Promise<THREE.Group>((resolve, reject) => {
            if (enableWorker) {
                try {
                    const worker = new Worker('./utils/modelLoader.worker.ts');
                    worker.onmessage = (event) => {
                        const loader = new THREE.ObjectLoader();
                        let model = loader.parse(event.data.data) as THREE.Group; // 解析JSON数据‌
                        model = this.processModel(model);
                        // 将模型文件名作为索引，用于本地存储
                        // model.userData.url = url;
                        this.cache.set(url, model);
                        // useGlobal.setIsLoading(false);
                        resolve(model.clone());
                    };
                }
                catch (error) {
                    console.error('Worker加载失败', error);
                    reject(error);
                }
            } else {
                this.loader.load(
                    url,
                    (gltf) => {
                        const model = this.processModel(gltf.scene);
                        this.cache.set(url, model);
                        // useGlobal.setIsLoading(false);
                        // 将模型文件名作为索引，用于本地存储
                        // model.userData.url = url;
                        resolve(model.clone());
                    },
                    (event) => {
                        if (onProgress) onProgress(url, event.loaded, event.total);
                    },
                    (error) => {
                        console.error(`模型加载失败: ${url}`, error)
                        reject(error);
                    }
                );
            }

        });

        this.pendingRequests.set(url, promise);
        return promise
    }

    // 模型预处理
    private processModel(model: THREE.Group): THREE.Group {
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = this.optimizeMaterials(child.material);
                child.geometry = this.optimizeGeometry(child.geometry);
            }
        });
        return model;
    }


    // 优化材质
    private optimizeMaterials(material: THREE.Material): THREE.Material {
        if (material instanceof THREE.MeshStandardMaterial) {
            material.roughness = 0.7; // 统一材质参数降低渲染开销
        }
        return material;
    }

    // 优化几何体
    private optimizeGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
        return BufferGeometryUtils.mergeVertices(geometry, 0.01); // 合并顶点降低渲染开销
    }

    getFromCache(url: string): THREE.Group | undefined {
        return this.cache.get(url);
    }

}