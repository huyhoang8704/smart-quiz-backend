

import QuizzDetail from "@/components/quizz/QuizzDetail";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Chi tiết quizz | Quản lý dự án phần mềm - Tạo Quizz",
    description:
        "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
    // other metadata
};
export default function BasicTables({ params }: { params: { id: string } }) {

    return <QuizzDetail quizzId={params.id} />
}
