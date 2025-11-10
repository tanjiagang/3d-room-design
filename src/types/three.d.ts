import { Object3D } from "three";

declare module "three" {
    interface Object3D {
        // extend custom Object3D properties
        isSelected?: boolean;
        itemType?: string;
        originalScale?: number;
        metaData?: TeapotItemMeta;
        userData?: {
            placementId?: string;
        };
    }
}

// the interface of teapot ojbect's data
interface TeapotItemMeta {
   id: number;
   bluePrintId: number;
   position: [number, number, number];
   rotation?: number;
   variant?: string;
}