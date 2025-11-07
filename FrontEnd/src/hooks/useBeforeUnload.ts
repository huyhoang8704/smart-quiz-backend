import { useEffect } from 'react';

export const useBeforeUnload = (isDirty) => {
    useEffect(() => {
        // Chỉ kích hoạt khi có dữ liệu chưa lưu
        if (!isDirty) return;

        const handleBeforeUnload = (event) => {
            // Bắt buộc đối với một số trình duyệt
            event.preventDefault();

            // Gán một chuỗi trả về để hiển thị cảnh báo
            // Lưu ý: Nội dung thông báo hiển thị sẽ do trình duyệt kiểm soát
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);
};

// Sử dụng hook này trong component của bạn
// useBeforeUnload(unsavedChanges);