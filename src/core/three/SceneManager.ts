import * as THREE from 'three';
import type { Placement, SceneSave } from '../game/placement';
import { StorageService } from '../game/StorageService';
import { LoadManager } from './LoadManager';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { PhysicsWorld } from './physics/WorldManager';
import { githubPagePublicDir } from '@/utils/config';
import { getSplitedPanorama } from './utils/panoramaTileLoad';
import type { DragControlsManager } from './DragControlsManager';


const loadManager = new LoadManager();
const storageService = new StorageService();
const physicsWorld = new PhysicsWorld();

// init scene
export class SceneManger {
    static instance: SceneManger;
    scene!: THREE.Scene;
    placedItems: Placement[] = []; // 放置的模型列表
    dragControls: any;

    constructor() {
        if (SceneManger.instance) return SceneManger.instance;
        SceneManger.instance = this;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        if (import.meta.env.MODE === 'development') {
            this.scene.add(new THREE.AxesHelper(100));
        }
        return this.scene;
    }

    // 添加新物体时记录位置
    addItem(url: string, object: THREE.Object3D) {
        const placement: Placement = {
            itemId: THREE.MathUtils.generateUUID(),
            url,
            position: {
                x: object.position.x,
                y: object.position.y,
                z: object.position.z
            },
            rotation: {
                x: object.rotation.x,
                y: object.rotation.y,
                z: object.rotation.z
            },
            timestamp: Date.now()
        };

        this.placedItems.push(placement);
        object.userData.url = url; // 添加URL到物体的userData中
    }

    // 更新物体位置
    updateItem(object: THREE.Object3D) {
        const url = object.userData.url;
        if (url) {
            const placement = this.placedItems.find(p => p.url === url);
            if (placement) {
                placement.position = {
                    x: object.position.x,
                    y: object.position.y,
                    z: object.position.z
                };
                placement.rotation = {
                    x: object.rotation.x,
                    y: object.rotation.y,
                    z: object.rotation.z
                };
                placement.timestamp = Date.now();
            }
        }
    }

    // 保存当前场景
    saveCurrentScene(camera: THREE.Camera, dragControls: DragControlsManager, load: number) {
        return storageService.saveScene(this.scene, camera, dragControls, load);
    }

    // 加载场景
    loadScene(sceneData: any) {
        // this.placedItems = PlacementStorage.loadScene(saveId);
        return storageService.loadScene(sceneData);
    }

    // 初始场景
    loadDefaultScene(callback?: any) {
        // const skyBoxTextures = [
        //     '/textures/skybox/px.png',
        //     '/textures/skybox/nx.png',
        //     '/textures/skybox/py.png',
        //     '/textures/skybox/ny.png',
        //     '/textures/skybox/pz.png',
        //     '/textures/skybox/nz.png'
        // ];
        this.createSkybox(githubPagePublicDir + '/textures/panorama.hdr');
        const placedItems = this.placedItems;
        const modelPromises = placedItems.map(placement => {
            return loadManager.load(placement.url);
        });

        modelPromises.push(loadManager.load(githubPagePublicDir + '/models/village_landscape4.glb'));

        Promise.all(
            // [
            //     loadManager.load('/models/village_landscape2.glb'),
            //     loadManager.load('/models/chinese_house.glb'),

            // ]
            modelPromises
        ).then(models => {
            const draggableObjects: THREE.Object3D[] = [];
            let ground: THREE.Object3D | undefined;
            models.forEach((group) => {
                const model = group.children[0];
                // const model = group.children[0];
                if (model.name === 'village_landscape') {
                    // 给地面添加物理
                    // physicsWorld.createGround(model);

                    ground = model.getObjectByName('ground') || model;
                    ground.renderOrder = 1;
                    ground.receiveShadow = true;
                } else {
                    // 给其他物体添加物理
                    // physicsWorld.createBox(model);

                    // draggableObjects.push(group)
                };
                this.scene.add(group);
            });
            callback && callback(draggableObjects, ground);
        });
    }

    // create skybox using cubeTexture
    // createSkybox(textures: string[]) {
    //     const loader = new THREE.CubeTextureLoader();
    //     const textureCube = loader.load(textures);
    //     this.scene.background = textureCube;
    //     this.scene.environment = textureCube;
    // }

    // create skybox using hdr
    createSkybox(url: string) {
        // const loader = new RGBELoader();
        // loader.load(url, (texture) => {
        //     texture.mapping = THREE.EquirectangularReflectionMapping;
        //     this.scene.background = texture;
        //     this.scene.environment = texture;
        // });
        getSplitedPanorama(
            4, 4,
            [
                '/textures/panorama_tile/tile_0_0.png',
                '/textures/panorama_tile/tile_0_1.png',
                '/textures/panorama_tile/tile_0_2.png',
                '/textures/panorama_tile/tile_0_3.png',
                '/textures/panorama_tile/tile_1_0.png',
                '/textures/panorama_tile/tile_1_1.png',
                '/textures/panorama_tile/tile_1_2.png',
                '/textures/panorama_tile/tile_1_3.png',
                '/textures/panorama_tile/tile_2_0.png',
                '/textures/panorama_tile/tile_2_1.png',
                '/textures/panorama_tile/tile_2_2.png',
                '/textures/panorama_tile/tile_2_3.png',
                '/textures/panorama_tile/tile_3_0.png',
                '/textures/panorama_tile/tile_3_1.png',
                '/textures/panorama_tile/tile_3_2.png',
                '/textures/panorama_tile/tile_3_3.png'
            ],
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.background = texture;
                this.scene.environment = texture;
            }
        )
    }

    dispose() {
        if (this.scene) {
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
        }
    }
}