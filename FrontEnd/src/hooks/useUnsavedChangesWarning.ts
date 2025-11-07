// useUnsavedChangesWarning.js
'use client';

import { useEffect, useCallback } from 'react';

const useUnsavedChangesWarning = (isDirty, message) => {

    // Biến cờ để theo dõi xem chúng ta đã thêm entry vào history hay chưa
    let addedHistoryEntry = false;

    // 1. Xử lý sự kiện trình duyệt: Tải lại, Đóng tab
    const handleBeforeUnload = useCallback((event) => {
        if (isDirty) {
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    }, [isDirty, message]);

    // 2. Xử lý sự kiện Quay lại/Tiến (popstate)
    const handlePopState = useCallback((event) => {
        if (isDirty) {
            if (!window.confirm(message)) {
                // Nếu người dùng chọn Hủy, thêm lại trạng thái để VÔ HIỆU HÓA việc quay lại.
                // Điều này làm cho nút back tiếp theo vẫn ở trang hiện tại.
                window.history.pushState(event.state, '', window.location.href);
                return
            } else {
                // Người dùng chọn Rời đi: Cho phép hành động popstate diễn ra.
                // addedHistoryEntry sẽ được đặt lại trong cleanup.
            }
        }
    }, [isDirty, message]);

    useEffect(() => {
        if (isDirty) {
            // A. Kích hoạt BeforeUnload
            window.addEventListener('beforeunload', handleBeforeUnload);

            // B. Thêm trạng thái giả vào lịch sử (Chỉ thêm một lần)
            if (!addedHistoryEntry) {
                window.history.pushState(null, '', window.location.href);
                addedHistoryEntry = true;
            }

            // C. Lắng nghe sự kiện PopState (nút Back/Forward)
            window.addEventListener('popstate', handlePopState);
        } else {
            // Trường hợp isDirty chuyển từ true -> false (dữ liệu đã được lưu)
            // Loại bỏ entry giả đã thêm khỏi history
            if (addedHistoryEntry) {
                // Loại bỏ entry giả. Lúc này, lịch sử quay về trạng thái ban đầu.
                window.history.back();
                addedHistoryEntry = false;
            }
        }

        return () => {
            // Dọn dẹp listener khi component unmount
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isDirty, handleBeforeUnload, handlePopState]);
};

export default useUnsavedChangesWarning;