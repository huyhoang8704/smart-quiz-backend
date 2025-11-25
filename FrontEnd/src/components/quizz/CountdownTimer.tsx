// CountdownTimer.jsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';

// Thời gian ban đầu: 1 giờ (3600 giây)
const INITIAL_SECONDS = 3600;

/**
 * Component đếm ngược 1 giờ với design lấy cảm hứng từ TailAdmin
 * * @param {function} onComplete - Hàm callback được gọi khi đếm ngược kết thúc
 */
const CountdownTimer = forwardRef(({ onComplete, timeLimit }: {}, ref) => {
    const limit = useMemo(() => timeLimit ? timeLimit * 60 : INITIAL_SECONDS, [timeLimit])

    const [secondsLeft, setSecondsLeft] = useState(limit);
    const [isRunning, setIsRunning] = useState(true);

    // Sử dụng useCallback để đảm bảo hàm format không bị tạo lại không cần thiết
    const formatTime = useCallback((totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Định dạng HH:MM:SS, thêm '0' đằng trước nếu nhỏ hơn 10
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }, []);

    // Logic đếm ngược
    useEffect(() => {
        if (!isRunning || secondsLeft <= 0) {
            if (secondsLeft <= 0) {
                // Đảm bảo callback chỉ chạy 1 lần khi secondsLeft về 0
                setIsRunning(false);
            }
            return;
        }

        const intervalId = setInterval(() => {
            setSecondsLeft(prevSeconds => prevSeconds - 1);
        }, 1000);

        // Cleanup function
        return () => clearInterval(intervalId);
    }, [secondsLeft, isRunning]);

    useEffect(() => {
        if (secondsLeft === 0) {
            onComplete?.();
        }
    }, [secondsLeft])

    // Xác định màu sắc (Đỏ khi còn dưới 10 giây)
    const isCritical = secondsLeft <= 10 && secondsLeft > 0;

    // Tạo chuỗi class Tailwind
    const timerClasses = `
        text-6xl font-extrabold transition-colors duration-300 
        ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-white'}
    `;


    useImperativeHandle(ref, () => ({
        getTimeTake: () => {
            return (limit - secondsLeft) / 60;
        },
    }), [secondsLeft, limit]);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-boxdark rounded-lg shadow-default border border-stroke dark:border-strokedark">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Thời gian còn lại
            </p>
            <div className={timerClasses}>
                {formatTime(secondsLeft)}
            </div>
            {secondsLeft === 0 && (
                <p className="mt-4 text-lg font-semibold text-green-600">
                    Đã hết thời gian!
                </p>
            )}

            {/* Nút tạm dừng/tiếp tục (Tùy chọn) */}
            <button
                onClick={() => setIsRunning(prev => !prev)}
                className={`mt-4 px-4 py-2 text-sm font-medium rounded-md transition-colors 
                    ${isRunning && secondsLeft > 0 ?
                        'bg-warning text-white hover:bg-opacity-80' :
                        'bg-success text-white hover:bg-opacity-80'
                    }
                    ${secondsLeft === 0 ? 'hidden' : ''}
                `}
            >
                {isRunning ? 'Tạm dừng' : 'Tiếp tục'}
            </button>
        </div>
    );
})

export default CountdownTimer;