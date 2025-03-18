<template>
    <div class="loading" v-show="isLoading">
        <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    </div>
    <canvas id="webgl" ref="canvas"></canvas>
    <!-- <div ref="guiContainer" id="guiContainer"></div> -->
     <!-- reset button  -->
    <div class="reset" @click="resetSceneOperatoion">重置</div>
    <!-- side bar -->
    <div :class="['side-bar', { 'active': isShowSideBar }]" @mouseenter="showSideBar" @mouseleave="hideSideBar">
        <div class="pointer" ></div>
        <div class="side-bar-item"
            v-for="item in sideBarItem" :key="item.name">
          <span class="side-bar-item-name">{{ item.name }}</span>
          <div class="side-bar-sub-item">
            <div v-for="subItem in item.subItems" :key="subItem.name"
                 class="model-item"
                 @click="addFurniture(subItem.name)">
              <img :src="subItem.imgSrc" alt="">
              <span>添加{{ subItem.name }}</span>
            </div>
          </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import {  ref, onMounted, useTemplateRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RenderPass, EffectComposer, OutlinePass, ShaderPass } from 'three/examples/jsm/Addons.js';
import { GammaCorrectionShader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { drawHall, drawKitchen, drawBedroom, drawBathroom, drawFloor,
         initController, updateController, saveInitialGroupData,
        resetScene, addModel,
        base } from '../utils/common';
import { useGlobalState } from '../hooks/useGlobalState';
import { useInitialGroupData } from '../hooks/useGroupData';
import { storeToRefs } from 'pinia';
import * as dat from 'dat.gui';
// import tween.js
import {Tween} from '@tweenjs/tween.js'


// selectedGroup interface
interface SelectedGroup extends THREE.Group {
    isChanged: boolean
    isNew: boolean
}

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls,
    composer: EffectComposer, outlinePass: OutlinePass, selectedGroup: SelectedGroup = new THREE.Group(), gui: dat.GUI;
const canvas = useTemplateRef('canvas')
// const guiContainer = useTemplateRef('guiContainer');
const globalState = useGlobalState();
const useGroupData = useInitialGroupData();
const { isLoading } = storeToRefs(useGlobalState());
// side bar item
const sideBarItem = [
    { name: '沙发', subItems: [{name: '沙发1', imgSrc: base + 'images/sofa1.png'}] },
    { name: '柜子', subItems: [{name: '柜子1', imgSrc: base + 'images/cabinet1.png'}] },
]
let isShowSideBar = ref(false);

const initThree = () => {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: canvas.value as HTMLCanvasElement
    });
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    scene = new THREE.Scene();
    // const textureLoader = new THREE.TextureLoader();
    // scene.background = textureLoader.load('/textures/scene_bg1.jpg');
    // scene.environment = textureLoader.load('/textures/scene_bg1.jpg');
    // scene.backgroundBlurriness = 1;

    // load hdr
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setPath( base + 'textures/');
    rgbeLoader.load('royal_esplanade_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        scene.backgroundBlurriness = 0.35;
        scene.environmentIntensity = 0.23;
    });
    // using PMREMGenerator to set scene environment
    // const pmremGenerator = new THREE.PMREMGenerator(renderer);
    // pmremGenerator.compileEquirectangularShader();
    // scene.environment = pmremGenerator.fromScene(scene).texture;
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 500, 500);
    // camera.position.set(50, 400, 0);
    camera.lookAt(0, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.enableDamping = true;

    // using tween to animate camera
    const tween = new Tween(camera.position);
    // tween.easing(Easing.Quadratic.Out);
    tween.to({ x: 0, y: 400, z: 0 }, 2000);
    


    // post-processing
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const gamaPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gamaPass);
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth / window.devicePixelRatio, window.innerHeight / window.devicePixelRatio), scene, camera);
    composer.addPass(outlinePass);
    

    // axes
    // const axes = new THREE.AxesHelper(100);
    // scene.add(axes);

    // light
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);

    // top light
    const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topLight.position.set(0, 300, 50);
    topLight.castShadow = true;
    scene.add(topLight);
    // add pointLight helper
    // const topLightLightHelper = new THREE.DirectionalLightHelper(topLight);
    // scene.add(topLightLightHelper);

    // floor
    const floor = drawFloor();
    floor.name = 'floor&unmoveable';
    scene.add(floor);

    // hall
    const hall = drawHall();
    scene.add(hall);

    // kitchen
    const kitchen = drawKitchen();
    scene.add(kitchen);

    // bedroom
    const bedroom = drawBedroom();
    scene.add(bedroom);

    // bathroom
    const bathroom = drawBathroom();
    scene.add(bathroom);

    // load manage
    // loadManage();
    
    THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        if(itemsLoaded == itemsTotal){
          console.log(url);
          globalState.setIsLoading(false);
          tween.start();
        }  
    };

    // add select event
    const raycaster = new THREE.Raycaster();
    let isDragging = false;
    let mouse = new THREE.Vector2();

    let plane: THREE.Plane,//平移平面由活动对象初始位置和当前相机方向向量确定
    startPosition: THREE.Vector3,//目标位置,使用终末位置计算平移量，当然也可以使用递增量
    startMouseWorldPosition: THREE.Vector3,//拖动起始点射线与平移平面的交点
    endMouseWorldPosition: THREE.Vector3;//拖动结束点射线与平移平面的交点

    document.addEventListener('pointerdown', function (event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        // console.log(intersects);
        if (intersects.length > 0) {
            

            // 获取点击的物体
            let clickedObject = intersects[0].object;
            // outlinePass.selectedObjects = [clickedObject];
            // console.log(clickedObject);
            // 查找点击物体所属的 Group
            // if (clickedObject.parent instanceof THREE.Group) {
            //     selectedGroup = clickedObject.parent;
            // }
            while(!(clickedObject.parent instanceof THREE.Group)){
                clickedObject = clickedObject.parent as THREE.Group;
            }
            selectedGroup = clickedObject.parent;

            // 如果点击的是 Group 中的物体，则高亮整个 Group
            if (selectedGroup && !selectedGroup.name.includes('unmoveable')) {
                isDragging = true;
                controls.enabled = false;
                
                

                const selectedObjects: THREE.Mesh[] = [];
                selectedGroup.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        selectedObjects.push(child);
                    }
                });

                //创建经过物体中心点的垂直于相机方向的平面
                plane = new THREE.Plane();
                plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(plane.normal), selectedGroup.position);
                //如果使用世界原点构建平面会导致物体位移和鼠标位移不对等，应该使用物体的初始位置中心作为视角切面平面
                // plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(plane.normal), new THREE.Vector3());
                startMouseWorldPosition = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, startMouseWorldPosition);
                //备份物体初始点
                startPosition = selectedGroup.position.clone();

                outlinePass.selectedObjects = selectedObjects;
                
                // selectedObjects.forEach((item) => {
                //     console.log(item.name);
                // })
                updateController(selectedGroup, gui);
            }

        }

    });

    // selectedGroup follow mouse
    document.addEventListener('pointermove', function (event) {
        if(!selectedGroup || !isDragging || selectedGroup.name.includes('unmoveable')) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        // const intersects = raycaster.intersectObjects(scene.children, true);
        // if (intersects.length > 0) {
        //     // selectedGroup.position.set(intersects[0].point.x, intersects[0].point.y, selectedGroup.position.z);
        // }
        selectedGroup.position.x = mouse.x * 500;
        selectedGroup.position.y = mouse.y * 500;

        endMouseWorldPosition = new THREE.Vector3();
        //目标点射线与平移平面的焦点即为平移目标点
        raycaster.ray.intersectPlane(plane, endMouseWorldPosition);
        //计算平移向量
        let addVector3 = endMouseWorldPosition.sub(startMouseWorldPosition);
        let target = startPosition.clone().add(addVector3).clone();
        selectedGroup.position.copy(target)
    });

    document.addEventListener('pointerup', function () {
        isDragging = false;
        controls.enabled = true;
        selectedGroup = new THREE.Group();
        outlinePass.selectedObjects = [];
    });

    // controller
    gui = new dat.GUI();
    initController(selectedGroup, gui);
    // guiContainer.value.appendChild(gui.domElement); 
    // save initial state
    saveInitialGroupData(scene, useGroupData);
    
    // animation
    const animate = () => {
        requestAnimationFrame(animate);

        // move selectedGroup
        // if(selectedGroup && mouse) {
        //     selectedGroup.position.x = mouse.x * 2;
        //     selectedGroup.position.y = mouse.y * 2;
        // }
        tween.update();
        controls.update();
        // renderer.render(scene, camera);
        composer.render();
    }
    
    
    animate();

    window.addEventListener('resize', onWindowResize);
}

