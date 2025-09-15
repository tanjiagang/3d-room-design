import Mock from 'mockjs'
import { type MockMethod } from 'vite-plugin-mock'

interface InventoryItem {
    id: number,
    type: string,
    name: string,
    count: number
}

export default [
    {
        url: '/api/user/inventory',
        method: 'get',
        response: () => {
            return {
                code: 200,
                data: Mock.mock({
                    'coins|500-2000': 0,
                    'items|10-20': [{
                        'id|+1': 1001,
                        'type': '@pick(["building", "furniture"])',
                    }]
                })
            }
        }
    }
]


// Mock.mock('/api/user/inventory', {
//     'coins|500-2000': 0,
//     'items|10-20': [{
//         'id|+1': 1001,
//         'type': '@pick(["building", "furniture"])',
//         'name': '@ctitle(3,5)',
//         'count|1-5': 1
//     }]
// })