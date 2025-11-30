// components/pdf/PDFViewer.tsx
"use client";

import React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import type { ToolbarSlot, TransformToolbarSlot } from '@react-pdf-viewer/default-layout';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Định nghĩa ngôn ngữ tiếng Việt cho Toolbar (Tuỳ chọn)
import vi_VN from '@react-pdf-viewer/locales/lib/vi_VN.json';

interface PDFViewerProps {
    fileUrl: string;
}

const WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
    // 1. Khởi tạo plugin defaultLayout để có full toolbar
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        // Cấu hình ngôn ngữ tiếng Việt (nếu muốn)
        // localization: vi_VN as any, 

        // Bạn có thể tùy chỉnh toolbar tại đây nếu cần
        renderToolbar: (Toolbar: (props: any) => React.ReactElement) => (
            <Toolbar />
        ),
    });

    return (
        <Worker workerUrl={WORKER_URL}>
            <div
                style={{
                    height: '750px', // Chiều cao cố định hoặc full screen
                    width: '100%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
            >
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[
                        // 2. Truyền plugin vào đây
                        defaultLayoutPluginInstance,
                    ]}
                // Thay đổi ngôn ngữ hiển thị
                // localization={vi_VN as any} 
                />
            </div>
        </Worker>
    );
};

export default PDFViewer;