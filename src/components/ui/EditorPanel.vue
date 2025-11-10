<!-- editor panel -->
<template>

    <div class="header container flex flex-center">
        <div class="header-tab flex flex-center">负荷<span class="tag"
                :class="{ orange: load >= 1000, red: load >= 2000 }"></span></div>
        <div class="header-tab flex flex-center">种类100/1999</div>
        <div class="load-num header-tab flex flex-center"><el-icon :size="16">
                <Odometer />
            </el-icon>{{ load }}</div>
        <div class="close-btn" @click="closeEditorPanel">
            <el-icon color="#fff" :size="40">
                <CircleClose />
            </el-icon>
        </div>
    </div>

    <div class="side-panel">
        <div class="side-panel-tab flex flex-center">常规旋转<el-icon :size="20" @click="rotateModel">
                <RefreshRight />
            </el-icon></div>
        <div class="side-panel-tab flex flex-center" @click="saveScene">保存<el-icon :size="20">
                <Edit />
            </el-icon>
        </div>
    </div>

    <div class="control-panel hide-ipad-mobile flex">
        <div class="keywords-panel control-panel-tab flex">
            <div class="keywords">
                <span class="keyword"></span>
                <span class="keyword">W</span>
                <span class="keyword"></span>
                <br />
                <span class="keyword">A</span>
                <span class="keyword">S</span>
                <span class="keyword">D</span>
            </div>
            <span>镜头平移</span>
        </div>
        <div class="view-distance-panel control-panel-tab flex flex-center">
            <el-icon :size="30">
                <Mouse />
            </el-icon>
            <span>调整视距</span>
        </div>
    </div>

    <div class="building-list-wrap">
        <ul class="building-list-tabs flex">
            <li v-for="(item, index) in decorationList" class="building-list-tab"
                :class="{ active: index === activedTabIndex }" @click="activedTabIndex = index">
                {{ item.type }}
            </li>
        </ul>

        <!-- 图片列表 -->
        <!-- <div class="list-wrap"> -->
        <!-- <ul ref="listContainer" class="list-container">
                <li 
                    v-for="(item, index) in decorationImgList"
                    :key="index"
                    @click="loadDecoration(item)"
                    class="list-item">
                    <img v-lazyload="item.previewImg" alt="">
                    <div class="model-info"><el-icon>
                            <CircleCheck />
                        </el-icon>{{ item.load }} <span class="num">×{{ item.num }}</span>
                    </div>
                </li>
            </ul> -->
        <ul ref="listContainer" class="list-container" scroll-container>
            <li v-for="(item, index) in decorationImgList" :key="index" @click="loadDecoration(item)" class="list-item"
                :class="{ 'disabled': item.num <= 0 }">
                <el-image :src="githubPagePublicDir + item.previewImg" alt="" lazy />
                <div class="model-info"><el-icon>
                        <CircleCheck />
                    </el-icon>{{ item.load }} <span class="num">×{{ item.num }}</span>
                </div>
            </li>
        </ul>
        <!-- </div> -->

    </div>
</template>
<script setup lang="ts">
import { withDefaults, ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useGlobalState } from '@/hooks/useGlobalState'
import { storeToRefs } from 'pinia';
// import { LoadManager } from '@/core/three/LoadManager'
import { githubPagePublicDir } from '@/utils/config';

withDefaults(defineProps<{
    // load: number
}>(), {
    // load: 0
})

const emit = defineEmits<{
    (e: 'closeEditorPanel'): void
    (e: 'loadDecoration', item: any): void
    (e: 'rotateModel'): void
    (e: 'saveScene'): void
}>()

const useGlobalStore = useGlobalState()
const { load } = storeToRefs(useGlobalStore)

// const loadManager = new LoadManager()

