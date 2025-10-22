import React from "react";
import { Metadata } from "next";


import QuizzAttempsReview from "@/components/quizz/QuizzAttempsReview";


export const metadata: Metadata = {
    title: "Làm quizz | Quản lý dự án phần mềm - Tạo Quizz",
    description:
        "Làm quizz | Quản lý dự án phần mềm - Tạo Quizz",
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function BasicTables({ params }: any) {
    const { id } = await params
    return <div>
        <QuizzAttempsReview quizzId={id} />
    </div>
}
