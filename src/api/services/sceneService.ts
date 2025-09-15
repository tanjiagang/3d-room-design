import axios from 'axios'

export const getModel = async () => {
    const res = await axios.get('/api/models')
    return res.data
}