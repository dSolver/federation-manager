import axios from "axios"

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8100'
})

export default axiosInstance