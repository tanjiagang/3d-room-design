import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';


let instance: ControlManager | null = null;
// init scene
export class ControlManager {
    control: OrbitControls | null = null;
    constructor(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera) {
        if(instance) return instance;
        instance = this;
        this.init(canvas, camera);
    }

    init(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera) {
        this.control = new OrbitControls(camera, canvas);
        this.control.enableDamping = true;
        this.control.dampingFactor = 0.05;
        this.control.enableDamping = true;
    }

    dispose() {
        if (this.control) {
            this.control.dispose();
        }
    }
}