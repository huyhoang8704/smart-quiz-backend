import axios from 'axios';


const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

axiosInstance.interceptors.request.use(
    async (config) => {
        // Check if running on the server
        // This code runs on the client
        const token = localStorage.getItem('authjs.session-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;