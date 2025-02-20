/*
* @Author: tan
* @Date: 2025-02-10
* @LastEditTime: 
* @Description: global state manager
* @FilePath: \3d-room\src\hooks\useGlobalState.ts
*/

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalState = defineStore('global', () => {
    // isLoading
    const isLoading = ref<boolean>(true)
    const setIsLoading = (value: boolean) => {
        isLoading.value = value
    }
    return { isLoading, setIsLoading }
})

