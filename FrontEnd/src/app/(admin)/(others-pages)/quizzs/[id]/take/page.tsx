import React from "react";
import { Metadata } from "next";

import QuizzTake from "@/components/quizz/QuizzTake";


export const metadata: Metadata = {
    title: "Làm quizz | Quản lý dự án phần mềm - Tạo Quizz",
    description:
        "Làm quizz | Quản lý dự án phần mềm - Tạo Quizz",
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function BasicTables({ params }: any) {
    const { id } = await params
    return <div>
        <QuizzTake quizzId={id} />
    </div>
}
