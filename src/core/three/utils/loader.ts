import { LoadManager } from "../LoadManager"
import * as THREE from 'three'
// SceneChunkLoader.ts
export class SceneChunkLoader {
    private loader: LoadManager
    private activeChunks = new Set<string>()
    
    constructor(loader: LoadManager) {
      this.loader = loader
    }
  
    async updateVisibleChunks(
      cameraPosition: THREE.Vector3,
      chunkSize: number = 50
    ) {
      const visibleChunks = this.calculateVisibleChunks(cameraPosition, chunkSize)
      
      // 卸载不可见区块
      this.activeChunks.forEach(chunkId => {
        if (!visibleChunks.has(chunkId)) {
          this.unloadChunk(chunkId)
        }
      })
  
      // 加载新可见区块
      visibleChunks.forEach(async chunkId => {
        if (!this.activeChunks.has(chunkId)) {
          const url = `/models/${chunkId}.glb`
          await this.loader.load(url, this.handleProgress)
          this.activeChunks.add(chunkId)
        }
      })
    }
  
    private calculateVisibleChunks(
      position: THREE.Vector3, 
      chunkSize: number
    ): Set<string> {
      // 生成形如 "x10_y5_z3" 的区块ID 
      const x = Math.floor(position.x / chunkSize)
      const y = Math.floor(position.y / chunkSize)
      const z = Math.floor(position.z / chunkSize)
      return new Set([`x${x}_y${y}_z${z}`])
    }
  
    private handleProgress = (url: string, loaded: number, total: number) => {
      console.log(`加载进度: ${url} ${(loaded/total*100).toFixed(1)}%`)
    }
  
    private unloadChunk(chunkId: string) {
      const model = this.loader.getFromCache(`/models/${chunkId}.glb`)
      model?.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose() // 释放显存
        }
      })
      this.activeChunks.delete(chunkId)
    }
  }
  