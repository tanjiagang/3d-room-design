import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
    private static instance: PhysicsWorld;
    world!: CANNON.World;
    timeStep!: number;
    lastTime!: number;
    bodies!: Map<string, CANNON.Body>;
    helperObjects!: Map<string, THREE.Object3D>;

    constructor() {
        if (PhysicsWorld.instance) return PhysicsWorld.instance;
        PhysicsWorld.instance = this;

        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0), // 地球重力
            broadphase: new CANNON.SAPBroadphase(this.world), // 高性能碰撞检测
            allowSleep: true, // 允许物体休眠
        });
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);

        this.timeStep = 1 / 60;
        this.lastTime = 0;
        this.bodies = new Map();
        this.helperObjects = new Map();

        // 创建默认材质
        const defaultMaterial = new CANNON.Material('default');
        this.world.defaultMaterial = defaultMaterial;
        this.world.defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            { friction: 0.3, restitution: 0.3 }
        );
    }

    update(currentTime: number = performance.now()) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.world.step(this.timeStep, deltaTime, 3); // 3次子步提高精度
        this.lastTime = currentTime;

        // 同步物理体和Three.js对象
        this.bodies.forEach((body, id) => {
            const obj = this.helperObjects.get(id);
            if (obj) {
                // 统一处理坐标系统转换
                obj.position.set(body.position.x, body.position.z, body.position.y);
                obj.quaternion.set(body.quaternion.x, body.quaternion.z, body.quaternion.y, body.quaternion.w);
            }
        });
    }

    /**
     * 向物理世界中添加一个物理体，并将其与一个可选的三维对象关联
     * 
     * @param id - 唯一标识符，用于在内部映射中识别物理体和三维对象
     * @param body - CANNON.Body实例，代表物理世界中的一个物理体
     * @param threeObj - 可选的THREE.Object3D实例，代表与物理体关联的三维对象
     */
    addBody(
        id: string,
        body: CANNON.Body,
        threeObj?: THREE.Object3D
    ) {
        // 将物理体添加到物理世界中
        this.world.addBody(body);
        // 将物理体保存到映射中，以便后续检索和管理
        this.bodies.set(id, body);
        // 如果提供了三维对象，则将其保存到映射中，以便后续检索和管理
        if (threeObj) this.helperObjects.set(id, threeObj);
    }

    // 给地形添加物理
    createGround(object: THREE.Object3D) {
        if(!object) return;
        // object.traverse(child => {
            // if (child instanceof THREE.Mesh && child.name !== 'cloud_8' && child.name !== 'cloud_10' && child.name !== 'cloud_4' && child.name !== 'cloud_12' && child.name !== 'cloud_6' && child.name !== 'water_base' ) {
            if (object instanceof THREE.Mesh && object.name.includes('ground') ) {
                object.receiveShadow = true;
                // child.castShadow = true;
                
                const pos = object.geometry.getAttribute('position');
                const indices = object.geometry.index.array;

                const trimesh = new CANNON.Trimesh(pos.array, indices);
                const triBody = new CANNON.Body({
                    mass: 0,
                    shape: trimesh,
                });
                this.addBody(object.uuid + '_box', triBody, object);
            }
        // });
        
    }

    // 使用box给模型添加物理
    createBox(object: THREE.Object3D) {
        if(!object) return;
        object.receiveShadow = true;
        object.castShadow = true;

        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        
        const connonSize = new CANNON.Vec3(size.x/2, size.z/2, size.y/2);
        const boxBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(connonSize),
            position: new CANNON.Vec3(object.position.x, object.position.z, object.position.y),
            quaternion: new CANNON.Quaternion().setFromEuler(object.rotation.x, object.rotation.z, object.rotation.y)
        });
        this.addBody(object.uuid, boxBody, object);
    }


    removeBody(id: string) {
        const body = this.bodies.get(id);
        if (body) {
            this.world.removeBody(body);
            this.bodies.delete(id);
            this.helperObjects.delete(id);
        }
    }
}