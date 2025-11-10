
type EventHandler = (payload?: any) => void;

class ThreeEventSystem {
    private events: Map<string, EventHandler[]> = new Map();

    on(type: string, handler: EventHandler) {
        if (!this.events.has(type)) {
            this.events.set(type, []);
        }

        this.events.get(type)!.push(handler);
    }

    off(type: string, handler?: EventHandler) {
        if (!handler) {
            this.events.delete(type)
            return
        }
        const handlers = this.events.get(type)?.filter(fn => fn !== handler)
        this.events.set(type, handlers || [])
    }

    emit(type: string, payload?: any) {
        if (!this.events.has(type)) {
            return;
        }

        const handlers = this.events.get(type)!;
        handlers.forEach((handler) => {
            handler(payload);
        });
    }
}

export const eventSystem = new ThreeEventSystem();