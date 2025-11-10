import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

interface ExtendedInternalConfig  extends InternalAxiosRequestConfig {
    showLoading?: boolean
    mockFallback?: boolean
}

export function setupInterceptors(axios: AxiosInstance) {
    
    axios.interceptors.request.use((config: ExtendedInternalConfig) => {
        config.headers = config.headers || {}
        // add token to headers
        if(localStorage.getItem('-token')) {
            config.headers['Authorization'] = `Bearer ${localStorage.getItem('teapot-token')}`
        }

        // simulate mock fallback
        if(import.meta.env.MODE === 'development' && config.mockFallback) {
            // handle mock fallback logic here
            config.headers['X-Mock-Request'] = 'true'
        }
        return config
    })

    // response interceptor
    axios.interceptors.response.use(
        (response) => {
            if(response.config.responseType === 'blob') {
                return response
            }
            return response.data
        },
        (error) => {
            const status = error.response?.status || 'UNKONWN'
            const errorMap: Record<number, string> = {
                400: 'Bad Request',
                401: 'Unauthorized',
                403: 'Forbidden',
                404: 'Not Found',
                500: 'Internal Server Error',
            }
            return Promise.reject(errorMap[status] || 'Unknown Error:' + status)

        }
    )
}