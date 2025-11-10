import mitt from 'mitt';

export default class Emitter {
    private static emmiter_instance: ReturnType<typeof mitt>;

    constructor() {
        if (!Emitter.emmiter_instance) {
            Emitter.emmiter_instance = mitt();
        }
    }

    $on(event: string, callback: (...args: any[]) => void) {
        Emitter.emmiter_instance.on(event, callback);
    }

    $off(event: string, callback: (...args: any[]) => void) {
        Emitter.emmiter_instance.off(event, callback);
    }

    $emit(event: string, ...args: any[]) {
        Emitter.emmiter_instance.emit(event, args);
    }
}