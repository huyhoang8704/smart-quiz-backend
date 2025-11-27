import React from "react";
import { Metadata } from "next";

import QuizzTake from "@/components/quizz/QuizzTake";


export const metadata: Metadata = {
    title: "Làm quizz | Quản lý dự án phần mềm - Tạo Quiz",
    description:
        "Làm quizz | Quản lý dự án phần mềm - Tạo Quiz",
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function BasicTables({ params, searchParams }: any) {
    const { id, } = await params
    const { timeLimit } = await searchParams
    console.log("🚀 ~ BasicTables ~ prams:", timeLimit)
    return <div>
        <QuizzTake quizzId={id} timeLimit={timeLimit ? parseInt(timeLimit) : undefined} />
    </div>
}
