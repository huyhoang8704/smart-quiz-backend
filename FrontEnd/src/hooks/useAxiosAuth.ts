import AxiosInstanceLocal from "@/utils/axios";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";


export const useAxiosAuth = () => {
    const { data: session, status } = useSession();
    // console.log("🚀 ~ useAxiosAuth ~ session:", session,status)

    // Sử dụng useMemo để đảm bảo instance không bị tạo lại không cần thiết
    const axiosInstance = useMemo(() => {
        return AxiosInstanceLocal; // Bắt đầu với instance cơ bản đã tạo
    }, [session, status]); // Phụ thuộc vào session để cấu hình lại interceptor khi session thay đổi

    useEffect(() => {
        // 1. Loại bỏ các interceptor cũ (để tránh lặp lại)
        axiosInstance.interceptors.request.clear();

        // 2. Định nghĩa Request Interceptor
        const requestInterceptor = axiosInstance.interceptors.request.use(
            async (config) => {
                // Kiểm tra session và lấy token
                const token = session?.user?.backendToken; // Đảm bảo đường dẫn đến token là đúng

                if (token) {
                    // Gán token vào header Authorization
                    config.headers.Authorization = `Bearer ${token}`;
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 3. Cleanup function: Gỡ bỏ interceptor khi component unmount
        return () => {
            axiosInstance.interceptors.request.eject(requestInterceptor);
        };

    }, [session, axiosInstance]); // Re-run effect khi session hoặc axiosInstance thay đổi

    return { axiosInstance, status };
};