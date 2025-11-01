import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/WorldManager';
import { LoadManager } from '../LoadManager';
import { Capsule, VerticalTiltShiftShader } from 'three/examples/jsm/Addons.js';
import { Octree } from 'three/examples/jsm/Addons.js';
import { OctreeHelper } from 'three/examples/jsm/Addons.js';
import { githubPagePublicDir } from '@/utils/config';

const loader = new LoadManager();
const worldManager = new PhysicsWorld();
export class Character {
    private static instance: Character;
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    model!: THREE.Object3D; // 人物模型
    modelBox: THREE.Box3; // 角色mesh包围盒
    capsule!: Capsule; // 角色胶囊体，用户octree碰撞检测
    worldOctree: Octree = new Octree(); // 八叉树，用于检测碰撞
    mesh!: THREE.Mesh; // 人物胶囊占位几何体
    // collisionGroup: THREE.Object3D; // 碰撞组
    // mixer!: THREE.AnimationMixer; // 动画混合器
    // action?: THREE.AnimationAction; // 动画动作
    body!: CANNON.Body;
    keys: any = {};
    playerVelocity = new THREE.Vector3(0, 0, 0); // 角色运动速度
    playDirection = new THREE.Vector3(); // 角色运动方向
    jumpSpeed = 10;
    jumpForce = 20;
    static GRAVITY = 19.82; // 重力
    isGrounded = true; // 是否在地面上
    isActivated = false; // 是否激活
    characterBoxHelper: THREE.BoxHelper; // 角色包围盒
    start: THREE.Mesh; // 角色起始位置
    end: THREE.Mesh; // 角色结束位置
    cameraZoom: number = -20; // 角色摄像机缩放，与Home.vue中的相机组位置保持一致
    cameraRotationY = 0; // 角色摄像机旋转角度
    cameraRotationX = 0; // 角色摄像机旋转角度
    cameraGroup: THREE.Group; // 角色摄像机组
    modelRotationX: number = 0; // 角色模型旋转角度
    targetCameraZoom: number = -40; // 目标相机缩放值，用于平滑过渡
    targetModelRotationX: number = 0; // 目标模型旋转角度，用于平滑过渡
    // 触摸事件
    touchObj = {
        startPos: { x: 0, y: 0 },
        lastPos: { x: 0, y: 0 },
        isTracking: false,
        direction: '',
        distance: { x: 0, y: 0 },
    };
    shaderGroup!: THREE.Group = new THREE.Group(); // 角色特效组
    shaderMaterials!: THREE.ShaderMaterial[] = []; // 角色特效材质


    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        if (Character.instance) return Character.instance;
        Character.instance = this;
        this.scene = scene;
        this.camera = camera;
        this.cameraGroup = new THREE.Group();
        this.modelBox = new THREE.Box3();
        // this.collisionGroup = collisionGroup;

        // 初始化目标值，确保平滑过渡正常工作
        this.targetCameraZoom = this.cameraZoom;
        this.targetModelRotationX = this.modelRotationX;

        this.initModel();


