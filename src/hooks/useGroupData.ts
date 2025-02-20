import { defineStore } from "pinia";
import { ref } from "vue";

// save initial group data
type TGroupData = {
    uuid: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    children: Array<any>;
};

export const useInitialGroupData = defineStore("initialGroupData", () => {
    const initialGroupData = ref<TGroupData[]>([]);

    function setInitialGroupData(data: TGroupData[]) {
        initialGroupData.value = data;
    }

    function addInitialGroupData(data: TGroupData) {
        initialGroupData.value.push(data);
    }

    function clearInitialGroupData() {
        initialGroupData.value = [];
    }

    return { initialGroupData, addInitialGroupData, clearInitialGroupData, setInitialGroupData };
});