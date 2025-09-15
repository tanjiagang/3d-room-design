<template>
    <div class="scene-manager">
        <canvas ref="canvasRef" id="scene-container"></canvas>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
const canvasRef = ref<HTMLCanvasElement | null>(null)
</script>
<style scoped lang="scss">

</style>
