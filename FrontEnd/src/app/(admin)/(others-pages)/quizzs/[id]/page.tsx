import React from "react";
import { Metadata } from "next";
import QuizzDetail from "@/components/quizz/QuizzDetail";


export const metadata: Metadata = {
    title: "Chi tiết quiz | Quản lý dự án phần mềm - Tạo Quiz",
    description:
        "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
    // other metadata
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function BasicTables({ params }: any) {
    const { id } = await params
    return <div>
        <QuizzDetail quizzId={id} />
    </div>
}
