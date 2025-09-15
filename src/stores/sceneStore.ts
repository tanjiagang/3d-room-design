import { defineStore } from 'pinia'
import { sceneService } from '@/api/services/sceneService'

interface SceneState {
    placedObjects: any[],
    selectedObject: any | null,
    currentScene: string | null,
    editMode: boolean,
    scenes: Record<string, any>
}


export const useSceneStore = defineStore('scene', {
    state: (): SceneState => ({
        placedObjects: [],
        selectedObject: null,
        currentScene: null,
        editMode: false,
        scenes: {}
    }),
    actions: {
        setCurrentScene(scene: string) {
            this.currentScene = scene
        },
        addObject(object: any) {
            this.placedObjects.push(object)
        },
        removeObject(object: any) {
            this.placedObjects = this.placedObjects.filter(o => o.id !== object.id)
        },
        toggleEditMode() {
            this.editMode = !this.editMode
        },
        setSelectedObject(object: any) {
            this.selectedObject = object
        },
        async loadSceneData() {
            const res = await sceneService.getSceneLayout()
            this.scenes = res.data
        }
    }
})