// 装饰列表
const decorationList = [
    {
        type: '建筑',
        list: [
            {
                type: 'building',
                load: 10,
                num: 1,
                previewImg: '/images/buildings/pillar.png',
                modelSrc: '/models/buildings/pillar.glb'
            },
            {
                type: 'building',
                load: 100,
                num: 1,
                previewImg: '/images/buildings/japanese-door.png',
                modelSrc: '/models/buildings/japanese-door.glb'
            },
            {
                type: 'building',
                load: 50,
                num: 1,
                previewImg: '/images/buildings/streetlight.png',
                modelSrc: '/models/buildings/streetlight.glb'
            },

        ]
    },
    {
        type: '房屋',
        list: [
            {
                type: 'house',
                load: 300,
                num: 2,
                previewImg: '/images/house/chinese-house.png',
                modelSrc: '/models/house/chinese-house.glb'
            },
            {
                type: 'house',
                load: 200,
                num: 3,
                previewImg: '/images/house/chinese-house2.png',
                modelSrc: '/models/house/chinese-house2.glb'
            },
        ]
    },
    {
        type: '家具',
        list: [
            {
                type: 'furniture',
                load: 50,
                num: 5,
                previewImg: '/images/furnitures/chair.png',
                modelSrc: '/models/furnitures/chair.glb'
            },
            {
                type: 'furniture',
                load: 200,
                num: 5,
                previewImg: '/images/furnitures/wardrobe.png',
                modelSrc: '/models/furnitures/wardrobe.glb'
            },
            {
                type: 'furniture',
                load: 10,
                num: 5,
                previewImg: '/images/furnitures/chair2.png',
                modelSrc: '/models/furnitures/chair2.glb'
            },
            {
                type: 'furniture',
                load: 10,
                num: 5,
                previewImg: '/images/furnitures/chair3.png',
                modelSrc: '/models/furnitures/chair3.glb'
            },
            {
                type: 'furniture',
                load: 10,
                num: 5,
                previewImg: '/images/furnitures/desk.png',
                modelSrc: '/models/furnitures/desk.glb'
            },
            {
                type: 'furniture',
                load: 10,
                num: 5,
                previewImg: '/images/furnitures/pot.png',
                modelSrc: '/models/furnitures/pot.glb'
            },
        ]
    },
    {
        type: '其它',
        list: [
            {
                type: 'others',
                load: 20,
                num: 5,
                previewImg: '/images/others/barrel.png',
                modelSrc: '/models/others/barrel.glb'
            },
            {
                type: 'others',
                load: 10,
                num: 5,
                previewImg: '/images/others/boat.png',
                modelSrc: '/models/others/boat.glb'
            },
            {
                type: 'others',
                load: 30,
                num: 5,
                previewImg: '/images/others/campfire.png',
                modelSrc: '/models/others/campfire.glb'
            },
            {
                type: 'others',
                load: 5,
                num: 10,
                previewImg: '/images/others/car.png',
                modelSrc: '/models/others/car.glb'
            },
            {
                type: 'others',
                load: 100,
                num: 2,
                previewImg: '/images/others/kirara.png',
                modelSrc: '/models/others/kirara.glb'
            },
            {
                type: 'others',
                load: 100,
                num: 2,
                previewImg: '/images/others/kirara.png',
                modelSrc: '/models/others/luoli_run.glb'
            }
        ]
    }
]
let activedTabIndex = ref(0)
let decorationImgList = reactive(decorationList[activedTabIndex.value].list)
watch(activedTabIndex, (newVal, oldVal) => {
    decorationImgList = reactive(decorationList[newVal].list)
})

// 列表拖动
let isDrag = ref(false)
let startX = 0
let scrollLeft = 0
const listContainer = ref<HTMLElement | null>(null)
function initDragScroll() {
    if (listContainer.value) {
        const container = listContainer.value;
        container.addEventListener('mousedown', function (e) {
            isDrag.value = true;
            startX = e.pageX
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        });

        container.addEventListener('mousemove', function (e) {
            if (!isDrag.value) return;
            e.preventDefault();
            container.scrollLeft = scrollLeft - (e.pageX - startX);
        });

        // 移动端
        container.addEventListener('touchstart', function (e) {
            isDrag.value = true;
            startX = e.touches[0].pageX
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        }, { passive: false });

        container.addEventListener('touchmove', function (e) {
            if (!isDrag.value) return;
            e.preventDefault();
            container.scrollLeft = scrollLeft - (e.touches[0].pageX - startX);
        }, { passive: false });

        const endDrag = () => {
            isDrag.value = false
            container.style.cursor = 'grab'
        }
        container.addEventListener('mouseup', endDrag);
        container.addEventListener('mouseleave', endDrag);
        container.addEventListener('touchend', endDrag);
    }
}

// 关闭编辑器
const closeEditorPanel = () => {
    emit('closeEditorPanel')
}

// 加载装饰
const loadDecoration = (item: any) => {

    // if (item.num > 0) {
    //     item.num = item.num - 1
    // }
    // if (item.num <= 0) {
    //     ElMessage.error({
    //         message: '数量不足, 请重新选择',
    //         type: 'error'
    //     })
    // }
    emit('loadDecoration', item)
}

// 旋转模型
const rotateModel = () => {
    emit('rotateModel')
}



