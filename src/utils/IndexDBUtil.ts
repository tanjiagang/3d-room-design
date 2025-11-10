export default class IndexDBUtil {
    private dbName!: string;
    private version!: number;
    private db!: IDBDatabase | null;
    // static instance: IndexDBUtil | null = null;

    constructor(dbName: string, version: number = 1) {
        // if (IndexDBUtil.instance) return IndexDBUtil.instance;
        // IndexDBUtil.instance = this;
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    /**
     * 初始化数据库
     * @param stores 对象仓库
     * @returns
     */
    async initDB(stores: { name: string, keyPath: string }[]): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('数据库打开失败:', event);
                reject(event);
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(true);
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // 创建对象仓库
                stores.forEach((store) => {
                    if (!db.objectStoreNames.contains(store.name)) {
                        db.createObjectStore(store.name, { keyPath: store.keyPath });
                    }
                });
            };
        })
    }

    /**
     * 添加数据
     * @param storeName 仓库名称
     * @param data 数据
     */
    async add<T>(storeName: string, data: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(data);
            }
            request.onerror = (event) => {
                reject(new Error(`添加数据失败: ${event}`));
            }
        })
    }

    /**
     * 更新数据
     * @param storeName 仓库名称
     * @param data 数据
     * @returns
     */
    async update<T>(storeName: string, data: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(data);
            }
            request.onerror = (event) => {
                reject(new Error(`更新数据失败: ${event}`));
            }
        })
    }

    /**
     * 获取数据
     * @param storeName 仓库名称
     * @param key 主键
     * @returns
     */
    async get<T>(storeName: string, key: string): Promise<T | null> {
        return new Promise<T | null>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result as T);
            }
            request.onerror = (event) => {
                reject(new Error(`获取数据失败: ${event}`));
            }
        })
    }

    /**
     * 删除数据
     * @param storeName 仓库名称
     * @param key 主键
     * @returns
     */
    async delete(storeName: string, key: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => {
                resolve(true);
            }
            request.onerror = (event) => {
                reject(new Error(`删除数据失败: ${event}`));
            }
        })
    }

    /**
     * 获取所有数据
     * @param storeName 仓库名称
     * @returns
     */
    async getAll<T>(storeName: string): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            }
            request.onerror = (event) => {
                reject(new Error(`获取所有数据失败: ${event}`));
            }
        })
    }

    /**
     * 清空仓库
     * @param storeName 仓库名称
     * @returns
     */
    async clear(storeName: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => {
                resolve(true);
            }
            request.onerror = (event) => {
                reject(new Error(`清空仓库失败: ${event}`));
            }
        })
    }

}