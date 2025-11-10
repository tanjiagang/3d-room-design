import * as dat from 'dat.gui';
export class GuiManager {
    static instance: GuiManager;
    gui!: dat.GUI;
    constructor() {
        if (GuiManager.instance) return GuiManager.instance;
        GuiManager.instance = this;
        this.gui = new dat.GUI();
    }

}