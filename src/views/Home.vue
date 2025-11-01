<template>
  <!-- 加载中动画 -->
  <div class="loading" v-show="isLoading">
    <div class="lds-roller">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>

  <!-- 横屏提示 -->
  <LandScapeTip v-if="!isLandScape"/>

  <!-- 用于端加载中动画 -->
  <div class="loading-overlay" id="loadingOverlay" v-if="isInnerLoading">
    <div class="circle-container">
      <div class="circle">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    <!-- <div class="loading-text">加载中...</div> -->
  </div>

  <div class="scene-manager">
    <el-container class="content-container" v-loading="elLoading" element-loading-text="Loading...">
      <el-header>
        <Header v-show="!isEditor" @openEditorPanel="openEditorPanel" />
      </el-header>
      <el-main class="main-container">
        <EditorPanel v-if="isEditor" @closeEditorPanel="closeEditorPanel" @loadDecoration="loadDecoration"
          @rotateModel="rotateModel" @saveScene="saveScene" />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import EditorPanel from '@/components/ui/EditorPanel.vue'
import Header from '@/components/ui/header.vue'
import LandScapeTip from '@/components/ui/LandScapeTip.vue'
import { onMounted, onBeforeMount, ref } from 'vue'
import { useGlobalState } from '@/hooks/useGlobalState'
import Core from '@/core/index'
import { storeToRefs } from 'pinia'
import * as THREE from 'three'
import { LoadManager } from '@/core/three/LoadManager'
import { ElMessage } from 'element-plus'
import { StorageService } from '@/core/game/StorageService'
import { camelCase, delay } from 'lodash-es'
import { IndexDbStoreName, IndexDbStoreKeyPath, IndexDbDataName } from '@/enums/indexDb';
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { Character } from '@/core/three/objects/Character'
import { PhysicsWorld } from '@/core/three/physics/WorldManager'
import CannonDebugger from "cannon-es-debugger";
import { githubPagePublicDir } from '@/utils/config'
import  useDraggableObjects from '@/hooks/useDraggableObjects'

const core = new Core()

const storageService = new StorageService()
const physicsWorld = new PhysicsWorld()
const sceneManager = core.sceneManager
const collisionGroup = new THREE.Group() // 创建一个组，用于添加碰撞体

const useGlobalStore = useGlobalState()
const useDraggable = useDraggableObjects()
const dragControls = core.dragControls
const loadManager = new LoadManager()
const { isLoading, isInnerLoading, isEditor, dragObject, load } = storeToRefs(useGlobalState())
const elLoading = ref(false) // 加载动画
const isLandScape = ref(false)

// 关闭编辑面板
const closeEditorPanel = () => {
  useGlobalStore.setIsEditor(false)

  document.removeEventListener('keydown', onkeydown) // 移除编辑模式键盘事件
  core.dragControls.dragControls.enabled = false // 禁用dragControls
  core.orbit_controls.enabled = false // 禁止鼠标控制

  if (core.charater) {
    core.charater.cameraGroup.add(core.camera)
    // core.charater.model.add(core.charater.cameraGroup)
    core.camera.position.set(0, 0, 0)
    core.charater.cameraGroup.position.set(0, 20, -20)
    core.charater.addKeyEvent() // 添加角色相关事件
    core.charater.isActivated = true
    core.charater.model.visible = true // 显示角色模型

    // 添加碰撞体
    collisionGroup.removeFromParent();
    dragControls.draggableObjects.forEach(object => {
      collisionGroup.add(object)
    })
    collisionGroup.add(dragControls.ground)
    // dragControls.ground.rotateX(Math.PI / 3)
    core.scene.add(collisionGroup)
    

    // 添加加载状态
    useGlobalStore.setIsLoading(true)
    console.log(core.charater)
    setTimeout(() => {
      // 重新创建八叉树
      core.charater?.worldOctree.fromGraphNode(collisionGroup);
      useGlobalStore.setIsLoading(false)
    }, 0);

  }

}

// 打开编辑面板
const openEditorPanel = () => {
  useGlobalStore.setIsEditor(true)

  document.addEventListener('keydown', onkeydown) // 添加编辑模式键盘事件
  core.dragControls.dragControls.enabled = true // 开启拖拽
  core.orbit_controls.enabled = true; // 允许鼠标控制
  core.orbit_controls.minDistance = 20;
  core.orbit_controls.maxDistance = 400;
  // 垂直旋转控制（限制在30°俯角到60°仰角之间）
  core.orbit_controls.minPolarAngle = Math.PI/10; 
  core.orbit_controls.maxPolarAngle = Math.PI/2;
  
  // 将相机移除
  core.camera.removeFromParent()
  core.camera.position.set(0, 200, 0)
  // 暂停角色
  if (core.charater) {
    core.charater.removeKeyEvent() // 移除角色相关事件
    // core.charater.cameraGroup.removeFromParent()

    core.charater.isActivated = false
    core.charater.model.visible = false // 隐藏角色模型
  }

}

// 横屏处理
// const closeLandScapeTip = (value) => {
//   isLandScape.value = value
// }