// const initControls = (scene: THREE.Scene, controls: OrbitControls, outlinePass: OutlinePass, selectedGroup: THREE.Object3D[]) => {
//     let dragControls = new DragControls(selectedGroup, camera, canvas.value);

//     dragControls.addEventListener('dragstart', function (event) {
//         controls.enabled =false;
//         outlinePass.selectedObjects = [event.object];
//     });

//     dragControls.addEventListener('dragend', function (event) {
//         outlinePass.selectedObjects = [];
//         controls.enabled =true;
//     });
//     // controls = new OrbitControls(camera, canvas.value);
// }

// const updateGroups = (node: THREE.Object3D) => {
//     if(!node) return;
//     for(let i = 0 ; i < node.children.length; i++) {
//         updateGroups(node.children[i]);
//     }
//     if(node.isGroup) {
//         node.boundingBox = new THREE.Box3().setFromObject(node);
//         node.raycast = function(raycaster , intersects) {
//             let vClosest = new THREE.Vector3();
//             let bIntersect = raycaster.ray.intersectBox(node.boundingBox , vClosest) !== null;
//             if(bIntersect) {
//                 let distance = raycaster.ray.origin.distanceTo(vClosest);
//                 if(distance < raycaster.near || distance > raycaster.far) return;
//                 let intersection = {
//                     distance: distance,
//                     distanceToRay: 0,
//                     point: vClosest,
//                     index: null,
//                     face: null,
//                     object: node
//                 }
//                 // intersects.push(intersection);
//                 return true;
//             }

