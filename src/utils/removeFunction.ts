// 声明一个带有toJSON()方法的对象
 export interface RemoveableObject {
    toJSON(): any;
}
export function sanitizeFunction(object: RemoveableObject) {
    const data = object.toJSON();
    // 递归清理函数属性
    const removeFunctions = (obj: any) => {
        for (const key in obj) {
            if (typeof obj[key] === 'function') {
                delete obj[key];
            } else if (obj[key] && typeof obj[key] === 'object') {
                removeFunctions(obj[key]);
            }
        }
    };
    removeFunctions(data);
    return data;
}