// 旋转模型
const rotateModel = () => {
  if (dragControls.dragObject) {
    dragControls.dragObject.rotateY(Math.PI / 4)
    dragControls.highlightBox.rotateZ(Math.PI / 4)
  }
}

// 保存场景
const saveScene = () => {
  elLoading.value = true

  // 删除不需要保存的模型
  core.scene.remove(dragControls.highlightBox)
  core.scene.remove(dragControls.deleteButton.removeFromParent())
  core.scene.remove(dragControls.confirmButton.removeFromParent())
  // core.charater?.characterBoxHelper.removeFromParent()
  // core.charater?.start.removeFromParent()
  // core.charater?.end.removeFromParent()
  // core.charater?.mesh.removeFromParent()
  core.charater?.model.removeFromParent()

  // 用setTimeout是为了解决scene.toJson太慢导致卡顿
  setTimeout(() => {
    sceneManager.saveCurrentScene(core.camera, core.dragControls, load.value).then((result) => {
      Promise.all(result).then(() => { 
        console.log('导出成功')
      })
      elLoading.value = false

      core.scene.add(dragControls.highlightBox)
      core.scene.add(dragControls.deleteButton)
      core.scene.add(dragControls.confirmButton)

      if (result) {
        ElMessage.success({
          message: '保存成功',
          type: 'success'
        })
      } else {
        ElMessage.error({
          message: '保存失败',
          type: 'error'
        })
      }

      // 恢复角色
      core.scene.add(core.charater.model)
    })
  }, 1000)

  // const result = sceneManager.saveCurrentScene('application/json')



}

// 加载滚动列表的模型
const loadDecoration = (item: any) => {
  elLoading.value = true

  loadManager.load(githubPagePublicDir + item.modelSrc).then((model: THREE.Object3D) => {
    elLoading.value = false

    // 设置全局拖拽物体
    useGlobalStore.setDragObject(model)
    dragControls.dragObject = model

    // 接受阴影
    model.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    const modelBox = new THREE.Box3().setFromObject(model)
    const size = modelBox.getSize(new THREE.Vector3())
    // 设置模型位置
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), core.camera);
    const intersects = raycaster.intersectObjects(core.scene.children); // 获取交点
    if (intersects.length > 0) {
      const worldPosition = intersects[0].point; // 交点世界坐标
      model.position.copy(worldPosition);
    }
    model.position.y += modelBox.getSize(new THREE.Vector3()).y / 2

    // 边框显示
    dragControls.highlightBox.geometry.dispose();
    dragControls.highlightBox.geometry = dragControls.createPlaneGeometry(size);
    dragControls.highlightBox.position.copy(model.position);
    dragControls.highlightBox.position.y = modelBox.min.y - 0.01;
    dragControls.highlightBox.visible = true;

    // 添加边框
    dragControls.highlightBox.remove(dragControls.line);
    const edges = new THREE.EdgesGeometry(dragControls.highlightBox.geometry);
    dragControls.line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    dragControls.highlightBox.add(dragControls.line);

    // 设置确认删除按钮位置
    dragControls.confirmButton.position.set(size.x + model.position.x, 0, size.z + model.position.z)
    dragControls.deleteButton.position.set(-size.x + model.position.x, 0, size.z + model.position.z)
    dragControls.confirmButton.visible = true
    dragControls.deleteButton.visible = true

    // 添加场景数据，用户保存 
    sceneManager.addItem(item.modelSrc, model)

    // 设置负荷
    useGlobalStore.setLoad(load.value + item.load)

    core.scene.add(model)

    // 标记model为可拖拽
    model.userData.isDraggable = true
    // 添加到拖拽列表
    dragControls.addObject(model)
  })
}


/**
 * 初始化键盘控制功能
 * 该函数添加了键盘事件监听器，以控制相机的前后左右移动
 */
function onkeydown(event: KeyboardEvent) {
  // 定义移动速度
  const moveSpeed = 5;
  // 创建一个向量对象，用于表示方向
  const direction = new THREE.Vector3()
  // 初始化移动因子，根据相机面向的方向决定移动方向
  let factor = 1;
  // 忽略重复的按键事件
  if (event.repeat) return;
  // 获取相机面向的方向
  core.camera.getWorldDirection(direction)

  // 根据按键不同，计算相机的新位置
  switch (event.key) {
    case 'w':
      // 向前移动
      factor = direction.z <= 0 ? 1 : -1
      core.camera.position.z -= moveSpeed * factor
      core.orbit_controls.target.z -= moveSpeed * factor
      break
    case 's':
      // 向后移动
      factor = direction.z <= 0 ? 1 : -1
      core.camera.position.z += moveSpeed * factor
      core.orbit_controls.target.z += moveSpeed * factor
      break
    case 'a':
      // 向左移动
      factor = direction.z <= 0 ? 1 : -1
      core.camera.position.x -= moveSpeed * factor
      core.orbit_controls.target.x -= moveSpeed * factor
      break
    case 'd':
      // 向右移动
      factor = direction.z <= 0 ? 1 : -1
      core.camera.position.x += moveSpeed * factor
      core.orbit_controls.target.x += moveSpeed * factor
  }

}

