import * as THREE from 'three';
import { CSS3DObject, CSS2DObject, DragControls } from 'three/examples/jsm/Addons.js';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { githubPagePublicDir } from '@/utils/config';
import useDraggableObjects from '../../hooks/useDraggableObjects';

const raycaster = new THREE.Raycaster();
const useDraggable = useDraggableObjects();

export class DragControlsManager {
    static instance: DragControlsManager;
    dragControls!: DragControls;
    draggableObjects: THREE.Object3D[] = []; // 可拖拽的物体
    scene!: THREE.Scene;
    orbitControls!: OrbitControls;
    highlightBox!: THREE.Mesh; // 拖拽平面
    hoverBox!: THREE.Mesh; // 鼠标悬停显示盒子
    ground!: THREE.Object3D; // 要吸附的地形
    line!: THREE.LineSegments;
    octree!: Octree;
    // rotationCircle!: CSS3DObject; // 圆形旋转标志
    confirmButton!: CSS2DObject; // 确认按钮
    deleteButton!: CSS2DObject; // 删除按钮
    dragObject!: THREE.Object3D; // 当前拖拽的物体


    constructor(camera: THREE.Camera, renderer: THREE.WebGLRenderer, oribitControls: OrbitControls, scene: THREE.Scene) {
        if (DragControlsManager.instance) return DragControlsManager.instance;
        DragControlsManager.instance = this;
        this.initController(camera, renderer, oribitControls, scene);

        // const rotationCircleDiv = document.createElement('div');
        // rotationCircleDiv.id = 'rotation-circle';
        // rotationCircleDiv.style.pointerEvents = 'none';
        // const image = document.createElement('img');
        // image.src = '/images/rotation-circle.png';
        // rotationCircleDiv.appendChild(image);
        // this.rotationCircle = new CSS3DObject(rotationCircleDiv);
        // this.rotationCircle.rotation.x = -Math.PI / 2;
        // this.scene.add(this.rotationCircle);
    }

