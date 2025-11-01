import { reactive } from "vue";
import * as THREE from "three";
const draggableObjects = reactive<THREE.Object3D[]>([]);

const addObject = (object: THREE.Object3D) => { 
    draggableObjects.push(object);
}
const removeObject = (object: THREE.Object3D) => { 
    draggableObjects.splice(draggableObjects.indexOf(object), 1);
}
export default function useDraggableObjects() {
    return { draggableObjects, addObject, removeObject };
}