// 保存场景
const saveScene = () => {
    emit('saveScene')
}

onMounted(() => {
    initDragScroll();
})
</script>
<style lang="less" scoped>
.editor-panel {

    width: 100%;
    pointer-events: none;
}

.header {
    position: relative;
    z-index: 100;
    box-sizing: border-box;
    width: 100%;
    justify-content: center;
    padding: 20px;
    justify-content: flex-end;
}

.header-tab {
    box-sizing: border-box;
    cursor: pointer;
    margin-right: 20px;
    padding: 5px 10px;
    user-select: none;

    color: #fff;
    background-color: rgba(0, 0, 0, .5);
    border-radius: 25px;
    font-size: 14px;

    .tag {
        width: 10px;
        height: 10px;
        position: relative;
        margin-left: 10px;
        border-radius: 50%;
        background-color: #a2ea93;
    }

    .tag.orange {
        background-color: orange;
    }

    .tag.red {
        background-color: red;
    }

}

.load-num {
    cursor: pointer;

    .el-icon {
        margin-right: 10px;
    }
}

.close-btn {}

.side-panel {
    position: fixed;
    z-index: 100;
    top: calc(50% - 100px);
    right: 40px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    user-select: none;

    .side-panel-tab {
        margin-bottom: 40px;
        font-weight: 600;
        color: #fff;
    }

    .side-panel-tab:hover {
        // color: #a2ea93;
    }

    .el-icon {
        position: relative;
        margin-left: 20px;
        color: #000;
        cursor: pointer;

        &::after {
            content: '';
            position: absolute;
            z-index: -1;
            top: -35%;
            left: -35%;
            width: 150%;
            height: 150%;
            background-color: #fff;
            border-radius: 50%;
            border: 2px solid rgba(0, 0, 0, .2);
        }

        &:hover {
            opacity: 0.8;
        }
    }
}

.control-panel {
    position: fixed;
    z-index: 100;
    top: calc(50% - 100px);
    left: 40px;
    padding-bottom: 20px;
    user-select: none;
    pointer-events: none;

    &-tab {
        margin-right: 25px;
        color: #fff;
    }
}

.keywords-panel {
    align-items: flex-end;
    font-weight: bold;
}

.keywords {
    .keyword {
        display: inline-block;
        margin-top: 5px;
        margin-right: 5px;
        padding: 2px 8px;
        font-size: 14px;
        color: #000;
        background-color: #fff;
        border-radius: 3px;
    }

}

.view-distance-panel {
    font-weight: bold;
    padding-top: 40px;
}

.building-list-wrap {
    position: fixed;
    z-index: 100;
    bottom: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    overflow-x: scroll;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    user-select: none;

    .list-wrap {
        overflow-x: scroll;
        width: 100%;
    }

    .list-container {
        display: flex;
        flex-wrap: nowrap;
        min-width: 100%;
        box-sizing: border-box;
        padding-left: 20px;
        overflow-x: scroll;
        white-space: nowrap;

        /* 子元素横向排列 */
        .list-item {
            flex: 0 0 auto;
            margin: 10px;
            width: 150px;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2));
            border-radius: 10px;
            overflow: hidden;

            &.disabled {
                background: rgba(0, 0, 0, 0.5);
            }

            &:hover {
                background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4));
            }

            img {
                width: 100%;
                object-fit: cover;
            }
        }
    }

    .model-info {
        padding: 2px 10px;
        background: #ebe4df;
        color: #000;
        font-weight: bold;
        font-size: 14px;

        .num {
            float: right;
        }
    }
}

.building-list-tabs {
    padding: 5px 0;
    padding-left: 20px;

    .building-list-tab {
        padding: 10px 60px;
        color: #fff;
        font-size: 18px;
        border-radius: 40px;
        transition: all .3s ease;
        cursor: pointer;

        &.active {
            background-color: #eee4db;
            color: #000;
        }

        &:hover {
            background-color: #eee4db;
            color: #000;
        }
    }

    .type {
        font-size: 18px;
        color: #fff;
    }
}

@media screen and (max-width: 1024px) {
    .building-list-tabs {
        .building-list-tab {
            padding: 5px 30px;
            font-size: 12px;
        }

    }

    .building-list-wrap {
        .list-container {
            .list-item {
                width: 11vw;
                margin: 2px 5px;
            }
        }
        .model-info {
            font-size: 9px;
        }
    }

    .side-panel .side-panel-tab {
        font-size: 14px;
    }

}
</style>