// 加载人物模型
function loadCharacterModel() {
  core.charater = new Character(core.scene, core.camera)
  core.charater.worldOctree.fromGraphNode(dragControls.ground)
  // 开启人物控制
  if (core.charater) {
    core.charater.removeKeyEvent()
    // document.removeEventListener('keydown', onkeydown) // 移除编辑模式键盘事件
    // core.dragControls.dragControls.enabled = false // 禁用dragControls
    core.orbit_controls.enabled = false // 禁止鼠标控制
    // core.charater.cameraGroup.add(core.camera)
    
    // core.camera.position.set(0, 0, 0)
    // core.charater.cameraGroup.position.set(0, 20, -40)
    // core.charater.addKeyEvent() // 添加角色相关事件
    // core.charater.isActivated = true

    // // 添加碰撞体
    // collisionGroup.removeFromParent();
    // useDraggable.draggableObjects.forEach(object => {
    //   collisionGroup.add(object)
    // })
    // collisionGroup.add(dragControls.ground)
    
    // core.scene.add(collisionGroup)
    // // 重新创建八叉树
    // core.charater.worldOctree.fromGraphNode(collisionGroup);

  }

}

const handleResize = () => {
  isLandScape.value = window.innerWidth > window.innerHeight;
}

onMounted(() => {

  useGlobalStore.setIsLoading(true)


  // 延迟执行数据库查询，以防数据库未初始化完成
  delay(
    async () => {
      const jsonData = await storageService.getSave() as { scene: string } // 获取保存的场景数据

      if (false) {
        useGlobalStore.setIsLoading(true)

        // 解析场景数据
        const loader = new THREE.ObjectLoader()
        loader.parse(jsonData.scene, (scene) => {
          core.sceneManager.scene = scene
          core.scene = core.sceneManager.scene
          // 设置拖拽工具类数据
          scene.traverse((child) => {
            // 筛选可拖拽模型（地面模型不可拖拽）
            // if (child.children[1]?.name !== 'village_landscape') {
            //   dragControls.addObject(child)
            // } else {
            //   dragControls.ground = child.children[1].getObjectByName('ground')
            //   // physicsWorld.createGround(dragControls.ground)
            // }
            if (child.type === 'Mesh') {
              if (child.name === 'ground') dragControls.ground = child
            }
            if (child.userData.isDraggable && child.name !== 'ground') dragControls.addObject(child)
            // if(child.children[1]?.name === 'village_landscape') {
            //   dragControls.ground = child.children[1].getObjectByName('ground')
            // }
          })
          // dragControls.removeObject(dragControls.ground) // 移除地面
          // core.cannonDebugger = new (CannonDebugger as any)(core.scene, physicsWorld.world)
          // 在初始化一次拖拽工具类
          dragControls.initController(core.camera, core.renderer, core.orbit_controls, core.scene);

          // 加载人物模型
          loadCharacterModel();
          useGlobalStore.setLoad(jsonData.load)
          useGlobalStore.setIsLoading(false)

          if(import.meta.env.DEV) {
            // 添加坐标轴
            core.scene.add(new THREE.AxesHelper(100));
          }
          
        })
      } else {
        // 加载默认场景
        sceneManager.loadDefaultScene((models: Array<THREE.Object3D>, ground: THREE.Object3D) => {
          useGlobalStore.setIsLoading(false)
          // 加载模型
          models.forEach((model: THREE.Object3D) => {
            dragControls.addObject(model)
          })
          // 设置地面
          dragControls.ground = ground
          // core.chunkManager.update();

          // physicsWorld.createGround(dragControls.ground)
          // 加载人物模型
          loadCharacterModel();
        })


      }

      // 禁用 鼠标控制
      core.orbit_controls.enabled = true;

    },
    300
  )

  window.addEventListener('resize', handleResize)


})


onBeforeMount(() => { 
  window.removeEventListener('resize', handleResize)
})
</script>
<style scoped lang="less">
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

.content-container {
  height: 100vh;
  padding: 0;

  .el-header {
    height: 0;
    padding: 0;
  }

  .el-main {
    padding: 0;
  }
}



.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  // display: none;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  flex-direction: column;
}

.circle-container {
  position: absolute;
  width: 100px;
  height: 100px;
  top: calc(50% - 50px);
  left: calc(50% - 50px);
}

.circle {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid #409eff;
  animation: rotate-circle 3s infinite linear;
}

.dot {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: #409eff;
  border-radius: 50%;
  top: -7.5px;
  left: 42.5px;
  animation: flash-dot 1s infinite ease-in-out alternate;
}

.dot:nth-child(2) {
  animation-delay: 0.3s;
}

.dot:nth-child(3) {
  animation-delay: 0.6s;
}

.dot:nth-child(4) {
  animation-delay: 0.9s;
}

.loading-text {
  margin-top: 30px;
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #82b1ff;
}

@keyframes rotate-circle {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes flash-dot {
  0% {
    opacity: 0.1;
  }

  100% {
    opacity: 1;
  }
}
</style>
