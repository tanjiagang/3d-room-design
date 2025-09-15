import mockjs from "mockjs";

// 模型数据
const modelData = mockjs.mock({
    "list|10": [
        {
            "id|+1": 1,
            "name": "@cname",
            "modelUrl": "@url",
            "thumbnailUrl": "@url",
            "description": "@paragraph",
            "createdAt": "@datetime",
            "updatedAt": "@datetime",
        }
    ]
})