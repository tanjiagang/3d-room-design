<template>
    <div class="landscape-tip hide-pc">
        <div class="landscape-content">
            <div class="icon-wrap"><el-icon><Iphone /></el-icon></div>
            <p>使用横屏体验更佳</p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount} from "vue";
// const emit = defineEmits(['landscapeTip'])

// const isLandscape = ref(false);

// const handleResize = () => {
//     isLandscape.value = window.innerWidth > window.innerHeight;
//     emit('landscapeTip', isLandscape.value)
// }
onMounted(() => {
    // window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    // window.removeEventListener('resize', handleResize)
})

</script>

<style scoped lang="less">
    .landscape-tip {
        position: absolute;
        top: 0%;
        left: 0%;
        z-index: 9990;
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: rgba(0, 0, 0, 1);
        color: white;
        
    }
    .icon-wrap {
        transform: rotateZ(90deg);
    }
    .el-icon {
        font-size: 50px;
    }
    p {
        font-size: 16px;
        margin-top: 5vh;
    }
</style>
