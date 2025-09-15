/*
* @Author: tan
* @Date: 2025-02-10
* @LastEditTime: 
* @Description: global state manager
* @FilePath: \3d-room\src\hooks\useGlobalState.ts
*/

import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as THREE from 'three'

export const useGlobalState = defineStore('global', () => {
    // isLoading
    const isLoading = ref<boolean>(true)
    const isInnerLoading = ref<boolean>(false)
    // isEditor
    const isEditor = ref<boolean>(false)

    // 是否移动端
    const isMobile = ref<boolean>(false)

    // 负荷
    const load = ref<number>(0)

    // 当前拖拽的物体
    const dragObject = ref<THREE.Object3D | null>(null)

    const setIsLoading = (value: boolean) => {
        isLoading.value = value
    }

    const setIsInnerLoading = (value: boolean) => {
        isInnerLoading.value = value
    }

    const setIsEditor = (value: boolean) => {
        isEditor.value = value
    }

    const setLoad = (value: number) => {
        load.value = value
    }

    const setDragObject = (value: THREE.Object3D | null) => {
        dragObject.value = value
    }

    const setIsMobile = (value: boolean) => {
        isMobile.value = value
    }

    return { isLoading, setIsLoading,
             isInnerLoading, setIsInnerLoading,
             isEditor, setIsEditor,
             load, setLoad,
             dragObject, setDragObject,
             isMobile, setIsMobile
            }
})

