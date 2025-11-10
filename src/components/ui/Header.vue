<template>
    <div class="header container flex">
        <el-popover placement="right-start" popper-class="editPop" :width="400" :visible="eidtVisible">
            <template #reference>
                <div class="header-left flex">
                    <el-icon @click="openEditorPanel" :size="30">
                        <Edit />
                    </el-icon>
                </div>
            </template>
            <div class="popover-content">
                <p>点击这里开启编辑模式</p>
                <div style="text-align: right; margin: 0">
                    <el-button type="primary" @click="eidtVisible = false">
                        关闭
                    </el-button>
                </div>
            </div>
        </el-popover>
    </div>
</template>

<script setup lang="ts">
import { size } from 'lodash-es';
import { ref } from 'vue';
const emit = defineEmits(['openEditorPanel']);
const eidtVisible = ref(true);
const openEditorPanel = () => {
    emit('openEditorPanel');
    eidtVisible.value = false;
};
</script>

<style scoped lang="less">
.header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    padding: 30px;
}

.header .el-icon {
    position: relative;
    margin-left: 20px;
    color: #000;
    cursor: pointer;

    &::after {
        content: '';
        position: absolute;
        z-index: -1;
        top: -30%;
        left: -30%;
        width: 150%;
        height: 150%;
        background-color: #fff;
        border-radius: 50%;
        border: 2px solid rgba(0, 0, 0, .2);
    }
}

@media screen and (max-width: @pc-width) { 
    .editPop {
        width: 60%;
    }
    .popover-content {
        p {
            font-size: 12px;
        }
        button {
            font-size: 12px;
        }
    }
}
</style>