//         }
//     }
//     return false;
// }

// draw floor


const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}


const resetSceneOperatoion = () => {
    resetScene(scene);
}

const showSideBar = () => {
    isShowSideBar.value = true
}
const hideSideBar = () => {
    isShowSideBar.value = false
}

// add furniture
const addFurniture = (name: string) => {
  addModel(scene, name);
}

onMounted(() => {
    initThree();
    // insert gui dom to #app
    document.getElementById('app')?.appendChild(gui.domElement);
})
</script>

<style lang="less" scoped>
body {
    background-color: #FFFEF8;
}
#webgl {
    width: 100%;
    height: 100%;
}

.loading {
    position: fixed;
    top: 0%;
    left: 0%;
    width: 100%;
    height: 100%;
    background-color: #FFFEF8;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}
.lds-roller {
  /* change color here */
  color: #1c4c5b
}
.lds-roller,
.lds-roller div,
.lds-roller div:after {
  box-sizing: border-box;
}
.lds-roller {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-roller div {
  animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: 40px 40px;
}
.lds-roller div:after {
  content: " ";
  display: block;
  position: absolute;
  width: 7.2px;
  height: 7.2px;
  border-radius: 50%;
  background: currentColor;
  margin: -3.6px 0 0 -3.6px;
}
.lds-roller div:nth-child(1) {
  animation-delay: -0.036s;
}
.lds-roller div:nth-child(1):after {
  top: 62.62742px;
  left: 62.62742px;
}
.lds-roller div:nth-child(2) {
  animation-delay: -0.072s;
}
.lds-roller div:nth-child(2):after {
  top: 67.71281px;
  left: 56px;
}
.lds-roller div:nth-child(3) {
  animation-delay: -0.108s;
}
.lds-roller div:nth-child(3):after {
  top: 70.90963px;
  left: 48.28221px;
}
.lds-roller div:nth-child(4) {
  animation-delay: -0.144s;
}
.lds-roller div:nth-child(4):after {
  top: 72px;
  left: 40px;
}
.lds-roller div:nth-child(5) {
  animation-delay: -0.18s;
}
.lds-roller div:nth-child(5):after {
  top: 70.90963px;
  left: 31.71779px;
}
.lds-roller div:nth-child(6) {
  animation-delay: -0.216s;
}
.lds-roller div:nth-child(6):after {
  top: 67.71281px;
  left: 24px;
}
.lds-roller div:nth-child(7) {
  animation-delay: -0.252s;
}
.lds-roller div:nth-child(7):after {
  top: 62.62742px;
  left: 17.37258px;
}
.lds-roller div:nth-child(8) {
  animation-delay: -0.288s;
}
.lds-roller div:nth-child(8):after {
  top: 56px;
  left: 12.28719px;
}
@keyframes lds-roller {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.reset {
    position: fixed;
    bottom: 55%;
    right: 15px;
    cursor: pointer;
    font-size: 15px;
    color: #1c4c5b;
    width: 234px;
    padding: 5px;
    text-align: center;
    user-select: none;
    background-color: #FFFEF8;
    transition: all .4s ease-in-out;
    &:hover {
        background-color: #f0d4af;
        color: #FFFEF8;
    }
}
.side-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 1%;
    height: 100%;
    font-size: 15px;
    color: #333;
    background-color: #f0d4af;
    transition: all ease-in-out .4s;
    // prevent text selection
    user-select: none;
    *:not(.pointer) {
      opacity: 0;
    }
    &.active {
      width: 20%;
      * {
        opacity: 1;
      }
    }
    .pointer {
    content: '';
    position: absolute;
    right: -12px;
    top: calc(50% - 50px);
    width: 30px;
    height: 100px;
    background: #f0d4af;
    cursor: pointer;
    border-radius: 0px 100px 100px 0;
  }
}
.side-bar-item {
  border-top: 1px solid #eee;
  &:hover .side-bar-sub-item {
    height: 240px;
    .model-item {
      border: 1px solid #eee;
    }
  }
}
.side-bar-item-name {
  padding: 10px;
  cursor: pointer;
  transition: all ease-in-out .4s;
  text-align: left;
  display: block;
  color: #333;
  
  &.active {
      border-left: 5px solid #887d70;
  }
  &:hover {
      color: #fff;
      background-color: #887d70;
  }
}
.side-bar-sub-item {
    display: flex;
    justify-content: space-evenly;
    height: 0;
    padding: 10px 0;
    transition: height ease-in-out .4s;
    & > span {
      display: block;
      padding: 5px;
      font-size: 18px;
      text-align: center;
    }
}
.model-item {
    width: 200px;
    cursor: pointer;
    border-radius: 5px;
    overflow: hidden;
    background: #fff;
    span {
        display: block;
        padding: 5px;
        text-align: center;
    }
    img {
      width: 200px;
    }
}
</style>