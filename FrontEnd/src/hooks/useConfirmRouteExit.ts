import { useEffect } from 'react';
import { useRouter } from 'next/router';

export const useConfirmRouteExit = (isDirty, message) => {
    const router = useRouter();

    useEffect(() => {
        if (!isDirty) return;

        const handleRouteChange = (url) => {
            // Nếu có dữ liệu chưa lưu và người dùng cố gắng chuyển trang
            if (isDirty) {
                if (window.confirm(message)) {
                    // Người dùng đồng ý rời đi, cho phép chuyển trang
                    return;
                } else {
                    // Người dùng hủy, ngăn chặn việc chuyển trang
                    router.events.emit('routeChangeError');
                    throw 'Abort route change. Please ignore this error.';
                }
            }
        };

        router.events.on('routeChangeStart', handleRouteChange);

        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [isDirty, router, message]);
};