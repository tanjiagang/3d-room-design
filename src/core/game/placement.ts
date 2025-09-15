export interface Placement {
    url: string;         // url
    itemId: string;     // 模型ID (如 "desk", "tree")
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number };
    scale?: number;     // 可选缩放
    timestamp?: number; // 最后修改时间
  }
  
  export interface SceneSave {
    version: string;    // 数据版本
    placements: Placement[];
    createdAt: number; // 创建时间戳
  }