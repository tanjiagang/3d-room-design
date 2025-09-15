import * as THREE from 'three';
import { CSS3DRenderer, CSS2DRenderer } from 'three/examples/jsm/Addons.js';

let instance: RendererManger | null = null;
// init scene
export class RendererManger {
    renderer!: THREE.WebGLRenderer;
    css2Renderer!: CSS2DRenderer;
    // css3Renderer!: CSS3DRenderer;
    constructor() {
        if (instance) return instance;
        instance = this;
        this.init();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xffffff);
        this.renderer.setClearAlpha(0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影
		this.renderer.domElement.style.position = "absolute";
		this.renderer.domElement.style.zIndex = "0";
		this.renderer.domElement.style.top = "0px";
		document.querySelector("#app")?.appendChild(this.renderer.domElement);

        this.css2Renderer = new CSS2DRenderer();
        this.css2Renderer.setSize(window.innerWidth, window.innerHeight);
        this.css2Renderer.domElement.style.position = "absolute";
        this.css2Renderer.domElement.style.top = "0px";
        this.css2Renderer.domElement.style.pointerEvents = "none";
        this.css2Renderer.domElement.style.zIndex = "200";
        document.querySelector("#app")?.appendChild(this.css2Renderer.domElement);

        // this.css3Renderer = new CSS3DRenderer();
        // this.css3Renderer.setSize(window.innerWidth, window.innerHeight);
        // this.css3Renderer.domElement.style.position = "absolute";
        // this.css3Renderer.domElement.style.top = "0px";
        // this.css3Renderer.domElement.style.pointerEvents = "none";
        // document.querySelector("#app")?.appendChild(this.css3Renderer.domElement);
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}