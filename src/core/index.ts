import { SceneManger } from "./three/SceneManager";
import { RendererManger } from "./three/RendererManager";
// import { ControlManager } from "./control";
import { CameraManager } from "./three/CameraManager";
import { WebGLRenderer, PerspectiveCamera, Scene, Clock } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import * as dat from "dat.gui";
import { PhysicsWorld } from "./three/physics/WorldManager";
import CannonDebugger from "cannon-es-debugger";
import { DragControlsManager } from "./three/DragControlsManager";
import { LightManager } from "./three/LightManager";
import { Character } from "./three/objects/Character";
import * as THREE from "three";

const physicsWorld = new PhysicsWorld();

export default class Core {
    static instance: Core;
    scene!: Scene;
    sceneManager!: SceneManger;
    renderer!: WebGLRenderer;
    rendererManager!: RendererManger;
    camera!: PerspectiveCamera;
    cameraManager!: CameraManager;
    lightManager!: LightManager;
    clock!: Clock;
    charater?: Character;
    orbit_controls!: OrbitControls;
    dragControls!: DragControlsManager;

    // ui: UI;
    // control_manage: ControlManage;
    // loader: Loader;
    // world: World;
    stats!: Stats;
    gui!: dat.GUI;
    // cannonDebugger!: any;

    constructor() {
        if (!Core.instance) {
            Core.instance = this;
            this.sceneManager = new SceneManger();
            this.scene = this.sceneManager.scene;
            this.rendererManager = new RendererManger();
            this.renderer = this.rendererManager.renderer;
            this.camera = new CameraManager(this.renderer!.domElement).camera;
            this.orbit_controls = new OrbitControls(this.camera!, this.renderer!.domElement);
            this.lightManager = new LightManager();
            this.clock = new Clock();
            // this.charater = new Character(this.scene, this.camera);
            // this.cannonDebugger = new (CannonDebugger as any)(this.scene, physicsWorld.world);
            this._initResponsiveResize();
            if(import.meta.env.DEV) {
                this._initStats();
                this._initDatGui();
            }
            this._initDragControls();
            this.initLight()
        }
        return Core.instance;
    }

    render() {
        this.renderer.setAnimationLoop(() => {
            // this.orbit_controls.update();
            if(import.meta.env.DEV) {
                this.stats.update();
            }
            // physicsWorld.update();
            // this.cannonDebugger.update();
            this.renderer.render(this.scene, this.camera);
            this.rendererManager.css2Renderer.render(this.scene, this.camera);

            // 角色动画
            // if(this.charater?.mixer) {
            //     this.charater.mixer.update(this.clock.getDelta());
            // }
            
            // 角色包围盒
            this.charater?.characterBoxHelper?.update();

            // 角色激活了就禁止orbitcontrols控制相机
            if(this.charater?.isActivated) {
                
                // this.charater.cameraRotationY = THREE.MathUtils.clamp(
                //     this.charater.cameraRotationY, 
                //     -100,  // 最小仰角
                //     100    // 最大俯角
                // );

                this.charater?.update(Math.min( 0.1, this.clock.getDelta()));
                // this.camera.updateProjectionMatrix(); // 手动更新相机投影矩阵
                // const cameraLookAt = this.charater.model.position;
                // cameraLookAt.add(new THREE.Vector3(0, this.charater.cameraRotationY, 0));
                // console.log(cameraLookAt.y)
                // this.orbit_controls.target = new THREE.Vector3(cameraLookAt.x + this.charater.cameraRotationX , cameraLookAt.y + this.charater.cameraRotationY, cameraLookAt.z);
            } else {
                this.orbit_controls.update();
            }

            // this.rendererManager.css3Renderer.render(this.scene, this.camera)
        });
    }


    private initLight() {
        this.lightManager.initSceneLights(this.scene);
    }

    private _initResponsiveResize() {
        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.rendererManager.css2Renderer.setSize(window.innerWidth, window.innerHeight);
            // this.rendererManager.css3Renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private _initStats() {
        this.stats = new Stats();
        this.stats.showPanel(1);
        document.body.appendChild(this.stats.dom);
    }