    /*
    * 初始化拖拽控制器
     */
    initController(camera: THREE.Camera, renderer: THREE.WebGLRenderer, oribitControls: OrbitControls, scene: THREE.Scene) {
        this.dragControls = new DragControls(this.draggableObjects, camera, renderer.domElement);
        this.dragControls.enabled = false;
        this.dragControls.transformGroup = true;
        this.scene = scene;
        this.orbitControls = oribitControls;
        this.setupEventListeners(this.orbitControls);

        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0x20c0fd,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            // depthWrite: false,
            // depthTest: false,
        });
        this.highlightBox = new THREE.Mesh(this.createPlaneGeometry(new THREE.Vector3(50, 0, 50)), boxMaterial);
        this.highlightBox.rotation.x = -Math.PI / 2;
        this.highlightBox.visible = false;
        this.scene.add(this.highlightBox);
        this.highlightBox.renderOrder = 2;

        // 悬停盒子
        this.hoverBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(
            { color: 0x20c0fd, opacity: 0.5, transparent: true, wireframe: true }
        ));
        this.hoverBox.visible = false;
        this.scene.add(this.hoverBox);
        this.hoverBox.renderOrder = 2;



        const edges = new THREE.EdgesGeometry(this.highlightBox.geometry);
        this.line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        this.highlightBox.add(this.line);

        // 确认删除按钮
        const deleteButton = document.createElement('img');
        deleteButton.id = 'model-delete-button';
        deleteButton.src = githubPagePublicDir + '/images/model-delete-button.png';

        const confirmButton = document.createElement('img');
        confirmButton.id = 'model-confirm-button';
        confirmButton.src = githubPagePublicDir + '/images/model-confirm-button.png';

        deleteButton.style.pointerEvents = 'auto';
        confirmButton.style.pointerEvents = 'auto';
        // 添加按钮事件
        deleteButton.addEventListener('click', () => {
            // 删除模型
            this.deleteButton.visible = false;
            this.confirmButton.visible = false;
            this.dragObject.removeFromParent();
            this.dragObject = new THREE.Object3D();
            this.highlightBox.visible = false;

            // 从dragableObjects中删除
            this.draggableObjects = this.draggableObjects.filter(item => item !== this.dragObject);
        });

        confirmButton.addEventListener('click', () => {
            // 确认模型
            this.deleteButton.visible = false;
            this.confirmButton.visible = false;
            // this.rotationCircle.visible = false;
            this.highlightBox.visible = false;
        });


        this.deleteButton = new CSS2DObject(deleteButton);
        this.confirmButton = new CSS2DObject(confirmButton);
        this.deleteButton.visible = false;
        this.confirmButton.visible = false;
        this.scene.add(this.deleteButton, this.confirmButton);
    }

    // 拖拽处理
    dragHandler(event: any, that: DragControlsManager) {
        const object = event.object;

        // 拖拽时，将物体与地形吸附
        if (that.ground) {
            if(!this.octree) {
                this.octree = new Octree();
                this.octree.fromGraphNode(this.ground);
            } 
            const origin = object.position.clone().add(new THREE.Vector3(0, 100, 0)); // 提高起点确保射线跨越地形
            const direction = new THREE.Vector3(0, -1, 0);
            raycaster.set(origin, direction);

            // 射线与地形相交
            // const intersects = raycaster.intersectObject(that.ground);
            const intersects = this.octree.rayIntersect(raycaster.ray)
            if (intersects) {
                // const hitPoint = intersects[0].point;
                // const normal = intersects[0].face.normal;

                const hitPoint = intersects.position;
                const pa = intersects.triangle.a;
                const pb = intersects.triangle.b;
                const pc = intersects.triangle.c;
                const normal = new THREE.Vector3().crossVectors(pb.clone().sub(pa), pc.clone().sub(pa));
                // const arrowHelper = new  THREE.ArrowHelper(normal, hitPoint, 10, 0xff0000);
                // this.scene.add(arrowHelper);

                object.position.copy(hitPoint);
                const size = new THREE.Vector3();
                object.position.y += new THREE.Box3().setFromObject(object).getSize(size).y / 2;
                // object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
                // that.highlightBox.quaternion.copy(object.quaternion);
                // that.highlightBox.rotateX(Math.PI / 2);

            }
        }

        // 更新高亮框位置
        that.highlightBox.position.copy(object.position);
        that.highlightBox.position.y = new THREE.Box3().setFromObject(object).min.y + 0.05;

        this.deleteButton.visible = false;
        this.confirmButton.visible = false;
        this.hoverBox.visible = false;
        // this.rotationCircle.visible = false;
    }

    // 添加鼠标事件
    private setupEventListeners(oribitControls: OrbitControls) {
        this.dragControls.addEventListener('hoveron', (event: any) => {
            // const material = (event.object as THREE.Mesh).material;
            // if ('emissive' in material) {
            //     (material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
            // }
            const objectBox = new THREE.Box3().setFromObject(event.object);
            this.hoverBox.geometry = new THREE.BoxGeometry(objectBox.max.x - objectBox.min.x, objectBox.max.y - objectBox.min.y, objectBox.max.z - objectBox.min.z);
            this.hoverBox.position.copy(objectBox.getCenter(new THREE.Vector3()));
            this.hoverBox.visible = true;
        });

        this.dragControls.addEventListener('hoveroff', (event: any) => {
            // const material = (event.object as THREE.Mesh).material;
            // if ('emissive' in material) {
            //     (material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            // }
            this.hoverBox.visible = false;
        });

        this.dragControls.addEventListener('dragstart', (event: any) => {
            oribitControls.enabled = false;
            event.object.userData.isDragging = true;
            document.body.style.cursor = 'grabbing';

            const object = event.object;
            const box = new THREE.Box3().setFromObject(object);
            const size = new THREE.Vector3();
            box.getSize(size);

            this.dragObject = object;

            // adjust the position and the size of the highlight box
            this.highlightBox.geometry.dispose();
            this.highlightBox.geometry = this.createPlaneGeometry(size);
            this.highlightBox.position.copy(object.position);
            this.highlightBox.position.y = box.min.y - 0.01;
            this.highlightBox.visible = true;

            // 添加边框
            this.highlightBox.remove(this.line);
            const edges = new THREE.EdgesGeometry(this.highlightBox.geometry);
            this.line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
            this.highlightBox.add(this.line);

            // 添加旋转圈
            // this.rotationCircle.position.copy(object.position);
            // this.rotationCircle.visible = true;
        })

        // const throttledDragHandler = lodash.throttle(this.dragHandler, 100);
        this.dragControls.addEventListener('drag', (event: any) => {
            this.dragHandler(event, this)
        })

        this.dragControls.addEventListener('dragend', (event: any) => {
            const box = new THREE.Box3().setFromObject(event.object);
            const size = new THREE.Vector3();
            box.getSize(size);

            oribitControls.enabled = true;
            event.object.userData.isDragging = false;
            document.body.style.cursor = 'grab';

            // this.highlightBox.visible = false;

            this.deleteButton.visible = true;
            this.confirmButton.visible = true;
            this.deleteButton.position.set(event.object.position.x - size.x, event.object.position.y, event.object.position.z + size.z);
            this.confirmButton.position.set(event.object.position.x + size.x, event.object.position.y, event.object.position.z + size.z);

            // 更新存档物体位置
            // sceneManager.updateItem(event.object);

            // this.rotationCircle.visible = true;
        })

    }

    // 添加新的可拖拽对象
    addObject(object: THREE.Object3D) {
        this.draggableObjects.push(object);
        // useDraggable.addObject(object);
    }

    // 移除可拖拽对象
    removeObject(object: THREE.Object3D) {
        const index = this.draggableObjects.indexOf(object);
        if (index !== -1) {
            this.draggableObjects.splice(index, 1);
        }
        // useDraggable.removeObject(object);
    }

    // 使用BufferGeometry创建拖拽平面geometry
    createPlaneGeometry(size: THREE.Vector3) {
        const bufferGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -size.x, -size.z, 0,
            size.x, -size.z, 0,
            size.x, size.z, 0,
            -size.x, size.z, 0
        ]);
        bufferGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
        bufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

        const uvs = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]);
        bufferGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // const normals = new Float32Array([
        //     0, 1, 0,
        //     0, 1, 0,
        //     0, 1, 0,
        //     0, 1, 0
        // ]);
        // const normals = new Float32Array([
        //     0, 0, 1,
        //     0, 0, 1,
        //     0, 0, 1,
        //     0, 0, 1,
        // ]);
        // bufferGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        bufferGeometry.computeVertexNormals();

        return bufferGeometry;
    }
}