import type { SceneSave, Placement } from './placement';
import IndexDBUtil from '@/utils/IndexDBUtil';
const STORAGE_KEY = 'teapot';
import { Camera, Scene } from 'three';
import { IndexDbStoreName, IndexDbStoreKeyPath, IndexDbDataName } from '@/enums/indexDb';
import ChunkManager from '../three/ChunkManager';
import type { DragControlsManager } from '../three/DragControlsManager';


interface SceneData extends ReturnType<Scene['toJSON']> {
  sceneBlobData: string;
}

const sceneToJsonWorker = new Worker(new URL('./sceneToJsonWorker.ts', import.meta.url));

export class StorageService {
  indexDBUtil!: IndexDBUtil;
  instance: StorageService | null = null;
  constructor() {
    // 创建数据库
    if (this.instance) return this.instance;
    this.instance = this;
    this.indexDBUtil = new IndexDBUtil(IndexDbDataName, 1);
    this.indexDBUtil.initDB([
      { name: IndexDbStoreName, keyPath: IndexDbStoreKeyPath },
    ]);
  }
  // 获取存档
  getSave() {
    const res = this.indexDBUtil.get(IndexDbStoreName, IndexDbStoreKeyPath);
    return res;
  }

  // 保存当前场景
  async saveScene(scene: Scene, camera: Camera, dragControls: DragControlsManager, load: number): Promise<Object> {
    return new Promise(async (resolve) => {      
      // // 将场景转为JSON
      // const sceneJson = JSON.parse(JSON.stringify(scene.toJSON()));
      // const jsonData = {
      //   load,
      //   scene: sceneJson
      // }
      // // 定义indexedDB需要的索引
      // Object.defineProperty(jsonData, IndexDbStoreKeyPath, {
      //     value: IndexDbStoreKeyPath,
      //     writable: true,
      //     enumerable: true
      // })
      
      // // 查询是否有存档
      // let res = await this.indexDBUtil.get(IndexDbStoreName, IndexDbStoreKeyPath)
      // if (res) {
      //   res = await this.indexDBUtil.update(IndexDbStoreName, jsonData);
      // } else {
      //   res = await this.indexDBUtil.add(IndexDbStoreName, jsonData);
      // }
      const chunkManager = new ChunkManager(scene, camera, dragControls, 250);
      const res = chunkManager.exportChunk();
      resolve(res);
    })
  }


  // 加载存档
  async loadScene(sceneData: any) {
    // const res = await this.indexDBUtil.get('sceneData', 'application/json')
    if (sceneData) {
      const reader = new FileReader();
      reader.readAsText(sceneData as Blob);
      reader.onload = (event) => {
        const json = JSON.parse(event.target?.result as string);
        return json;
      }
    }
    return null;
  }

  // 删除存档
  static deleteSave(saveId: number) {
    const saves = this.getSaves();
    saves.splice(saveId, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  }
}