    private _initDragControls() {
        this.dragControls = new DragControlsManager(this.camera, this.renderer, this.orbit_controls, this.scene);
    }

    private _initDatGui() {
        this.gui = new dat.GUI();

        // 相机调试
        // this.gui.add(this.camera.position, "x", -1000, 1000, 1).name("camera x").onChange((val) => {
        //     this.camera.position.x = val;
        //     this.camera.updateProjectionMatrix();
        // });
        // this.gui.add(this.camera.position, "y", -1000, 1000, 1).name("camera y").onChange((val) => {
        //     this.camera.position.y = val;
        //     this.camera.updateProjectionMatrix();
        // });
        // this.gui.add(this.camera.position, "z", -1000, 1000, 1).name("camera z").onChange((val) => {
        //     this.camera.position.z = val;
        //     this.camera.updateProjectionMatrix();
        // });

        // 太阳灯光调试
        // this.lightManager.directionalLight.shadow.mapSize.width = 2048;  // 横向分辨率
        // this.lightManager.directionalLight.shadow.mapSize.height = 2048; // 纵向分辨率
        // const helper = new THREE.CameraHelper(this.lightManager.directionalLight.shadow.camera);
        // this.gui.add(this.lightManager.directionalLight.shadow.camera, "near", 1, 1000, 1).name("shadow near").onChange((val) => {
        //     this.lightManager.directionalLight.shadow.camera.near = val;
        //     this.lightManager.directionalLight.shadow.camera.updateProjectionMatrix();
        //     helper.update()
        //     console.log(this.lightManager.directionalLight.shadow.camera.near)
        // });
        // this.gui.add(this.lightManager.directionalLight.shadow.camera, "far", 1000, 5000, 1).name("shadow far").onChange((val) => {
        //     this.lightManager.directionalLight.shadow.camera.far = val;
        //     this.lightManager.directionalLight.shadow.camera.updateProjectionMatrix();
        //     helper.update()
        // });
        // this.gui.add(this.lightManager.directionalLight.shadow.camera, "left", -2000, 2000, 1).name("shadow left").onChange((val) => {
        //     this.lightManager.directionalLight.shadow.camera.left = val;
        //     this.lightManager.directionalLight.shadow.camera.updateProjectionMatrix();
        //     helper.update()
        // });
        // this.gui.add(this.lightManager.directionalLight.shadow.camera, "right", 2000, 4000, 1).name("shadow right").onChange((val) => {
        //     this.lightManager.directionalLight.shadow.camera.right = val;
        //     this.lightManager.directionalLight.shadow.camera.updateProjectionMatrix();
        //     helper.update()
        // });
        // this.gui.add(this.lightManager.directionalLight.shadow.camera, "top", 2000, 4000, 1).name("shadow top").onChange((val) => {
        //     this.lightManager.directionalLight.shadow.camera.top = val;
        //     this.lightManager.directionalLight.shadow.camera.updateProjectionMatrix();
        //     helper.update()
        // });
        // this.gui.add(this.lightManager.directionalLight.shadow.camera, "bottom", -2000, 2000, 1).name("shadow bottom").onChange((val) => {
        //     this.lightManager.directionalLight.shadow.camera.bottom = val;
        //     this.lightManager.directionalLight.shadow.camera.updateProjectionMatrix();
        //     helper.update()
        // });
        // this.gui.add(this.lightManager.directionalLight, "intensity", 0, 10, 0.1).name("intensity").onChange((val) => {
        //     this.lightManager.directionalLight.intensity = val;
        // })
        // this.gui.add(this.lightManager.directionalLight.shadow.mapSize, "width", 1024, 4096, 1).onChange(() => {
        //         this.lightManager.directionalLight.shadow.mapSize.width = this.lightManager.directionalLight.shadow.mapSize.height;
        //         helper.update()
        // });
        // this.gui.add(this.lightManager.directionalLight.shadow.mapSize, "height", 1024, 4096, 1).onChange(() => {
        //         this.lightManager.directionalLight.shadow.mapSize.height = this.lightManager.directionalLight.shadow.mapSize.width;
        //         helper.update()
        // });
        
        // this.scene.add(helper);
        

    }

}