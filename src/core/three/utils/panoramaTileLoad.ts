import * as THREE from 'three';
export const getSplitedPanorama = function (
    rows: number,
    cols: number,
    tilePaths: string[],
    callback: (texture: THREE.Texture) => void
) {
    const textures: THREE.Texture[] = [] // 纹理缓存
    const totalTiles = rows * cols;
    let loadedCount = 0;

    // 创建一个canvas来拼接图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // 计算拼接后的图片尺寸
    let fullWidth, fullHeight;
    let tileWidth, tileHeight;

    // 加载所有小图
    for (let i = 0; i < rows; i++) {
        for(let j = 0; j < cols; j++) {
            const texture = new THREE.Texture();
            textures.push(texture);

            // 加载单个小图
            const loader = new THREE.TextureLoader();
            loader.load(tilePaths[i * cols + j], function (loadedTexture) {
               textures[i * cols + j] = loadedTexture;
               loadedCount++;

               // 所有图片加载完成后，拼接图片
               if (loadedCount === totalTiles) {
                   fullWidth = textures[0].image.width * cols;
                   fullHeight = textures[0].image.height * rows;
                   tileWidth = textures[0].image.width;
                   tileHeight = textures[0].image.height;

                   // 创建拼接后的图片
                   canvas.width = fullWidth;
                   canvas.height = fullHeight;

                    //    绘制小图
                    for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols; j++) {
                            ctx.drawImage(textures[i * cols + j].image, j * tileWidth, i * tileHeight);
                        }
                    }

                    // 创建纹理
                    const fullTexture = new THREE.CanvasTexture(canvas);

                    callback(fullTexture);
                }
            })
        }
    }
}