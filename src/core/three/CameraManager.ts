import * as THREE from 'three';

let instance: CameraManager | null = null;
// init scene
export class CameraManager {
    camera!: THREE.PerspectiveCamera;
    constructor(canvas: HTMLCanvasElement) {
        if(instance) return instance;
        instance = this;
        this.init(canvas);
    }

    init(canvas: HTMLCanvasElement) {
        this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 1, 2000);
        this.camera.rotation.order = 'YXZ';
        this.camera.position.set(40, 200, -400);
        this.camera.lookAt(0, 0, 0);
    }

    dispose() {
        
    }
}