        // this.addKeyEvent();
        // this.initControls();
    }

    initModel() {
        // 加载人物模型
        loader.loader.load(githubPagePublicDir + '/models/characters/mita.glb', (gltf) => {
            this.model = gltf.scene;
            // this.model.scale.set(0.06, 0.06, 0.06);
            // this.model.updateMatrixWorld();
            this.model.name = 'character';
            // 产生阴影
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.characterBoxHelper = new THREE.BoxHelper(this.model, 0xffff00);
            // this.scene.add(this.characterBoxHelper);

            this.modelBox.setFromObject(this.model);

            // 添加相机组
            this.model.add(this.cameraGroup)

            // 动画处理
            // const animations = gltf.animations;
            // this.mixer = new THREE.AnimationMixer(this.model);
            // this.action = this.mixer.clipAction(animations[0]);
            // this.action.setLoop(THREE.LoopRepeat, Infinity);

            // // 将摄像机添加到人物模型
            this.model.add(this.camera)
            this.model.visible = false; // 默认隐藏

            this.scene.add(this.model);
            // this.model.position.set(200, 30, -100);

            this.isActivated = true;
            this.initPhysics();
            this.initShaders();
        });

    }

    // 初始化流光特效
    initShaders() {
        const width = 8, height = 30, lineWidth = .1;
        const commonUniforms = {
            uFade: { value: new THREE.Vector2(0, 0.2) },
            uOffset: { value: new THREE.Vector2(40, 20) },
        };

        const spline = new THREE.LineCurve3(
            new THREE.Vector3(0, 0, height * 0.25),
            new THREE.Vector3(0, 0, height * 0.75)
        );
        const geometry = new THREE.TubeGeometry(spline, height, lineWidth, 64);
        const vertexShader = /* glsl */ `
    float PI = acos(-1.0);
    uniform vec2 uOffset;
    uniform float uDirection;
    varying vec2 vUv; 
    float uSpiralRadius = 6.0; // 螺旋半径
    float uSpiralPitch = 0.01;  // 螺旋螺距
    float uSpiralTurns = 1.0;  // 螺旋圈数

    float getMove(float u, float offset){ 
      float a = u * PI * 2.0;
      return sin(a + PI*0.25) * u * offset;
    }

    float getHeight(float u, float offset){
      float a = u * PI * 3.0;
      return cos(a) * u * offset; 
    }


    void main() {
      vUv = uv;
      // float m = getMove(vUv.x, uOffset.x);
      // float h = getHeight(vUv.x, uOffset.y);

      // vec3 newPosition = position;
      // newPosition.x += m;
      // newPosition.y += h;

      float theta = uv.x * 2.0 * PI * uSpiralTurns;
      if(uDirection == 1.0) {
        theta += PI;
      }

      float radius = uSpiralRadius;
      float x = radius * cos(theta);
      float y = radius * sin(theta);
      float z = uSpiralPitch * theta;
      vec3 newPosition = position;
      newPosition.x += x;
      newPosition.y += y;
      newPosition.z += z;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }`;

        const fragmentShader = /* glsl */ `
    varying vec2 vUv;

    uniform vec2 uOffset;
    uniform vec2 uFade;
    uniform vec3 uColor;
    uniform float uDirection;
    uniform float uTime;
    uniform float uSpeed;

    void main() {
      vec3 color = uColor;
      // 流动方向
      float s = -uTime * uSpeed;
      float v = 0.0;
      if(uDirection == 1.0) {
        v = vUv.x;
      } else {
        v = vUv.x;
      }

      float d = mod((v + s), 1.0);

      if(d < uFade.x || d > uFade.y) {
        discard;
      } else {
        float alpha = smoothstep(uFade.x, uFade.y, d);
        if(alpha < 0.001)
          discard;
        gl_FragColor = vec4(color, alpha);
      }
    }`;


        const amount = 10;
        // const gap = 8;
        // const step = (width - gap) / amount;
        for (let i = 0; i < amount; i++) {
            const c = new THREE.Color();
            const v = i / amount;
            c.setHSL(
                THREE.MathUtils.lerp(0.7, 0.2, v),
                1,
                THREE.MathUtils.lerp(0.5, 1.0, v)
            );

            const material = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    uColor: { value: c },
                    uTime: { value: THREE.MathUtils.lerp(-1, 1, Math.random()) },
                    uDirection: { value: i < amount / 2 ? 1 : 0 },
                    uSpeed: { value: THREE.MathUtils.lerp(1, 1.5, Math.random()) },
                    ...commonUniforms,
                },
                vertexShader,
                fragmentShader,

            });

            this.shaderMaterials.push(material);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotateX(-Math.PI / 2);
            // mesh.position.x = i * step - width / 2;
            // mesh.position.y = Math.random() * 5;
            this.shaderGroup.add(mesh);
            this.shaderGroup.name = 'shader-group';
            this.shaderGroup.position.y = -5;
            this.model.add(this.shaderGroup);
        }
    }

    // 初始化物理引擎
    initPhysics() {
        // 按照模型尺寸创造capsule
        const radius = this.modelBox.getSize(new THREE.Vector3()).x / 2;
        const height = this.modelBox.getSize(new THREE.Vector3()).y;
        const totalHeight = height; // 总高度
        const cylinderHeight = totalHeight - radius * 2; // 几何体圆柱高度

        // this.worldOctree.fromGraphNode(this.collisionGroup); // 根据碰撞体创建八叉树
        // this.scene.add(new OctreeHelper(this.worldOctree, 0xffff00))
        this.capsule = new Capsule(
            new THREE.Vector3(0, radius, 0),
            new THREE.Vector3(0, height - radius, 0),
            radius
        );
        // this.capsule.translate(new THREE.Vector3(0, 0, -50));

        // this.capsule.translate(new THREE.Vector3(0, height/2, 0));
        // 创建占位几何体
        const geometry = new THREE.CapsuleGeometry(radius, cylinderHeight, 20, 20);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: .6, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        // this.mesh.position.y += totalHeight / 2; 

        // this.scene.add(this.mesh);

        // 设置摄像机位置
        // this.camera.position.copy(this.capsule.start);
        // this.camera.position.z -= 100;
        // this.camera.lookAt(this.capsule.start);

        // 两个平面显示capsule的start和end
        this.start = new THREE.Mesh(new THREE.PlaneGeometry(20, 20, 20, 20), new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: .6, transparent: true, depthTest: false }));
        this.start.position.copy(this.capsule.start);
        this.start.rotateX(Math.PI / 2);
        // this.scene.add(this.start);

        this.end = new THREE.Mesh(new THREE.PlaneGeometry(20, 20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: .6, transparent: true, depthTest: false }));
        this.end.rotateX(Math.PI / 2);
        this.end.position.copy(this.capsule.end);
        // this.scene.add(this.end);



        // 创建物理引擎对象
        // const cylinder = new CANNON.Cylinder(radius, radius, height, 20);
        // const sphere = new CANNON.Sphere(radius);
        // this.body = new CANNON.Body({
        //     mass: 0,
        //     position: new CANNON.Vec3(40, 20, -10),
        // });
        // this.body.addShape(cylinder, new CANNON.Vec3(0, 0, 0));
        // this.body.addShape(sphere, new CANNON.Vec3(0, height / 2, 0));
        // this.body.addShape(sphere, new CANNON.Vec3(0, -height / 2, 0));
        // worldManager.world.addBody(this.body);


        this.isActivated = true;
    }

    // 添加键盘事件
    addKeyEvent() {
        this.keys = {
            W: false,
            A: false,
            S: false,
            D: false,
            Space: false,
        }
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('wheel', this.onWheel);

        // 添加触摸事件
        document.addEventListener('touchstart', this.touchStart);
        document.addEventListener('touchmove', this.touchMove);
        document.addEventListener('touchend', this.touchEnd);



    }

    // 旋转摄像机角度
    onMouseMove(event: MouseEvent) {
        if (Character.instance.isActivated) {
            // 使用更小的旋转步长，使旋转更平滑
            const rotationSpeed = 0.002; // 降低旋转速度
            Character.instance.targetModelRotationX -= event.movementX * rotationSpeed;

            // 限制旋转角度范围，防止过度旋转
            const maxRotation = Math.PI * 2; // 最大旋转角度
            if (Math.abs(Character.instance.targetModelRotationX) > maxRotation) {
                Character.instance.targetModelRotationX = Math.sign(Character.instance.targetModelRotationX) * maxRotation;
            }
        }
    }

    // 移除键盘事件
    removeKeyEvent() {

        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('wheel', this.onWheel);

        // 移除触摸事件
        document.removeEventListener('touchstart', this.touchStart);
        document.removeEventListener('touchmove', this.touchMove);
        document.removeEventListener('touchend', this.touchEnd);
    }

    onKeyDown(e: KeyboardEvent) {

        if (e.code === 'KeyW') {
            Character.instance.keys.W = true;
            // this.action?.play();
        }
        if (e.code === 'KeyA') {
            Character.instance.keys.A = true;
            // this.action?.play();
        }
        if (e.code === 'KeyS') {
            Character.instance.keys.S = true;
            // this.action?.play();
        }
        if (e.code === 'KeyD') {
            Character.instance.keys.D = true;
            // this.action?.play();
        }
        if (e.code === 'Space') {
            Character.instance.keys.Space = true;
            // this.action?.stop();
        }

        // if (e.code === 'KeyA') this.keys.A = true;
        // if (e.code === 'KeyS') this.keys.S = true;
        // if (e.code === 'KeyD') this.keys.D = true;
        // this.keys[e.code.toLowerCase().replace('key','')] = true;
        // this.action?.play();

    }

    onKeyUp(e: KeyboardEvent) {
        if (e.code === 'KeyW') {
            Character.instance.keys.W = false;
            // this.action?.stop();
        }
        if (e.code === 'KeyA') {
            Character.instance.keys.A = false;
            // this.action?.stop();
        }
        if (e.code === 'KeyS') {
            Character.instance.keys.S = false;
            // this.action?.stop();
        }
        if (e.code === 'KeyD') {
            Character.instance.keys.D = false;
            // this.action?.stop();
        }
        if (e.code === 'Space') {
            Character.instance.keys.Space = false;
            // this.action?.stop();
        }
        // if (e.code === 'KeyW') this.keys.W = false;
        // if (e.code === 'KeyA') this.keys.A = false;
        // if (e.code === 'KeyS') this.keys.S = false;
        // if (e.code === 'KeyD') this.keys.D = false;
        // this.action?.stop();     
    }

    // 鼠标滚轮事件
    onWheel(event: WheelEvent) {
        // event.preventDefault(); // 防止页面滚动
        const delta = Math.sign(event.deltaY); // 获取滚动方向（-1上滚，1下滚）

        // 使用更小的缩放步长，避免突然变化
        const zoomStep = 0.9;
        const newTargetZoom = Character.instance.targetCameraZoom - delta * zoomStep;

        // 限制缩放范围，防止相机过近或过远
        // const minZoom = -80;
        // const maxZoom = -10;
        Character.instance.targetCameraZoom = newTargetZoom;
        // if (newTargetZoom >= minZoom && newTargetZoom <= maxZoom) {
        //     Character.instance.targetCameraZoom = newTargetZoom;
        //     console.log('目标缩放值更新:', Character.instance.targetCameraZoom); // 调试信息    
        // }
    }

    // 开始触摸
    touchStart(event: TouchEvent) {
        const touch = event.touches[0];
        Character.instance.touchObj.startPos = { x: touch.clientX, y: touch.clientY };
        Character.instance.touchObj.lastPos = { ...Character.instance.touchObj.startPos };
        Character.instance.touchObj.isTracking = true;
    }

    touchMove(event: TouchEvent) {
        if (!Character.instance.touchObj.isTracking) return;
        const touch = event.touches[0];
        const currentPos = { x: touch.clientX, y: touch.clientY };

        const deltaX = currentPos.x - Character.instance.touchObj.lastPos.x;
        const deltaY = currentPos.y - Character.instance.touchObj.lastPos.y;
        Character.instance.touchObj.direction = Character.instance.calculateDirection(deltaX, deltaY);
        Character.instance.touchObj.distance = { x: deltaX, y: deltaY }

        if (Character.instance.touchObj.direction === 'up') {
            Character.instance.keys.W = true;
        }
        if (Character.instance.touchObj.direction === 'down') {
            Character.instance.keys.S = true;
        }
        if (Character.instance.touchObj.direction === 'left') {
            Character.instance.keys.A = true;
        }
        if (Character.instance.touchObj.direction === 'right') {
            Character.instance.keys.D = true;
        }

        if (Character.instance.isActivated) {
            // 使用更小的旋转步长，使旋转更平滑
            const rotationSpeed = 0.00002; // 降低旋转速度
            Character.instance.targetModelRotationX -= deltaX * rotationSpeed;

            // 限制旋转角度范围，防止过度旋转
            const maxRotation = Math.PI * 2; // 最大旋转角度
            if (Math.abs(Character.instance.targetModelRotationX) > maxRotation) {
                Character.instance.targetModelRotationX = Math.sign(Character.instance.targetModelRotationX) * maxRotation;
            }
        }

    }


    touchEnd() {
        Character.instance.keys = { W: false, A: false, S: false, D: false, Space: false };
        Character.instance.touchObj.isTracking = false;
    }

    calculateDirection(deltaX: number, deltaY: number) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    touchSwipe() {

    }

    // 人物检测碰撞
    playerCollision() {
        const result = this.worldOctree.capsuleIntersect(this.capsule);

        this.isGrounded = false;
        if (result) {
            this.isGrounded = result.normal.y >= 0;

            if (!this.isGrounded) {
                this.playerVelocity.addScaledVector(result.normal, -result.normal.dot(this.playerVelocity));
            }
            // console.log(result);
            this.capsule.translate(result.normal.multiplyScalar(result.depth));
        }
    }

    getFowardVector() {
        this.model.getWorldDirection(this.playDirection);
        return this.playDirection.normalize();
    }

    getSideVector() {
        this.model.getWorldDirection(this.playDirection);
        this.playDirection.cross(this.model.up);
        return this.playDirection.normalize();
    }

    controls(deltaTime: number) {
        const speed = 105; // 加速度
        if (!this.isGrounded) return;
        if (this.keys.W) {
            this.playerVelocity.add(this.getFowardVector().multiplyScalar(speed * deltaTime))
        }
        if (this.keys.S) {
            this.playerVelocity.add(this.getFowardVector().multiplyScalar(- speed * deltaTime))
        }
        if (this.keys.A) {
            this.playerVelocity.add(this.getSideVector().multiplyScalar(- speed * deltaTime))
        }
        if (this.keys.D) {
            this.playerVelocity.add(this.getSideVector().multiplyScalar(speed * deltaTime))
        }

        // 跳跃
        if (this.keys.Space) {
            this.playerVelocity.y = 25;
        }
    }

    // 移动
    update(deltaTime: number) {
        this.controls(deltaTime)

        if (this.isGrounded) {
            // const damping = Math.exp(- 3 * deltaTime) - 1;
            this.playerVelocity.addScaledVector(this.playerVelocity, -0.1); // 在地面时，使用摩擦力减速
        } else {
            this.playerVelocity.y -= Character.GRAVITY * deltaTime; // 不在地面时，使用重力下落
        }

        let deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime); // 计算当前帧的位移
        // 设置胶囊移动边界
        if (this.capsule.start.x < (-250 + this.capsule.radius * 2)) {
            deltaPosition.x += 5.2 * deltaTime;
        }
        if (this.capsule.start.x > (250 - this.capsule.radius * 2)) {
            deltaPosition.x -= 5.2 * deltaTime;
        }
        if (this.capsule.start.z < (-250 + this.capsule.radius * 2)) {
            deltaPosition.z += 5.2 * deltaTime;
        }
        if (this.capsule.start.z > (250 - this.capsule.radius * 2)) {
            deltaPosition.z -= 5.2 * deltaTime;
        }

        this.capsule.translate(deltaPosition); // 将位移应用到胶囊
        this.playerCollision(); // 检查胶囊是否与场景中的其他物体发生碰撞

        // 检测胶囊y轴不能是负数
        // if (this.capsule.start.y <= this.capsule.radius) {
        //     this.capsule.translate(new THREE.Vector3(0, this.capsule.radius, 0));
        // }

        // 同步胶囊位置到Three.js对象
        const cylinderHeight = this.capsule.end.y - this.capsule.start.y;

        this.mesh.position.copy(this.capsule.start);
        this.mesh.position.y += cylinderHeight / 2;

        this.model.position.copy(this.capsule.start);
        this.model.position.y -= this.capsule.radius;

        this.start.position.copy(this.capsule.start);
        this.end.position.copy(this.capsule.end);

        // 同步相机lookat
        // console.log(this.capsule.end);
        // const targetPos = new THREE.Vector3().copy(this.capsule.end).add(new THREE.Vector3(0, 0, -15));
        // this.camera.position.copy(targetPos);
        this.camera.lookAt(this.capsule.end);

        // 人物模式下相机的改动
        if (this.isActivated) {
            // 使用lerp进行平滑过渡，避免突然的位置变化
            const targetZ = this.targetCameraZoom;
            const currentZ = this.camera.position.z;
            const lerpFactor = 0.08; // 平滑因子，值越小越平滑

            // 平滑过渡到目标位置
            this.camera.position.z = THREE.MathUtils.lerp(currentZ, targetZ, lerpFactor);

            // 同步当前缩放值，用于其他地方的引用
            this.cameraZoom = this.camera.position.z;

            // 平滑过渡模型旋转
            const targetRotationY = this.targetModelRotationX;
            const currentRotationY = this.model.rotation.y;
            const rotationLerpFactor = 0.5; // 旋转平滑因子

            this.model.rotation.y = THREE.MathUtils.lerp(currentRotationY, targetRotationY, rotationLerpFactor);

            // 同步当前旋转值
            this.modelRotationX = this.model.rotation.y;
        }

        // 更新特效动画
        if (this.shaderMaterials.length > 0) {
            this.shaderMaterials.forEach(material => {
                material.uniforms.uTime.value += 0.005;
                if (material.uniforms.uTime.value > 1) {
                    material.uniforms.uTime.value = 0;
                }
            })
        }

    }

    // 更新相机
    updateCamera() {
        if (!this.model) return;

        const targetPos = new THREE.Vector3().copy(this.model.position);
        // this.camera.position.lerp(
        //     new THREE.Vector3(targetPos.x, targetPos.y + 20.5, targetPos.z - 15),
        //     1
        //   );
        this.camera.position.copy(new THREE.Vector3(targetPos.x, targetPos.y + 20.5 - this.modelBox.getSize(new THREE.Vector3()).y / 2, targetPos.z - 15));
        this.camera.lookAt(targetPos);
        // this.camera.position.set(0, 20, 0);
        // this.camera.lookAt(0, 0, 0);
    }

}